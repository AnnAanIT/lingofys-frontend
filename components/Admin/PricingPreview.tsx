
import React from 'react';
import { PricingCountry, PricingGroup } from '../../types';
import { Calculator, AlertTriangle, TrendingUp } from 'lucide-react';

interface PricingPreviewProps {
    basePrice: number;
    countries: PricingCountry[];
    groups: PricingGroup[];
    selectedCountryId: string;
    selectedGroupId: string;
    topupRatio: number;
}

export const PricingPreview: React.FC<PricingPreviewProps> = ({ 
    basePrice, 
    countries, 
    groups, 
    selectedCountryId,
    selectedGroupId,
    topupRatio
}) => {
    // --- 1. Resolve Factors ---
    const country = countries.find(c => c.id === selectedCountryId || c.name === selectedCountryId);
    const group = groups.find(g => g.id === selectedGroupId);

    const countryMult = country ? country.multiplier : 1.0;
    const groupMult = group ? group.multiplier : 1.0;

    // --- 2. Calculate Pricing (Credit Cost) ---
    const finalPriceCredits = basePrice * countryMult * groupMult;

    // --- 3. Calculate Financials (Dynamic Ratio) ---
    const estimatedUserCostUSD = finalPriceCredits / (topupRatio || 1.0);
    const estimatedPayoutUSD = finalPriceCredits; 
    const estimatedMarginUSD = estimatedUserCostUSD - estimatedPayoutUSD;

    return (
        <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 shadow-2xl border border-slate-800 h-full">
            <div className="flex items-center gap-2 text-white font-bold mb-6 pb-4 border-b border-slate-700">
                <Calculator size={20} className="text-brand-400" /> 
                <span className="text-lg">Live Price Simulation</span>
            </div>
            
            {/* --- SELECTION SUMMARY --- */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-mono">
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="text-slate-500 block mb-1">Student Location</span>
                    <span className="text-white font-bold flex justify-between truncate">
                        {country?.name || 'Default'}
                        <span className="text-blue-400">x{countryMult.toFixed(2)}</span>
                    </span>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="text-slate-500 block mb-1">Mentor Tier</span>
                    <span className="text-white font-bold flex justify-between truncate">
                        {group?.name || 'Default'}
                        <span className="text-purple-400">x{groupMult.toFixed(2)}</span>
                    </span>
                </div>
            </div>

            {/* --- PRICING RESULT --- */}
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-slate-400">Lesson Price (Credits)</span>
                        <span className="text-3xl font-black text-white tracking-tight">{finalPriceCredits.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* --- PROFIT BREAKDOWN --- */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <TrendingUp size={14}/> Projected Financials
                    </h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Mentee Pays (Avg USD)</span>
                            <span className="font-mono text-white font-bold">${estimatedUserCostUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Liability (Payout Basis)</span>
                            <span className="font-mono text-red-400">-${estimatedPayoutUSD.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-800 my-1 pt-3 flex justify-between items-center font-bold">
                            <span className="text-brand-400">Net System Margin</span>
                            <div className="text-right">
                                <div className="font-mono text-xl text-brand-400">+${estimatedMarginUSD.toFixed(2)}</div>
                                <div className="text-[10px] opacity-60">Per Lesson</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {estimatedMarginUSD <= 0 && (
                    <div className="bg-red-900/30 border border-red-500/50 p-3 rounded-lg flex items-start gap-2 text-xs text-red-300">
                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                        <span>Critical: Negative margin detected for this combination. Increase multiplier or Top-up ratio.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
