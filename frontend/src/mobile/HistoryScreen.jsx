import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, Loader2, Leaf } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

function formatDateShort(dateStr) {
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

function formatDateLong(dateStr) {
  try {
    const d = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function getDotColor(val) {
  if (val > 10.0) return 'var(--red-dot, #E53935)';
  if (val > 4.0) return 'var(--amber-dot, #FB8C00)';
  return 'var(--green-dot, #43A047)';
}

export default function HistoryScreen({ session, onBack }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = session?.access_token || '';
  const API_URL = import.meta.env.VITE_API_URL ?? '';

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!token) {
          setHistoryData([]);
          setLoading(false);
          return;
        }

        // If mock token, use localStorage simulation
        if (token.startsWith('mock_')) {
          const mockDb = JSON.parse(localStorage.getItem('rp_mock_history') || '[]');
          setHistoryData(mockDb);
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        setHistoryData(data);
      } catch (err) {
        console.error('Error fetching mobile history:', err);
        setError('Could not load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, API_URL]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
        <div className="screen-header-bar">
          <button className="header-bar-btn" onClick={onBack} aria-label="Go back">
            <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
          <h2 className="header-bar-title">History & Trends</h2>
          <div style={{ width: '48px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px' }}>
          <Loader2 className="animate-spin text-emerald-400" size={32} style={{ color: 'var(--green-primary)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading history...</span>
        </div>
      </div>
    );
  }

  if (error || historyData.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
        <div className="screen-header-bar">
          <button className="header-bar-btn" onClick={onBack} aria-label="Go back">
            <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
          <h2 className="header-bar-title">History & Trends</h2>
          <div style={{ width: '48px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px', textAlign: 'center' }}>
          <Leaf size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px' }}>No Receipts Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '240px', marginTop: '6px', lineHeight: '1.4' }}>
            {error ? error : 'Scan your first receipt to start tracking carbon trends over time.'}
          </p>
        </div>
      </div>
    );
  }

  // Sort: newest first
  const sortedReceipts = [...historyData].sort((a, b) => new Date(b.receipt_date) - new Date(a.receipt_date));

  // Chart data: oldest to newest (up to last 5)
  const chartData = [...sortedReceipts]
    .slice(0, 5)
    .reverse()
    .map(r => ({
      name: formatDateShort(r.receipt_date),
      value: r.total_emissions
    }));

  // Compare latest vs previous
  let comparisonText = 'No previous trip to compare';
  let comparisonSub = '1 receipt logged';
  let isBetter = false;
  let pctChange = '0%';

  if (sortedReceipts.length >= 2) {
    const latestVal = sortedReceipts[0].total_emissions;
    const prevVal = sortedReceipts[1].total_emissions;
    comparisonSub = `${latestVal.toFixed(1)} kg CO₂e vs ${prevVal.toFixed(1)} kg CO₂e`;
    
    if (prevVal > 0) {
      const diff = ((latestVal - prevVal) / prevVal) * 100;
      pctChange = `${Math.abs(Math.round(diff))}%`;
      isBetter = diff < 0;
      comparisonText = isBetter ? 'This week vs last week' : 'This week vs last week';
    } else {
      pctChange = latestVal > 0 ? 'Higher' : '0%';
      isBetter = false;
    }
  }

  const calculatePotentialItemSavings = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      const cat = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      let itemSavings = 0;
      if (name.includes('rice')) {
        itemSavings = item.co2e * 0.68;
      } else if (cat === 'meat' || name.includes('mutton') || name.includes('chicken') || name.includes('meat')) {
        itemSavings = item.co2e * 0.85;
      } else if (cat === 'dairy' || name.includes('milk') || name.includes('paneer') || name.includes('butter')) {
        itemSavings = item.co2e * 0.50;
      }
      return sum + itemSavings;
    }, 0);
  };

  const lifetimeSavings = historyData.reduce((sum, receipt) => sum + calculatePotentialItemSavings(receipt.items), 0);

  const getTrendInterpretation = (data) => {
    if (data.length < 2) return '';
    const chronological = [...data].sort((a, b) => new Date(a.receipt_date) - new Date(b.receipt_date));
    const half = Math.floor(chronological.length / 2);
    const firstAvg = chronological.slice(0, half).reduce((sum, r) => sum + r.total_emissions, 0) / (half || 1);
    const secondAvg = chronological.slice(half).reduce((sum, r) => sum + r.total_emissions, 0) / (chronological.length - half || 1);
    const diffPct = ((secondAvg - firstAvg) / (firstAvg || 1)) * 100;
    
    if (diffPct < -5) {
      return `Your emissions are down ${Math.abs(diffPct).toFixed(0)}%! You're successfully transitioning to a plant-forward, green grocery list.`;
    } else if (diffPct > 5) {
      return `Your emissions are up ${diffPct.toFixed(0)}% recently. Consider swap suggestions on your latest receipts to bring it down.`;
    } else {
      return `Your footprint is stable (~${secondAvg.toFixed(1)} kg). Look for low-hanging swap recommendations to reduce your impact.`;
    }
  };

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
        <h2 className="header-bar-title">History & Trends</h2>
        <div style={{ width: '48px' }} />
      </div>

      {/* Scroll Content */}
      <div className="history-scroll-content">
        
        {/* Line Chart Section */}
        {chartData.length > 0 && (
          <div className="chart-section">
            <span className="chart-title">Carbon Footprint Trend (kg CO₂e)</span>
            <div className="chart-container-mock">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
                >
                  <CartesianGrid stroke="#F5F5F5" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis 
                    domain={[0, 'dataMax + 2']}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--green-primary)" 
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: 'var(--green-primary)', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: 'var(--green-primary)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Comparison Card */}
        {sortedReceipts.length >= 2 && (
          <div className="comparison-card">
            <div className="comparison-left">
              <span className="comparison-title">{comparisonText}</span>
              <div className="comparison-better-row">
                <span className="comparison-arrow" style={{ transform: isBetter ? 'none' : 'rotate(180deg)', display: 'inline-block' }}>↓</span>
                <span className="comparison-better-val" style={{ color: isBetter ? 'var(--green-primary)' : '#E53935' }}>
                  {pctChange} {isBetter ? 'better' : 'higher'}
                </span>
              </div>
              <span className="comparison-subtitle">{comparisonSub}</span>
            </div>

            <div className="comparison-right">
              <svg 
                className="globe-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="var(--green-primary)" 
                strokeWidth="1.5"
                aria-label="Sustainability globe indicator"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3.6 9h16.8" />
                <path d="M3.6 15h16.8" />
                <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z" />
                <path 
                  d="M16 4c.5 1 .5 2 0 3-.5 1-1.5 1.5-2.5 1.5 0-1 .5-2 1.5-3 1-1 1-1.5 1-1.5z" 
                  fill="var(--green-primary)"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Lifetime Savings Card */}
        {lifetimeSavings > 0 && (
          <div className="comparison-card" style={{ marginTop: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.03))', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <div className="comparison-left">
              <span className="comparison-title" style={{ color: 'var(--green-primary)' }}>Lifetime Potential Savings</span>
              <div className="comparison-better-row" style={{ marginTop: '4px' }}>
                <span className="comparison-better-val" style={{ color: 'var(--green-primary)', fontSize: '20px', fontWeight: 'bold' }}>
                  {lifetimeSavings.toFixed(1)} kg CO₂e
                </span>
              </div>
              <span className="comparison-subtitle">Preventable carbon across all shopping trips</span>
            </div>
            <div className="comparison-right">
              <Leaf size={24} style={{ color: 'var(--green-primary)' }} />
            </div>
          </div>
        )}

        {/* Personalized Trend Banner */}
        {sortedReceipts.length >= 2 && (
          <div style={{ margin: '12px 20px 0', padding: '12px 16px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--green-primary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Eco-Advisor Insight</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px', lineHeight: '1.4' }}>
              {getTrendInterpretation(historyData)}
            </span>
          </div>
        )}

        {/* Past Receipts Section */}
        <div className="past-receipts-section">
          <h3 className="section-heading">Past Receipts</h3>
          
          {sortedReceipts.map((receipt) => (
            <div key={receipt.id} className="past-receipt-row">
              <span className="past-receipt-date">{formatDateLong(receipt.receipt_date)}</span>
              
              <div className="past-receipt-right">
                <span className="past-receipt-val">{receipt.total_emissions.toFixed(1)} kg CO₂e</span>
                <div 
                  className="offender-dot" 
                  style={{ backgroundColor: getDotColor(receipt.total_emissions) }}
                />
                <span className="past-receipt-chevron">›</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

HistoryScreen.propTypes = {
  session: PropTypes.shape({
    access_token: PropTypes.string,
    user: PropTypes.shape({
      email: PropTypes.string,
    }),
  }),
  onBack: PropTypes.func.isRequired,
};
