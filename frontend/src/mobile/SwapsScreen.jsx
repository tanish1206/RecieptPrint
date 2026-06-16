import React from 'react';
import { ChevronLeft } from 'lucide-react';

export default function SwapsScreen({ onBack }) {
  const swaps = [
    {
      id: 1,
      originalName: "Amul Butter 100g",
      swapName: "MilkyMist Butter 100g",
      savings: 0.5,
      percent: 56,
    },
    {
      id: 2,
      originalName: "Aashirvaad Atta 5kg",
      swapName: "Pillsbury Atta 5kg",
      savings: 0.4,
      percent: 40,
    },
    {
      id: 3,
      originalName: "Toor Dal 1kg",
      swapName: "Moong Dal 1kg",
      savings: 0.3,
      percent: 35,
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      {/* Top Bar */}
      <div className="screen-header-bar">
        <button 
          className="header-bar-btn" 
          onClick={onBack}
          aria-label="Go back"
        >
          <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
        </button>
        <h2 className="header-bar-title">Swap Suggestions</h2>
        <div style={{ width: '48px' }} /> {/* Spacer */}
      </div>

      {/* Scroll Content */}
      <div className="swaps-scroll-content">
        
        {/* Swap Cards Stack */}
        <div className="swap-cards-list">
          {swaps.map((card) => (
            <div key={card.id} className="swap-card">
              {/* Top Row: Original -> Swap Layout */}
              <div className="swap-card-top">
                <div className="swap-item-column">
                  <span className="swap-item-name">{card.originalName}</span>
                  <span className="tag-original">Original</span>
                </div>
                
                <span className="swap-arrow">→</span>
                
                <div className="swap-item-column" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                  <span className="swap-item-name">{card.swapName}</span>
                  <span className="tag-swap">Swap</span>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="swap-card-bottom">
                <span className="swap-save-text">
                  Save {card.savings} kg CO₂e per purchase
                </span>
                <span className="swap-percent-text">
                  {card.percent}% less
                </span>
              </div>

              {/* Progress Bar */}
              <div className="swap-progress-track">
                <div 
                  className="swap-progress-fill" 
                  style={{ width: `${card.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Annual Savings Card */}
        <div className="annual-savings-card">
          <div className="annual-savings-left">
            <span className="annual-savings-line1">If you made all these swaps</span>
            <span className="annual-savings-line2">for 1 year:</span>
            <span className="annual-savings-value">Save 41 kg CO₂e</span>
          </div>

          <div className="annual-savings-right">
            {/* SVG leaf + upward arrow */}
            <svg 
              className="annual-savings-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
            >
              <path d="M12 2a10 10 0 0 1 10 10v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4A10 10 0 0 1 12 2z" />
              <path d="M12 6v12" />
              <path d="m9 9 3-3 3 3" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
