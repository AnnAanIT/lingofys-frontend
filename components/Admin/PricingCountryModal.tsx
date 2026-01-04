
import React, { useState, useEffect } from 'react';
import { X, Globe } from 'lucide-react';
import { PricingCountry } from '../../types';

interface PricingCountryModalProps {
    isOpen: boolean;
    onClose: () => void;
    country: PricingCountry | null;
    onSave: (data: any) => void;
}

export const PricingCountryModal: React.FC<PricingCountryModalProps> = ({ isOpen, onClose, country, onSave }) => {
    const [formData, setFormData] = useState({ id: '', name: '', multiplier: 1.0 });

    useEffect(() => {
        if (country) {
            setFormData({ ...country });
        } else {
            setFormData({ id: '', name: '', multiplier: 1.0 });
        }
    }, [country, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.id || formData.id.length < 2) {
            alert('Please enter a valid country code (min 2 characters)');
            return;
        }
        if (!formData.name || formData.name.length < 2) {
            alert('Please enter a valid country name');
            return;
        }
        if (formData.multiplier < 0.1 || formData.multiplier > 5.0) {
            alert('Multiplier must be between 0.1 and 5.0');
            return;
        }

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
                    <Globe size={20} className="text-brand-600" />
                    {country ? 'Edit Country Pricing' : 'Add Country Pricing'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Country Code (ISO)</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="e.g. VN, US, JP"
                            value={formData.id}
                            onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})}
                            disabled={!!country} // Cannot edit ID
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Country Name</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="e.g. Vietnam"
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
                            min="0.1"
                            max="5.0"
                            value={formData.multiplier}
                            onChange={e => setFormData({...formData, multiplier: Number(e.target.value)})}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">1.0 = Base Price. 0.9 = 10% Discount.</p>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg mt-2"
                    >
                        Save Configuration
                    </button>
                </form>
            </div>
        </div>
    );
};
