import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <header className="welcome-header">
        <h1>PixQR</h1>
        <p className="welcome-subtitle">Quick and secure photo sharing system</p>
      </header>

      <div className="welcome-content">
        <div className="welcome-instructions">
          <h2>How It Works</h2>
          <div className="welcome-steps">
            <div className="welcome-step">
              <div className="welcome-step-number">1</div>
              <p>Scan a unique QR code for your upload session</p>
            </div>
            <div className="welcome-step">
              <div className="welcome-step-number">2</div>
              <p>Scan the QR code with your mobile device</p>
            </div>
            <div className="welcome-step">
              <div className="welcome-step-number">3</div>
              <p>Enter your  Name</p>
            </div>
            <div className="welcome-step">
              <div className="welcome-step-number">4</div>
              <p>Capture and upload your images securely</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/qr-screen')} 
          className="welcome-generate-button"
        >
          <div className="welcome-button-content">
            <svg className="welcome-qr-icon" viewBox="0 0 24 24">
              <path d="M3 3h6v6H3zm12 0h6v6h-6zm0 12h6v6h-6zM3 15h6v6H3z"/>
            </svg>
            <span>Tap To Scan QR</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;