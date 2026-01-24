
import React, { useState } from 'react';
import { User, Mentor, Provider, UserRole } from '../../types';
import { api } from '../../services/api';
import { security } from '../../utils/security';
import { Save } from 'lucide-react';
import { CountrySelector } from '../Admin/CountrySelector';
import { getTimezoneByCountry } from '../../lib/timeUtils';
import { useToast } from '../ui/Toast';

interface ProfileFormProps {
    user: User | Mentor | Provider;
    onSave: () => void;
    // Optional: custom update method for AdminUserDetail (updates specific user by ID)
    // If not provided, defaults to updateUserProfile (updates current logged-in user)
    updateMethod?: (data: Partial<User>) => Promise<void>;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave, updateMethod }) => {
    const { success, error } = useToast();

    // Debug: Log user.country on mount
    console.log('📋 [ProfileForm] Received user:', { id: user.id, name: user.name, country: user.country, timezone: user.timezone });

    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        country: user.country || '',
        timezone: user.timezone || '', // ✅ LESSON 8: Track timezone in state
        // Payment info for Provider and Mentor
        paymentMethod: (user as any).paymentMethod || 'Bank',
        paymentDetails: (user as any).paymentDetails || ''
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
        console.log('🚀 [ProfileForm] handleSubmit called!', { formData });
        setSaving(true);
        try {
            // ✅ LESSON 8: Use timezone from state (already calculated in onChange)
            const sanitizedData: any = {
                name: security.sanitizeInput(formData.name),
                email: formData.email, // Don't sanitize email
                country: security.sanitizeInput(formData.country),
                timezone: formData.timezone || getTimezoneByCountry(formData.country), // Use state first, fallback to calculation
                paymentMethod: formData.paymentMethod ? security.sanitizeInput(formData.paymentMethod) : '',
                paymentDetails: formData.paymentDetails ? security.sanitizeInput(formData.paymentDetails) : ''
            };
            
            console.log('💾 [ProfileForm] Saving profile...', { 
                rawCountry: formData.country,
                stateTimezone: formData.timezone,
                sanitizedCountry: sanitizedData.country,
                finalTimezone: sanitizedData.timezone 
            });

            // Use custom update method if provided (AdminUserDetail), otherwise updateUserProfile (AdminProfile)
            if (updateMethod) {
                await updateMethod(sanitizedData);
            } else {
                await api.updateUserProfile(sanitizedData);
            }
            success("Profile Updated", "Your changes have been saved successfully");
            onSave(); // Trigger reload
        } catch (err: any) {
            console.error('Profile update error:', err);
            error("Update Failed", err.message || "Failed to update profile");
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
            </div>
            
            {/* Country Selector - Hidden for Provider */}
            {user.role !== 'PROVIDER' && (
                <div>
                    <CountrySelector 
                        value={formData.country} 
                        onChange={(countryCode) => {
                            // ✅ LESSON 8: Update BOTH country AND timezone in state
                            const timezone = getTimezoneByCountry(countryCode);
                            setFormData({ ...formData, country: countryCode, timezone: timezone });
                            console.log(`🌍 Country changed to ${countryCode}, timezone auto-set to ${timezone}`);
                        }} 
                        label="Country"
                    />
                </div>
            )}

            {user.role === 'PROVIDER' && (
                <div className="pt-4 md:pt-4 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4">Payment Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                            <select 
                                name="paymentMethod" 
                                value={formData.paymentMethod} 
                                onChange={handleChange} 
                                className="w-full px-4 py-3 md:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-base"
                            >
                                <option value="Bank">Bank</option>
                                <option value="Paypay">Paypay</option>
                                <option value="Wise">Wise</option>
                                <option value="Momo">Momo</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Payment Details 
                                <span className="text-xs text-slate-500 ml-2">(Paypay email, Bank account, Momo number, etc.)</span>
                            </label>
                            <input 
                                type="text" 
                                name="paymentDetails" 
                                value={formData.paymentDetails} 
                                onChange={handleChange} 
                                placeholder="e.g., your-email@paypay.com"
                                className="w-full px-4 py-3 md:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-base"
                            />
                        </div>
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
