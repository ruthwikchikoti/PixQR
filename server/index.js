require('dotenv').config();
// server/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const fs = require('fs');
const { uploadToDrive } = require('./driveService');

const app = express();

// Update CORS configuration
app.use(cors({
  origin: ['http://10.51.2.175:3000', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST']
}));

app.use(express.json());
app.use(express.static('build')); 

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userFolder = path.join(uploadsDir, req.body.name || 'temp');
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }
    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    if (!req.body.name) {
      return cb(new Error('Name is required'));
    }
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const imageNumber = req.body.imageNumber || 1;
    const sanitizedName = req.body.name.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}_${timestamp}_${imageNumber}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!req.body.name) {
      const busboyFields = req.unparsedFields || {};
      if (busboyFields.name) {
        req.body.name = busboyFields.name;
        cb(null, true);
        return;
      }
      cb(new Error('Name is required'));
      return;
    }
    cb(null, true);
  }
}).single('image');

app.get('/m/:qrdata', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

app.post('/api/upload', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload middleware error:', err);
      return res.status(400).json({ 
        error: err.message,
        details: 'File upload configuration error'
      });
    }

    try {
      const { name, fileName, folder, imageNumber } = req.body;
      const file = req.file;

      if (!file || !name || !folder) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: {
            file: !file ? 'No file uploaded' : 'OK',
            name: !name ? 'Name is required' : 'OK',
            folder: !folder ? 'Folder is required' : 'OK'
          }
        });
      }

      const finalFileName = fileName;

      console.log('Starting upload process:', {
        name,
        folderName: folder,
        imageNumber,
        file: finalFileName,
        size: file.size,
        path: file.path
      });

      const result = await uploadToDrive(file.path, finalFileName, folder).catch(error => {
        console.error('Drive upload error:', error);
        throw new Error(`Drive upload failed: ${error.message}`);
      });
      
      if (!result || !result.id) {
        console.error('No result from Drive upload');
        throw new Error('Drive upload failed - no file ID returned');
      }

      await fs.promises.unlink(file.path).catch(error => {
        console.warn('Failed to delete temp file:', error);
        // Don't throw here, continue with the response
      });

      const userFolder = path.join(uploadsDir, name);
      if (fs.existsSync(userFolder)) {
        await fs.promises.rm(userFolder, { recursive: true }).catch(error => {
          console.warn('Failed to clean up user folder:', error);
        });
      }

      res.json({ 
        success: true, 
        filename: finalFileName,
        driveId: result.id,
        webViewLink: result.webViewLink
      });
    } catch (error) {
      console.error('Upload process error:', {
        message: error.message,
        stack: error.stack,
        details: error
      });
      
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Failed to clean up file:', cleanupError);
        }
      }

      res.status(500).json({ 
        error: 'Upload failed',
        details: error.message,
        code: error.code || 'UPLOAD_ERROR'
      });
    }
  });
});

const PORT = process.env.SERVER_PORT || process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});