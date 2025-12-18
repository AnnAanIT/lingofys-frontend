
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout, ConfirmDialog } from '../components/AdminComponents';
import { PricingPreview } from '../components/Admin/PricingPreview';
import { PricingCountryModal } from '../components/Admin/PricingCountryModal';
import { PricingCountry, PricingGroup } from '../types';
import { 
    Globe, Users, DollarSign, Save, RotateCcw, Settings, Plus, Trash2, TrendingUp, AlertTriangle
} from 'lucide-react';

export default function AdminPricing() {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // --- DATA STATE ---
    const [countries, setCountries] = useState<PricingCountry[]>([]);
    const [groups, setGroups] = useState<PricingGroup[]>([]);
    
    // --- EDITABLE CONFIG STATE ---
    const [basePrice, setBasePrice] = useState<number>(10);
    const [topupRatio, setTopupRatio] = useState<number>(1.0);

    // --- PREVIEW STATE ---
    const [previewCountry, setPreviewCountry] = useState<string>('');
    const [previewGroup, setPreviewGroup] = useState<string>('');

    // --- MODAL STATE ---
    const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
    const [editingCountry, setEditingCountry] = useState<PricingCountry | null>(null);
    const [deletingCountry, setDeletingCountry] = useState<PricingCountry | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [cData, gData, sysData] = await Promise.all([
            api.getPricingCountries(),
            api.getPricingGroups(),
            api.getSystemSettings()
        ]);

        setCountries(cData);
        setGroups(gData);
        setBasePrice(sysData.baseLessonCreditPrice);
        setTopupRatio(sysData.topupConversionRatio || 1.0);

        if(cData.length > 0 && !previewCountry) setPreviewCountry(cData[0].id);
        if(gData.length > 0 && !previewGroup) setPreviewGroup(gData[0].id);

        setLoading(false);
    };

    // --- HANDLERS ---
    
    const updateCountryMultiplier = (id: string, val: number) => {
        setCountries(prev => prev.map(c => c.id === id ? { ...c, multiplier: val } : c));
    };

    const updateGroupMultiplier = (id: string, val: number) => {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, multiplier: val } : g));
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            // Sử dụng BATCH SAVE để ghi đè toàn bộ LocalStorage an toàn
            await api.batchSavePricing(basePrice, topupRatio, countries, groups);
            await api.logAction('CONFIG_UPDATE', 'Admin updated core pricing and multipliers via batch save', 'u3');
            alert("Settings saved successfully!");
            await loadData(); // Reload to sync
        } catch (error) {
            alert("Error saving settings: " + error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCountryModal = async (data: PricingCountry) => {
        // Local update only before global save
        if (editingCountry) {
            setCountries(prev => prev.map(c => c.id === data.id ? data : c));
        } else {
            setCountries(prev => [...prev, data]);
        }
        setIsCountryModalOpen(false);
        setEditingCountry(null);
    };

    const handleConfirmDelete = async () => {
        if (!deletingCountry) return;
        setCountries(prev => prev.filter(c => c.id !== deletingCountry.id));
        setDeletingCountry(null);
    };

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    const sellPricePerCredit = 1 / topupRatio;
    const payoutCostPerCredit = 1.0; 
    const grossProfitPerCredit = sellPricePerCredit - payoutCostPerCredit;
    const marginPercent = (grossProfitPerCredit / sellPricePerCredit) * 100;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Credit System Configuration</h1>
                        <p className="text-slate-500 mt-1">Configure credit valuation and top-up margins.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={loadData} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors flex items-center">
                            <RotateCcw size={18} className="mr-2" /> Reset
                        </button>
                        <button 
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-100 flex items-center disabled:opacity-50"
                        >
                            <Save size={20} className="mr-2" /> {isSaving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                    <div className="xl:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                        <TrendingUp className="mr-2 text-green-600" /> Revenue Model
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">Profit is recognized immediately at Top-up.</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${marginPercent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {marginPercent.toFixed(1)}% Top-up Margin
                                </div>
                            </div>
                            
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Top-up Conversion Ratio</label>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-3.5 text-slate-400 font-bold">$1 USD = </span>
                                            <input 
                                                type="number" 
                                                step="0.05"
                                                min="0.1"
                                                max="2.0"
                                                value={topupRatio}
                                                onChange={(e) => setTopupRatio(Number(e.target.value))}
                                                className="w-full pl-20 pr-4 py-3 font-mono text-lg font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-3 rounded-xl">Credits</span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Lower ratio = More expensive credits = Higher margin.
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Unit Economics (Per 1 Credit)</h3>
                                    <div className="space-y-3 font-mono text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">Sell Price (To Mentee)</span>
                                            <span className="font-bold text-slate-900">${sellPricePerCredit.toFixed(3)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">Cost Basis (Mentor Payout)</span>
                                            <span className="font-bold text-red-600">-${payoutCostPerCredit.toFixed(3)}</span>
                                        </div>
                                        <div className="h-px bg-slate-200 my-1"></div>
                                        <div className="flex justify-between items-center text-base">
                                            <span className="font-bold text-slate-700">Gross Margin</span>
                                            <span className={`font-extrabold ${grossProfitPerCredit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {grossProfitPerCredit >= 0 ? '+' : ''}${grossProfitPerCredit.toFixed(3)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                    <DollarSign className="mr-2 text-brand-600" /> Lesson Credit Cost
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Defines how many credits a lesson costs for the Mentee.</p>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Base Price (Credits per Lesson)</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={basePrice}
                                            onChange={(e) => setBasePrice(Number(e.target.value))}
                                            className="w-48 p-3 text-lg font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                        />
                                        <span className="text-sm text-slate-400">Credits needed for a standard class</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-800 flex items-center">
                                            <Globe size={18} className="mr-2 text-blue-500" /> Geographic Multipliers
                                        </h3>
                                        <button 
                                            onClick={() => { setEditingCountry(null); setIsCountryModalOpen(true); }}
                                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center transition-colors"
                                        >
                                            <Plus size={14} className="mr-1" /> Add Country
                                        </button>
                                    </div>
                                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-bold">
                                                <tr>
                                                    <th className="px-4 py-3">Country</th>
                                                    <th className="px-4 py-3 w-32">Multiplier</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {countries.map(c => (
                                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-4 py-3 font-medium text-slate-700">{c.name}</td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="number" 
                                                                step="0.05"
                                                                value={c.multiplier}
                                                                onChange={(e) => updateCountryMultiplier(c.id, Number(e.target.value))}
                                                                className="w-20 p-1 border border-slate-200 rounded text-center font-bold focus:border-brand-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button onClick={() => setDeletingCountry(c)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                        <Users size={18} className="mr-2 text-purple-500" /> Mentor Tier Multipliers
                                    </h3>
                                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-bold">
                                                <tr>
                                                    <th className="px-4 py-3">Group</th>
                                                    <th className="px-4 py-3 w-32">Multiplier</th>
                                                    <th className="px-4 py-3 text-right">Preview</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {groups.map(g => (
                                                    <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-slate-700">{g.name}</td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="number" 
                                                                step="0.1"
                                                                value={g.multiplier}
                                                                onChange={(e) => updateGroupMultiplier(g.id, Number(e.target.value))}
                                                                className="w-20 p-1 border border-slate-200 rounded text-center font-bold focus:border-brand-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-slate-400 font-mono">
                                                            x{g.multiplier.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-1">
                        <div className="sticky top-6 space-y-6">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                    <Settings size={18} className="mr-2 text-slate-400" /> Simulation Controls
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Country</label>
                                        <select value={previewCountry} onChange={e => setPreviewCountry(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-slate-50 font-medium">
                                            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Mentor Group</label>
                                        <select value={previewGroup} onChange={e => setPreviewGroup(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-slate-50 font-medium">
                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <PricingPreview basePrice={basePrice} countries={countries} groups={groups} selectedCountryId={previewCountry} selectedGroupId={previewGroup} topupRatio={topupRatio} />
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                                <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Unsaved Changes</h4>
                                <p className="text-blue-800 text-sm">You must click "Save All Changes" at the top to apply these multipliers to the entire platform.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <PricingCountryModal isOpen={isCountryModalOpen} onClose={() => setIsCountryModalOpen(false)} country={editingCountry} onSave={handleSaveCountryModal} />
                <ConfirmDialog isOpen={!!deletingCountry} onClose={() => setDeletingCountry(null)} onConfirm={handleConfirmDelete} title="Remove Geographic Adjustment" message={`Are you sure you want to remove pricing rules for ${deletingCountry?.name}?`} />
            </div>
        </AdminLayout>
    );
}
