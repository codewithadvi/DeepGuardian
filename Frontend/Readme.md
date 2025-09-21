# Deepfake Detection System - README

![Deepfake Detection](https://img.shields.io/badge/Deepfake-Detection-blue?logo=security)
![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-2.0+-black?logo=flask)

## 📌 Overview

A comprehensive deepfake detection system that analyzes videos, images, audio, and text for potential misinformation and synthetic media. The system uses state-of-the-art machine learning models to detect deepfakes across multiple modalities.

## ✅ Features

- **Multi-modal analysis**: Video, image, audio, and text analysis
- **Real-time detection**: Identify deepfake content with confidence scores
- **Misinformation detection**: Analyze text for potential misinformation
- **User-friendly interface**: Web-based dashboard for easy analysis
- **API endpoints**: For integration with other systems

## 🛠️ System Requirements

- Python 3.10+
- Node.js 16+
- At least 8GB RAM (16GB+ recommended for GPU acceleration)
- For GPU acceleration: NVIDIA GPU with CUDA 11.8+ support

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/Rushilz98/DEEPFAKE_DETECTION-backend.git
cd DEEPFAKE_DETECTION-backend
```

### 2. Set up Python environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

> **Important**: To fix scikit-learn version mismatch issues, run:
> ```bash
> pip uninstall scikit-learn -y
> pip install scikit-learn==1.6.1
> ```

### 3. Set up Node.js backend (website)

```bash
cd website
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
# API Configuration
API_BASE_URL=http://localhost:5000
DEEPFAKE_API_ENDPOINT=/api/video/
AUDIO_API_ENDPOINT=/api/audio/
IMAGE_API_ENDPOINT=/api/image/
MISINFORMATION_API_ENDPOINT=/api/text/
WEB_SERVER_PORT=3000

# Optional: For misinformation API timeout issues
MISINFORMATION_API_TIMEOUT=300000  # 5 minutes in milliseconds
```

## ⚙️ Configuration Notes

### Fixing Common Issues

#### 1. API Timeout Errors (Critical)

If you're experiencing timeout errors like:
```
Error: API request failed with status 500: {"message":"No response from misinformation detection API","details":"timeout of 30000ms exceeded"}
```

**Solution**: Increase the timeout in `website/server.js`:

```javascript
// Find this section:
const apiResponse = await axios.post(
  misinformationApiUrl,
  req.body,
  {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000  // CHANGE THIS VALUE
  }
);

// Change to:
timeout: 300000  // 5 minutes instead of 30 seconds
```

#### 2. Scikit-learn Version Mismatch

To fix the warning:
```
InconsistentVersionWarning: Trying to unpickle estimator from version 1.6.1 when using version 1.7.2
```

Run:
```bash
pip uninstall scikit-learn -y
pip install scikit-learn==1.6.1
```

#### 3. CPU vs GPU Performance

For significantly faster inference:
- Use a GPU-enabled VM on Google Cloud
- Install TensorFlow GPU version:
  ```bash
  pip uninstall tensorflow -y
  pip install tensorflow-gpu
  ```

## 🚀 Running the Application

### 1. Start the Python API server

```bash
# From project root
cd deepfake_backend
python app.py
```

### 2. Start the website backend

```bash
# In a new terminal
cd website
npm start
```

### 3. Access the application

Open your browser and navigate to:
```
http://localhost:3000
```

## 🌐 API Endpoints

### Core Detection Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/video/` | POST | Analyze video for deepfakes |
| `/api/image/` | POST | Analyze image for deepfakes |
| `/api/audio/` | POST | Analyze audio for deepfakes |
| `/api/text/` | POST | Analyze text for misinformation |

### Proxy Endpoints (for frontend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/proxy/deepfake` | POST | Proxy for video analysis |
| `/api/proxy/image` | POST | Proxy for image analysis |
| `/api/proxy/audio` | POST | Proxy for audio analysis |
| `/api/proxy/misinformation` | POST | Proxy for text analysis |

## ☁️ Deployment on Google Cloud

### 1. Create a VM Instance

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new VM instance with:
   - Machine type: `e2-medium` or higher
   - Boot disk: Ubuntu 22.04 LTS
   - Allow HTTP/HTTPS traffic

### 2. Set up the instance

```bash
# Install Python and Node.js
sudo apt update
sudo apt install python3 python3-pip git nodejs npm -y

# Clone repository
git clone https://github.com/Rushilz98/DEEPFAKE_DETECTION-backend.git
cd DEEPFAKE_DETECTION-backend

# Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Fix scikit-learn version
pip uninstall scikit-learn -y
pip install scikit-learn==1.6.1

# Set up website
cd website
npm install

# Configure environment
echo "WEB_SERVER_PORT=80" > .env
echo "API_BASE_URL=http://localhost:5000" >> .env
```

### 3. Run as a service (to keep running after SSH disconnect)

```bash
# Install PM2 for Node.js process management
npm install -g pm2

# Start website in background
cd website
pm2 start server.js --name "deepfake-website"

# Start Python API with screen
cd ..
screen -S deepfake-api
python app.py
# Press Ctrl+A, then D to detach
```

### 4. Configure firewall

Allow traffic on ports 80 (HTTP) and 5000 (API) in Google Cloud firewall rules.

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Q: Getting timeout errors (30000ms exceeded)
**A**: Increase timeout values in both frontend and backend:
- Frontend: Update `script.js` with increased timeout (see [Timeout Configuration](#fixing-common-issues))
- Backend: Update `website/server.js` with increased timeout (5 minutes recommended)

#### Q: Slow inference on CPU
**A**: 
1. Use the correct scikit-learn version (1.6.1)
2. Consider converting models to ONNX format for faster CPU inference:
   ```python
   from skl2onnx import to_onnx
   onx = to_onnx(clf, X[:1].astype(numpy.float32), target_opset=12)
   with open("model.onnx", "wb") as f:
       f.write(onx.SerializeToString())
   ```

#### Q: "misinfoResultSummary is not defined" error
**A**: Ensure all required HTML elements exist before accessing them in JavaScript:
```javascript
const misinfoResultSummary = document.getElementById('misinfo-result-summary');
if (misinfoResultSummary) {
    // Update element
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgements

- TensorFlow and PyTorch teams
- scikit-learn developers
- ONNX Runtime team
- Google Cloud Platform

---

> **Note for Production Deployment**: Always set `debug=False` in production:
> ```python
> if __name__ == "__main__":
>     app.run(host="0.0.0.0", port=5000, debug=False)
> ```

For support, please open an issue in the GitHub repository.