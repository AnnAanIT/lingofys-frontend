
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PricingGroup } from '../../types';
import { Users, Loader2 } from 'lucide-react';

interface MentorGroupSelectorProps {
    value?: string; // Group ID
    onChange: (groupId: string) => void;
}

export const MentorGroupSelector: React.FC<MentorGroupSelectorProps> = ({ value, onChange }) => {
    const [groups, setGroups] = useState<PricingGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await api.getPricingGroups();
            setGroups(data);
            setLoading(false);
        };
        load();
    }, []);

    const selectedGroup = groups.find(g => g.id === value);

    if (loading) return <div className="flex items-center text-sm text-slate-400"><Loader2 className="animate-spin mr-2" size={14}/> Loading groups...</div>;

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                    <Users size={16} className="mr-2 text-purple-600" />
                    Mentor Group
                </label>
                {selectedGroup && (
                    <span className="text-xs font-bold px-2 py-1 rounded bg-purple-100 text-purple-700">
                        x{selectedGroup.multiplier}
                    </span>
                )}
            </div>
            
            <select 
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
                <option value="">Select Group</option>
                {groups.map(g => (
                    <option key={g.id} value={g.id}>
                        {g.name}
                    </option>
                ))}
            </select>
            <p className="text-xs text-slate-400 mt-2">
                Defines mentor tier multiplier.
            </p>
        </div>
    );
};
