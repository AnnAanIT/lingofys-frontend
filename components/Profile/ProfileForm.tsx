
import React, { useState } from 'react';
import { User, Mentor, Provider, UserRole } from '../../types';
import { api } from '../../services/api';
import { security } from '../../utils/security';
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
        // Only for mentees
        ...(user.role === 'MENTEE' && { language: (user as User).language || 'en' }),
        // Provider specific
        payoutDetails: (user as Provider).payoutDetails || '',
        // Mentor specific
        bio: (user as Mentor).bio || ''
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        // ✅ FIX SEC-2: Sanitize user input to prevent XSS
        const sanitizedValue = e.target.type === 'email' || e.target.type === 'select-one'
            ? e.target.value // Don't sanitize email and select values
            : security.sanitizeInput(e.target.value);

        setFormData({ ...formData, [e.target.name]: sanitizedValue });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // ✅ Additional sanitization before sending to API
            const sanitizedData = {
                ...formData,
                name: security.sanitizeInput(formData.name),
                phone: security.sanitizeInput(formData.phone),
                country: security.sanitizeInput(formData.country),
                bio: formData.bio ? security.sanitizeInput(formData.bio) : '',
                payoutDetails: formData.payoutDetails ? security.sanitizeInput(formData.payoutDetails) : ''
            };

            await api.updateUserProfile(user.id, sanitizedData);
            onSave();
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-base"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-base bg-slate-50"
                        readOnly
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                    <input 
                        type="text" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-base"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                    <input 
                        type="text" 
                        name="country" 
                        value={formData.country} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-base"
                    />
                </div>
                {user.role === 'MENTEE' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                    <select 
                        name="language" 
                        value={(formData as any).language || 'en'} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-base"
                    >
                        <option value="en">English (English)</option>
                        <option value="vi">Tiếng Việt (Vietnamese)</option>
                        <option value="zh">中文 (Chinese)</option>
                        <option value="ko">한국어 (Korean)</option>
                        <option value="ja">日本語 (Japanese)</option>
                    </select>
                </div>
                )}
            </div>

            {user.role === 'PROVIDER' && (
                <div className="pt-4 md:pt-4 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4">Payout Information</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Payment Details (PayPal/Bank)</label>
                        <input 
                            type="text" 
                            name="payoutDetails" 
                            value={formData.payoutDetails} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 md:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-base"
                        />
                    </div>
                </div>
            )}

            {user.role === 'MENTOR' && (
                <div className="pt-4 md:pt-4 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4">Quick Bio</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Short Headline (1-2 sentences)</label>
                        <input 
                            type="text" 
                            name="bio" 
                            value={formData.bio} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 md:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-base"
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3 pt-4">
                <button 
                    type="submit" 
                    disabled={saving}
                    className="flex items-center justify-center px-6 py-3 md:py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-lg shadow-brand-100 text-base md:text-sm"
                >
                    <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};
