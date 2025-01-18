const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function cleanBase64String(str) {
  // Remove whitespace, newlines and any unwanted characters
  return str.replace(/[\n\r\s]/g, '');
}

function validateAndParseCredentials() {
  try {
    const base64Creds = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    if (!base64Creds) {
      throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS_BASE64');
    }

    const cleanCreds = cleanBase64String(base64Creds);
    const decodedCreds = Buffer.from(cleanCreds, 'base64').toString();
    
    try {
      const parsedCreds = JSON.parse(decodedCreds);
      console.log('Credentials parsed successfully');
      return parsedCreds;
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      throw new Error('Invalid JSON in credentials');
    }
  } catch (error) {
    console.error('Credential validation error:', error);
    throw error;
  }
}

async function createDriveFolders() {
  try {
    const credentials = validateAndParseCredentials();
    
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

// Debug mode to check credentials first
if (require.main === module) {
  try {
    console.log('Validating credentials...');
    validateAndParseCredentials();
    console.log('Credentials are valid, creating folders...');
    createDriveFolders();
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

module.exports = { createDriveFolders };