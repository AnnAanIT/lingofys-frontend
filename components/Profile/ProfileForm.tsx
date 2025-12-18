
import React, { useState } from 'react';
import { User, Mentor, Provider } from '../../types';
import { api } from '../../services/api';
import { Save } from 'lucide-react';

interface ProfileFormProps {
    user: User | Mentor | Provider;
    onSave: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        country: user.country || '',
        // Provider specific
        payoutDetails: (user as Provider).payoutDetails || '',
        // Mentor specific
        bio: (user as Mentor).bio || ''
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.updateUserProfile(user.id, formData);
            onSave();
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50"
                        readOnly // Prevent email change for simplicity in demo
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input 
                        type="text" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                    <input 
                        type="text" 
                        name="country" 
                        value={formData.country} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                </div>
            </div>

            {user.role === 'PROVIDER' && (
                <div className="pt-4 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4">Payout Information</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Details (PayPal/Bank)</label>
                        <input 
                            type="text" 
                            name="payoutDetails" 
                            value={formData.payoutDetails} 
                            onChange={handleChange} 
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                    </div>
                </div>
            )}

            {user.role === 'MENTOR' && (
                <div className="pt-4 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4">Quick Bio</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Short Headline (1-2 sentences)</label>
                        <input 
                            type="text" 
                            name="bio" 
                            value={formData.bio} 
                            onChange={handleChange} 
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button 
                    type="submit" 
                    disabled={saving}
                    className="flex items-center px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-lg shadow-brand-100"
                >
                    <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};
