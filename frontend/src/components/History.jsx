import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, ChevronRight, ChevronDown, Leaf, Info, Loader2, AlertTriangle, BarChart3 } from 'lucide-react';

export default function History({ token }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReceipt, setExpandedReceipt] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // If mock token, use localStorage simulation
      if (token.startsWith('mock_')) {
        const mockDb = JSON.parse(localStorage.getItem('rp_mock_history') || '[]');
        setHistoryData(mockDb);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch history.');
      }
      setHistoryData(data);
    } catch (err) {
      console.error(err);
      setError('Could not load receipt history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteReceipt = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this receipt from your history?')) return;

    try {
      if (token.startsWith('mock_')) {
        const mockDb = JSON.parse(localStorage.getItem('rp_mock_history') || '[]');
        const updated = mockDb.filter(r => r.id !== id);
        localStorage.setItem('rp_mock_history', JSON.stringify(updated));
        setHistoryData(updated);
        return;
      }

      // Supabase call via custom DELETE endpoint or directly
      // In our backend schema.sql, RLS allows deleting own receipts.
      // We can implement a quick DELETE endpoint in our backend history router, or do it client-side if we use the JS SDK directly.
      // Let's implement client-side delete using standard fetch to backend or mock.
      // Wait, let's write a backend delete endpoint or simply handle it. In our schema.sql, we set up RLS for DELETE.
      // If we use direct supabase client on frontend:
      // import { supabase } from '../utils/supabaseClient';
      // await supabase.from('receipts').delete().eq('id', id);
      // Wait, since we are doing it via the backend, let's call the DELETE endpoint on the backend.
      const response = await fetch(`${API_URL}/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete receipt.');
      }

      setHistoryData(prev => prev.filter(r => r.id !== id));
      if (expandedReceipt === id) setExpandedReceipt(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete receipt: ' + err.message);
    }
  };

  // Compile trend data for the chart (grouped chronologically by date)
  const getTrendData = () => {
    if (historyData.length === 0) return [];
    
    // Group and sum emissions by date
    const grouped = historyData.reduce((acc, r) => {
      const dateStr = r.receipt_date;
      acc[dateStr] = (acc[dateStr] || 0) + r.total_emissions;
      return acc;
    }, {});

    // Sort dates ascending
    return Object.entries(grouped)
      .map(([date, co2e]) => ({ date, co2e: Math.round(co2e * 10) / 10 }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const trendPoints = getTrendData();

  // Custom accessible SVG Area Chart generator
  const renderSvgChart = () => {
    if (trendPoints.length === 0) return null;

    const width = 600;
    const height = 180;
    const padding = 30;

    const xMax = width - padding * 2;
    const yMax = height - padding * 2;

    const maxCo2 = Math.max(...trendPoints.map(p => p.co2e), 5); // Fallback max to 5
    
    // Generate coordinate pairs
    const coordinates = trendPoints.map((p, idx) => {
      const x = padding + (idx / (trendPoints.length - 1 || 1)) * xMax;
      const y = padding + yMax - (p.co2e / maxCo2) * yMax;
      return { x, y, ...p };
    });

    // Generate Path Data for the line
    const linePath = coordinates.reduce((acc, p, idx) => {
      return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
    }, '');

    // Generate Path Data for the closed filled area
    const fillPath = linePath + `L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`;

    return (
      <div className="w-full overflow-x-auto">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full min-w-[500px] h-auto font-sans"
          role="img"
          aria-label="Line chart showing carbon footprint over time. The trend goes from left (older) to right (newer) shopping trips."
        >
          <defs>
            <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeWidth={0.5} strokeDasharray="4 4" />
          <line x1={padding} y1={padding + yMax / 2} x2={width - padding} y2={padding + yMax / 2} stroke="#334155" strokeWidth={0.5} strokeDasharray="4 4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#475569" strokeWidth={1} />

          {/* Fill Area */}
          {coordinates.length > 1 && (
            <path d={fillPath} fill="url(#chart-glow)" />
          )}

          {/* Trend line */}
          <path d={linePath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Data nodes */}
          {coordinates.map((pt, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r={4} 
                fill="#0f172a" 
                stroke="#10b981" 
                strokeWidth={2} 
                className="hover:r-6 hover:fill-emerald-400 transition-all duration-150"
              />
              <title>{`${pt.date}: ${pt.co2e} kg CO2e`}</title>
            </g>
          ))}

          {/* X Axis Labels */}
          {coordinates.map((pt, idx) => {
            // Show only first, last and middle labels if too many
            const showLabel = trendPoints.length <= 6 || idx === 0 || idx === trendPoints.length - 1 || idx === Math.floor(trendPoints.length / 2);
            if (!showLabel) return null;

            return (
              <text 
                key={idx}
                x={pt.x} 
                y={height - 10} 
                fill="#94a3b8" 
                fontSize={10} 
                textAnchor="middle"
              >
                {new Date(pt.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </text>
            );
          })}

          {/* Y Axis Labels */}
          <text x={padding - 5} y={padding + 4} fill="#94a3b8" fontSize={9} textAnchor="end">{maxCo2.toFixed(1)}</text>
          <text x={padding - 5} y={padding + yMax / 2 + 4} fill="#94a3b8" fontSize={9} textAnchor="end">{(maxCo2 / 2).toFixed(1)}</text>
          <text x={padding - 5} y={height - padding + 4} fill="#94a3b8" fontSize={9} textAnchor="end">0.0</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-fade-in pb-16">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-100 flex items-center gap-2.5">
          <BarChart3 className="text-emerald-400" size={28} /> Carbon History & Trends
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor your green shopping progress and see how your dietary footprint decreases over time.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="animate-spin text-emerald-400 mb-3" size={36} />
          <p className="text-slate-300 font-semibold">Loading history logs...</p>
        </div>
      ) : error ? (
        <div className="flex gap-2 items-start bg-red-950/40 border border-red-500/30 rounded-xl p-4 text-red-200 text-sm" role="alert">
          <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : historyData.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center flex flex-col items-center gap-3">
          <Leaf className="text-slate-600 animate-bounce" size={40} />
          <h3 className="text-lg font-bold text-slate-200">No Receipt History Found</h3>
          <p className="text-slate-400 text-sm max-w-sm">
            You haven't scanned or saved any receipts yet. Go to the Scanner tab, upload a grocery bill, and save it!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Trend Chart Panel (Rule 18) */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Leaf size={16} className="text-emerald-400" /> Carbon Emissions Trend (kg CO₂e)
            </h2>
            {renderSvgChart()}

            {/* Hidden descriptive table for accessibility screen-readers */}
            <div className="sr-only">
              <h4>Carbon Footprint Chart Data Table</h4>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Emissions (kg CO2e)</th>
                  </tr>
                </thead>
                <tbody>
                  {trendPoints.map((pt, idx) => (
                    <tr key={idx}>
                      <td>{pt.date}</td>
                      <td>{pt.co2e} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* History Log List */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-200">Receipt Scans Log</h2>
            <div className="flex flex-col gap-3">
              {historyData.map((receipt) => {
                const isExpanded = expandedReceipt === receipt.id;
                
                return (
                  <div 
                    key={receipt.id} 
                    className="glass-panel rounded-xl overflow-hidden transition-all duration-200 border border-slate-800/80 shadow-md"
                  >
                    {/* Header Row */}
                    <div 
                      onClick={() => setExpandedReceipt(isExpanded ? null : receipt.id)}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/20 active:bg-slate-800/30 transition-colors select-none"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-900 rounded-lg text-emerald-400">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-200 truncate max-w-[150px] md:max-w-[280px]">
                            {receipt.store_name}
                          </h3>
                          <time className="text-xs text-slate-400 block" dateTime={receipt.receipt_date}>
                            {new Date(receipt.receipt_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </time>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-400 block">₹{receipt.total_amount.toFixed(1)}</span>
                          <span className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1">
                            <Leaf size={14} /> {receipt.total_emissions.toFixed(1)} kg
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => deleteReceipt(receipt.id, e)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            aria-label={`Delete receipt from ${receipt.store_name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                          {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Pane */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-800/60 bg-slate-900/10 pt-4 animate-slide-down">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Itemized footprint</h4>
                        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                          {receipt.items && receipt.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex justify-between text-sm py-1.5 border-b border-slate-800/30 text-slate-300">
                              <span className="capitalize">{item.name} <span className="text-xs text-slate-500">x{item.quantity} {item.unit}</span></span>
                              <span className="font-semibold text-slate-200">{item.co2e.toFixed(1)} kg CO₂e</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
