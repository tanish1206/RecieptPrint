import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Leaf, UploadCloud, Sun, FileText, Frame, CheckCircle2,
  RefreshCw, LogOut, User, Sparkles, AlertCircle, Zap,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from 'recharts';
import DesktopAuth from './DesktopAuth';
import { analyzeReceipt, saveToHistory } from '../utils/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Category label map */
const CAT_LABELS = {
  meat:     'Meat & Proteins',
  dairy:    'Dairy Products',
  produce:  'Fresh Produce',
  grains:   'Grains & Pulses',
  seafood:  'Seafood',
  beverage: 'Beverages',
  snacks:   'Snacks & Packaged',
  misc:     'Other Items',
};

/** Assign a color per category */
const CAT_COLORS = {
  meat:     '#E53935',
  dairy:    '#FB8C00',
  produce:  '#43A047',
  grains:   '#FF7043',
  seafood:  '#039BE5',
  beverage: '#8E24AA',
  snacks:   '#FFB300',
  misc:     '#90A4AE',
};

function categoryColor(cat) {
  return CAT_COLORS[cat] || '#90A4AE';
}

function categoryLabel(cat) {
  return CAT_LABELS[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Other');
}

/** Convert an analysed result's items into ring-chart segments */
function buildSegments(items) {
  const totals = {};
  for (const item of items) {
    const c = item.category || 'misc';
    totals[c] = (totals[c] || 0) + item.co2e;
  }
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({ cat, val }));
}

// Analysis step labels for the progress UI
const STEPS = [
  'Detecting receipt edges…',
  'Extracting item names…',
  'Mapping carbon database…',
  'Calculating CO₂ emissions…',
  'Generating swap suggestions…',
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function UploadPage({ session, onAuthSuccess, onLogOut }) {
  const [dragActive,       setDragActive]       = useState(false);
  const [selectedFile,     setSelectedFile]      = useState(null);
  const [isAnalyzing,      setIsAnalyzing]       = useState(false);
  const [analysisProgress, setAnalysisProgress]  = useState(0);
  const [analysisStep,     setAnalysisStep]      = useState('');
  const [result,           setResult]            = useState(null);   // ← real API data
  const [apiError,         setApiError]          = useState('');
  const [fileError,        setFileError]         = useState('');     // inline validation error
  const fileInputRef = useRef(null);

  // ── File Validation ───────────────────────────────────────────────────────
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const MAX_SIZE_MB   = 5;

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type) &&
        !file.name.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      return 'Unsupported file type. Please upload a JPEG, PNG, or PDF.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File exceeds ${MAX_SIZE_MB} MB. Please upload a smaller receipt.`;
    }
    return null;
  };

  // ── Drag / Drop / Select ──────────────────────────────────────────────────

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const err = validateFile(file);
      if (err) { setFileError(err); return; }
      setFileError('');
      startUpload(file);
    }
  }, [session]);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file) {
      const err = validateFile(file);
      if (err) { setFileError(err); return; }
      setFileError('');
      startUpload(file);
    }
    // Reset input so the same file can be re-selected after error
    e.target.value = '';
  }, [session]);

  const handleDropzoneKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const triggerBrowse = () => fileInputRef.current?.click();

  // ── Demo Scan (uses a sample image URL → fetches as blob) ────────────────

  const triggerDemoScan = async () => {
    setApiError('');
    // Use a tiny but real JPEG so the backend can process it (1x1 px white pixel)
    // In production you'd host a real sample receipt image
    const sampleReceiptDataUri =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB/8QAIBAAAQMEAwEAAAAAAAAAAAAAAQIDBAUREiExQf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCx0nJtFjgx3pDjqvlQlKUgEk/4F1FtJbhW+O+40FOLSSoISSASdgKKKAP/2Q==';

    const byteString = atob(sampleReceiptDataUri.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: 'image/jpeg' });
    const demoFile = new File([blob], 'sample_grocery_receipt.jpg', { type: 'image/jpeg' });
    startUpload(demoFile);
  };

  // ── Core Upload + API Call ────────────────────────────────────────────────

  const startUpload = async (file) => {
    setSelectedFile(file);
    setResult(null);
    setApiError('');
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStep(STEPS[0]);

    try {
      // Tick the fake-progress bar while the real API call is in flight
      const token = session?.access_token || 'mock_token_guest';

      // Kick off real API call immediately
      const apiPromise = analyzeReceipt(file, token);

      // Animate progress bar in parallel (stops at 90% until API resolves)
      let prog = 0;
      const ticker = setInterval(() => {
        prog = Math.min(prog + 3, 90);
        const stepIdx = Math.min(Math.floor((prog / 90) * STEPS.length), STEPS.length - 1);
        setAnalysisProgress(prog);
        setAnalysisStep(STEPS[stepIdx]);
      }, 120);

      const data = await apiPromise;

      clearInterval(ticker);
      setAnalysisProgress(100);
      setAnalysisStep('Analysis complete!');

      await new Promise((r) => setTimeout(r, 500));

      // Save to history in the background (non-blocking)
      saveToHistory(data, token).catch(() => {});

      setResult(data);
      setIsAnalyzing(false);
    } catch (err) {
      setIsAnalyzing(false);
      const msg = err.message || '';
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
        setApiError('Rate limit reached. Please wait a moment and try again.');
      } else if (msg.toLowerCase().includes('parse') || msg.toLowerCase().includes('json') || msg.toLowerCase().includes('empty response')) {
        setApiError('We couldn\'t read this receipt. Try a clearer photo or different lighting.');
      } else {
        setApiError(msg || 'Analysis failed. Please try again.');
      }
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setResult(null);
    setApiError('');
    setFileError('');
    setAnalysisProgress(0);
    setIsAnalyzing(false);
  };

  // ── Dashboard helpers ─────────────────────────────────────────────────────

  const segments    = result ? buildSegments(result.items) : [];
  const total       = result?.totalEmissions ?? 0;
  const circumference = 2 * Math.PI * 66;

  // Build SVG ring: each segment arc
  let cumLen = 0;
  const ringPaths = segments.map((seg) => {
    const len    = total > 0 ? (seg.val / total) * circumference : 0;
    const offset = -cumLen;
    cumLen += len;
    return { ...seg, len, offset };
  });

  // Build top offenders (top 3 items by CO2e)
  const topOffenders = result
    ? [...result.items].sort((a, b) => b.co2e - a.co2e).slice(0, 3)
    : [];

  // Build swap suggestions from API (top 3)
  const swaps = result?.swapSuggestions?.slice(0, 3) ?? [];

  // Category breakdown for the ring legend
  const catBreakdown = segments.slice(0, 4);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="desktop-wrapper">

      {/* ── Navigation ──────────────────────────────────────────── */}
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
                {session.user?.email}
              </span>
              <button
                onClick={onLogOut}
                className="desktop-nav-link"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red-dot)', cursor: 'pointer' }}
              >
                <LogOut size={14} /> Log Out
              </button>
            </>
          ) : (
            <>
              <a href="#login" className="desktop-nav-link">Log in</a>
              <button className="btn-signup">Sign up</button>
            </>
          )}
        </nav>
      </header>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="desktop-main">

        {/* ── AUTH GATE ── */}
        {!session && <DesktopAuth onAuthSuccess={onAuthSuccess} />}

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
                  style={{ transition: 'stroke-dashoffset 0.12s linear' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: 'var(--green-primary)' }}>
                {analysisProgress}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {selectedFile?.name === 'sample_grocery_receipt.jpg' ? 'Running demo analysis…' : 'Analysing your receipt'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', minHeight: '20px', transition: 'opacity 0.3s' }}>
                {analysisStep}
              </p>
            </div>
            <div style={{ width: '100%', height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${analysisProgress}%`, backgroundColor: 'var(--green-primary)', borderRadius: '2px', transition: 'width 0.12s linear' }} />
            </div>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {session && !isAnalyzing && apiError && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-20)', maxWidth: '460px', textAlign: 'center' }} role="alert">
            <AlertCircle size={48} style={{ color: 'var(--red-dot)' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>We couldn't read this receipt</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{apiError}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Tips: use a well-lit photo, ensure all four corners are visible, and avoid shadows.
            </p>
            <button onClick={resetScanner} className="btn-primary" style={{ height: '42px', padding: '0 var(--spacing-24)', borderRadius: '8px' }}>
              <RefreshCw size={15} /> Try Again
            </button>
          </div>
        )}

        {/* ── RESULTS DASHBOARD ── */}
        {session && result && !isAnalyzing && (
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-16)', paddingBottom: 'var(--spacing-16)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  Receipt Carbon Dashboard
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {result.storeName} &nbsp;·&nbsp; {result.receiptDate} &nbsp;·&nbsp; ₹{result.totalAmount?.toFixed(2)}
                  {result.warning && (
                    <span style={{ marginLeft: '12px', color: 'var(--amber-dot)', fontWeight: 600, fontSize: '11px' }}>
                      ⚠ {result.warning}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={resetScanner} className="btn-primary" style={{ height: '40px', padding: '0 var(--spacing-20)', borderRadius: '8px', fontSize: '14px' }}>
                <RefreshCw size={15} /> Scan Another
              </button>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-16)' }}>
              {[
                { label: 'Total Impact',     value: `${total} kg`,               sub: 'CO₂e this receipt',    color: total > 5 ? 'var(--red-dot)' : total > 2 ? 'var(--amber-dot)' : 'var(--green-primary)' },
                { label: 'Items Scanned',    value: String(result.items.length),  sub: 'grocery items',         color: 'var(--green-primary)' },
                { label: 'Potential Saving', value: `${result.swapSuggestions?.reduce((s, sw) => s + (sw.originalCo2e - sw.swapCo2e), 0).toFixed(1)} kg`, sub: 'CO₂e with swaps', color: 'var(--green-dot)' },
                { label: 'Driving Equiv.',   value: `${result.impactComparison?.drivingEquivalentKm} km`, sub: 'in a petrol car', color: 'var(--amber-dot)' },
              ].map((s, i) => (
                <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</p>
                  <p style={{ fontSize: '26px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 'var(--spacing-24)' }}>

              {/* LEFT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }}>

                {/* Ring + Category Breakdown */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-24)', display: 'flex', gap: 'var(--spacing-32)', alignItems: 'center' }}>
                  <div className="circular-progress-ring-container">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="66" fill="transparent" stroke="var(--border-color)" strokeWidth="14" />
                      {ringPaths.map((seg) => (
                        <circle
                          key={seg.cat}
                          cx="80" cy="80" r="66"
                          fill="transparent"
                          stroke={categoryColor(seg.cat)}
                          strokeWidth="14"
                          strokeDasharray={`${seg.len} ${circumference}`}
                          strokeDashoffset={seg.offset}
                          transform="rotate(-90 80 80)"
                          strokeLinecap="butt"
                        />
                      ))}
                    </svg>
                    <div className="circular-progress-text">
                      <span className="progress-text-value">{total.toFixed(1)}</span>
                      <span className="progress-text-unit">kg CO₂e</span>
                      <span className="progress-text-label">Total Impact</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>By Category</h4>
                    {catBreakdown.map((seg) => {
                      const pct = total > 0 ? Math.round((seg.val / total) * 100) : 0;
                      return (
                        <div key={seg.cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: categoryColor(seg.cat), flexShrink: 0 }} />
                              {categoryLabel(seg.cat)}
                            </span>
                            <strong>{seg.val.toFixed(2)} kg</strong>
                          </div>
                          <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: categoryColor(seg.cat), borderRadius: '2px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Impact comparison card */}
                {result.impactComparison && (
                  <div style={{ backgroundColor: 'var(--green-light)', border: '1px solid #C8E6C9', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-16)' }}>
                    <Zap size={28} style={{ color: 'var(--green-primary)', flexShrink: 0 }} />
                    <p style={{ fontSize: '13px', color: 'var(--green-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                      {result.impactComparison.text}
                    </p>
                  </div>
                )}

                {/* All items table */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-16)' }}>All Scanned Items</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '8px', padding: '0 0 8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      <span>Item</span>
                      <span style={{ textAlign: 'right' }}>Qty</span>
                      <span style={{ textAlign: 'right' }}>Price</span>
                      <span style={{ textAlign: 'right' }}>CO₂e</span>
                    </div>
                    {result.items.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '8px', padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: categoryColor(item.category), flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                          {item.isFallback && <span style={{ fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'var(--border-color)', padding: '1px 5px', borderRadius: '4px' }}>est.</span>}
                        </span>
                        <span style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{item.quantity} {item.unit}</span>
                        <span style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>₹{item.price?.toFixed(2)}</span>
                        <span style={{ textAlign: 'right', fontWeight: 700, color: item.co2e > 2 ? 'var(--red-dot)' : item.co2e > 0.5 ? 'var(--amber-dot)' : 'var(--green-primary)' }}>
                          {item.co2e} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }}>

                {/* Top Offenders */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-16)' }}>Top Offenders</h4>
                  {topOffenders.length > 0 ? topOffenders.map((item) => (
                    <div key={item.name} className="offender-row">
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: categoryColor(item.category), flexShrink: 0 }} />
                      <span className="offender-name">{item.name}</span>
                      <span className="offender-value" style={{ color: categoryColor(item.category) }}>{item.co2e} kg CO₂e</span>
                    </div>
                  )) : (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No items detected.</p>
                  )}
                </div>

                {/* Insights */}
                {result.insights?.length > 0 && (
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-12)' }}>Insights</h4>
                    {result.insights.map((insight, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--green-primary)', fontSize: '16px', lineHeight: '1.2' }}>•</span>
                        {insight}
                      </div>
                    ))}
                  </div>
                )}

                {/* Eco Swap Suggestions */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-20)', flex: 1 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-16)' }}>Eco Swap Suggestions</h4>

                  {swaps.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {swaps.map((s, i) => {
                        const savedKg = Math.max(0, s.originalCo2e - s.swapCo2e);
                        const savePct = s.originalCo2e > 0 ? Math.round((savedKg / s.originalCo2e) * 100) : 0;
                        return (
                          <div key={i} style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                              <div>
                                <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{s.originalItem}</span>
                                <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>→</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.swapTo}</span>
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--green-primary)', whiteSpace: 'nowrap' }}>-{savePct}%</span>
                            </div>
                            {s.reason && (
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.4 }}>{s.reason}</p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${savePct}%`, backgroundColor: 'var(--green-primary)', borderRadius: '2px' }} />
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>save {savedKg.toFixed(2)} kg</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No swaps available for these items.</p>
                  )}

                  {/* Annual savings card */}
                  {swaps.length > 0 && (
                    <div className="annual-savings-card" style={{ marginTop: 'var(--spacing-16)', padding: '14px var(--spacing-16)' }}>
                      <div className="annual-savings-left">
                        <span style={{ fontSize: '12px', opacity: 0.85 }}>Annual savings (if all swaps made):</span>
                        <span className="annual-savings-value" style={{ fontSize: '18px', marginTop: '4px' }}>
                          Save {(swaps.reduce((s, sw) => s + Math.max(0, sw.originalCo2e - sw.swapCo2e), 0) * 52).toFixed(0)} kg CO₂e / yr
                        </span>
                      </div>
                      <div className="annual-savings-right" style={{ width: '44px', height: '44px' }}>
                        <Leaf size={22} />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ── DROPZONE (logged in, idle) ── */}
        {session && !isAnalyzing && !result && !apiError && (
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-32)' }}>

            {/* Hero heading */}
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
                <form
                  onDragEnter={handleDrag} onDragOver={handleDrag}
                  onDragLeave={handleDrag} onDrop={handleDrop}
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="desktop-file-upload"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  <div
                    className={`dropzone-card ${dragActive ? 'dragging' : ''}`}
                    onClick={triggerBrowse}
                    onKeyDown={handleDropzoneKeyDown}
                    tabIndex={0}
                    role="button"
                    aria-label="Upload receipt. Press Enter or Space to browse files."
                    style={{ height: '240px' }}
                  >
                    <UploadCloud className="upload-icon" />
                    <p className="upload-primary-text">Drop your receipt here</p>
                    <p className="upload-secondary-text">or click to <span className="browse-link">browse</span></p>
                    <p className="upload-format-hint">Accepts JPG · PNG · PDF — max 5 MB</p>
                  </div>
                </form>

                {/* Inline file validation error */}
                {fileError && (
                  <div
                    role="alert"
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '10px', padding: '10px 14px', backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 'var(--radius-button)', fontSize: '13px', color: '#B71C1C', lineHeight: 1.4 }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--red-dot)' }} />
                    {fileError}
                  </div>
                )}

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
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--green-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
