# PixQR(QR Image Upload System)

A web application that facilitates image uploads through QR code scanning, built with React and Node.js. The system allows desktop users to generate QR codes that mobile users can scan to quickly upload images to specific Google Drive folders.

## Features

- QR code generation for mobile upload links
- Mobile-friendly image capture interface
- Direct upload to Google Drive
- Real-time upload status tracking
- Secure file handling
- Automatic file cleanup

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Platform account
- Google Drive API credentials

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/qr-image-upload.git
cd qr-image-upload
```

2. Install dependencies:
```bash
npm install
```

3. Configure Google Drive credentials:
   - Create a project in Google Cloud Console
   - Enable Google Drive API
   - Create service account credentials
   - Download credentials as `credentials.json`
   - Place `credentials.json` in project root

4. Set up environment variables:
   Create a `.env` file in the root directory:
```
REACT_APP_BASE_URL=your-deployment-url
REACT_APP_API_URL=your-api-url
```

5. Initialize Drive folders:
```bash
node utils/setupDrive.js
```

6. Build the frontend:
```bash
npm run build
```

7. Start the server:
```bash
npm start
```


## Project Structure

```
qr-image-upload/
├── server/
│   ├── api/
│   │   └── upload.js
│   ├── driveService.js
│   └── index.js
├── src/
│   ├── components/
│   │   ├── ImageCapture.js
│   │   ├── MobileUpload.js
│   │   ├── QRScreen.js
│   │   └── ReviewScreen.js
│   ├── context/
│   │   └── UploadContext.js
│   └── App.js
├── utils/
│   ├── generateQR.js
│   └── setupDrive.js
└── vercel.json
```

## Usage

### Desktop Flow:
1. Access the web application
2. Enter required information
3. Get QR code for mobile upload
4. Share QR code with mobile user

### Mobile Flow:
1. Scan QR code
2. Access mobile upload interface
3. Capture or select image
4. Review and confirm upload
5. Wait for upload confirmation

## Security Considerations

- File size limits implemented
- Temporary file cleanup
- Secure Google Drive integration
- Input sanitization
- CORS configuration

## API Endpoints

- `POST /api/upload`: Handle file uploads
- `GET /m/:qrdata`: Serve mobile upload interface

## Error Handling

The application includes comprehensive error handling for:
- File upload failures
- Invalid input
- Drive API errors
- Network issues
- Missing credentials

