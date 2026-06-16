import React, { useState, useRef, useEffect } from 'react';
import { Leaf, UploadCloud, Sun, FileText, Frame, CheckCircle2, RefreshCw, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import DesktopAuth from './DesktopAuth';

export default function UploadPage({ session, onAuthSuccess, onLogOut }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const fileInputRef = useRef(null);

  const chartData = [
    { name: 'May 20', value: 6.1 },
    { name: 'May 27', value: 5.4 },
    { name: 'Jun 3', value: 4.8 },
    { name: 'Jun 10', value: 4.2 },
  ];

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
    startAnalysis();
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
  };

  const triggerDemoScan = () => {
    handleFile({ name: "sample_grocery_receipt.jpg" });
  };

  useEffect(() => {
    if (!isAnalyzing) return;

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsAnalyzing(false);
            setIsAnalyzed(true);
          }, 400);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const triggerBrowse = () => {
    // If ?mock=true in URL, fire demo directly
    if (window.location.search.includes('mock=true')) {
      triggerDemoScan();
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setIsAnalyzed(false);
    setAnalysisProgress(0);
  };

  // SVG circular progress dimensions
  const radius = 66;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const total = 4.7;
  const greenLen = (1.3 / total) * circumference;
  const amberLen = (1.3 / total) * circumference;
  const redLen = (2.1 / total) * circumference;

  const greenOffset = 0;
  const amberOffset = -greenLen;
  const redOffset = -(greenLen + amberLen);

  return (
    <div className="desktop-wrapper">
      
      {/* Top Navigation Bar */}
      <header className="desktop-nav">
        <div className="desktop-logo-area">
          <Leaf className="desktop-logo-icon" />
          <span style={{ fontWeight: 'var(--weight-large-num)', letterSpacing: '-0.5px' }}>ReceiptPrint</span>
        </div>

        <nav className="desktop-nav-links" aria-label="Desktop Navigation">
          <a href="#how" className="desktop-nav-link">How it Works</a>
          {session ? (
            <>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Logged in as <strong>{session.user.email}</strong>
              </span>
              <button 
                onClick={onLogOut} 
                className="btn-secondary" 
                style={{ height: '36px', padding: '0 var(--spacing-16)', fontSize: '13px', borderRadius: '8px', borderColor: 'var(--red-dot)', color: 'var(--red-dot)' }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <a href="#login" className="desktop-nav-link" onClick={() => resetScanner()}>Log in</a>
              <button className="btn-signup" onClick={() => resetScanner()}>Sign up</button>
            </>
          )}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="desktop-main">
        {!session ? (
          <DesktopAuth onAuthSuccess={onAuthSuccess} />
        ) : isAnalyzed ? (
          /* PRESTIGE DESKTOP RESULTS DASHBOARD */
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1080px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
            
            {/* Dashboard Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%', borderBottom: '1.5px solid var(--border-color)', paddingBottom: 'var(--spacing-16)' }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: 'var(--weight-large-num)', color: 'var(--text-primary)' }}>Receipt Carbon Dashboard</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Uploaded: {selectedFile?.name || 'receipt.jpg'} · June 13, 2026</p>
              </div>
              <button 
                onClick={resetScanner} 
                className="btn-primary" 
                style={{ marginLeft: 'auto', height: '40px', padding: '0 var(--spacing-20)', borderRadius: '8px', fontSize: '14px' }}
              >
                <RefreshCw size={16} />
                Scan Another Receipt
              </button>
            </div>

            {/* Split Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-32)' }}>
              
              {/* Left Column: Stats and Trend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
                
                {/* Ring & Breakdown Section */}
                <div style={{ display: 'flex', gap: 'var(--spacing-24)', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-24)' }}>
                  
                  {/* SVG progress ring */}
                  <div className="circular-progress-ring-container">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r={radius} fill="transparent" stroke="var(--border-color)" strokeWidth={strokeWidth} />
                      <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#43A047" strokeWidth={strokeWidth} strokeDasharray={`${greenLen} ${circumference}`} strokeDashoffset={greenOffset} transform="rotate(-90 80 80)" />
                      <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#FB8C00" strokeWidth={strokeWidth} strokeDasharray={`${amberLen} ${circumference}`} strokeDashoffset={amberOffset} transform="rotate(-90 80 80)" />
                      <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#E53935" strokeWidth={strokeWidth} strokeDasharray={`${redLen} ${circumference}`} strokeDashoffset={redOffset} transform="rotate(-90 80 80)" />
                    </svg>
                    <div className="circular-progress-text">
                      <span className="progress-text-value">4.7</span>
                      <span className="progress-text-unit">kg CO₂e</span>
                      <span className="progress-text-label">Total Impact</span>
                    </div>
                  </div>

                  {/* Breakdown details */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'var(--weight-heading)', color: 'var(--text-secondary)' }}>Emission Breakdown</h4>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E53935' }} /> Meat & Proteins
                      </span>
                      <strong>2.1 kg CO₂e</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FB8C00' }} /> Dairy products
                      </span>
                      <strong>1.3 kg CO₂e</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#43A047' }} /> Fresh Produce
                      </span>
                      <strong>1.3 kg CO₂e</strong>
                    </div>
                  </div>

                </div>

                {/* History Trend Card */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-24)', height: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'var(--weight-heading)', color: 'var(--text-primary)' }}>Carbon Footprint Trend (kg CO₂e)</h4>
                  <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                        <CartesianGrid stroke="#F5F5F5" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <YAxis domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <Line type="monotone" dataKey="value" stroke="var(--green-primary)" strokeWidth={3} dot={{ r: 6, fill: 'var(--green-primary)', strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Right Column: Offenders & Suggestions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
                
                {/* Top Offenders Panel */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'var(--weight-heading)', color: 'var(--text-primary)' }}>Top Offenders</h4>
                  
                  <div className="offender-row">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--red-dot)' }} />
                    <span className="offender-name">Amul Butter 100g</span>
                    <span className="offender-value">0.9 kg CO₂e</span>
                  </div>

                  <div className="offender-row">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--amber-dot)' }} />
                    <span className="offender-name">Aashirvaad Atta 5kg</span>
                    <span className="offender-value">0.7 kg CO₂e</span>
                  </div>

                  <div className="offender-row">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--amber-dot)' }} />
                    <span className="offender-name">Toor Dal 1kg</span>
                    <span className="offender-value">0.5 kg CO₂e</span>
                  </div>
                </div>

                {/* Swaps & Annual Savings Column */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'var(--weight-heading)', color: 'var(--text-primary)' }}>Recommended Eco Swaps</h4>
                  
                  {/* Swaps summary list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span>Amul Butter → <strong>MilkyMist Butter</strong></span>
                      <span style={{ color: 'var(--green-primary)', fontWeight: 'bold' }}>Save 0.5 kg (-56%)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span>Aashirvaad Atta → <strong>Pillsbury Atta</strong></span>
                      <span style={{ color: 'var(--green-primary)', fontWeight: 'bold' }}>Save 0.4 kg (-40%)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Toor Dal → <strong>Moong Dal</strong></span>
                      <span style={{ color: 'var(--green-primary)', fontWeight: 'bold' }}>Save 0.3 kg (-35%)</span>
                    </div>
                  </div>

                  {/* Savings summary */}
                  <div className="annual-savings-card" style={{ padding: '12px var(--spacing-16)' }}>
                    <div className="annual-savings-left">
                      <span style={{ fontSize: '12px' }}>Projected annual savings (1 year):</span>
                      <span className="annual-savings-value" style={{ fontSize: '18px', marginTop: '2px' }}>Save 41 kg CO₂e</span>
                    </div>
                    <div className="annual-savings-right" style={{ width: '40px', height: '40px' }}>
                      <Leaf size={20} />
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* SCANNING / UPLOAD SCREEN */
          <div className="desktop-columns">
            
            {/* Left Column: Dropzone & Upload animations */}
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
                  onClick={isAnalyzing ? undefined : triggerBrowse}
                  style={{ pointerEvents: isAnalyzing ? 'none' : 'auto', position: 'relative' }}
                >
                  {isAnalyzing ? (
                    /* SCANNING PROGRESS ANIMATION */
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-16)', width: '100%', padding: '0 var(--spacing-24)' }}>
                      <RefreshCw className="spinner-loader" size={40} style={{ color: 'var(--green-primary)', width: '40px', height: '40px', animationDuration: '1.5s' }} />
                      <p className="upload-primary-text" style={{ fontSize: '16px' }}>
                        Analysing receipt with Groq Vision...
                      </p>
                      
                      <div className="progress-bar-container" style={{ width: '100%', height: '4px', borderRadius: '2px' }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${analysisProgress}%`,
                            animation: 'none'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{analysisProgress}% Complete</span>
                    </div>
                  ) : selectedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={52} style={{ color: 'var(--green-primary)' }} />
                      <p className="upload-primary-text" style={{ fontSize: '16px' }}>
                        {selectedFile.name}
                      </p>
                      <p className="upload-secondary-text" style={{ fontSize: '13px', marginTop: '0' }}>
                        Processing file...
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
        )}
      </main>

    </div>
  );
}
