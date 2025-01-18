// utils/generateQR.js
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

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