import React, { useState } from 'react';
import '../styles/MobileUpload.css';
import { useParams } from 'react-router-dom';
import { CameraIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MobileUpload = () => {
  const { folder, count } = useParams();
  const [name, setName] = useState('');
  const [images, setImages] = useState([]);
  const [step, setStep] = useState('name');
  const maxImages = parseInt(count);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    toast.success('Welcome ' + name + '!');
    setStep('upload');
  };

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file && images.length < maxImages) {
      const newImage = {
        file,
        preview: URL.createObjectURL(file)
      };
      setImages(prevImages => [...prevImages, newImage]);
      toast.success(`Photo ${images.length + 1} captured`);
    }
  };

  const removeImage = (index) => {
    setImages(prevImages => {
      const newImages = [...prevImages];
      URL.revokeObjectURL(newImages[index].preview); // Clean up URL
      newImages.splice(index, 1);
      toast.success('Photo removed');
      return newImages;
    });
  };

  const handleUpload = async () => {
    try {
      const sanitizedName = name.trim();
      if (!sanitizedName) {
        toast.error('Please enter a valid name');
        setStep('name');
        return;
      }

      if (images.length === 0) {
        toast.error('Please take at least one photo');
        return;
      }

      if (images.length !== maxImages) {
        toast.error(`Please take all ${maxImages} photos before uploading`);
        return;
      }

      setIsUploading(true);
      const uploadToast = toast.loading('Starting upload...');

      for (let i = 0; i < images.length; i++) {
        const formData = new FormData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileExtension = images[i].file.name.substring(images[i].file.name.lastIndexOf('.'));
        const fileName = `${sanitizedName}_${timestamp}_${i + 1}${fileExtension}`;

        formData.append('name', sanitizedName);
        formData.append('fileName', fileName);
        formData.append('folder', folder || 'default');
        formData.append('imageNumber', (i + 1).toString());
        formData.append('image', images[i].file);

        try {
          const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || `Failed to upload image ${i + 1}`);
          }

          toast.loading(`Uploading image ${i + 1}/${images.length}`, { id: uploadToast });
          setUploadProgress(((i + 1) / images.length) * 100);
        } catch (uploadError) {
          throw new Error(`Error uploading image ${i + 1}: ${uploadError.message}`);
        }
      }

      toast.success('All images uploaded successfully!', { id: uploadToast });

      // Extract sessionId from the URL params if present
      const urlParts = folder.split('/');
      const sessionId = urlParts.length > 2 ? urlParts[2] : null;

      // Notify server about upload completion
      if (sessionId) {
        try {
          const response = await fetch(`${API_URL}/api/upload-status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              status: true
            })
          });

          if (!response.ok) {
            console.error('Failed to notify upload status');
          }
        } catch (notifyError) {
          console.error('Error notifying upload status:', notifyError);
        }
      }

      // Attempt to notify parent windows
      try {
        if (window.opener) {
          window.opener.postMessage('uploadComplete', '*');
          window.close();
        } else {
          window.parent.postMessage('uploadComplete', '*');
          window.postMessage('uploadComplete', '*');
          if (window.top !== window) {
            window.top.postMessage('uploadComplete', '*');
          }
        }
      } catch (messageError) {
        console.error('Error sending completion message:', messageError);
      }

      setUploadComplete(true);
      // Send message to parent window
      if (window.opener) {
        window.opener.postMessage('uploadComplete', '*');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`, { duration: 5000 });
      setStep('name');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const renderNameScreen = () => (
    <div className="name-screen">
      <div className="name-card">
        <h2 className="header-text text-center">Enter Your Name</h2>
        <form onSubmit={handleNameSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="name-input"
            placeholder="Your name"
            required
            autoFocus
          />
          <button type="submit" className="camera-button">
            Continue <CameraIcon className="icon" />
          </button>
        </form>
      </div>
    </div>
  );

  const renderUploadScreen = () => (
    <div className="mobile-container">
      <div className="content-wrapper">
        <div className="glass-effect">
          <h2 className="header-text">
            Photos ({images.length}/{maxImages})
          </h2>
          
          <div className="mobile-scroll">
            <div className="image-grid">
              {images.map((img, index) => (
                <div key={index} className="image-preview-container">
                  <img
                    src={img.preview}
                    alt={`Upload ${index + 1}`}
                    className="image-preview"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="delete-button"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-fixed-bottom">
        {images.length < maxImages ? (
          <>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
              id="camera"
              style={{ display: 'none' }}
            />
            <label htmlFor="camera" className="camera-button">
              <CameraIcon className="icon" />
              <span>Take Photo ({images.length}/{maxImages})</span>
            </label>
          </>
        ) : (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="camera-button"
            style={{
              background: isUploading 
                ? '#9CA3AF'
                : 'linear-gradient(to right, #059669, #10B981)'
            }}
          >
            <ArrowUpTrayIcon className="icon" />
            <span>{isUploading ? 'Uploading...' : 'Upload All Photos'}</span>
          </button>
        )}
      </div>

      {isUploading && (
        <div className="upload-progress">
          <div 
            className="progress-bar"
            style={{ width: `${uploadProgress}%` }}
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      )}

      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
          }
        }}
      />
    </div>
  );

  const renderThankYouScreen = () => (
    <div className="name-screen">
      <div className="name-card">
        <h2 className="header-text text-center">Thank You!</h2>
        <p className="text-center mt-4">
          Your images have been uploaded successfully.
          You can close this window now.
        </p>
      </div>
    </div>
  );

  if (uploadComplete) {
    return renderThankYouScreen();
  }

  return step === 'name' ? renderNameScreen() : renderUploadScreen();
};

export default MobileUpload;