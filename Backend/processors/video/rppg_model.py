# File: processors/video/rppg_model.py

import os
import cv2
import torch
import mediapipe as mp
import numpy as np
from scipy.signal import find_peaks
from collections import deque
from torch import nn
import torch.nn.functional as F

# -----------------------------
# Define PhysNet3D Architecture
# -----------------------------
class ConvBlock3D(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size=(3,3,3), stride=(1,1,1), padding=(1,1,1)):
        super().__init__()
        self.conv = nn.Conv3d(in_channels, out_channels, kernel_size, stride, padding)
        self.bn = nn.BatchNorm3d(out_channels)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        return self.relu(self.bn(self.conv(x)))


class ResidualBlock3D(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.conv1 = ConvBlock3D(channels, channels)
        self.conv2 = ConvBlock3D(channels, channels)

    def forward(self, x):
        return x + self.conv2(self.conv1(x))


class PhysNet3D(nn.Module):
    def __init__(self):
        super().__init__()
        self.block1 = ConvBlock3D(3, 32, kernel_size=(3,5,5), padding=(1,2,2))
        self.block2 = ConvBlock3D(32, 64, kernel_size=(3,5,5), stride=(1,2,2), padding=(1,2,2))
        self.res2 = ResidualBlock3D(64)
        self.block3 = ConvBlock3D(64, 128, padding=(1,1,1), stride=(1,2,2))
        self.res3 = ResidualBlock3D(128)
        self.block4 = ConvBlock3D(128, 256, padding=(1,1,1), stride=(1,2,2))
        self.res4 = ResidualBlock3D(256)
        self.deconv3 = nn.ConvTranspose3d(256, 128, kernel_size=(1,4,4), stride=(1,2,2), padding=(0,1,1))
        self.deconv2 = nn.ConvTranspose3d(128, 64, kernel_size=(1,4,4), stride=(1,2,2), padding=(0,1,1))
        self.deconv1 = nn.ConvTranspose3d(64, 32, kernel_size=(1,4,4), stride=(1,2,2), padding=(0,1,1))
        self.out_conv = nn.Conv3d(32, 1, kernel_size=(1,1,1))

    def forward(self, x):
        x = self.block1(x)
        x = self.res2(self.block2(x))
        x = self.res3(self.block3(x))
        x = self.res4(self.block4(x))
        x = F.relu(self.deconv3(x))
        x = F.relu(self.deconv2(x))
        x = F.relu(self.deconv1(x))
        x = self.out_conv(x)
        return x.mean(dim=[3,4])  # (B,1,T)


# -----------------------------
# Load Model
# -----------------------------
device = "cuda" if torch.cuda.is_available() else "cpu"
model_path = os.path.join(os.path.dirname(__file__), "models", "physnet_ubfc.pth")
model = PhysNet3D().to(device)
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()

# -----------------------------
# MediaPipe Setup
# -----------------------------
mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.7)


def crop_face(frame):
    results = face_detector.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    if results.detections:
        box = results.detections[0].location_data.relative_bounding_box
        h, w, _ = frame.shape
        x1 = int(box.xmin * w)
        y1 = int(box.ymin * h)
        x2 = int((box.xmin + box.width) * w)
        y2 = int((box.ymin + box.height) * h)
        return frame[max(y1,0):y2, max(x1,0):x2]
    return None


def extract_valid_clip(video_path, clip_len=150, size=(72, 72)):
    cap = cv2.VideoCapture(video_path)
    faces, areas = [], []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        face = crop_face(frame)
        if face is not None:
            resized = cv2.resize(face, size) / 255.0
            faces.append(resized)
            areas.append(face.shape[0] * face.shape[1])
        else:
            faces.append(None)
            areas.append(0)

    cap.release()

    best_start = -1
    max_area = 0
    for i in range(len(faces) - clip_len + 1):
        if all(faces[i+j] is not None for j in range(clip_len)):
            total_area = sum(areas[i:i+clip_len])
            if total_area > max_area:
                max_area = total_area
                best_start = i

    if best_start == -1:
        raise ValueError("No valid clip found.")

    selected = np.stack(faces[best_start:best_start + clip_len])
    tensor = torch.tensor(selected).permute(3, 0, 1, 2).unsqueeze(0).float().to(device)
    return tensor


def estimate_bpm(bvp, fps=30):
    signal = bvp.squeeze().cpu().numpy()
    signal = (signal - np.mean(signal)) / (np.std(signal) + 1e-6)
    peaks, _ = find_peaks(signal, distance=fps*0.5)
    if len(peaks) < 2: return 0
    intervals = np.diff(peaks) / fps
    return 60.0 / np.mean(intervals)


def rppg_process(video_path):
    try:
        clip = extract_valid_clip(video_path)
        with torch.no_grad():
            bvp = model(clip)
        bpm = estimate_bpm(bvp)
        power = np.mean(np.abs(bvp.cpu().numpy()))

        if bpm < 40 or bpm > 120 or power < 0.05:
            label = "fake"
            reason = f"Abnormal BPM or weak signal"
        else:
            label = "real"
            reason = f"Realistic BPM signals"

        return label, float(np.clip(bpm/120, 0, 1)), reason
    except Exception as e:
        return "unknown", 0.0, f"RPPG Error: {str(e)}"
