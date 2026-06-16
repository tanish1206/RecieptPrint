import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { analyzeReceipt, saveToHistory } from '../utils/api';

const STEPS = [
  'Detecting receipt edges…',
  'Extracting item names…',
  'Mapping carbon database…',
  'Calculating CO₂ emissions…',
  'Generating swap suggestions…',
];

export default function PreviewScreen({ imageUrl, file, session, onAnalysisComplete, onRetake }) {
  const [progress,   setProgress]   = useState(0);
  const [step,       setStep]       = useState(STEPS[0]);
  const [error,      setError]      = useState('');
  const [isDone,     setIsDone]     = useState(false);
  const didStart = useRef(false);

  useEffect(() => {
    if (didStart.current) return;
    didStart.current = true;

    const run = async () => {
      setError('');
      const token = session?.access_token || 'mock_token_guest';

      // Kick off the real API call
      let apiPromise;
      if (file) {
        apiPromise = analyzeReceipt(file, token);
      } else {
        // No file (SVG placeholder from logo click) — use mock token path
        const tinyJpeg = await fetch(imageUrl).then(r => r.blob()).catch(() => null);
        if (tinyJpeg) {
          const f = new File([tinyJpeg], 'receipt.jpg', { type: 'image/jpeg' });
          apiPromise = analyzeReceipt(f, 'mock_token_guest_demo');
        } else {
          apiPromise = analyzeReceipt(new File(['x'], 'demo.jpg', { type: 'image/jpeg' }), 'mock_token_guest_demo');
        }
      }

      // Animate progress bar while API call is in flight (stops at 90%)
      let prog = 0;
      const ticker = setInterval(() => {
        prog = Math.min(prog + 4, 90);
        const stepIdx = Math.min(Math.floor((prog / 90) * STEPS.length), STEPS.length - 1);
        setProgress(prog);
        setStep(STEPS[stepIdx]);
      }, 100);

      try {
        const result = await apiPromise;
        clearInterval(ticker);
        setProgress(100);
        setStep('Analysis complete!');
        setIsDone(true);

        // Save to history (non-blocking)
        saveToHistory(result, token).catch(() => {});

        // Brief pause so user sees 100%
        await new Promise(r => setTimeout(r, 600));
        onAnalysisComplete(result);
      } catch (err) {
        clearInterval(ticker);
        setError(err.message || 'Analysis failed. Please try again.');
      }
    };

    run();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>

      {/* Top progress header */}
      <div className="mobile-preview-header">
        <div className="analysing-indicator">
          {!isDone && !error && <div className="spinner-loader" style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border-color)', borderTopColor: 'var(--green-primary)', animation: 'spin 0.8s linear infinite' }} />}
          <span style={{ color: error ? 'var(--red-dot)' : 'inherit' }}>
            {error ? 'Analysis failed' : isDone ? 'Analysis complete!' : 'Analysing receipt…'}
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${error ? 100 : progress}%`, backgroundColor: error ? 'var(--red-dot)' : undefined }}
          />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0', minHeight: '16px' }}>{!error && step}</p>
      </div>

      {/* Receipt image preview */}
      <div className="receipt-image-preview-container">
        {imageUrl ? (
          <img src={imageUrl} alt="Captured receipt" className="captured-image" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            No image captured
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div style={{ margin: 'var(--spacing-16)', padding: '12px', backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 'var(--radius-card)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <AlertCircle size={18} style={{ color: 'var(--red-dot)', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#B71C1C', lineHeight: 1.4 }}>{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="preview-actions">
        <button className="btn-preview-retake" onClick={onRetake} style={{ minHeight: '48px' }}>
          {error ? 'Try Again' : 'Retake'}
        </button>
      </div>

    </div>
  );
}
