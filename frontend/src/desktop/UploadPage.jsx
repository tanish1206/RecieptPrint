import React, { useState, useRef } from 'react';
import { Leaf, UploadCloud, Sun, FileText, Frame, CheckCircle2, Star, MoreHorizontal, ArrowLeft, ArrowRight, Lock } from 'lucide-react';

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setSelectedFile(file);
  };

  const triggerBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="desktop-wrapper">
      
      {/* Decorative Browser Chrome */}
      <div className="browser-chrome" aria-label="Simulated Browser Chrome">
        <div className="browser-dots">
          <div className="browser-dot dot-close" />
          <div className="browser-dot dot-minimize" />
          <div className="browser-dot dot-maximize" />
        </div>
        
        <div className="browser-nav-btns">
          <ArrowLeft size={14} style={{ cursor: 'not-allowed', opacity: 0.5 }} />
          <ArrowRight size={14} style={{ cursor: 'not-allowed', opacity: 0.5 }} />
        </div>

        <div className="browser-url-bar">
          <Lock size={12} style={{ color: 'var(--text-secondary)' }} />
          <span>receiptprint.in/upload</span>
        </div>

        <div className="browser-chrome-right">
          <Star size={14} style={{ cursor: 'pointer' }} />
          <MoreHorizontal size={14} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {/* Top Navigation Bar */}
      <header className="desktop-nav">
        <div className="desktop-logo-area">
          <Leaf className="desktop-logo-icon" />
          <span>ReceiptPrint</span>
        </div>

        <nav className="desktop-nav-links" aria-label="Desktop Navigation">
          <a href="#how" className="desktop-nav-link">How it Works</a>
          <a href="#pricing" className="desktop-nav-link">Pricing</a>
          <a href="#login" className="desktop-nav-link">Log in</a>
          <button className="btn-signup">Sign up</button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="desktop-main">
        <div className="desktop-columns">
          
          {/* Left Column: Dropzone */}
          <div>
            <form 
              onDragEnter={handleDrag} 
              onDragOver={handleDrag} 
              onDragLeave={handleDrag} 
              onDrop={handleDrop}
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="desktop-file-upload"
                multiple={false}
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleChange}
                style={{ display: 'none' }}
              />

              <div 
                className={`dropzone-card ${dragActive ? 'dragging' : ''}`}
                onClick={triggerBrowse}
              >
                {selectedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={52} style={{ color: 'var(--green-primary)' }} />
                    <p className="upload-primary-text" style={{ fontSize: '16px' }}>
                      {selectedFile.name}
                    </p>
                    <p className="upload-secondary-text" style={{ fontSize: '13px', marginTop: '0' }}>
                      Ready to analyse. Click to change.
                    </p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="upload-icon" />
                    <p className="upload-primary-text">Drop your receipt here</p>
                    <p className="upload-secondary-text">
                      or click to <span className="browse-link">browse</span>
                    </p>
                    <p className="upload-format-hint">
                      Accepts JPG · PNG · PDF — max 5MB
                    </p>
                  </>
                )}
              </div>
            </form>
          </div>

          {/* Right Column: Tips Panel */}
          <div className="tips-panel">
            <h3 className="tips-heading">Tips for best results</h3>
            
            <div className="tip-rows">
              <div className="tip-row">
                <div className="tip-icon"><Sun size={16} /></div>
                <div className="tip-text">Works best with clear, well-lit photos.</div>
              </div>

              <div className="tip-row">
                <div className="tip-icon"><FileText size={16} /></div>
                <div className="tip-text">Make sure all four corners of the receipt are visible.</div>
              </div>

              <div className="tip-row">
                <div className="tip-icon"><Frame size={16} /></div>
                <div className="tip-text">Avoid shadows and blurred images.</div>
              </div>

              <div className="tip-row">
                <div className="tip-icon"><CheckCircle2 size={16} /></div>
                <div className="tip-text">Review and confirm details after upload.</div>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
