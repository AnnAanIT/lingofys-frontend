
import React, { useState, useEffect } from 'react';
import { User, Mentor, Provider, UserRole, PricingCountry, ProviderLevel } from '../../types';
import { api } from '../../services/api';
import { X } from 'lucide-react';

interface EditUserFormProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSave: (id: string, data: any) => void;
}

export const EditUserForm: React.FC<EditUserFormProps> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState<any>({});
    const [countries, setCountries] = useState<PricingCountry[]>([]);
    const [providerLevels, setProviderLevels] = useState<ProviderLevel[]>([]);

    useEffect(() => {
        if (user) {
            setFormData({ 
                ...user,
                specialties: (user as any).specialties ? (user as any).specialties.join(', ') : ''
            });
        }
        api.getPricingCountries().then(setCountries);
        if (user?.role === UserRole.PROVIDER) {
            api.getProviderLevels().then(setProviderLevels);
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData };
        if (user.role === UserRole.MENTOR) {
            finalData.specialties = formData.specialties.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
        }
        onSave(user.id, finalData);
        onClose();
    };

    const handleChange = (field: string, value: string | number) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-slide-up relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <h3 className="text-xl font-bold text-slate-900 mb-6">Edit {user.role === 'MENTEE' ? 'User' : user.role} Profile</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name || ''} 
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input 
                                type="email" 
                                required
                                value={formData.email || ''} 
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input 
                                type="text" 
                                value={formData.phone || ''} 
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                            <select 
                                value={formData.country || ''} 
                                onChange={(e) => handleChange('country', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="">Select Country</option>
                                {countries.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {user.role === UserRole.MENTOR && (
                        <>
                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <h4 className="font-bold text-slate-800 mb-3 text-sm">Mentor Details</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Short Bio / Headline</label>
                                        <textarea 
                                            rows={2}
                                            value={formData.bio || ''} 
                                            onChange={(e) => handleChange('bio', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="Introduce the mentor..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Specialties (comma separated)</label>
                                        <input 
                                            type="text"
                                            value={formData.specialties || ''} 
                                            onChange={(e) => handleChange('specialties', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="IELTS, Business, Daily Talk..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate (Credits)</label>
                                            <input 
                                                type="number" 
                                                value={formData.hourlyRate || 0} 
                                                onChange={(e) => handleChange('hourlyRate', Number(e.target.value))}
                                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years)</label>
                                            <input 
                                                type="number" 
                                                value={formData.experienceYears || 0} 
                                                onChange={(e) => handleChange('experienceYears', Number(e.target.value))}
                                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {user.role === UserRole.PROVIDER && (
                        <>
                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <h4 className="font-bold text-slate-800 mb-3 text-sm">Provider Details</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Partner Level</label>
                                        <select 
                                            value={formData.levelId || ''} 
                                            onChange={(e) => handleChange('levelId', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        >
                                            <option value="">Select Level</option>
                                            {providerLevels.map(l => (
                                                <option key={l.id} value={l.id}>{l.name} ({l.commissionPercent}%)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Payout Method</label>
                                            <select 
                                                value={formData.payoutMethod || 'PayPal'} 
                                                onChange={(e) => handleChange('payoutMethod', e.target.value)}
                                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            >
                                                <option value="PayPal">PayPal</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                                <option value="Wise">Wise</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Referral Code</label>
                                            <input 
                                                type="text" 
                                                value={formData.refCode || ''} 
                                                onChange={(e) => handleChange('refCode', e.target.value)}
                                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-100">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
