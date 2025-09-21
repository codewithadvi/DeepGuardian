# Backend

This folder contains the backend services for the **DeepGuardian Deepfake Detection** project.  
The backend provides RESTful APIs to analyze images, videos, audio, and text for synthetic or manipulated content using advanced machine learning models.

---

## Table of Contents

- [Overview](#overview)
- [Folder Structure](#folder-structure)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Extending the Backend](#extending-the-backend)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

The backend is built using [Flask](https://flask.palletsprojects.com/) and exposes endpoints for deepfake detection across multiple modalities:

- **Video**: Detects manipulated or synthetic videos.  
- **Image**: Detects fake or altered images.  
- **Audio**: Detects synthetic or tampered audio.  
- **Text**: Detects AI-generated or manipulated text.  

Each modality is handled by a dedicated controller and processor module, making the system modular and easy to extend.

---

## Folder Structure

```plaintext
Backend/
├── app.py                # Main Flask application entry point
├── requirements.txt      # Python dependencies
├── controllers/          # API route handlers (Flask Blueprints)
│   ├── video_controller.py
│   ├── image_controller.py
│   ├── audio_controller.py
│   └── text_controller.py
├── processors/           # Core detection logic for each modality
│   ├── video/
│   ├── image/
│   ├── audio/
│   └── text/
└── readme.md             # This documentation file
```

---

## Features

- **RESTful API**: Endpoints for video, image, audio, and text analysis.  
- **CORS Enabled**: Allows cross-origin requests for frontend integration.  
- **Modular Design**: Each media type is handled by its own controller and processor.  
- **Easy to Extend**: Add new detection models or modalities with minimal changes.  
- **Configurable**: Easily change host, port, and debug settings.  

---

## Setup Instructions

### 1. Prerequisites
- Python 3.8 or higher  
- [pip](https://pip.pypa.io/en/stable/)  

### 2. Install Dependencies
```sh
cd Backend
pip install -r requirements.txt
```

### 3. Run the Application
```sh
python app.py
```

---

## API Documentation

### 1. Video Deepfake Detection
- **Endpoint**: `POST /api/video/`  
- **Description**: Analyze a video file for deepfake content.  
- **Request**: `multipart/form-data` with a `file` field.  
- **Response**: JSON with detection results.  

### 2. Image Deepfake Detection
- **Endpoint**: `POST /api/image/`  
- **Description**: Analyze an image file for manipulation.  
- **Request**: `multipart/form-data` with a `file` field.  
- **Response**: JSON with detection results.  

### 3. Audio Deepfake Detection
- **Endpoint**: `POST /api/audio/`  
- **Description**: Analyze an audio file for synthetic content.  
- **Request**: `multipart/form-data` with a `file` field.  
- **Response**: JSON with detection results.  

### 4. Text Deepfake Detection
- **Endpoint**: `POST /api/text/`  
- **Description**: Analyze a text snippet for AI-generated or manipulated content.  
- **Request**: JSON with a `text` field.  
- **Response**: JSON with detection results.  

---

## Extending the Backend

To add a new detection modality or model:

1. Create a new processor module in `processors/`.  
2. Add a new controller in `controllers/` and register its blueprint in `app.py`.  
3. Update `requirements.txt` if new dependencies are needed.  

---

## Troubleshooting

- **Port Already in Use**: Change the port in `app.py` or stop the conflicting service.  
- **Module Not Found**: Ensure all dependencies are installed and `PYTHONPATH` is set correctly.  
- **CORS Issues**: CORS is enabled by default, but can be configured in `app.py`.  

---
For more information, refer to the main `README.md` in the project root.
