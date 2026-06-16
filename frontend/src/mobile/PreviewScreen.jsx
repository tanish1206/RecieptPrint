import React, { useState, useEffect } from 'react';

export default function PreviewScreen({ imageUrl, onConfirm, onRetake }) {
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [analysisFinished, setAnalysisFinished] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setLoadingPercent((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setAnalysisFinished(true);
          return 100;
        }
        return prev + 10;
      });
    }, 250);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      {/* Top progress area */}
      <div className="mobile-preview-header">
        <div className="analysing-indicator">
          {!analysisFinished && <div className="spinner-loader" />}
          <span>{analysisFinished ? "Analysis complete!" : "Analysing receipt..."}</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ 
              width: `${loadingPercent}%`,
              animation: analysisFinished ? 'none' : undefined
            }}
          />
        </div>
      </div>

      {/* Receipt image preview */}
      <div className="receipt-image-preview-container">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Captured receipt" 
            className="captured-image" 
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            No image captured
          </div>
        )}

        {/* Paper receipt overlay - always showing or fades in after loading starts */}
        {loadingPercent > 30 && (
          <div 
            className="receipt-paper-overlay"
            style={{
              transition: 'opacity 0.5s ease-in-out',
              opacity: loadingPercent > 60 ? 0.96 : 0.4
            }}
          >
            <div className="receipt-paper-header">
              <p className="receipt-paper-store">ECO GROCERS</p>
              <p>123 Green Lane, New Delhi</p>
              <p>Ph: +91 98765 43210</p>
            </div>
            
            <div className="receipt-separator" />
            
            <table className="receipt-table">
              <thead>
                <tr>
                  <th style={{ color: 'var(--text-primary)' }}>Item</th>
                  <th style={{ textAlign: 'center', color: 'var(--text-primary)' }}>Qty</th>
                  <th style={{ textAlign: 'right', color: 'var(--text-primary)' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Amul Butter 100g</td>
                  <td style={{ textAlign: 'center' }}>1</td>
                  <td style={{ textAlign: 'right' }}>₹55.00</td>
                </tr>
                <tr>
                  <td>Aashirvaad Atta 5kg</td>
                  <td style={{ textAlign: 'center' }}>1</td>
                  <td style={{ textAlign: 'right' }}>₹260.00</td>
                </tr>
                <tr>
                  <td>Toor Dal 1kg</td>
                  <td style={{ textAlign: 'center' }}>1</td>
                  <td style={{ textAlign: 'right' }}>₹150.00</td>
                </tr>
              </tbody>
            </table>
            
            <div className="receipt-separator" />
            
            <div className="receipt-footer">
              <div className="receipt-footer-row">
                <span>Total Items:</span>
                <span>3</span>
              </div>
              <div className="receipt-footer-row" style={{ fontWeight: 'bold' }}>
                <span>Total Amount:</span>
                <span>₹465.00</span>
              </div>
              <div className="receipt-separator" />
              <p style={{ marginTop: '4px', fontStyle: 'italic' }}>Thank you!</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="preview-actions">
        <button 
          className="btn-preview-good" 
          onClick={onConfirm}
          style={{ minHeight: '48px' }}
        >
          Looks Good
        </button>
        <button 
          className="btn-preview-retake" 
          onClick={onRetake}
          style={{ minHeight: '48px' }}
        >
          Retake
        </button>
      </div>
    </div>
  );
}
