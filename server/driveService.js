const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

let driveClient = null;

async function initializeDrive() {
  try {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY) {
      throw new Error('Google Drive private key not found in environment variables');
    }

    let privateKey = process.env.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY;
    try {
      if (privateKey.startsWith('"') || privateKey.startsWith("'")) {
        privateKey = JSON.parse(privateKey);
      }
    } catch (e) {
      console.log('Private key is not JSON encoded, using as-is');
    }

    privateKey = privateKey.replace(/\\n/g, '\n');

    const credentials = {
      type: process.env.GOOGLE_APPLICATION_CREDENTIALS_TYPE,
      project_id: process.env.GOOGLE_APPLICATION_CREDENTIALS_PROJECT_ID,
      private_key_id: process.env.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_ID,
      auth_uri: process.env.GOOGLE_APPLICATION_CREDENTIALS_AUTH_URI,
      token_uri: process.env.GOOGLE_APPLICATION_CREDENTIALS_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_APPLICATION_CREDENTIALS_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_X509_CERT_URL
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Drive initialization error:', {
      error: error.message,
      privateKeyExists: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY,
      envVars: {
        type: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_TYPE,
        projectId: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_PROJECT_ID,
        clientEmail: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_EMAIL
      }
    });
    throw new Error(`Failed to initialize Drive: ${error.message}`);
  }
}

async function createFolder(folderName) {
  const drive = await initializeDrive();
  
  try {
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id',
      supportsAllDrives: true
    });

    // Add permission for the service account to be the owner
    await drive.permissions.create({
      fileId: folder.data.id,
      requestBody: {
        role: 'owner',
        type: 'user',
        emailAddress: process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_EMAIL // Service account email
      },
      supportsAllDrives: true,
      transferOwnership: true
    });

    return folder.data.id;
  } catch (error) {
    console.error('Folder creation error:', error);
    throw new Error(`Failed to create folder: ${error.message}`);
  }
}

async function findOrCreateFolder(folderName) {
  const drive = await initializeDrive();
  
  try {
    // Search for existing folder with supportsAllDrives
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: 'files(id, name)',
      supportsAllDrives: true
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create new folder if not found
    return await createFolder(folderName);
  } catch (error) {
    console.error('Folder search error:', error);
    throw new Error(`Failed to find or create folder: ${error.message}`);
  }
}

async function setAdminPermissions(drive, fileId) {
  try {
    // Add admin user permission
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: 'chikotiruthwik@gmail.com' 
      },
      supportsAllDrives: true
    });
  } catch (error) {
    console.error('Permission setting error:', error);
  }
}

async function uploadToDrive(filePath, fileName, folderName) {
  try {
    // Verify file exists and is readable
    await fs.promises.access(filePath, fs.constants.R_OK);
    
    const drive = await initializeDrive();
    const folderId = process.env[`FOLDER_ID_${folderName.toUpperCase()}`];
    
    if (!folderId) {
      throw new Error(`Invalid folder: ${folderName}`);
    }

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(filePath)
    };

    console.log('Starting Drive upload:', {
      fileName,
      folderName,
      folderId,
      filePath
    });

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,webViewLink', // Add webContentLink
      supportsAllDrives: true
    });

    // Set admin permissions
    await setAdminPermissions(drive, file.data.id);

    // Set file permissions for anyone to view
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      },
      fields: 'id'
    });

    console.log('File uploaded successfully:', {
      id: file.data.id,
      webViewLink: file.data.webViewLink,
    });

    return {
      id: file.data.id,
      webViewLink: file.data.webViewLink,
    };
  } catch (error) {
    console.error('Drive upload error:', {
      error,
      filePath,
      fileName,
      folderName
    });
    throw new Error(`Drive upload failed: ${error.message}`);
  }
}

module.exports = {
  uploadToDrive,
  findOrCreateFolder,
  initializeDrive,
  setAdminPermissions
};