require('dotenv').config();
const driveService = require('./driveService');

async function setupFolderPermissions() {
  try {
    const drive = await driveService.initializeDrive();
    
    const folders = {
      'A': process.env.FOLDER_ID_A,
      'B': process.env.FOLDER_ID_B,
      'C': process.env.FOLDER_ID_C
    };

    for (const [name, id] of Object.entries(folders)) {
      if (!id) {
        console.error(`Missing folder ID for folder ${name}`);
        continue;
      }

      console.log(`Setting up permissions for folder ${name} (${id})`);
      await driveService.setAdminPermissions(drive, id);

      console.log(`Completed setup for folder ${name}`);
    }

    console.log('All folders processed');
  } catch (error) {
    console.error('Setup error:', error);
    throw error;
  }
}

setupFolderPermissions().catch(console.error);
