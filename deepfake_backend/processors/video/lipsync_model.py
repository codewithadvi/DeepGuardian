import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import librosa
from moviepy.editor import VideoFileClip
import mediapipe as mp

# ------------------------------
# Define model (must match training)
# ------------------------------
class LipSyncLSTMClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.lip_lstm = nn.LSTM(input_size=40, hidden_size=64, batch_first=True)
        self.audio_lstm = nn.LSTM(input_size=13, hidden_size=64, batch_first=True)
        self.fc = nn.Sequential(
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(128, 2)
        )

    def forward(self, lips, audio):
        B = lips.shape[0]
        lips = lips.view(B, 150, -1)
        _, (h_lip, _) = self.lip_lstm(lips)
        _, (h_audio, _) = self.audio_lstm(audio)
        fused = torch.cat([h_lip[-1], h_audio[-1]], dim=1)
        return self.fc(fused)

# ------------------------------
# Lip landmarks
# ------------------------------
mp_face_mesh = mp.solutions.face_mesh
lip_landmarks = list(range(61, 81))

def extract_lip_landmarks(video_path, max_frames=150):
    cap = cv2.VideoCapture(video_path)
    lips = []

    with mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1) as face_mesh:
        while len(lips) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)
            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    points = []
                    for idx in lip_landmarks:
                        lm = face_landmarks.landmark[idx]
                        points.extend([lm.x, lm.y])
                    lips.append(points)
                    break
    cap.release()

    if len(lips) == 0:
        return None  # failure case

    lips = np.array(lips)
    if len(lips) < max_frames:
        pad = np.zeros((max_frames - len(lips), 40))
        lips = np.vstack([lips, pad])
    else:
        lips = lips[:max_frames]
    return lips  # [150, 40]

# ------------------------------
# Audio feature extraction
# ------------------------------
def extract_audio_from_video(video_path, temp_wav_path="temp.wav"):
    try:
        clip = VideoFileClip(video_path)
        clip.audio.write_audiofile(temp_wav_path, verbose=False, logger=None)
        return temp_wav_path
    except Exception as e:
        print(f"[ERROR] Audio extract failed: {e}")
        return None

def extract_audio_features(video_path, max_frames=150):
    temp_wav_path = extract_audio_from_video(video_path)
    if temp_wav_path is None:
        return None

    y, sr = librosa.load(temp_wav_path, sr=None)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc = mfcc.T

    if len(mfcc) < max_frames:
        pad = np.zeros((max_frames - len(mfcc), 13))
        mfcc = np.vstack([mfcc, pad])
    else:
        mfcc = mfcc[:max_frames]
    return mfcc  # [150, 13]

# ------------------------------
# Main process to be called from backend
# ------------------------------
def lipsync_process(video_path):
    try:
        # Load model
        model = LipSyncLSTMClassifier()
        model_path = os.path.join(os.path.dirname(__file__), "models", "lipsync_deepfake_model.pth")
        model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
        model.eval()

        # Feature extraction
        lips = extract_lip_landmarks(video_path)
        if lips is None:
            return "error", 0.0, "Lip landmarks could not be extracted"

        audio = extract_audio_features(video_path)
        if audio is None:
            return "error", 0.0, "Audio features could not be extracted"

        lips_tensor = torch.tensor(lips, dtype=torch.float32).unsqueeze(0)   # [1, 150, 40]
        audio_tensor = torch.tensor(audio, dtype=torch.float32).unsqueeze(0) # [1, 150, 13]

        with torch.no_grad():
            output = model(lips_tensor, audio_tensor)
            probs = torch.softmax(output, dim=1)
            pred = torch.argmax(probs, dim=1).item()
            conf = probs[0, pred].item()

        label = "real" if pred == 0 else "fake"
        if label == "fake":
            reason = "voice and lip sync mismatch detected"
        else:
            reason = "synchronized lip movement with audio"
        return label, conf, reason

    except Exception as e:
        return "error", 0.0, f"Error: {str(e)}"
