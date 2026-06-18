import { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, Lock, LogIn, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

export default function DesktopAuth({ onAuthSuccess }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

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
          user: { id: 'mock-demo-desktop', email: email || 'demo@receiptprint.in' },
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

      if (authError) {
        throw new Error(authError.message);
      }

      if (!data.session) {
        if (isSignUp) {
          setError('Account created! Please check your email to confirm your account, then sign in.');
        } else {
          throw new Error('Sign in failed — no session returned.');
        }
        setLoading(false);
        return;
      }

      // Persist session and notify parent
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

    // Guest mode: sign in anonymously with Supabase or use a demo mock session
    // If Supabase is configured, we use a real anon sign-in; otherwise fall back to a local mock.
    try {
      if (isSupabaseConfigured()) {
        const { data, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw new Error(authError.message);
        if (data.session) {
          localStorage.setItem('rp_session', JSON.stringify(data.session));
          onAuthSuccess(data.session);
          return;
        }
      }
    } catch (err) {
      console.warn('Anonymous sign-in failed, falling back to mock guest:', err);
    }

    // Local mock fallback (so the demo scan still works)
    const mockSession = {
      access_token: 'mock_token_guest_' + Math.random().toString(36).substring(7),
      user: { id: 'mock-guest-desktop', email: 'guest@receiptprint.in' },
    };
    localStorage.setItem('rp_session', JSON.stringify(mockSession));
    onAuthSuccess(mockSession);
    setLoading(false);
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
          {[
            { title: 'Vision OCR Extraction',  desc: 'Just snap or drop receipt images to map emissions instantly.' },
            { title: 'Sustainable Swaps',        desc: 'Get localized suggestions to buy lower-emission milk, butter, and grains.' },
            { title: 'History & Goals',           desc: 'Log purchases to measure monthly carbon savings and view real trends.' },
          ].map((f) => (
            <div key={f.title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--green-primary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 'var(--weight-heading)', color: 'var(--text-primary)' }}>{f.title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Auth Card */}
      <div style={{ flex: 0.9, backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-32)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'var(--weight-heading)', color: 'var(--text-primary)', marginBottom: 'var(--spacing-4)' }}>
          {isSignUp ? 'Create account' : 'Log in'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-20)' }}>
          {isSignUp ? 'Start scanning your receipts for free' : 'Sign in to begin scanning receipts'}
        </p>

        {error && (
          <div style={{ display: 'flex', gap: '8px', padding: '10px', borderRadius: '6px', border: '1px solid #FFCDD2', backgroundColor: '#FFEBEE', color: '#B71C1C', fontSize: '12px', marginBottom: 'var(--spacing-16)', lineHeight: 1.4 }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          {/* Email */}
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

          {/* Password */}
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
            style={{ height: '40px', fontSize: '14px', borderRadius: '8px', marginTop: 'var(--spacing-8)', opacity: loading ? 0.7 : 1 }}
          >
            {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
            <span>{loading ? 'Processing…' : (isSignUp ? 'Sign Up' : 'Sign In')}</span>
          </button>
        </form>

        <button
          onClick={handleGuest}
          className="btn-secondary"
          disabled={loading}
          style={{ height: '40px', fontSize: '14px', borderRadius: '8px', marginTop: 'var(--spacing-8)' }}
        >
          Continue as Guest (Demo Mode)
        </button>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-16)' }}>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            style={{ fontSize: '12px', color: 'var(--green-primary)', fontWeight: 'var(--weight-label)' }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>

    </div>
  );
}

DesktopAuth.propTypes = {
  onAuthSuccess: PropTypes.func.isRequired,
};
