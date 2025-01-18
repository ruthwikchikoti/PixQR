import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ImageCapture = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { folder, imageCount, name } = location.state;
  const [images, setImages] = useState([]);

  const captureImage = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImages([...images, {
        file,
        preview: URL.createObjectURL(file)
      }]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleComplete = () => {
    if (images.length === imageCount) {
      navigate('/review', { state: { images, folder, name } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Photo {images.length + 1} of {imageCount}
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {images.map((img, index) => (
            <div key={index} className="relative">
              <img 
                src={img.preview} 
                alt={`Upload ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg shadow"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={captureImage}
            className="hidden"
            id="camera"
          />
          <label
            htmlFor="camera"
            className="bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:bg-blue-600 transition-colors"
          >
            📸 Take Photo
          </label>

          {images.length === imageCount && (
            <button
              onClick={handleComplete}
              className="w-full bg-green-500 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Review All Photos
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCapture;
