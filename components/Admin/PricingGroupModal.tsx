
import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { PricingGroup } from '../../types';

interface PricingGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: PricingGroup | null;
    onSave: (data: any) => void;
}

export const PricingGroupModal: React.FC<PricingGroupModalProps> = ({ isOpen, onClose, group, onSave }) => {
    const [formData, setFormData] = useState({ id: '', name: '', multiplier: 1.0 });

    useEffect(() => {
        if (group) {
            setFormData({ ...group });
        } else {
            setFormData({ id: '', name: '', multiplier: 1.0 });
        }
    }, [group, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Users size={20} className="text-purple-600" />
                    {group ? 'Edit Mentor Group' : 'Add Mentor Group'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Group ID</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="e.g. expert, native"
                            value={formData.id}
                            onChange={e => setFormData({...formData, id: e.target.value.toLowerCase()})}
                            disabled={!!group} 
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="e.g. Expert Mentor"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Price Multiplier</label>
                        <input 
                            type="number" 
                            required 
                            step="0.01"
                            min="1.0"
                            max="5.0"
                            value={formData.multiplier}
                            onChange={e => setFormData({...formData, multiplier: Number(e.target.value)})}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Multiplier for base hourly rate (min 1.0)</p>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg mt-2"
                    >
                        Save Group
                    </button>
                </form>
            </div>
        </div>
    );
};
