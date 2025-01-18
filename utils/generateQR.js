// utils/generateQR.js
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

const initializeStorage = () => {
  try {
    // Prioritize base64 credentials for production
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
      const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString()
      );
      return new Storage({ 
        credentials,
        projectId: credentials.project_id 
      });
    }
    
    // Development fallback
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return new Storage();
    }
    
    throw new Error('Google Cloud credentials not found in environment');
  } catch (error) {
    console.error('Failed to initialize Google Cloud Storage:', error);
    throw error;
  }
};

async function generateQRCodes() {
  // Create QR codes directory if it doesn't exist
  const qrDir = path.join(__dirname, '../public/qr-codes');
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
  }

  // Configuration for each folder
  const folders = [
    { name: 'a', imageCount: 3 },
    { name: 'b', imageCount: 4 },
    { name: 'c', imageCount: 5 }
  ];

  for (const folder of folders) {
    const data = `${folder.name}-${folder.imageCount}`;
    const filePath = path.join(qrDir, `${folder.name}.png`);

    try {
      await QRCode.toFile(filePath, data, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      console.log(`Generated QR code for ${data}`);
    } catch (error) {
      console.error(`Error generating QR code for ${data}:`, error);
    }
  }
}

generateQRCodes();