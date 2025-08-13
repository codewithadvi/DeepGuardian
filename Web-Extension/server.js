// 1. Load environment variables FIRST
require('dotenv').config();
console.log('=== DEEPGUARDIAN EXTENSION BACKEND STARTING ===');

// 2. Import required packages
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const axios = require('axios');
const FormData = require('form-data');

// 3. Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// 4. Create upload directories if they don't exist
const uploadDir = path.join(__dirname, 'uploads');
const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');
const audioDir = path.join(uploadDir, 'audio');

try {
    mkdirp.sync(uploadDir);
    mkdirp.sync(imageDir);
    mkdirp.sync(videoDir);
    mkdirp.sync(audioDir);
    console.log('Upload directories created successfully');
} catch (err) {
    console.error('Error creating upload directories:', err);
}

// 5. Configure multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let destinationDir = uploadDir;
    
    if (file.mimetype.startsWith('image/')) {
      destinationDir = imageDir;
    } else if (file.mimetype.startsWith('video/')) {
      destinationDir = videoDir;
    } else if (file.mimetype.startsWith('audio/')) {
      destinationDir = audioDir;
    }
    
    cb(null, destinationDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    let filename;
    if (file.mimetype.startsWith('video/')) {
      filename = 'video-' + uniqueSuffix + ext;
    } else if (file.mimetype.startsWith('audio/')) {
      filename = 'audio-' + uniqueSuffix + ext;
    } else if (file.mimetype.startsWith('image/')) {
      filename = 'image-' + uniqueSuffix + ext;
    } else {
      filename = 'file-' + uniqueSuffix + ext;
    }
    
    cb(null, filename);
  }
});

// 6. Create multer middleware
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 1024 * 1024 * 500 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/flv', 
      'video/mkv', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio, video, and image files are allowed.`), false);
    }
  }
});

// 7. Middleware
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), usb=()'
  );
  next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// 8. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'deepguardian-extension'
  });
});

// 9. DEEPFAKE DETECTION PROXY ENDPOINT
app.post('/api/proxy/deepfake', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No video file provided',
        code: 'NO_VIDEO_FILE'
      });
    }
    
    const apiResponse = await axios.post(
      `${process.env.API_BASE_URL}/api/video/`,
      { video: req.file.path },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    res.json(apiResponse.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      message: 'Deepfake analysis failed',
      details: error.message,
      code: 'ANALYSIS_FAILED'
    });
  }
});

// 10. IMAGE DETECTION PROXY ENDPOINT
app.post('/api/proxy/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No image file provided',
        code: 'NO_IMAGE_FILE'
      });
    }
    
    const apiResponse = await axios.post(
      `${process.env.API_BASE_URL}/api/image/`,
      { image: req.file.path },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    res.json(apiResponse.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      message: 'Image analysis failed',
      details: error.message,
      code: 'ANALYSIS_FAILED'
    });
  }
});

// 11. AUDIO DETECTION PROXY ENDPOINT
app.post('/api/proxy/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No audio file provided',
        code: 'NO_AUDIO_FILE'
      });
    }
    
    const apiResponse = await axios.post(
      `${process.env.API_BASE_URL}/api/audio/`,
      { audio: req.file.path },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    res.json(apiResponse.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      message: 'Audio analysis failed',
      details: error.message,
      code: 'ANALYSIS_FAILED'
    });
  }
});

// 12. Add a route to serve uploaded files
app.use('/uploads', express.static(uploadDir));

// 13. Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: err.message
  });
});

// 14. 404 handler
app.use('/*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// 15. Start server
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n============================================`);
  console.log(`🚀 DeepGuardian Extension running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`🖼️  Image directory: ${imageDir}`);
  console.log(`🎥 Video directory: ${videoDir}`);
  console.log(`🎤 Audio directory: ${audioDir}`);
  console.log(`🌐 API Base URL: ${process.env.API_BASE_URL}`);
  console.log(`🔧 Deepfake proxy endpoint: /api/proxy/deepfake`);
  console.log(`🔧 Image proxy endpoint: /api/proxy/image`);
  console.log(`🔧 Audio proxy endpoint: /api/proxy/audio`);
  console.log(`============================================\n`);
});

// 16. Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down extension server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});