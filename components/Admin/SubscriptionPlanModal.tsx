
import React, { useState, useEffect } from 'react';
import { X, Award } from 'lucide-react';
import { SubscriptionPlan } from '../../types';

interface SubscriptionPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: SubscriptionPlan | null;
    onSave: (plan: SubscriptionPlan) => void;
}

export const SubscriptionPlanModal: React.FC<SubscriptionPlanModalProps> = ({ isOpen, onClose, plan, onSave }) => {
    const [form, setForm] = useState<SubscriptionPlan>({
        id: '',
        name: '',
        price: 0,
        sessions: 4,
        description: '',
        allowedCancel: 1,
        allowedReschedule: 1,
        durationWeeks: 4
    });

    useEffect(() => {
        if (plan) {
            setForm(plan);
        } else {
            setForm({
                id: '',
                name: '',
                price: 0,
                sessions: 4,
                description: '',
                allowedCancel: 1,
                allowedReschedule: 1,
                durationWeeks: 4
            });
        }
    }, [plan, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    const handleChange = (field: keyof SubscriptionPlan, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Award className="text-brand-600" size={24} />
                    {plan ? 'Edit Plan' : 'New Plan'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Name</label>
                        <input 
                            type="text" 
                            required 
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="e.g. Starter, Premium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                        <input 
                            type="text" 
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="Short summary..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (Credits)</label>
                            <input 
                                type="number" 
                                required 
                                min={0}
                                value={form.price}
                                onChange={(e) => handleChange('price', Number(e.target.value))}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sessions</label>
                            <input 
                                type="number" 
                                required 
                                min={1}
                                value={form.sessions}
                                onChange={(e) => handleChange('sessions', Number(e.target.value))}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Wks)</label>
                            <input 
                                type="number" 
                                min={1}
                                value={form.durationWeeks}
                                onChange={(e) => handleChange('durationWeeks', Number(e.target.value))}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cancels</label>
                            <input 
                                type="number" 
                                min={0}
                                value={form.allowedCancel}
                                onChange={(e) => handleChange('allowedCancel', Number(e.target.value))}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reschedules</label>
                            <input 
                                type="number" 
                                min={0}
                                value={form.allowedReschedule}
                                onChange={(e) => handleChange('allowedReschedule', Number(e.target.value))}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg mt-4"
                    >
                        Save Plan
                    </button>
                </form>
            </div>
        </div>
    );
};
