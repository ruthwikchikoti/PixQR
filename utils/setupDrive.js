// utils/setupDrive.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createDriveFolders() {
  try {
    // Use base64 credentials from env
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString()
    );

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
    
    // Update folder IDs
    envContent = envContent.replace(/FOLDER_ID_A=.*/, `FOLDER_ID_A=${folderIds.a}`);
    envContent = envContent.replace(/FOLDER_ID_B=.*/, `FOLDER_ID_B=${folderIds.b}`);
    envContent = envContent.replace(/FOLDER_ID_C=.*/, `FOLDER_ID_C=${folderIds.c}`);
    
    fs.writeFileSync(envPath, envContent);

    console.log('Drive folders created and .env updated successfully!');
    console.log('Folder IDs:', folderIds);
    
    return folderIds;
  } catch (error) {
    console.error('Error creating drive folders:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createDriveFolders();
}

module.exports = { createDriveFolders };