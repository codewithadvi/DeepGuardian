from flask import Flask
from flask_cors import CORS
from controllers.video_controller import video_bp
from controllers.image_controller import image_bp
from controllers.audio_controller import audio_bp
from controllers.text_controller import text_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(video_bp, url_prefix='/api/video')
app.register_blueprint(image_bp, url_prefix='/api/image')
app.register_blueprint(audio_bp, url_prefix='/api/audio')
app.register_blueprint(text_bp, url_prefix='/api/text')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
