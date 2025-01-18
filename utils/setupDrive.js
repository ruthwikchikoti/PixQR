// utils/setupDrive.js
const { google } = require('googleapis');

async function createDriveFolders() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
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

      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: 'chikotiruthwik@gmail.com' 
        }
      });

      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      console.log(`Created folder ${folderName} with ID: ${folderId}`);
    }

    const fs = require('fs');
    fs.writeFileSync(
      './server/config.json',
      JSON.stringify({ FOLDER_IDS: folderIds }, null, 2)
    );

    console.log('Drive folders created successfully!');
    return folderIds;
  } catch (error) {
    console.error('Error creating drive folders:', error);
    throw error;
  }
}

createDriveFolders();