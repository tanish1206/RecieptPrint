import React, { useState } from 'react';
import { Home, Clock, User } from 'lucide-react';
import HomeScreen from './HomeScreen';
import PreviewScreen from './PreviewScreen';
import ResultsScreen from './ResultsScreen';
import SwapsScreen from './SwapsScreen';
import HistoryScreen from './HistoryScreen';
import MobileAuth from './MobileAuth';

export default function MobileShell({ session, onAuthSuccess, onLogOut }) {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [capturedFile,  setCapturedFile]  = useState(null);   // raw File object
  const [capturedImage, setCapturedImage] = useState(null);   // blob URL for preview
  const [analysisResult, setAnalysisResult] = useState(null); // real API response

  if (!session) {
    return <MobileAuth onAuthSuccess={onAuthSuccess} />;
  }

  const getActiveTab = () => {
    if (['home', 'preview', 'results', 'swaps'].includes(currentScreen)) return 'home';
    return currentScreen;
  };

  const activeTab = getActiveTab();

  // Called from HomeScreen when user picks a file
  const handleImageSelect = (imageUrl, file) => {
    setCapturedImage(imageUrl);
    setCapturedFile(file || null);
    setAnalysisResult(null);
    setCurrentScreen('preview');
  };

  const handleTabClick = (tab) => {
    setCurrentScreen(tab === 'home' ? 'home' : tab);
  };

  return (
    <div className="mobile-app-wrapper">
      <div className="mobile-shell">

        <div className="screen-content">
          {currentScreen === 'home' && (
            <HomeScreen onImageSelect={handleImageSelect} />
          )}

          {currentScreen === 'preview' && (
            <PreviewScreen
              imageUrl={capturedImage}
              file={capturedFile}
              session={session}
              onAnalysisComplete={(result) => {
                setAnalysisResult(result);
                setCurrentScreen('results');
              }}
              onRetake={() => {
                setCapturedFile(null);
                setCapturedImage(null);
                setAnalysisResult(null);
                setCurrentScreen('home');
              }}
            />
          )}

          {currentScreen === 'results' && (
            <ResultsScreen
              result={analysisResult}
              onBack={() => setCurrentScreen('preview')}
              onSeeSwaps={() => setCurrentScreen('swaps')}
            />
          )}

          {currentScreen === 'swaps' && (
            <SwapsScreen
              result={analysisResult}
              onBack={() => setCurrentScreen('results')}
            />
          )}

          {currentScreen === 'history' && (
            <HistoryScreen session={session} onBack={() => setCurrentScreen('home')} />
          )}

          {currentScreen === 'profile' && (
            <div className="mobile-profile animate-fade-in">
              <div className="profile-avatar">🌿</div>
              <h2 className="profile-name">Eco Tracker</h2>
              <p className="profile-email">{session?.user?.email || 'user@receiptprint.in'}</p>

              <div className="profile-stats">
                <div className="profile-stat-box animate-slide-up">
                  <span className="profile-stat-val">{analysisResult ? '1+' : '0'}</span>
                  <span className="profile-stat-lbl">Receipts Scanned</span>
                </div>
                <div className="profile-stat-box animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <span className="profile-stat-val">{analysisResult ? analysisResult.totalEmissions.toFixed(1) : '0'}</span>
                  <span className="profile-stat-lbl">Total kg CO₂e</span>
                </div>
              </div>

              <button
                className="btn-secondary"
                onClick={onLogOut}
                style={{ width: '100%', height: '48px', marginTop: 'var(--spacing-24)', borderColor: 'var(--red-dot)', color: 'var(--red-dot)', minHeight: '48px' }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="bottom-nav" aria-label="Mobile Navigation">
          <button className={`bottom-nav-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleTabClick('home')} aria-label="Home tab">
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="bottom-nav-tab-label">Home</span>
          </button>
          <button className={`bottom-nav-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => handleTabClick('history')} aria-label="History tab">
            <Clock size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="bottom-nav-tab-label">History</span>
          </button>
          <button className={`bottom-nav-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabClick('profile')} aria-label="Profile tab">
            <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span className="bottom-nav-tab-label">Profile</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
