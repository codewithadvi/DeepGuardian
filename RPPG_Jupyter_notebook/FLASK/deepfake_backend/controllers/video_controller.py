# File: controllers/video_controller.py
import os
from flask import Blueprint, request, jsonify
from processors.video.video_processor import process_video

video_bp = Blueprint('video', __name__)

@video_bp.route('/', methods=['POST'])
def handle_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file uploaded'}), 400

    video = request.files['video']
    filename = video.filename
    os.makedirs('uploads', exist_ok=True)  # ensure uploads dir exists
    save_path = os.path.join('uploads', filename)
    video.save(save_path)

    results = process_video(save_path)
    return jsonify(results)
