import React, { useState, useRef, useEffect } from 'react';
import { Leaf, UploadCloud, Sun, FileText, Frame, CheckCircle2, RefreshCw, LogOut, User, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import DesktopAuth from './DesktopAuth';

export default function UploadPage({ session, onAuthSuccess, onLogOut }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const fileInputRef = useRef(null);

  const steps = [
    'Detecting receipt edges…',
    'Extracting item names…',
    'Mapping carbon database…',
    'Calculating CO₂ emissions…',
    'Generating swap suggestions…',
  ];

  const chartData = [
    { name: 'May 20', value: 6.1 },
    { name: 'May 27', value: 5.4 },
    { name: 'Jun 3',  value: 4.8 },
    { name: 'Jun 10', value: 4.2 },
  ];

  // --- File handling ---
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    setSelectedFile(file);
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStep(steps[0]);
  };

  const triggerDemoScan = () => handleFile({ name: 'sample_grocery_receipt.jpg' });

  const triggerBrowse = () => {
    if (window.location.search.includes('mock=true')) { triggerDemoScan(); return; }
    fileInputRef.current?.click();
  };

  // --- Analysis progress ticker ---
  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        const next = prev + 4;
        const stepIndex = Math.min(Math.floor((next / 100) * steps.length), steps.length - 1);
        setAnalysisStep(steps[stepIndex]);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => { setIsAnalyzing(false); setIsAnalyzed(true); }, 600);
          return 100;
        }
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const resetScanner = () => {
    setSelectedFile(null);
    setIsAnalyzed(false);
    setAnalysisProgress(0);
    setIsAnalyzing(false);
  };

  // --- SVG ring segments ---
  const radius = 66, strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const total = 4.7;
  const greenLen = (1.3 / total) * circumference;
  const amberLen = (1.3 / total) * circumference;
  const redLen   = (2.1 / total) * circumference;

  return (
    <div className="desktop-wrapper">

      {/* ─── Navigation ─────────────────────────────────────────── */}
      <header className="desktop-nav">
        <div className="desktop-logo-area">
          <Leaf className="desktop-logo-icon" strokeWidth={2.5} />
          <span style={{ fontWeight: 700, letterSpacing: '-0.5px' }}>ReceiptPrint</span>
        </div>

        <nav className="desktop-nav-links" aria-label="Desktop Navigation">
          <a href="#how" className="desktop-nav-link">How it Works</a>

          {session ? (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <User size={14} style={{ color: 'var(--green-primary)' }} />
                {session.user.email}
              </span>
              <button
                onClick={onLogOut}
                className="desktop-nav-link"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red-dot)' }}
              >
                <LogOut size={14} /> Log Out
              </button>
            </>
          ) : (
            <>
              <a href="#login"  className="desktop-nav-link">Log in</a>
              <button className="btn-signup">Sign up</button>
            </>
          )}
        </nav>
      </header>

      {/* ─── Main ───────────────────────────────────────────────── */}
      <main className="desktop-main">

        {/* ── AUTH GATE ── */}
        {!session && (
          <DesktopAuth onAuthSuccess={onAuthSuccess} />
        )}

        {/* ── ANALYSIS LOADER ── */}
        {session && isAnalyzing && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-24)', maxWidth: '480px', width: '100%' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="var(--green-primary)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - analysisProgress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: 'var(--green-primary)' }}>
                {analysisProgress}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Analysing your receipt
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', minHeight: '20px' }}>
                {analysisStep}
              </p>
            </div>
            <div style={{ width: '100%', height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${analysisProgress}%`, backgroundColor: 'var(--green-primary)', borderRadius: '2px', transition: 'width 0.08s linear' }} />
            </div>
          </div>
        )}

        {/* ── RESULTS DASHBOARD ── */}
        {session && isAnalyzed && (
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-16)', paddingBottom: 'var(--spacing-16)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Receipt Carbon Dashboard</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedFile?.name || 'receipt.jpg'} &nbsp;·&nbsp; June 13, 2026
                </p>
              </div>
              <button onClick={resetScanner} className="btn-primary" style={{ height: '40px', padding: '0 var(--spacing-20)', borderRadius: '8px', fontSize: '14px' }}>
                <RefreshCw size={15} /> Scan Another
              </button>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-16)' }}>
              {[
                { label: 'Total Impact',    value: '4.7 kg',   sub: 'CO₂e this receipt', color: 'var(--amber-dot)' },
                { label: 'Items Scanned',   value: '3',         sub: 'grocery items',      color: 'var(--green-primary)' },
                { label: 'Potential Saving', value: '1.2 kg',   sub: 'CO₂e with swaps',    color: 'var(--green-dot)' },
                { label: 'Weekly Trend',    value: '↓ 12%',    sub: 'vs last week',        color: 'var(--green-primary)' },
              ].map((s, i) => (
                <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{s.label}</p>
                  <p style={{ fontSize: '26px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 'var(--spacing-24)' }}>

              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }}>

                {/* Ring + breakdown */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-24)', display: 'flex', gap: 'var(--spacing-32)', alignItems: 'center' }}>
                  <div className="circular-progress-ring-container">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r={radius} fill="transparent" stroke="var(--border-color)" strokeWidth={strokeWidth} />
                      <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#43A047" strokeWidth={strokeWidth} strokeDasharray={`${greenLen} ${circumference}`} strokeDashoffset={0} transform="rotate(-90 80 80)" strokeLinecap="butt" />
                      <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#FB8C00" strokeWidth={strokeWidth} strokeDasharray={`${amberLen} ${circumference}`} strokeDashoffset={-greenLen} transform="rotate(-90 80 80)" strokeLinecap="butt" />
                      <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#E53935" strokeWidth={strokeWidth} strokeDasharray={`${redLen} ${circumference}`} strokeDashoffset={-(greenLen + amberLen)} transform="rotate(-90 80 80)" strokeLinecap="butt" />
                    </svg>
                    <div className="circular-progress-text">
                      <span className="progress-text-value">4.7</span>
                      <span className="progress-text-unit">kg CO₂e</span>
                      <span className="progress-text-label">Total Impact</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Emission Breakdown</h4>
                    {[
                      { color: '#E53935', label: 'Meat & Proteins',  val: '2.1 kg', pct: 44.7 },
                      { color: '#FB8C00', label: 'Dairy Products',    val: '1.3 kg', pct: 27.7 },
                      { color: '#43A047', label: 'Fresh Produce',     val: '1.3 kg', pct: 27.7 },
                    ].map((b) => (
                      <div key={b.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: b.color, flexShrink: 0 }} />
                            {b.label}
                          </span>
                          <strong>{b.val}</strong>
                        </div>
                        <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${b.pct}%`, backgroundColor: b.color, borderRadius: '2px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trend chart */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-24)', height: '260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Carbon Footprint Trend</h4>
                    <div style={{ backgroundColor: 'var(--green-light)', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, color: 'var(--green-primary)' }}>↓ 12% this week</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="#F5F5F5" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <YAxis domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }} formatter={(v) => [`${v} kg CO₂e`, 'Emissions']} />
                        <Line type="monotone" dataKey="value" stroke="var(--green-primary)" strokeWidth={3} dot={{ r: 5, fill: 'var(--green-primary)', strokeWidth: 0 }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }}>

                {/* Top offenders */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-16)' }}>Top Offenders</h4>
                  {[
                    { dot: 'var(--red-dot)',   name: 'Amul Butter 100g',     val: '0.9 kg CO₂e' },
                    { dot: 'var(--amber-dot)', name: 'Aashirvaad Atta 5kg',  val: '0.7 kg CO₂e' },
                    { dot: 'var(--amber-dot)', name: 'Toor Dal 1kg',         val: '0.5 kg CO₂e' },
                  ].map((o) => (
                    <div key={o.name} className="offender-row" style={{ marginBottom: '10px', height: 'auto' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: o.dot, flexShrink: 0 }} />
                      <span className="offender-name">{o.name}</span>
                      <span className="offender-value" style={{ color: o.dot }}>{o.val}</span>
                    </div>
                  ))}
                </div>

                {/* Swap suggestions */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)', flex: 1 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-16)' }}>Eco Swap Suggestions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { from: 'Amul Butter 100g',    to: 'MilkyMist Butter 100g', save: '0.5 kg', pct: 56 },
                      { from: 'Aashirvaad Atta 5kg', to: 'Pillsbury Atta 5kg',    save: '0.4 kg', pct: 40 },
                      { from: 'Toor Dal 1kg',        to: 'Moong Dal 1kg',         save: '0.3 kg', pct: 35 },
                    ].map((s) => (
                      <div key={s.from} style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{s.from}</span>
                            <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>→</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.to}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--green-primary)', whiteSpace: 'nowrap' }}>-{s.pct}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.pct}%`, backgroundColor: 'var(--green-primary)', borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>save {s.save}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Annual savings card */}
                  <div className="annual-savings-card" style={{ marginTop: 'var(--spacing-16)', padding: '14px var(--spacing-16)' }}>
                    <div className="annual-savings-left">
                      <span style={{ fontSize: '12px', opacity: 0.85 }}>Annual savings if all swaps made:</span>
                      <span className="annual-savings-value" style={{ fontSize: '20px', marginTop: '4px' }}>Save 41 kg CO₂e / yr</span>
                    </div>
                    <div className="annual-savings-right" style={{ width: '44px', height: '44px' }}>
                      <Leaf size={22} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ── DROPZONE (logged in, idle) ── */}
        {session && !isAnalyzing && !isAnalyzed && (
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-32)' }}>

            {/* Hero heading above dropzone */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '10px' }}>
                Scan your grocery receipt
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                Upload a photo or PDF — we'll extract every item and calculate its carbon footprint instantly.
              </p>
            </div>

            <div className="desktop-columns" style={{ width: '100%', alignItems: 'flex-start' }}>
              {/* Dropzone */}
              <div style={{ flex: 1 }}>
                <form onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} onSubmit={e => e.preventDefault()}>
                  <input ref={fileInputRef} type="file" id="desktop-file-upload" accept="image/jpeg,image/png,application/pdf" onChange={handleChange} style={{ display: 'none' }} />
                  <div
                    className={`dropzone-card ${dragActive ? 'dragging' : ''}`}
                    onClick={triggerBrowse}
                    style={{ height: '240px' }}
                  >
                    <UploadCloud className="upload-icon" />
                    <p className="upload-primary-text">Drop your receipt here</p>
                    <p className="upload-secondary-text">or click to <span className="browse-link">browse</span></p>
                    <p className="upload-format-hint">Accepts JPG · PNG · PDF — max 5 MB</p>
                  </div>
                </form>

                {/* Demo button */}
                <button
                  onClick={triggerDemoScan}
                  id="try-demo-scan-btn"
                  style={{
                    width: '100%',
                    marginTop: 'var(--spacing-12)',
                    height: '44px',
                    border: '1.5px solid var(--green-primary)',
                    borderRadius: 'var(--radius-button)',
                    background: 'transparent',
                    color: 'var(--green-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-light)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Sparkles size={16} />
                  Try Demo Scan (sample receipt)
                </button>
              </div>

              {/* Tips panel */}
              <div className="tips-panel">
                <h3 className="tips-heading">Tips for best results</h3>
                <div className="tip-rows">
                  <div className="tip-row"><div className="tip-icon"><Sun size={16} /></div><div className="tip-text">Works best with clear, well-lit photos.</div></div>
                  <div className="tip-row"><div className="tip-icon"><FileText size={16} /></div><div className="tip-text">Make sure all four corners of the receipt are visible.</div></div>
                  <div className="tip-row"><div className="tip-icon"><Frame size={16} /></div><div className="tip-text">Avoid shadows and blurred images.</div></div>
                  <div className="tip-row"><div className="tip-icon"><CheckCircle2 size={16} /></div><div className="tip-text">Review and confirm details after upload.</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
