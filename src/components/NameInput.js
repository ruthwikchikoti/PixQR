import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NameInput = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { folder, imageCount } = location.state;

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/capture', { 
      state: { folder, imageCount, name } 
    });
  };

  return (
    <div className="name-input-container">
      <div className="name-input-card">
        <h2>Enter Your Name</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="name-input"
            placeholder="Your Name"
            required
          />
          <button type="submit" className="submit-button">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameInput;
