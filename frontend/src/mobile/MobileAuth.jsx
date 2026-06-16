import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Info, Leaf } from 'lucide-react';

export default function MobileAuth({ onAuthSuccess }) {
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
        user: { id: 'mock-user-mobile', email }
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
        access_token: 'mock_token_guest_mobile',
        user: { id: 'mock-user-guest', email: 'guest.mobile@receiptprint.in' }
      };
      localStorage.setItem('rp_session', JSON.stringify(mockSession));
      onAuthSuccess(mockSession);
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 'var(--spacing-24)', justifyContent: 'center', minHeight: '80vh' }} className="animate-fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--spacing-32)' }}>
        <Leaf size={44} style={{ color: 'var(--green-primary)', marginBottom: 'var(--spacing-12)' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 'var(--weight-large-num)', color: 'var(--text-primary)' }}>
          {isSignUp ? 'Join ReceiptPrint' : 'Welcome Back'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
          {isSignUp 
            ? 'Track your grocery\'s impact on the planet 🌿' 
            : 'Sign in to access your carbon history log'}
        </p>
      </div>

      {message && (
        <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: 'var(--radius-card)', border: '1px solid #FFCDD2', backgroundColor: '#FFEBEE', color: '#B71C1C', fontSize: '12px', marginBottom: 'var(--spacing-16)' }}>
          <Info size={16} />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'var(--weight-label)', color: 'var(--text-secondary)' }}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', height: '44px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-card)', paddingLeft: '40px', paddingRight: '12px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'var(--weight-label)', color: 'var(--text-secondary)' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', height: '44px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-card)', paddingLeft: '40px', paddingRight: '12px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading}
          style={{ height: '48px', marginTop: 'var(--spacing-8)', minHeight: '48px' }}
        >
          {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
          <span>{loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}</span>
        </button>
      </form>

      <button 
        onClick={handleGuest}
        className="btn-secondary"
        style={{ height: '48px', marginTop: 'var(--spacing-12)', borderColor: '#CCCCCC', color: 'var(--text-secondary)', minHeight: '48px' }}
      >
        Continue as Guest
      </button>

      <div style={{ textAlign: 'center', marginTop: 'var(--spacing-24)' }}>
        <button 
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage('');
          }}
          style={{ fontSize: '13px', color: 'var(--green-primary)', fontWeight: 'var(--weight-label)' }}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
