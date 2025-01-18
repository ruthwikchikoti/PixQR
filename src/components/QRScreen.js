// QRScreen.js
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import '../styles/QRScreen.css';

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const QRScreen = () => {
  const [qrData, setQRData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Generate QR code on mount
    if (!isMobileDevice() && !qrData) {
      generateNewQR();
    }

    // Message handler function
    const handleMessage = (event) => {
      if (event.data === 'uploadComplete') {
        navigate('/', { replace: true });
      }
    };

    // Add event listener
    window.addEventListener('message', handleMessage);

    // Cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate, qrData]);

  const generateNewQR = () => {
    const folders = [
      { folder: 'a', images: 3 },
      { folder: 'b', images: 4 },
      { folder: 'c', images: 5 }
    ];
    const selected = folders[Math.floor(Math.random() * folders.length)];
    const qrData = `${selected.folder}/${selected.images}`;
    const mobileUrl = `${window.location.origin}/m/${qrData}`;
    setQRData({
      url: mobileUrl,
      ...selected
    });
  };

  return (
    <div className="main-container">
      <header className="app-header">
        <h1>Easy Image Upload</h1>
        <p className="subtitle">Simple and Quick Image Upload Solution</p>
      </header>

      <div className="content-container">
        {!qrData ? (
          <div className="loading">Generating QR Code...</div>
        ) : (
          <div className="qr-display">
            <div className="qr-container">
              <QRCodeSVG 
                value={qrData.url}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="qr-instructions">
              <p className="qr-info">
                Scan with your phone to upload {qrData.images} images
              </p>
              <button
                onClick={generateNewQR}
                className="reset-button"
              >
                Generate New QR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScreen;