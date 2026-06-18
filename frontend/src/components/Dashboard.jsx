import PropTypes from 'prop-types';
import SwapSuggestions from './SwapSuggestions';
import { Leaf, AlertTriangle, CheckCircle, ArrowLeft, Calendar, ShoppingBag, CreditCard, Car, Smartphone } from 'lucide-react';

export default function Dashboard({ data, onBack }) {
  if (!data) return null;

  const {
    storeName,
    receiptDate,
    totalAmount,
    items = [],
    totalEmissions,
    swapSuggestions = [],
    insights = [],
    impactComparison = {}
  } = data;

  // Group items by category to display distribution
  const categorySummary = items.reduce((acc, item) => {
    const cat = item.category || 'misc';
    acc[cat] = (acc[cat] || 0) + item.co2e;
    return acc;
  }, {});

  const totalCatEmissions = Object.values(categorySummary).reduce((a, b) => a + b, 0);

  // Helper to categorize carbon level and get styling details (Rule 17)
  const getCarbonStatus = (co2e) => {
    if (co2e >= 2.0) {
      return {
        label: 'High Carbon',
        colorClass: 'text-red-400 bg-red-950/40 border-red-500/30',
        barColor: 'bg-red-500',
        icon: <AlertTriangle size={14} className="text-red-400" aria-hidden="true" />,
        ariaText: 'Warning: High carbon footprint item'
      };
    } else if (co2e >= 0.5) {
      return {
        label: 'Medium Carbon',
        colorClass: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
        barColor: 'bg-amber-500',
        icon: <AlertTriangle size={14} className="text-amber-400" aria-hidden="true" />,
        ariaText: 'Attention: Medium carbon footprint item'
      };
    } else {
      return {
        label: 'Low Carbon',
        colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
        barColor: 'bg-emerald-500',
        icon: <CheckCircle size={14} className="text-emerald-400" aria-hidden="true" />,
        ariaText: 'Excellent: Low carbon footprint item'
      };
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-fade-in pb-16">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition focus-visible:ring-2 p-2 rounded-lg"
          aria-label="Go back to uploader"
        >
          <ArrowLeft size={18} /> Back to Upload
        </button>
        <span className="text-sm text-slate-500 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800">
          Source: emissions.json (India-localised)
        </span>
      </div>

      {/* Warning banner if running in simulated mode */}
      {data.warning && (
        <div className="flex gap-3 items-start bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 text-amber-200 text-sm shadow-lg animate-fade-in" role="alert">
          <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <span className="font-bold block mb-0.5 text-amber-300">Simulated Results Fallback</span>
            <span className="text-xs text-amber-200/90">{data.warning}</span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Receipt Details Card */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border-l-4 border-slate-700 md:col-span-1 shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Receipt Info</span>
            <h1 className="text-2xl font-bold text-slate-100 truncate mb-4" title={storeName}>
              {storeName}
            </h1>
            <div className="flex flex-col gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <Calendar size={16} className="text-emerald-400" />
                <time dateTime={receiptDate}>{new Date(receiptDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</time>
              </div>
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={16} className="text-emerald-400" />
                <span>{items.length} items purchased</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CreditCard size={16} className="text-emerald-400" />
                <span className="font-semibold text-slate-200">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carbon Stat Card */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border-l-4 border-emerald-500 md:col-span-2 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full"></div>
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-2">Total Carbon Impact</span>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-black text-slate-50 font-sans tracking-tight">{totalEmissions}</span>
              <span className="text-xl font-bold text-slate-400">kg CO₂e</span>
            </div>

            {/* Impact comparison (Rule 18 / 24) */}
            <div 
              className="grid grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 mb-2"
              aria-label={impactComparison.text}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                  <Car size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Car Driving</div>
                  <div className="text-sm font-bold text-slate-200">{impactComparison.drivingEquivalentKm} km</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                  <Smartphone size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Smartphones Charged</div>
                  <div className="text-sm font-bold text-slate-200">{impactComparison.smartphoneCharges} charges</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown and Suggestions Layout */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* Left side: Items lists */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <ShoppingBag size={20} className="text-emerald-400" /> Itemized Carbon Breakdown
            </h2>

            {/* Table layout (highly accessible) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Itemized carbon footprint breakdown table">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                    <th className="pb-3 pr-2">Item</th>
                    <th className="pb-3 px-2 text-right">Qty</th>
                    <th className="pb-3 px-2 text-right">Price</th>
                    <th className="pb-3 px-2 text-right">Carbon (CO₂e)</th>
                    <th className="pb-3 pl-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {items.map((item, index) => {
                    const status = getCarbonStatus(item.co2e);
                    return (
                      <tr key={index} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 pr-2 font-medium text-slate-200 capitalize">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-2 text-right text-slate-400">
                          {item.quantity} <span className="text-xs">{item.unit}</span>
                        </td>
                        <td className="py-3.5 px-2 text-right text-slate-300">
                          {item.price > 0 ? `₹${item.price.toFixed(1)}` : '—'}
                        </td>
                        <td className="py-3.5 px-2 text-right font-bold text-slate-100">
                          {item.co2e} <span className="text-xs font-normal text-slate-400">kg</span>
                        </td>
                        <td className="py-3.5 pl-2">
                          <div className="flex justify-center">
                            <span 
                              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${status.colorClass}`}
                              title={status.ariaText}
                              aria-label={status.label}
                            >
                              {status.icon}
                              <span>{status.label}</span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right side: Categories breakdown */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col h-full justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Leaf size={20} className="text-emerald-400" /> Categories
              </h2>

              <div 
                className="flex flex-col gap-5"
                role="img" 
                aria-label="Carbon emissions distribution by food category chart"
              >
                {Object.entries(categorySummary)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, value]) => {
                    const percentage = totalCatEmissions > 0 
                      ? Math.round((value / totalCatEmissions) * 100) 
                      : 0;
                    
                    const status = getCarbonStatus(value);
                    
                    return (
                      <div key={category} className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize text-slate-300 font-semibold">{category}</span>
                          <span className="text-slate-400 font-medium">
                            {value.toFixed(1)} kg ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/80">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${status.barColor}`}
                            style={{ width: `${percentage}%` }}
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {insights.length > 0 && (
              <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl mt-6">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">Key Insight</span>
                <ul className="list-disc pl-4 text-xs text-slate-300 flex flex-col gap-2 leading-relaxed">
                  {insights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sustainable Swap Suggestions Section */}
      <div className="mt-4">
        <SwapSuggestions suggestions={swapSuggestions} />
      </div>
    </div>
  );
}

Dashboard.propTypes = {
  data: PropTypes.shape({
    storeName: PropTypes.string,
    receiptDate: PropTypes.string,
    totalAmount: PropTypes.number,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        quantity: PropTypes.number,
        unit: PropTypes.string,
        price: PropTypes.number,
        category: PropTypes.string,
        co2e: PropTypes.number,
        isFallback: PropTypes.bool,
        suggestions: PropTypes.array,
      })
    ),
    totalEmissions: PropTypes.number,
    swapSuggestions: PropTypes.array,
    insights: PropTypes.arrayOf(PropTypes.string),
    impactComparison: PropTypes.shape({
      drivingEquivalentKm: PropTypes.number,
      smartphoneCharges: PropTypes.number,
      text: PropTypes.string,
    }),
    warning: PropTypes.string,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
};
