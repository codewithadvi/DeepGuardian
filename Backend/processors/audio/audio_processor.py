# File: processors/audio/audio_processor.py

from processors.audio.audio_model import audio_deepfake_predict

def process_audio(audio_path):
    label, confidence, reason = audio_deepfake_predict(audio_path)
    return {
        "label": label,
        "confidence": confidence,
        "reason": reason
    }
