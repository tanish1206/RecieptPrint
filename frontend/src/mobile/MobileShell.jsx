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
