import React, { useState, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Auth from './components/Auth';
import { Leaf, History as HistoryIcon, Camera, LogOut, CheckCircle, Loader2 } from 'lucide-react';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('upload'); // 'upload' | 'dashboard' | 'history'
  const [analysisData, setAnalysisData] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'failed'

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Check for existing session on load
  useEffect(() => {
    const savedSession = localStorage.getItem('rp_session');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
  }, []);

  const handleAuthSuccess = (newSession) => {
    setSession(newSession);
    setView('upload');
  };

  const handleSignOut = () => {
    localStorage.removeItem('rp_session');
    setSession(null);
    setAnalysisData(null);
    setView('upload');
  };

  // Automatically save receipt to history after extraction
  const saveReceiptToHistory = async (receiptData, currentSession) => {
    if (!currentSession) return;
    setSaveStatus('saving');

    try {
      const payload = {
        storeName: receiptData.storeName,
        receiptDate: receiptData.receiptDate,
        totalAmount: receiptData.totalAmount,
        totalEmissions: receiptData.totalEmissions,
        items: receiptData.items
      };

      if (currentSession.access_token.startsWith('mock_')) {
        // Save to mock localStorage database
        const mockDb = JSON.parse(localStorage.getItem('rp_mock_history') || '[]');
        const mockRecord = {
          id: 'mock_receipt_' + Date.now(),
          user_id: currentSession.user.id,
          store_name: payload.storeName,
          receipt_date: payload.receiptDate,
          total_amount: payload.totalAmount,
          total_emissions: payload.totalEmissions,
          created_at: new Date().toISOString(),
          items: payload.items.map((it, idx) => ({
            id: `mock_item_${idx}_${Date.now()}`,
            name: it.name,
            quantity: it.quantity,
            unit: it.unit,
            price: it.price,
            category: it.category,
            co2e: it.co2e,
            is_fallback: it.isFallback
          }))
        };
        mockDb.push(mockRecord);
        localStorage.setItem('rp_mock_history', JSON.stringify(mockDb));
        
        setTimeout(() => {
          setSaveStatus('saved');
        }, 600);
        return;
      }

      // Real Supabase API call
      const response = await fetch(`${API_URL}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Could not save to database');
      }

      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save receipt to DB:', err);
      setSaveStatus('failed');
    }
  };

  const handleAnalysisComplete = (data) => {
    setAnalysisData(data);
    setView('dashboard');
    saveReceiptToHistory(data, session);
  };

  const handleBackToUpload = () => {
    setAnalysisData(null);
    setSaveStatus('');
    setView('upload');
  };

  // If not authenticated, require login/signup
  if (!session) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md py-4">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Leaf className="text-emerald-400" size={24} />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white">
                  Receipt<span className="text-emerald-400">Print</span>
                </span>
                <span className="text-[10px] block text-slate-400 -mt-1 font-semibold tracking-wider uppercase">Challenge 3</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center p-6">
          <Auth onAuthSuccess={handleAuthSuccess} />
        </main>

        <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} ReceiptPrint. Built for Challenge 3.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Premium Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            onClick={handleBackToUpload}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            role="banner"
          >
            <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition">
              <Leaf className="text-emerald-400 group-hover:rotate-12 transition-transform duration-300" size={24} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Receipt<span className="text-emerald-400 group-hover:text-white transition-colors">Print</span>
              </span>
              <span className="text-[10px] block text-slate-400 -mt-1 font-semibold tracking-wider uppercase">Challenge 3</span>
            </div>
          </div>

          <nav className="flex items-center gap-2 md:gap-4 text-sm font-semibold" aria-label="Main Navigation">
            <button 
              onClick={() => { setView('upload'); setAnalysisData(null); setSaveStatus(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${view === 'upload' || view === 'dashboard' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Camera size={16} /> Scanner
            </button>
            <button 
              onClick={() => setView('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${view === 'history' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <HistoryIcon size={16} /> History
            </button>
            <div className="w-[1px] h-4 bg-slate-800 hidden md:block"></div>
            <span className="text-xs text-slate-400 font-medium hidden md:inline truncate max-w-[120px]" title={session.user.email}>
              {session.user.email}
            </span>
            <button 
              onClick={handleSignOut}
              className="p-1.5 text-slate-500 hover:text-red-400 transition rounded-lg"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {view === 'upload' && (
          <div className="max-w-xl mx-auto w-full flex flex-col gap-8">
            <div className="text-center flex flex-col gap-3">
              <h2 className="text-4xl font-black tracking-tight text-slate-100 md:text-5xl">
                Track Your Grocery <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500">
                  Carbon Footprint
                </span>
              </h2>
              <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
                Upload grocery receipts, scan automatically using Groq Vision, and instantly get India-localized carbon insights & eco-swaps.
              </p>
            </div>
            <UploadZone token={session.access_token} onAnalysisComplete={handleAnalysisComplete} />
          </div>
        )}

        {view === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Save Status Notification Banner */}
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl p-3.5 text-xs max-w-md mx-auto w-full" role="status">
                <Loader2 className="animate-spin text-emerald-400 flex-shrink-0" size={16} />
                <span>Saving receipt trip to history log...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl p-3.5 text-xs max-w-md mx-auto w-full" role="status">
                <CheckCircle className="text-emerald-400 flex-shrink-0" size={16} />
                <span>Receipt saved to your carbon history log!</span>
              </div>
            )}
            {saveStatus === 'failed' && (
              <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl p-3.5 text-xs max-w-md mx-auto w-full" role="status">
                <span className="text-red-400 font-bold">⚠️</span>
                <span>Could not save to history log (offline/DB configuration error).</span>
              </div>
            )}

            <Dashboard data={analysisData} onBack={handleBackToUpload} />
          </div>
        )}

        {view === 'history' && (
          <History token={session.access_token} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} ReceiptPrint. Built for PromptWars Challenge 3. All rights reserved.</p>
      </footer>
    </div>
  );
}
