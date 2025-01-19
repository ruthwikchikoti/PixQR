const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function getCredentialsFromEnv() {
  return {
    type: process.env.GOOGLE_APPLICATION_CREDENTIALS_TYPE,
    project_id: process.env.GOOGLE_APPLICATION_CREDENTIALS_PROJECT_ID,
    private_key_id: process.env.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_ID,
    auth_uri: process.env.GOOGLE_APPLICATION_CREDENTIALS_AUTH_URI,
    token_uri: process.env.GOOGLE_APPLICATION_CREDENTIALS_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_APPLICATION_CREDENTIALS_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_X509_CERT_URL
  };

}
console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY);

async function initializeGoogleDrive() {
  try {
    const credentials = getCredentialsFromEnv();

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'] // Changed to full drive scope
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Drive initialization error:', error);
    throw error;
  }
}

async function createDriveFolders() {
  try {
    const credentials = getCredentialsFromEnv();
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });
    const folderIds = {};

    // Create folders a, b, c
    for (const folderName of ['a', 'b', 'c']) {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      });

      const folderId = folder.data.id;
      folderIds[folderName] = folderId;

      // Set permissions
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'writer',
          type: 'anyone'
        }
      });

      console.log(`Created folder ${folderName} with ID: ${folderId}`);
    }

    // Update .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    Object.entries(folderIds).forEach(([folder, id]) => {
      const regex = new RegExp(`FOLDER_ID_${folder.toUpperCase()}=.*`, 'i');
      envContent = envContent.replace(regex, `FOLDER_ID_${folder.toUpperCase()}=${id}`);
    });
    
    fs.writeFileSync(envPath, envContent);

    console.log('Drive folders created and .env updated successfully!');
    console.log('Folder IDs:', folderIds);
    
    return folderIds;
  } catch (error) {
    console.error('Error creating drive folders:', error);
    throw error;
  }
}

async function uploadHandler(req, res) {
  return new Promise((resolve, reject) => {
    upload(req, res, async function(err) {
      try {
        if (err) {
          console.error('Multer error:', err);
          return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!req.body.folder) {
          return res.status(400).json({ error: 'No folder specified' });
        }

        const drive = await initializeGoogleDrive();
        const folderId = getFolderId(req.body.folder);

        const fileMetadata = {
          name: req.body.fileName || req.file.originalname,
          parents: [folderId]
        };

        const media = {
          mimeType: req.file.mimetype,
          body: Buffer.from(req.file.buffer)
        };

        const file = await drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id,webViewLink',
          supportsAllDrives: true
        });

        // Set file permissions to anyone with the link can view
        await drive.permissions.create({
          fileId: file.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });

        console.log(`File uploaded successfully: ${file.data.id}`);
        res.json({
          success: true,
          fileId: file.data.id,
          viewLink: file.data.webViewLink
        });
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
          error: 'Upload failed',
          details: error.message,
          stack: error.stack
        });
      }
    });
  });
}

// Debug mode to check credentials first
if (require.main === module) {
  try {
    console.log('Validating credentials...');
    getCredentialsFromEnv();
    console.log('Credentials are valid, creating folders...');
    createDriveFolders();
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

module.exports = { 
  createDriveFolders
};