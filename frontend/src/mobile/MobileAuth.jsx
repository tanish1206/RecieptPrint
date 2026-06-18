import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Info, Leaf } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

export default function MobileAuth({ onAuthSuccess }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // If Supabase is not configured, use a demo mock session so the app
      // is fully functional without backend auth credentials.
      if (!isSupabaseConfigured()) {
        const mockSession = {
          access_token: 'mock_token_demo_' + Math.random().toString(36).substring(7),
          user: { id: 'mock-demo-mobile', email: email || 'demo@receiptprint.in' },
        };
        localStorage.setItem('rp_session', JSON.stringify(mockSession));
        onAuthSuccess(mockSession);
        setLoading(false);
        return;
      }

      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      const { data, error: authError } = result;

      if (authError) throw new Error(authError.message);

      if (!data.session) {
        if (isSignUp) {
          setError('Account created! Please check your email to confirm, then sign in.');
        } else {
          throw new Error('Sign in failed — no session returned.');
        }
        setLoading(false);
        return;
      }

      localStorage.setItem('rp_session', JSON.stringify(data.session));
      onAuthSuccess(data.session);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    setError('');

    try {
      if (isSupabaseConfigured()) {
        const { data, error: authError } = await supabase.auth.signInAnonymously();
        if (!authError && data.session) {
          localStorage.setItem('rp_session', JSON.stringify(data.session));
          onAuthSuccess(data.session);
          return;
        }
      }
    } catch (_) {}

    // Fallback mock guest
    const mockSession = {
      access_token: 'mock_token_guest_' + Math.random().toString(36).substring(7),
      user: { id: 'mock-guest-mobile', email: 'guest@receiptprint.in' },
    };
    localStorage.setItem('rp_session', JSON.stringify(mockSession));
    onAuthSuccess(mockSession);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 'var(--spacing-24)', justifyContent: 'center', minHeight: '80vh' }} className="animate-fade-in">

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--spacing-32)' }}>
        <Leaf size={44} style={{ color: 'var(--green-primary)', marginBottom: 'var(--spacing-12)' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 'var(--weight-large-num)', color: 'var(--text-primary)' }}>
          {isSignUp ? 'Join ReceiptPrint' : 'Welcome Back'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
          {isSignUp ? "Track your grocery's impact on the planet 🌿" : 'Sign in to access your carbon history log'}
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: 'var(--radius-card)', border: '1px solid #FFCDD2', backgroundColor: '#FFEBEE', color: '#B71C1C', fontSize: '12px', marginBottom: 'var(--spacing-16)', lineHeight: 1.4 }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
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
          style={{ height: '48px', marginTop: 'var(--spacing-8)', minHeight: '48px', opacity: loading ? 0.7 : 1 }}
        >
          {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
          <span>{loading ? 'Processing…' : (isSignUp ? 'Sign Up' : 'Sign In')}</span>
        </button>
      </form>

      <button
        onClick={handleGuest}
        className="btn-secondary"
        disabled={loading}
        style={{ height: '48px', marginTop: 'var(--spacing-12)', borderColor: '#CCCCCC', color: 'var(--text-secondary)', minHeight: '48px' }}
      >
        Continue as Guest (Demo Mode)
      </button>

      <div style={{ textAlign: 'center', marginTop: 'var(--spacing-24)' }}>
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          style={{ fontSize: '13px', color: 'var(--green-primary)', fontWeight: 'var(--weight-label)' }}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
