import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, Leaf } from 'lucide-react';

export default function HomeScreen({ onImageSelect }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onImageSelect(imageUrl, file);
    }
  };

  const triggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const triggerGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  return (
    <div className="mobile-home">
      <div className="mobile-home-header">
        <Leaf 
          className="mobile-home-logo" 
          strokeWidth={2}
          style={{ color: 'var(--green-primary)', cursor: 'pointer' }}
          onClick={() => onImageSelect("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'><rect width='100%' height='100%' fill='%23F5F5F5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%23999999'>Scanned Receipt Image</text></svg>")}
          role="button"
          aria-label="Simulate receipt scan (dev mode)"
        />
        <h1 className="mobile-home-title">ReceiptPrint</h1>
        <p className="mobile-home-tagline">
          Track your grocery's impact on the planet 🌿
        </p>
      </div>

      <div className="mobile-home-buttons">
        {/* Hidden File Inputs */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="camera-capture-input"
        />
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="gallery-upload-input"
        />

        {/* Scan Receipt Button */}
        <button 
          className="btn-primary" 
          onClick={triggerCamera}
          style={{ minHeight: '48px' }}
        >
          <Camera size={20} strokeWidth={2} />
          Scan Receipt
        </button>

        {/* Choose from Gallery Button */}
        <button 
          className="btn-secondary" 
          onClick={triggerGallery}
          style={{ minHeight: '48px' }}
        >
          <ImageIcon size={20} strokeWidth={2} />
          Choose from Gallery
        </button>
      </div>
    </div>
  );
}
