
import React, { useState, useEffect } from 'react';
import { User, Mentor, Provider, UserRole, PricingCountry, ProviderLevel } from '../../types';
import { api } from '../../services/api';
import { X, Globe } from 'lucide-react';

// Available teaching languages for multi-select (matching MentorBioEditor)
const TEACHING_LANGUAGES = [
    { value: 'English', label: 'English 🇬🇧', flag: '🇬🇧' },
    { value: 'Chinese', label: 'Chinese 🇨🇳', flag: '🇨🇳' },
    { value: 'Japanese', label: 'Japanese 🇯🇵', flag: '🇯🇵' },
    { value: 'Korean', label: 'Korean 🇰🇷', flag: '🇰🇷' },
];

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
    const [providerProfile, setProviderProfile] = useState<any>(null);

    useEffect(() => {
        if (user) {
            setFormData({ 
                ...user,
                specialties: (user as any).specialties ? (user as any).specialties.join(', ') : '',
                teachingLanguages: (user as any).teachingLanguages || []
            });
            
            // Load provider profile if user is provider
            if (user.role === UserRole.PROVIDER) {
                api.getProviderProfile(user.id).then((provider: any) => {
                    if (provider?.providerProfile) {
                        setProviderProfile(provider.providerProfile);
                        setFormData((prev: any) => ({
                            ...prev,
                            levelId: provider.providerProfile?.levelId,
                            referralCode: provider.providerProfile?.referralCode
                        }));
                    }
                }).catch(() => {
                    // Provider profile not found, continue with empty
                });
            }
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
        
        // Process Mentor fields
        if (user.role === UserRole.MENTOR) {
            // Split comma-separated specialties into array
            finalData.specialties = formData.specialties
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s !== '');
            
            // Ensure teachingLanguages is array (already is from button clicks)
            finalData.teachingLanguages = formData.teachingLanguages || [];
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
                
                <h3 className="text-xl font-bold text-slate-900 mb-6">Edit {user.role === 'MENTEE' ? 'Student' : user.role === 'MENTOR' ? 'Teacher' : user.role} Profile</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                                autoComplete="name"
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
                                autoComplete="email"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
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
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {user.role === UserRole.MENTOR && (
                        <>
                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <h4 className="font-bold text-slate-800 mb-3 text-sm">
                                    Mentor Profile (Admin has FULL edit permissions)
                                </h4>
                                <div className="space-y-4">
                                    {/* Headline (Short Tagline) */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Headline <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text"
                                            value={formData.headline || ''}
                                            onChange={(e) => handleChange('headline', e.target.value)}
                                            maxLength={100}
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="Native English speaker with 10 years experience"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Short, catchy tagline</p>
                                    </div>

                                    {/* About Me (Full Bio) */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            About Me <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={6}
                                            value={formData.aboutMe || ''}
                                            onChange={(e) => handleChange('aboutMe', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="Full story: education, teaching approach, why students should choose..."
                                        />
                                    </div>

                                    {/* Teaching Languages - Multi-select */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            <Globe size={14} className="inline mr-1" />
                                            Languages Taught <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {TEACHING_LANGUAGES.map(lang => (
                                                <button
                                                    key={lang.value}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = formData.teachingLanguages || [];
                                                        const updated = current.includes(lang.value)
                                                            ? current.filter((l: string) => l !== lang.value)
                                                            : [...current, lang.value];
                                                        handleChange('teachingLanguages', updated);
                                                    }}
                                                    className={`
                                                        px-2 py-1.5 rounded-lg border text-xs font-medium transition-all
                                                        ${(formData.teachingLanguages || []).includes(lang.value)
                                                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                        }
                                                    `}
                                                >
                                                    {lang.flag} {lang.value}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Specialties */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Specialties (comma separated)</label>
                                        <input 
                                            type="text"
                                            value={formData.specialties || ''} 
                                            onChange={(e) => handleChange('specialties', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="IELTS, Business, Kids..."
                                        />
                                    </div>

                                    {/* Experience Years */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years)</label>
                                        <input 
                                            type="number" 
                                            value={formData.experienceYears || 0} 
                                            onChange={(e) => handleChange('experienceYears', Number(e.target.value))}
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        />
                                    </div>

                                    {/* Video Intro URL */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Video Intro (filename)</label>
                                        <input 
                                            type="text"
                                            value={formData.videoIntro || ''}
                                            onChange={(e) => handleChange('videoIntro', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="video-123.mp4"
                                        />
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
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Referral Code</label>
                                        <input 
                                            type="text" 
                                            value={formData.referralCode || ''} 
                                            onChange={(e) => handleChange('referralCode', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50"
                                        />
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
