import React from 'react';
import { ChevronLeft, Calendar, Leaf } from 'lucide-react';

export default function ResultsScreen({ onBack, onSeeSwaps }) {
  // SVG Circular progress configurations
  const radius = 66;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~414.69px

  // Values: Meat (2.1), Dairy (1.3), Produce (1.3)
  // Total = 4.7
  const total = 4.7;
  const meatVal = 2.1;
  const dairyVal = 1.3;
  const produceVal = 1.3;

  // Calculate segment lengths
  const greenLen = (produceVal / total) * circumference; // ~114.70
  const amberLen = (dairyVal / total) * circumference;   // ~114.70
  const redLen = (meatVal / total) * circumference;       // ~185.29

  // Start offsets (clockwise from top)
  const greenOffset = 0;
  const amberOffset = -greenLen;
  const redOffset = -(greenLen + amberLen);

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
        <h2 className="header-bar-title">Your Receipt — June 13</h2>
        <button className="header-bar-btn-secondary" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-scroll-content">
        
        {/* Circular Progress Ring */}
        <div className="circular-progress-section">
          <div className="circular-progress-ring-container">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {/* Background Ring Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="var(--border-color)"
                strokeWidth={strokeWidth}
              />
              {/* Colored Segments */}
              {/* Green (Produce) Segment */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#43A047"
                strokeWidth={strokeWidth}
                strokeDasharray={`${greenLen} ${circumference}`}
                strokeDashoffset={greenOffset}
                transform="rotate(-90 80 80)"
                strokeLinecap="butt"
              />
              {/* Amber (Dairy) Segment */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#FB8C00"
                strokeWidth={strokeWidth}
                strokeDasharray={`${amberLen} ${circumference}`}
                strokeDashoffset={amberOffset}
                transform="rotate(-90 80 80)"
                strokeLinecap="butt"
              />
              {/* Red (Meat) Segment */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#E53935"
                strokeWidth={strokeWidth}
                strokeDasharray={`${redLen} ${circumference}`}
                strokeDashoffset={redOffset}
                transform="rotate(-90 80 80)"
                strokeLinecap="butt"
              />
            </svg>
            {/* Center Text inside ring */}
            <div className="circular-progress-text">
              <span className="progress-text-value">4.7</span>
              <span className="progress-text-unit">kg CO₂e</span>
              <span className="progress-text-label">Total Impact</span>
            </div>
          </div>
        </div>

        {/* Category Cards Row */}
        <div className="category-cards-row">
          
          {/* Card 1 — Meat */}
          <div className="category-card">
            <div className="category-icon-wrapper icon-meat">
              {/* Meat / drumstick SVG icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2c-1.5 0-3 1.5-3 3.5 0 .7.1 1.4.3 2L4.6 12.2c-.8.8-.8 2 0 2.8.8.8 2 .8 2.8 0L12.1 10.3c.6.2 1.3.3 2 .3 2 0 3.5-1.5 3.5-3 0-1-1-2.5-3-3.5S13.5 2 12 2Z" />
                <path d="m14 14 3.5 3.5" />
                <path d="M18.5 16.5c.8-.8 2-.8 2.8 0 .8.8.8 2 0 2.8-.8.8-2 .8-2.8 0" />
              </svg>
            </div>
            <span className="category-label">Meat</span>
            <span className="category-value">2.1</span>
            <span className="category-unit">kg CO₂e</span>
          </div>

          {/* Card 2 — Dairy */}
          <div className="category-card">
            <div className="category-icon-wrapper icon-dairy">
              {/* Milk carton SVG icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18h12" />
                <path d="M6 22h12a2 2 0 0 0 2-2V9.5L16 6l-4-4-4 4-4 3.5V20a2 2 0 0 0 2 2Z" />
                <path d="M10 6h4" />
              </svg>
            </div>
            <span className="category-label">Dairy</span>
            <span className="category-value">1.3</span>
            <span className="category-unit">kg CO₂e</span>
          </div>

          {/* Card 3 — Produce */}
          <div className="category-card">
            <div className="category-icon-wrapper icon-produce">
              <Leaf size={22} />
            </div>
            <span className="category-label">Produce</span>
            <span className="category-value">1.3</span>
            <span className="category-unit">kg CO₂e</span>
          </div>
        </div>

        {/* Top Offenders Section */}
        <div className="top-offenders-section">
          <h3 className="section-heading">Top Offenders</h3>
          
          <div className="offender-row">
            <div className="offender-dot dot-red" />
            <div className="offender-name">Amul Butter 100g</div>
            <div style={{ flex: 1, borderBottom: '1px dotted var(--border-color)', margin: '0 8px' }} />
            <div className="offender-value">0.9 kg CO₂e</div>
          </div>

          <div className="offender-row">
            <div className="offender-dot dot-amber" />
            <div className="offender-name">Aashirvaad Atta 5kg</div>
            <div style={{ flex: 1, borderBottom: '1px dotted var(--border-color)', margin: '0 8px' }} />
            <div className="offender-value">0.7 kg CO₂e</div>
          </div>

          <div className="offender-row">
            <div className="offender-dot dot-amber" />
            <div className="offender-name">Toor Dal 1kg</div>
            <div style={{ flex: 1, borderBottom: '1px dotted var(--border-color)', margin: '0 8px' }} />
            <div className="offender-value">0.5 kg CO₂e</div>
          </div>
        </div>

      </div>

      {/* See Swap Suggestions Button */}
      <div className="btn-see-swaps-container">
        <button 
          className="btn-see-swaps" 
          onClick={onSeeSwaps}
          style={{ minHeight: '48px' }}
        >
          See Swap Suggestions
        </button>
      </div>
    </div>
  );
}
