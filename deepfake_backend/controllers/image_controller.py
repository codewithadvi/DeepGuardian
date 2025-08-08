import os
from flask import Blueprint, request, jsonify
from processors.image.image_processor import process_image

image_bp = Blueprint('image', __name__)

@image_bp.route('/', methods=['POST'])
def handle_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400

    image = request.files['image']
    filename = image.filename
    os.makedirs('uploads', exist_ok=True)
    save_path = os.path.join('uploads', filename)
    image.save(save_path)

    results = process_image(save_path)
    return jsonify(results)
