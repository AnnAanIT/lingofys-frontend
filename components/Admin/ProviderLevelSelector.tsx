
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ProviderLevel } from '../../types';
import { Shield, Loader2 } from 'lucide-react';

interface ProviderLevelSelectorProps {
    value?: string; // Level ID
    onChange: (levelId: string) => void;
}

export const ProviderLevelSelector: React.FC<ProviderLevelSelectorProps> = ({ value, onChange }) => {
    const [levels, setLevels] = useState<ProviderLevel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await api.getProviderLevels();
            setLevels(data);
            setLoading(false);
        };
        load();
    }, []);

    const selectedLevel = levels.find(l => l.id === value);

    if (loading) return <div className="flex items-center text-sm text-slate-400"><Loader2 className="animate-spin mr-2" size={14}/> Loading levels...</div>;

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                    <Shield size={16} className="mr-2 text-orange-600" />
                    Provider Level
                </label>
                {selectedLevel && (
                    <span className="text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-700">
                        {selectedLevel.commissionPercent}% Comm.
                    </span>
                )}
            </div>
            
            <select 
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
                <option value="">Select Level</option>
                {levels.map(l => (
                    <option key={l.id} value={l.id}>
                        {l.name}
                    </option>
                ))}
            </select>
            <p className="text-xs text-slate-400 mt-2">
                Determines the commission rate for referrals.
            </p>
        </div>
    );
};
