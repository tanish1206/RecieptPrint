import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Info } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const configured = isSupabaseConfigured();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (!configured) {
      // Mock Auth for Demo/Testing if Supabase is not configured
      setTimeout(() => {
        setLoading(false);
        const mockSession = {
          access_token: 'mock_token_' + Math.random().toString(36).substring(7),
          user: { id: 'mock-user-123', email }
        };
        localStorage.setItem('rp_session', JSON.stringify(mockSession));
        onAuthSuccess(mockSession);
      }, 800);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        setInfo('Sign up successful! Please check your email for confirmation link, or try signing in.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        if (data.session) {
          localStorage.setItem('rp_session', JSON.stringify(data.session));
          onAuthSuccess(data.session);
        } else {
          setError('Could not establish session. Check verification email.');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const mockSession = {
        access_token: 'mock_token_guest',
        user: { id: 'mock-user-123', email: 'guest@receiptprint.com' }
      };
      localStorage.setItem('rp_session', JSON.stringify(mockSession));
      onAuthSuccess(mockSession);
    }, 500);
  };

  return (
    <div className="max-w-md w-full mx-auto glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-100 mb-2">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h2>
        <p className="text-sm text-slate-400">
          {isSignUp 
            ? 'Start tracking the carbon footprint of your grocery purchases.' 
            : 'Access your receipt carbon history and eco-insights.'}
        </p>
      </div>

      {!configured && (
        <div className="flex gap-2 items-start bg-slate-900 border border-emerald-500/20 text-slate-300 rounded-xl p-3.5 text-xs mb-6" role="status">
          <Info className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <span className="font-semibold text-emerald-400 block mb-0.5">Demo Simulation Mode</span>
            Supabase is not configured in `.env`. You can enter any email and password to log in.
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-2 items-start bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-red-200 text-xs mb-4" role="alert">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}

      {info && (
        <div className="flex gap-2 items-start bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-emerald-200 text-xs mb-4" role="alert">
          <Info className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
          <span>{info}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="auth-email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="auth-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="auth-password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-950/20 mt-2 text-sm cursor-pointer"
        >
          {loading ? (
            'Processing...'
          ) : isSignUp ? (
            <>
              <UserPlus size={16} /> Sign Up
            </>
          ) : (
            <>
              <LogIn size={16} /> Sign In
            </>
          )}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-3">
        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 text-xs transition cursor-pointer"
        >
          Continue as Guest (Local Mock Mode)
        </button>
      </div>

      <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setInfo(null);
          }}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
        >
          {isSignUp 
            ? 'Already have an account? Sign In' 
            : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
