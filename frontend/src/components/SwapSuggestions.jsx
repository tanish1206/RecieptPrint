import React from 'react';
import { ArrowRight, Leaf, Sparkles } from 'lucide-react';

export default function SwapSuggestions({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center">
        <Leaf className="text-emerald-400/50 mx-auto mb-3" size={28} />
        <h3 className="font-semibold text-slate-200">Awesome Job!</h3>
        <p className="text-sm text-slate-400 mt-1">
          No high-carbon items found on this receipt. Your grocery choices are looking highly sustainable.
        </p>
      </div>
    );
  }

  // Calculate potential CO2 savings if user adopts all swaps
  const totalSavings = suggestions.reduce((acc, sug) => {
    const savings = sug.originalCo2e - sug.swapCo2e;
    return acc + (savings > 0 ? savings : 0);
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-emerald-400" size={20} />
          <h2 className="text-xl font-bold text-slate-100">Eco-Friendly Swaps</h2>
        </div>
        {totalSavings > 0 && (
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center gap-1.5 animate-pulse">
            <Leaf size={12} /> Save up to {totalSavings.toFixed(1)} kg CO₂e
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {suggestions.map((suggestion, index) => {
          const savings = suggestion.originalCo2e - suggestion.swapCo2e;
          
          return (
            <div 
              key={index} 
              className="glass-panel rounded-xl p-5 flex flex-col justify-between border-l-4 border-emerald-500/70 hover:border-emerald-400 transition-all duration-200 shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="text-slate-400 capitalize">{suggestion.category} category</span>
                  {savings > 0 && (
                    <span className="font-bold text-emerald-400">-{savings.toFixed(1)} kg CO₂e</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-slate-200 line-through decoration-red-500/50">
                    {suggestion.originalItem}
                  </span>
                  <ArrowRight size={14} className="text-slate-500" />
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Leaf size={14} /> {suggestion.swapTo}
                  </span>
                </div>

                <p className="text-sm text-slate-300 bg-slate-900/40 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                  {suggestion.reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
