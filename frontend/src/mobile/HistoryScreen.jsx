import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function HistoryScreen({ onBack }) {
  const chartData = [
    { name: 'May 20', value: 6.1 },
    { name: 'May 27', value: 5.4 },
    { name: 'Jun 3', value: 4.8 },
    { name: 'Jun 10', value: 4.2 },
  ];

  const pastReceipts = [
    { id: 1, date: "June 13, 2024", value: 4.7, dotColor: "var(--amber-dot)" },
    { id: 2, date: "June 6, 2024", value: 4.8, dotColor: "var(--amber-dot)" },
    { id: 3, date: "May 30, 2024", value: 5.4, dotColor: "var(--red-dot)" },
    { id: 4, date: "May 23, 2024", value: 6.1, dotColor: "var(--red-dot)" },
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
        <h2 className="header-bar-title">History & Trends</h2>
        <div style={{ width: '48px' }} /> {/* Spacer */}
      </div>

      {/* Scroll Content */}
      <div className="history-scroll-content">
        
        {/* Line Chart Section */}
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
                  domain={[0, 8]}
                  ticks={[0, 2, 4, 6, 8]}
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

        {/* Comparison Card */}
        <div className="comparison-card">
          <div className="comparison-left">
            <span className="comparison-title">This week vs last week</span>
            <div className="comparison-better-row">
              <span className="comparison-arrow">↓</span>
              <span className="comparison-better-val">-12% better</span>
            </div>
            <span className="comparison-subtitle">4.2 kg CO₂e vs 4.8 kg CO₂e</span>
          </div>

          <div className="comparison-right">
            {/* Earth/globe SVG with a leaf on top */}
            <svg 
              className="globe-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="var(--green-primary)" 
              strokeWidth="1.5"
            >
              {/* Outer globe outline */}
              <circle cx="12" cy="12" r="9" />
              {/* Latitude lines */}
              <path d="M3.6 9h16.8" />
              <path d="M3.6 15h16.8" />
              {/* Longitude lines */}
              <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z" />
              {/* Small leaf motif */}
              <path 
                d="M16 4c.5 1 .5 2 0 3-.5 1-1.5 1.5-2.5 1.5 0-1 .5-2 1.5-3 1-1 1-1.5 1-1.5z" 
                fill="var(--green-primary)"
              />
            </svg>
          </div>
        </div>

        {/* Past Receipts Section */}
        <div className="past-receipts-section">
          <h3 className="section-heading">Past Receipts</h3>
          
          {pastReceipts.map((receipt) => (
            <div key={receipt.id} className="past-receipt-row">
              <span className="past-receipt-date">{receipt.date}</span>
              
              <div className="past-receipt-right">
                <span className="past-receipt-val">{receipt.value} kg CO₂e</span>
                <div 
                  className="offender-dot" 
                  style={{ backgroundColor: receipt.dotColor }}
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
