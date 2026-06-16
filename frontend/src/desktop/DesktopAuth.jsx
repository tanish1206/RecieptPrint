import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Info, CheckCircle2 } from 'lucide-react';

export default function DesktopAuth({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!email || !password) {
      setMessage('Please enter both email and password.');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      const mockSession = {
        access_token: 'mock_token_' + Math.random().toString(36).substring(7),
        user: { id: 'mock-user-desktop', email }
      };
      localStorage.setItem('rp_session', JSON.stringify(mockSession));
      onAuthSuccess(mockSession);
    }, 800);
  };

  const handleGuest = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const mockSession = {
        access_token: 'mock_token_guest_desktop',
        user: { id: 'mock-user-guest-desktop', email: 'guest.desktop@receiptprint.in' }
      };
      localStorage.setItem('rp_session', JSON.stringify(mockSession));
      onAuthSuccess(mockSession);
    }, 500);
  };

  return (
    <div className="desktop-columns animate-fade-in" style={{ maxWidth: '840px', gap: 'var(--spacing-40)', alignItems: 'center' }}>
      
      {/* Left Column: Marketing pitch */}
      <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'var(--weight-large-num)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Track your grocery's <br />
          <span style={{ color: 'var(--green-primary)' }}>planet impact.</span>
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Join thousands of eco-conscious shoppers uploading receipts to track carbon footprints, discover planet-friendly swaps, and save tonnes of greenhouse gases.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--green-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 'var(--weight-heading)', color: 'var(--text-primary)' }}>Vision OCR Extraction</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Just snap or drop receipt images to map emissions instantly.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--green-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 'var(--weight-heading)', color: 'var(--text-primary)' }}>Sustainable Swaps</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Get localized suggestions to buy lower-emission milk, butter, and grains.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--green-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 'var(--weight-heading)', color: 'var(--text-primary)' }}>History & Goals</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Log purchases to measure monthly carbon savings and view real trends.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Auth Card */}
      <div style={{ flex: 0.9, backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-32)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'var(--weight-heading)', color: 'var(--text-primary)', marginBottom: 'var(--spacing-4)' }}>
          {isSignUp ? 'Create account' : 'Log in'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-20)' }}>
          Sign up to begin scanning receipts
        </p>

        {message && (
          <div style={{ display: 'flex', gap: '8px', padding: '10px', borderRadius: '6px', border: '1px solid #FFCDD2', backgroundColor: '#FFEBEE', color: '#B71C1C', fontSize: '12px', marginBottom: 'var(--spacing-16)' }}>
            <Info size={16} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'var(--weight-label)', color: 'var(--text-secondary)' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', height: '38px', border: '1.5px solid var(--border-color)', borderRadius: '8px', paddingLeft: '34px', paddingRight: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'var(--weight-label)', color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', height: '38px', border: '1.5px solid var(--border-color)', borderRadius: '8px', paddingLeft: '34px', paddingRight: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ height: '40px', fontSize: '14px', borderRadius: '8px', marginTop: 'var(--spacing-8)' }}
          >
            {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
            <span>{loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}</span>
          </button>
        </form>

        <button 
          onClick={handleGuest}
          className="btn-secondary"
          style={{ height: '40px', fontSize: '14px', borderRadius: '8px', marginTop: 'var(--spacing-8)', borderColor: '#CCCCCC', color: 'var(--text-secondary)' }}
        >
          Continue as Guest
        </button>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-16)' }}>
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
            }}
            style={{ fontSize: '12px', color: 'var(--green-primary)', fontWeight: 'var(--weight-label)' }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>

    </div>
  );
}
