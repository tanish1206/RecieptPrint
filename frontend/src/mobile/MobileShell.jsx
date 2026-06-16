import React, { useState } from 'react';
import { Home, Clock, User } from 'lucide-react';
import HomeScreen from './HomeScreen';
import PreviewScreen from './PreviewScreen';
import ResultsScreen from './ResultsScreen';
import SwapsScreen from './SwapsScreen';
import HistoryScreen from './HistoryScreen';

export default function MobileShell() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'preview' | 'results' | 'swaps' | 'history' | 'profile'
  const [capturedImage, setCapturedImage] = useState(null);

  // Determine active tab
  const getActiveTab = () => {
    if (['home', 'preview', 'results', 'swaps'].includes(currentScreen)) {
      return 'home';
    }
    return currentScreen;
  };

  const activeTab = getActiveTab();

  const handleImageSelect = (imageUrl) => {
    setCapturedImage(imageUrl);
    setCurrentScreen('preview');
  };

  const handleTabClick = (tab) => {
    if (tab === 'home') {
      // Reset home flow or keep current subscreen if already in it
      if (['preview', 'results', 'swaps'].includes(currentScreen)) {
        // Keep it as is or reset to home on double tap
        setCurrentScreen('home');
      } else {
        setCurrentScreen('home');
      }
    } else {
      setCurrentScreen(tab);
    }
  };

  return (
    <div className="mobile-app-wrapper">
      <div className="mobile-shell">
        
        {/* Status Bar */}
        <div className="status-bar" role="status">
          <span className="status-time">9:41</span>
          
          <div className="status-icons">
            {/* Cellular signal bars SVG */}
            <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
              <rect x="0" y="8" width="2.5" height="3" rx="0.5" />
              <rect x="4" y="6" width="2.5" height="5" rx="0.5" />
              <rect x="8" y="4" width="2.5" height="7" rx="0.5" />
              <rect x="12" y="2" width="2.5" height="9" rx="0.5" />
              <rect x="16" y="0" width="2.5" height="11" rx="0.5" />
            </svg>
            
            {/* Wifi SVG */}
            <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
              <path d="M7.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-4-4a5.6 5.6 0 0 1 8 0c-.5.5-1 .9-1.5 1.4a3.6 3.6 0 0 0-5 0c-.5-.5-1-.9-1.5-1.4zm-3-3a9.8 9.8 0 0 1 14 0c-.5.5-1.1 1-1.6 1.5a7.8 7.8 0 0 0-10.8 0A12 12 0 0 1 .5 4z" />
            </svg>
            
            {/* Battery status icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>100%</span>
              <svg width="22" height="11" viewBox="0 0 22 11" fill="currentColor">
                <rect x="0" y="0" width="19" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
                <rect x="2" y="2" width="15" height="7" rx="1.5" />
                <path d="M20 3.5v4c0 .3-.2.5-.5.5h-.5V3h.5c.3 0 .5.2.5.5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Viewport Screen Content */}
        <div className="screen-content">
          {currentScreen === 'home' && (
            <HomeScreen onImageSelect={handleImageSelect} />
          )}
          {currentScreen === 'preview' && (
            <PreviewScreen 
              imageUrl={capturedImage} 
              onConfirm={() => setCurrentScreen('results')} 
              onRetake={() => {
                setCapturedImage(null);
                setCurrentScreen('home');
              }} 
            />
          )}
          {currentScreen === 'results' && (
            <ResultsScreen 
              onBack={() => setCurrentScreen('preview')} 
              onSeeSwaps={() => setCurrentScreen('swaps')} 
            />
          )}
          {currentScreen === 'swaps' && (
            <SwapsScreen onBack={() => setCurrentScreen('results')} />
          )}
          {currentScreen === 'history' && (
            <HistoryScreen onBack={() => setCurrentScreen('home')} />
          )}
          {currentScreen === 'profile' && (
            <div className="mobile-profile">
              <div className="profile-avatar">🌿</div>
              <h2 className="profile-name">Eco Tracker</h2>
              <p className="profile-email">eco.user@receiptprint.in</p>

              <div className="profile-stats">
                <div className="profile-stat-box">
                  <span className="profile-stat-val">4</span>
                  <span className="profile-stat-lbl">Receipts Scanned</span>
                </div>
                <div className="profile-stat-box">
                  <span className="profile-stat-val">20.4</span>
                  <span className="profile-stat-lbl">Total kg CO₂e</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="bottom-nav" aria-label="Mobile Navigation">
          <button 
            className={`bottom-nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabClick('home')}
            aria-label="Home tab"
          >
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="bottom-nav-tab-label">Home</span>
          </button>
          
          <button 
            className={`bottom-nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabClick('history')}
            aria-label="History tab"
          >
            <Clock size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="bottom-nav-tab-label">History</span>
          </button>
          
          <button 
            className={`bottom-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabClick('profile')}
            aria-label="Profile tab"
          >
            <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span className="bottom-nav-tab-label">Profile</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
