import PropTypes from 'prop-types';
import { ChevronLeft, Leaf } from 'lucide-react';

export default function SwapsScreen({ result, onBack }) {
  const swaps = result?.swapSuggestions || [];

  // Compute annual savings total
  const weeklyTotal = swaps.reduce((sum, s) => sum + Math.max(0, s.originalCo2e - s.swapCo2e), 0);
  const annualSaving = Math.round(weeklyTotal * 52);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>

      {/* Top Bar */}
      <div className="screen-header-bar">
        <button className="header-bar-btn" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
        </button>
        <h2 className="header-bar-title">Swap Suggestions</h2>
        <div style={{ width: '48px' }} />
      </div>

      {/* Scrollable Content */}
      <div className="swaps-scroll-content">

        {swaps.length === 0 ? (
          <div style={{ padding: 'var(--spacing-24)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            <Leaf size={40} style={{ color: 'var(--border-color)', marginBottom: '12px' }} />
            <p>No swap suggestions for this receipt.</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>All your items are already low-carbon. Great job! 🌿</p>
          </div>
        ) : (
          <div className="swap-cards-list">
            {swaps.map((s, i) => {
              const savedKg = Math.max(0, s.originalCo2e - s.swapCo2e);
              const savePct = s.originalCo2e > 0 ? Math.round((savedKg / s.originalCo2e) * 100) : 0;
              return (
                <div key={i} className="swap-card">
                  <div className="swap-card-top">
                    <div className="swap-item-column">
                      <span className="swap-item-name">{s.originalItem}</span>
                      <span className="tag-original">Original</span>
                    </div>
                    <span className="swap-arrow">→</span>
                    <div className="swap-item-column" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                      <span className="swap-item-name">{s.swapTo}</span>
                      <span className="tag-swap">Swap</span>
                    </div>
                  </div>

                  {s.reason && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '6px 0', lineHeight: 1.4 }}>
                      {s.reason}
                    </p>
                  )}

                  <div className="swap-card-bottom">
                    <span className="swap-save-text">Save {savedKg.toFixed(2)} kg CO₂e</span>
                    <span className="swap-percent-text">{savePct}% less</span>
                  </div>

                  <div className="swap-progress-track">
                    <div className="swap-progress-fill" style={{ width: `${savePct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Annual Savings Card */}
        {swaps.length > 0 && (
          <div className="annual-savings-card">
            <div className="annual-savings-left">
              <span className="annual-savings-line1">If you made all these swaps</span>
              <span className="annual-savings-line2">every week for 1 year:</span>
              <span className="annual-savings-value">Save {annualSaving} kg CO₂e</span>
            </div>
            <div className="annual-savings-right">
              <Leaf size={28} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

SwapsScreen.propTypes = {
  result: PropTypes.shape({
    swapSuggestions: PropTypes.arrayOf(
      PropTypes.shape({
        originalItem: PropTypes.string,
        originalCo2e: PropTypes.number,
        category: PropTypes.string,
        swapTo: PropTypes.string,
        swapCo2e: PropTypes.number,
        reason: PropTypes.string,
      })
    ),
  }),
  onBack: PropTypes.func.isRequired,
};
