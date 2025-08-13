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
const PORT = process.env.PORT || 5000;

// 4. Create upload directories if they don't exist
const uploadDir = path.join(__dirname, 'uploads');
const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');
const audioDir = path.join(uploadDir, 'audio');  // New audio directory
const textDir = path.join(uploadDir, 'text');

try {
    mkdirp.sync(uploadDir);
    mkdirp.sync(imageDir);
    mkdirp.sync(videoDir);
    mkdirp.sync(audioDir);  // Create audio directory
    mkdirp.sync(textDir);
    console.log('Upload directories created successfully');
} catch (err) {
    console.error('Error creating upload directories:', err);
}

// 5. Configure multer storage for regular uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Determine destination folder based on file type
    let destinationDir = uploadDir;
    
    if (file.mimetype.startsWith('image/')) {
      destinationDir = imageDir;
      console.log(`✅ Image detected - saving to: ${imageDir}`);
    } else if (file.mimetype.startsWith('video/')) {
      destinationDir = videoDir;
      console.log(`✅ Video detected - saving to: ${videoDir}`);
    } else if (file.mimetype.startsWith('audio/')) {
      destinationDir = audioDir;
      console.log(`✅ Audio detected - saving to: ${audioDir}`);  // Handle audio files
    } else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      destinationDir = textDir;
      console.log(`✅ Text file detected - saving to: ${textDir}`);
    } else {
      console.log(`⚠️ Other file type detected - saving to: ${uploadDir}`);
    }
    
    cb(null, destinationDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with timestamp to prevent overwrites
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    // Different naming conventions for different file types
    let filename;
    if (file.mimetype.startsWith('video/')) {
      filename = 'video-' + uniqueSuffix + ext;
    } else if (file.mimetype.startsWith('audio/')) {
      filename = 'audio-' + uniqueSuffix + ext;  // Audio-specific naming
    } else if (file.mimetype.startsWith('image/')) {
      filename = 'image-' + uniqueSuffix + ext;  // Image-specific naming
    } else {
      filename = 'file-' + uniqueSuffix + ext;
    }
    
    console.log(`✅ Saving file as: ${filename}`);
    cb(null, filename);
  }
});

// 6. Configure multer with MEMORY storage for the proxy endpoints
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

// 7. Create the regular upload middleware
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 1024 * 1024 * 1024 // Increased to 1GB for videos
  },
  fileFilter: (req, file, cb) => {
    // Add comprehensive file MIME types including audio
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

// 8. Middleware - Add this first to fix the Permissions-Policy errors
app.use((req, res, next) => {
  // Set the Permissions-Policy header with only features we need
  res.setHeader('Permissions-Policy', 
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), usb=()'
  );
  
  // Also set the Feature-Policy header for older browsers (optional)
  res.setHeader('Feature-Policy', 
    "accelerometer 'none'; camera 'none'; geolocation 'none'; gyroscope 'none'; magnetometer 'none'; microphone 'none'; usb 'none'"
  );
  
  next();
});

// 9. Middleware - The rest of your middleware
app.use(bodyParser.json({ limit: '50mb' })); // Increased body size limit
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// 10. Add favicon route to fix 404 error
app.get('/favicon.ico', (req, res) => {
  const favicon = Buffer.from('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'base64');
  res.type('image/x-icon');
  res.send(favicon);
});

// 11. Serve static files - CORRECTED (index.html is in same directory as server.js)
const projectRoot = __dirname;
app.use(express.static(projectRoot));

// 12. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    storage: 'local',
    uploadDir: uploadDir
  });
});

// 13. File upload endpoint (regular uploads for preview)
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
    
    // Log detailed file information
    console.log(`📄 File details:
      - Name: ${req.file.originalname}
      - Size: ${req.file.size} bytes
      - MIME: ${req.file.mimetype}
      - Path: ${req.file.path}
      - Field: ${req.file.fieldname}`);
    
    // Determine file type
    let fileType = 'other';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'audio';  // Handle audio files
    } else if (req.file.mimetype === 'text/plain' || req.file.originalname.endsWith('.txt')) {
      fileType = 'text';
    }
    
    // Create relative path for response
    const relativePath = req.file.path.replace(__dirname, '');
    
    console.log(`✅ File uploaded successfully: ${req.file.originalname} (${fileType})`);
    
    res.json({
      message: 'File uploaded successfully',
      filePath: relativePath,
      fileName: req.file.originalname,
      fileType: fileType,
      size: req.file.size,
      absolutePath: req.file.path
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Handle multer errors specifically
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

// 14. DEEPFAKE DETECTION PROXY ENDPOINT
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
    
    console.log(`📤 Forwarding video to deepfake API: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Create form data to send to the API
    const formData = new FormData();
    formData.append('video', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Forward the request to your friend's API
    const apiResponse = await axios.post(
      'http://10.139.95.91:5002/api/video/',
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 300000 // 5 minutes timeout for video processing
      }
    );
    
    console.log('📥 Received response from deepfake API:', apiResponse.data);
    res.json(apiResponse.data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    // Handle axios errors
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

// 15. AUDIO DETECTION PROXY ENDPOINT
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
    
    console.log(`📤 Forwarding audio to audio API: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Create form data to send to the API
    const formData = new FormData();
    formData.append('audio', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Forward the request to the audio API
    const apiResponse = await axios.post(
      'http://10.139.95.91:5002/api/audio/',  // Use the same IP as your deepfake API
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 300000 // 5 minutes timeout
      }
    );
    
    console.log('📥 Received response from audio API:', apiResponse.data);
    res.json(apiResponse.data);
  } catch (error) {
    console.error('❌ Audio proxy error:', error);
    
    // Handle axios errors
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

// 16. MISINFORMATION DETECTION PROXY ENDPOINT
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
    
    // Get the misinformation API URL from environment variables
    // Default to the same IP as your other APIs
    const misinformationApiUrl = process.env.MISINFORMATION_API_URL || 'http://10.139.95.91:5002/api/text/';
    
    console.log(`📤 Forwarding text to misinformation API (${misinformationApiUrl}): "${req.body.text.substring(0, 50)}..."`);
    
    // Forward the request to the misinformation API
    const apiResponse = await axios.post(
      misinformationApiUrl,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );
    
    console.log('📥 Received response from misinformation API:', apiResponse.data);
    res.json(apiResponse.data);
  } catch (error) {
    console.error('❌ Misinformation proxy error:', error);
    
    // Handle axios errors
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

// 17. IMAGE DETECTION PROXY ENDPOINT
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
    
    console.log(`📤 Forwarding image to image API: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Create form data to send to the API
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Forward the request to the image API
    const apiResponse = await axios.post(
      'http://10.139.95.91:5002/api/image/',  // Use the same IP as your other APIs
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 300000 // 5 minutes timeout
      }
    );
    
    console.log('📥 Received response from image API:', apiResponse.data);
    res.json(apiResponse.data);
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    
    // Handle axios errors
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

// 18. Add a route to serve uploaded files
app.use('/uploads', express.static(uploadDir));

// 19. Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: err.message
  });
});

// 20. 404 handler for API routes
// 20. 404 handler for API routes - FIXED
app.use('/api/*splat', (req, res) => {
  console.log(`❌ 404 - API route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    message: 'API route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// 21. Catch-all route for frontend - FIXED WITH '/*' INSTEAD OF '*'
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// 22. Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n============================================`);
  console.log(`🚀 Website running on port ${PORT}`);
  console.log(`📁 Project root: ${projectRoot}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`🖼️  Image directory: ${imageDir}`);
  console.log(`🎥 Video directory: ${videoDir}`);
  console.log(`🎤 Audio directory: ${audioDir}`);  // Show audio directory
  console.log(`📄 Text directory: ${textDir}`);
  console.log(`🌐 Access from any device on your network: http://<your-ip>:${PORT}`);
  console.log(`🔧 Deepfake proxy endpoint: /api/proxy/deepfake`);
  console.log(`🔧 Audio proxy endpoint: /api/proxy/audio`);
  console.log(`🔧 Misinformation proxy endpoint: /api/proxy/misinformation`);
  console.log(`🔧 Image proxy endpoint: /api/proxy/image`);
  console.log(`============================================\n`);
});

// 23. Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});