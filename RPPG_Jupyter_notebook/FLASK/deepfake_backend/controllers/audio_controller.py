import os
from flask import Blueprint, request, jsonify
from processors.audio.audio_processor import process_audio

audio_bp = Blueprint('audio', __name__)

@audio_bp.route('/', methods=['POST'])
def handle_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file uploaded'}), 400

    audio = request.files['audio']
    filename = audio.filename
    os.makedirs('uploads/audio', exist_ok=True)
    save_path = os.path.join('uploads/audio', filename)
    audio.save(save_path)

    results = process_audio(save_path)
    return jsonify(results)
