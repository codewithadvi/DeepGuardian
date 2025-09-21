// 1. Load environment variables FIRST
require('dotenv').config();
console.log('=== WEBSITE BACKEND STARTING ===');

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

// 4. Get configuration from environment variables
const PORT = process.env.WEB_SERVER_PORT || 5000;
const API_BASE_URL = process.env.API_BASE_URL || 'http://10.19.184.73:5002';
const DEEPFAKE_API_ENDPOINT = process.env.DEEPFAKE_API_ENDPOINT || '/api/video/';
const AUDIO_API_ENDPOINT = process.env.AUDIO_API_ENDPOINT || '/api/audio/';
const IMAGE_API_ENDPOINT = process.env.IMAGE_API_ENDPOINT || '/api/image/';
const MISINFORMATION_API_ENDPOINT = process.env.MISINFORMATION_API_ENDPOINT || '/api/text/';

console.log(`Using API base URL: ${API_BASE_URL}`);
console.log(`Deepfake API endpoint: ${DEEPFAKE_API_ENDPOINT}`);
console.log(`Audio API endpoint: ${AUDIO_API_ENDPOINT}`);
console.log(`Image API endpoint: ${IMAGE_API_ENDPOINT}`);
console.log(`Misinformation API endpoint: ${MISINFORMATION_API_ENDPOINT}`);

// 5. Create upload directories if they don't exist
const uploadDir = path.join(__dirname, 'uploads');
const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');
const audioDir = path.join(uploadDir, 'audio');
const textDir = path.join(uploadDir, 'text');

try {
  mkdirp.sync(uploadDir);
  mkdirp.sync(imageDir);
  mkdirp.sync(videoDir);
  mkdirp.sync(audioDir);
  mkdirp.sync(textDir);
  console.log('Upload directories created successfully');
} catch (err) {
  console.error('Error creating upload directories:', err);
}

// 6. Configure multer storage for regular uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let destinationDir = uploadDir;
    if (file.mimetype.startsWith('image/')) {
      destinationDir = imageDir;
      console.log(`✅ Image detected - saving to: ${imageDir}`);
    } else if (file.mimetype.startsWith('video/')) {
      destinationDir = videoDir;
      console.log(`✅ Video detected - saving to: ${videoDir}`);
    } else if (file.mimetype.startsWith('audio/')) {
      destinationDir = audioDir;
      console.log(`✅ Audio detected - saving to: ${audioDir}`);
    } else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      destinationDir = textDir;
      console.log(`✅ Text file detected - saving to: ${textDir}`);
    } else {
      console.log(`⚠️ Other file type detected - saving to: ${uploadDir}`);
    }
    cb(null, destinationDir);
  },
  filename: function (req, file, cb) {
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
    console.log(`✅ Saving file as: ${filename}`);
    cb(null, filename);
  }
});

// 7. Configure multer with MEMORY storage for the proxy endpoints
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

// 8. Create the regular upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB limit for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/flv',
      'video/mkv', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav',
      'text/plain'
    ];
    console.log(`🔍 Checking file type: ${file.mimetype}`);
    if (allowedTypes.includes(file.mimetype)) {
      console.log(`✅ File type ${file.mimetype} is allowed`);
      cb(null, true);
    } else {
      console.error(`❌ Invalid file type: ${file.mimetype}`);
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio, video, image, and text files are allowed.`), false);
    }
  }
});

// 9. Middleware - Permissions-Policy
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), usb=()'
  );
  res.setHeader('Feature-Policy',
    "accelerometer 'none'; camera 'none'; geolocation 'none'; gyroscope 'none'; magnetometer 'none'; microphone 'none'; usb 'none'"
  );
  next();
});

// 10. CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 11. Handle preflight requests (Commented out, as app.use(cors()) handles OPTIONS)
// app.options('*', cors());

// 12. Middleware - Body parsers
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 13. Favicon route
app.get('/favicon.ico', (req, res) => {
  const favicon = Buffer.from('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'base64');
  res.type('image/x-icon');
  res.send(favicon);
});

// 14. Serve static files
const projectRoot = __dirname;
app.use(express.static(projectRoot));

// 15. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    storage: 'local',
    uploadDir: uploadDir,
    config: {
      webServerPort: PORT,
      apiBaseUrl: API_BASE_URL,
      deepfakeApiEndpoint: DEEPFAKE_API_ENDPOINT,
      audioApiEndpoint: AUDIO_API_ENDPOINT,
      imageApiEndpoint: IMAGE_API_ENDPOINT,
      misinformationApiEndpoint: MISINFORMATION_API_ENDPOINT
    }
  });
});

// 16. File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    console.log('📥 File upload request received');
    if (!req.file) {
      console.error('❌ No file uploaded in request');
      return res.status(400).json({
        message: 'No file uploaded',
        code: 'NO_FILE'
      });
    }
    console.log(`📄 File details:
      - Name: ${req.file.originalname}
      - Size: ${req.file.size} bytes
      - MIME: ${req.file.mimetype}
      - Path: ${req.file.path}
      - Field: ${req.file.fieldname}`);
    let fileType = 'other';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'audio';
    } else if (req.file.mimetype === 'text/plain' || req.file.originalname.endsWith('.txt')) {
      fileType = 'text';
    }
    const relativePath = req.file.path.replace(__dirname, '');

    // Create web-accessible path
    const webPath = `/uploads/${path.relative(uploadDir, req.file.path).replace(/\\/g, '/')}`;

    console.log(`✅ File uploaded successfully: ${req.file.originalname} (${fileType})`);
    console.log(`Web path: ${webPath}`);

    res.json({
      message: 'File uploaded successfully',
      filePath: relativePath,
      fileName: req.file.originalname,
      fileType: fileType,
      size: req.file.size,
      absolutePath: req.file.path,
      webPath: webPath  // Add this line
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        message: 'File size exceeds the 1GB limit',
        code: 'FILE_SIZE_EXCEEDED',
        maxSize: '1GB'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected field name. Expected "file"',
        code: 'INVALID_FIELD_NAME'
      });
    }
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        message: error.message,
        code: 'INVALID_FILE_TYPE'
      });
    }
    res.status(500).json({
      message: 'File upload failed',
      code: 'UPLOAD_FAILED',
      details: error.message
    });
  }
});

// 17. Deepfake detection proxy endpoint
app.post('/api/proxy/deepfake', uploadMemory.single('video'), async (req, res) => {
  try {
    console.log('🚀 Proxy request received for deepfake analysis');
    if (!req.file) {
      console.error('❌ No video file provided in proxy request');
      return res.status(400).json({
        message: 'No video file provided',
        code: 'NO_VIDEO_FILE'
      });
    }
    const deepfakeApiUrl = API_BASE_URL + DEEPFAKE_API_ENDPOINT;
    console.log(`📤 Forwarding video to deepfake API: ${req.file.originalname} (${req.file.size} bytes) [${deepfakeApiUrl}]`);
    const formData = new FormData();
    formData.append('video', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    const apiResponse = await axios.post(
      deepfakeApiUrl,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 300000
      }
    );
    console.log('📥 Received response from deepfake API:', apiResponse.data);
    res.json(apiResponse.data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    if (error.response) {
      console.error(`❌ API responded with status ${error.response.status}:`, error.response.data);
      return res.status(error.response.status).json({
        message: 'API request failed',
        details: error.response.data || error.message,
        code: 'API_ERROR',
        status: error.response.status
      });
    } else if (error.request) {
      console.error('❌ No response received from API');
      return res.status(500).json({
        message: 'No response from deepfake detection API',
        details: error.message,
        code: 'API_TIMEOUT'
      });
    } else {
      console.error('❌ Request setup error:', error.message);
      return res.status(500).json({
        message: 'Error setting up API request',
        details: error.message,
        code: 'REQUEST_ERROR'
      });
    }
  }
});

// 18. Audio detection proxy endpoint
app.post('/api/proxy/audio', uploadMemory.single('audio'), async (req, res) => {
  try {
    console.log('🚀 Audio proxy request received');
    if (!req.file) {
      console.error('❌ No audio file provided');
      return res.status(400).json({
        message: 'No audio file provided',
        code: 'NO_AUDIO_FILE'
      });
    }
    const audioApiUrl = API_BASE_URL + AUDIO_API_ENDPOINT;
    console.log(`📤 Forwarding audio to audio API: ${req.file.originalname} (${req.file.size} bytes) [${audioApiUrl}]`);
    const formData = new FormData();
    formData.append('audio', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    const apiResponse = await axios.post(
      audioApiUrl,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 300000
      }
    );
    
    // TRANSFORM THE RESPONSE TO MATCH FRONTEND EXPECTATIONS
    const transformedResponse = {
      audio_models: {
        voice_analysis: {
          confidence: apiResponse.data.confidence,
          label: apiResponse.data.label,
          reason: apiResponse.data.reason
        }
      }
    };
    
    console.log('📥 Received response from audio API:', apiResponse.data);
    console.log('🔄 Transformed response for frontend:', transformedResponse);
    
    res.json(transformedResponse);
  } catch (error) {
    console.error('❌ Audio proxy error:', error);
    if (error.response) {
      console.error(`❌ Audio API responded with status ${error.response.status}:`, error.response.data);
      return res.status(error.response.status).json({
        message: 'Audio API request failed',
        details: error.response.data || error.message,
        code: 'AUDIO_API_ERROR',
        status: error.response.status
      });
    } else if (error.request) {
      console.error('❌ No response received from audio API');
      return res.status(500).json({
        message: 'No response from audio detection API',
        details: error.message,
        code: 'AUDIO_API_TIMEOUT'
      });
    } else {
      console.error('❌ Request setup error:', error.message);
      return res.status(500).json({
        message: 'Error setting up audio API request',
        details: error.message,
        code: 'AUDIO_REQUEST_ERROR'
      });
    }
  }
});

// 19. Misinformation detection proxy endpoint
app.post('/api/proxy/misinformation', async (req, res) => {
  try {
    console.log('🚀 Misinformation proxy request received');
    if (!req.body || !req.body.text) {
      console.error('❌ No text provided for misinformation analysis');
      return res.status(400).json({
        message: 'No text provided',
        code: 'NO_TEXT'
      });
    }
    const misinformationApiUrl = process.env.MISINFORMATION_API_URL || (API_BASE_URL + MISINFORMATION_API_ENDPOINT);
    console.log(`📤 Forwarding text to misinformation API (${misinformationApiUrl}): "${req.body.text.substring(0, 50)}..."`);
    const apiResponse = await axios.post(
      misinformationApiUrl,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 300000
      }
    );
    console.log('📥 Received response from misinformation API:', apiResponse.data);
    res.json(apiResponse.data);
  } catch (error) {
    console.error('❌ Misinformation proxy error:', error);
    if (error.response) {
      console.error(`❌ Misinformation API responded with status ${error.response.status}:`, error.response.data);
      return res.status(error.response.status).json({
        message: 'Misinformation API request failed',
        details: error.response.data || error.message,
        code: 'MISINFO_API_ERROR',
        status: error.response.status
      });
    } else if (error.request) {
      console.error('❌ No response received from misinformation API');
      return res.status(500).json({
        message: 'No response from misinformation detection API',
        details: error.message,
        code: 'MISINFO_API_TIMEOUT'
      });
    } else {
      console.error('❌ Request setup error:', error.message);
      return res.status(500).json({
        message: 'Error setting up misinformation API request',
        details: error.message,
        code: 'MISINFO_REQUEST_ERROR'
      });
    }
  }
});

// 20. Image detection proxy endpoint
app.post('/api/proxy/image', uploadMemory.single('image'), async (req, res) => {
  try {
    console.log('🚀 Image proxy request received');
    if (!req.file) {
      console.error('❌ No image file provided');
      return res.status(400).json({
        message: 'No image file provided',
        code: 'NO_IMAGE_FILE'
      });
    }
    const imageApiUrl = API_BASE_URL + IMAGE_API_ENDPOINT;
    console.log(`📤 Forwarding image to image API: ${req.file.originalname} (${req.file.size} bytes) [${imageApiUrl}]`);
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    const apiResponse = await axios.post(
      imageApiUrl,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 300000
      }
    );
    console.log('📥 Received response from image API:', apiResponse.data);
    res.json(apiResponse.data);
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    if (error.response) {
      console.error(`❌ Image API responded with status ${error.response.status}:`, error.response.data);
      return res.status(error.response.status).json({
        message: 'Image API request failed',
        details: error.response.data || error.message,
        code: 'IMAGE_API_ERROR',
        status: error.response.status
      });
    } else if (error.request) {
      console.error('❌ No response received from image API');
      return res.status(500).json({
        message: 'No response from image detection API',
        details: error.message,
        code: 'IMAGE_API_TIMEOUT'
      });
    } else {
      console.error('❌ Request setup error:', error.message);
      return res.status(500).json({
        message: 'Error setting up image API request',
        details: error.message,
        code: 'IMAGE_REQUEST_ERROR'
      });
    }
  }
});

// 21. Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// 22. Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: err.message
  });
});

// 23. 404 handler for API routes
app.use(/^\/api\/.*/, (req, res) => {
  console.log(`❌ 404 - API route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    message: 'API route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// 24. Catch-all route for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// 25. Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n============================================`);
  console.log(`🚀 Website running on port ${PORT}`);
  console.log(`📁 Project root: ${projectRoot}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`🖼️  Image directory: ${imageDir}`);
  console.log(`🎥 Video directory: ${videoDir}`);
  console.log(`🎤 Audio directory: ${audioDir}`);
  console.log(`📄 Text directory: ${textDir}`);
  console.log(`🌐 Access from any device on your network: http://<your-ip>:${PORT}`);
  console.log(`🔧 Deepfake proxy endpoint: /api/proxy/deepfake`);
  console.log(`🔧 Audio proxy endpoint: /api/proxy/audio`);
  console.log(`🔧 Misinformation proxy endpoint: /api/proxy/misinformation`);
  console.log(`🔧 Image proxy endpoint: /api/proxy/image`);
  console.log(`🔗 API Base URL: ${API_BASE_URL}`);
  console.log(`🔗 Deepfake API Endpoint: ${DEEPFAKE_API_ENDPOINT}`);
  console.log(`🔗 Audio API Endpoint: ${AUDIO_API_ENDPOINT}`);
  console.log(`🔗 Image API Endpoint: ${IMAGE_API_ENDPOINT}`);
  console.log(`🔗 Misinformation API Endpoint: ${MISINFORMATION_API_ENDPOINT}`);
  console.log(`============================================\n`);
});

// 26. Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
