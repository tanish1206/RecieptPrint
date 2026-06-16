import React from 'react';
import { ChevronLeft, Leaf, Zap } from 'lucide-react';

const CAT_COLORS = {
  meat:     '#E53935',
  dairy:    '#FB8C00',
  produce:  '#43A047',
  vegetables: '#43A047',
  grains:   '#FF7043',
  seafood:  '#039BE5',
  beverage: '#8E24AA',
  snacks:   '#FFB300',
  misc:     '#90A4AE',
};

const CAT_LABELS = {
  meat:       'Meat',
  dairy:      'Dairy',
  produce:    'Produce',
  vegetables: 'Produce',
  grains:     'Grains',
  seafood:    'Seafood',
  beverage:   'Beverages',
  snacks:     'Snacks',
  misc:       'Other',
};

function catColor(cat) { return CAT_COLORS[cat] || '#90A4AE'; }
function catLabel(cat) { return CAT_LABELS[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Other'); }

function buildSegments(items) {
  const totals = {};
  for (const item of items) {
    const c = item.category || 'misc';
    totals[c] = (totals[c] || 0) + item.co2e;
  }
  return Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([cat, val]) => ({ cat, val }));
}

export default function ResultsScreen({ result, onBack, onSeeSwaps }) {
  if (!result) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '14px' }}>
        No analysis result available.
      </div>
    );
  }

  const { items = [], totalEmissions = 0, storeName, receiptDate, swapSuggestions = [], insights = [], impactComparison } = result;

  const radius = 66;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const segments = buildSegments(items);

  // Build SVG ring paths
  let cumLen = 0;
  const ringPaths = segments.map((seg) => {
    const len = totalEmissions > 0 ? (seg.val / totalEmissions) * circumference : 0;
    const offset = -cumLen;
    cumLen += len;
    return { ...seg, len, offset };
  });

  const topOffenders = [...items].sort((a, b) => b.co2e - a.co2e).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>

      {/* Top Bar */}
      <div className="screen-header-bar">
        <button className="header-bar-btn" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
        </button>
        <h2 className="header-bar-title">{storeName || 'Receipt'} — {receiptDate}</h2>
        <div style={{ width: '48px' }} />
      </div>

      {/* Scrollable content */}
      <div className="dashboard-scroll-content">

        {/* Circular Progress Ring */}
        <div className="circular-progress-section">
          <div className="circular-progress-ring-container">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={radius} fill="transparent" stroke="var(--border-color)" strokeWidth={strokeWidth} />
              {ringPaths.map((seg) => (
                <circle
                  key={seg.cat}
                  cx="80" cy="80" r={radius}
                  fill="transparent"
                  stroke={catColor(seg.cat)}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${seg.len} ${circumference}`}
                  strokeDashoffset={seg.offset}
                  transform="rotate(-90 80 80)"
                  strokeLinecap="butt"
                />
              ))}
            </svg>
            <div className="circular-progress-text">
              <span className="progress-text-value">{totalEmissions.toFixed(1)}</span>
              <span className="progress-text-unit">kg CO₂e</span>
              <span className="progress-text-label">Total Impact</span>
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="category-cards-row">
          {segments.slice(0, 3).map((seg) => (
            <div key={seg.cat} className="category-card">
              <div className="category-icon-wrapper" style={{ backgroundColor: catColor(seg.cat) + '22', color: catColor(seg.cat) }}>
                <Leaf size={18} />
              </div>
              <span className="category-label">{catLabel(seg.cat)}</span>
              <span className="category-value">{seg.val.toFixed(1)}</span>
              <span className="category-unit">kg CO₂e</span>
            </div>
          ))}
        </div>

        {/* Impact comparison */}
        {impactComparison && (
          <div style={{ margin: '0 var(--spacing-16)', backgroundColor: 'var(--green-light)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-16)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Zap size={20} style={{ color: 'var(--green-primary)', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '12px', color: 'var(--green-primary)', lineHeight: 1.5, fontWeight: 500 }}>
              {impactComparison.text}
            </p>
          </div>
        )}

        {/* Top Offenders */}
        <div className="top-offenders-section">
          <h3 className="section-heading">Top Offenders</h3>
          {topOffenders.map((item) => (
            <div key={item.name} className="offender-row">
              <div className="offender-dot" style={{ backgroundColor: catColor(item.category) }} />
              <div className="offender-name">{item.name}</div>
              <div style={{ flex: 1, borderBottom: '1px dotted var(--border-color)', margin: '0 8px' }} />
              <div className="offender-value" style={{ color: catColor(item.category) }}>{item.co2e} kg CO₂e</div>
            </div>
          ))}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div style={{ margin: 'var(--spacing-16)', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)', padding: 'var(--spacing-16)' }}>
            <h3 className="section-heading" style={{ margin: '0 0 var(--spacing-12)' }}>Insights</h3>
            {insights.map((insight, i) => (
              <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: i < insights.length - 1 ? '8px' : 0 }}>• {insight}</p>
            ))}
          </div>
        )}

      </div>

      {/* See Swaps CTA */}
      {swapSuggestions.length > 0 && (
        <div className="btn-see-swaps-container">
          <button className="btn-see-swaps" onClick={onSeeSwaps} style={{ minHeight: '48px' }}>
            See {swapSuggestions.length} Swap Suggestions
          </button>
        </div>
      )}

    </div>
  );
}
