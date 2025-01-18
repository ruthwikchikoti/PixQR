const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const credentialsPath = path.resolve(__dirname, '../credentials.json');

if (!fs.existsSync(credentialsPath)) {
  console.error('Error: credentials.json file not found at:', credentialsPath);
  throw new Error('Google Drive credentials file not found');
}

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

let driveClient = null;

async function initializeDrive() {
  try {
    if (!driveClient) {
      const authClient = await auth.getClient();
      driveClient = google.drive({ version: 'v3', auth: authClient });
      console.log('Drive client initialized successfully');
    }
    return driveClient;
  } catch (error) {
    console.error('Failed to initialize Drive client:', error);
    throw new Error(`Authentication failed: ${error.message}`);
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
    // Search for existing folder
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: 'files(id, name)',
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

async function uploadToDrive(filePath, filename, folderName) {
  try {
    const drive = await initializeDrive();
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Source file not found: ${filePath}`);
    }

    const folderId = await findOrCreateFolder(folderName);
    console.log('Using folder:', { name: folderName, id: folderId });

    const fileMetadata = {
      name: filename,
      parents: [folderId]
    };

    const media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(filePath)
    };

    console.log('Starting Drive upload:', { filename, folder: folderId });

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
    });

    console.log('Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Drive upload error:', error);
    throw new Error(`Drive upload failed: ${error.message}`);
  }
}

module.exports = {
  uploadToDrive,
  findOrCreateFolder
};