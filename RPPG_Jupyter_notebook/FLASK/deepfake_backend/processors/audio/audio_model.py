# File: processors/audio/audio_model.py

import os
import librosa
import numpy as np
import joblib
import tensorflow as tf

# -----------------------------
# Constants
# -----------------------------
N_MFCC_FEATURES = 40
DEVICE = "cuda" if tf.config.list_physical_devices("GPU") else "cpu"

# -----------------------------
# Load Trained Assets
# -----------------------------
base_dir = os.path.dirname(__file__)
scaler_path = os.path.join(base_dir, "models", "audio_scaler_optimizer.joblib")
model_path = os.path.join(base_dir, "models", "audio_mlp_classifier_optimized.h5")
encoder_path = os.path.join(base_dir, "models", "audio_label_encoder_optimized.joblib")

scaler = joblib.load(scaler_path)
label_encoder = joblib.load(encoder_path)
model = tf.keras.models.load_model(model_path)

# -----------------------------
# Feature Extraction
# -----------------------------
def extract_features_mean_mfcc(file_path, n_mfcc=N_MFCC_FEATURES):
    try:
        audio, sample_rate = librosa.load(file_path, res_type='kaiser_fast', duration=3.0)
        mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=n_mfcc)
        return np.mean(mfccs.T, axis=0)
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
        return None

# -----------------------------
# Inference Function
# -----------------------------
def audio_deepfake_predict(audio_file_path):
    try:
        if not os.path.exists(audio_file_path):
            return "unknown", 0.0, "Audio file not found."

        features = extract_features_mean_mfcc(audio_file_path)
        if features is None:
            return "unknown", 0.0, "Feature extraction failed."

        scaled_features = scaler.transform(features.reshape(1, -1))
        prediction = model.predict(scaled_features)[0]
        predicted_index = np.argmax(prediction)
        confidence = float(prediction[predicted_index])
        predicted_label = label_encoder.inverse_transform([predicted_index])[0].lower()

        # Interpretation logic
        if predicted_label == "real":
            if confidence > 0.9:
                reason = "Highly authentic speech detected."
            elif confidence > 0.7:
                reason = "Mostly real-sounding, minor anomalies."
            else:
                reason = "Predicted real, but with low confidence."
        else:
            if confidence > 0.9:
                reason = "Highly consistent with deepfake patterns."
            elif confidence > 0.7:
                reason = "Likely synthetic with some ambiguity."
            else:
                reason = "Predicted fake, low confidence."

        return predicted_label, confidence, reason

    except Exception as e:
        return "unknown", 0.0, f"Audio prediction error: {str(e)}"
