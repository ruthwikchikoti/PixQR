import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://pix-qr.vercel.app';

const ReviewScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { images, folder, name } = location.state;
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    setUploading(true);
    try {
      const formData = new FormData();
      images.forEach((img, index) => {
        formData.append('images', img.file);
      });
      formData.append('name', name);
      formData.append('folder', folder);

      await axios.post(`${API_URL}/api/upload`, formData);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Review Photos
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {images.map((img, index) => (
            <div key={index} className="relative">
              <img
                src={img.preview}
                alt={`Photo ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg shadow"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                ✓
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={uploading}
          className={`w-full ${
            uploading ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'
          } text-white px-6 py-4 rounded-lg text-lg font-semibold transition-colors`}
        >
          {uploading ? 'Uploading...' : 'Submit All Photos'}
        </button>
      </div>
    </div>
  );
};

export default ReviewScreen;