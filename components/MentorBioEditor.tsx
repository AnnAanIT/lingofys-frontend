
import React, { useState } from 'react';
import { Mentor } from '../types';
import { api } from '../services/api';
import { VideoUpload } from './Profile/VideoUpload';
import { Save, ArrowLeft, Globe, Edit3, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/Toast';

interface MentorBioEditorProps {
    mentor: Mentor;
    onSave: () => void;
    mode?: 'view' | 'edit'; // 'edit' = always editable (for mentor's own page), 'view' = view/edit toggle (for admin)
    showBackButton?: boolean; // Show back to profile button (for mentor's page)
}

// Available teaching languages for multi-select
const TEACHING_LANGUAGES = [
    { value: 'English', label: 'English 🇬🇧', flag: '🇬🇧' },
    { value: 'Chinese', label: 'Chinese 🇨🇳', flag: '🇨🇳' },
    { value: 'Japanese', label: 'Japanese 🇯🇵', flag: '🇯🇵' },
    { value: 'Korean', label: 'Korean 🇰🇷', flag: '🇰🇷' },
];

export const MentorBioEditor: React.FC<MentorBioEditorProps> = ({ mentor, onSave, mode = 'edit', showBackButton = true }) => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const [isEditing, setIsEditing] = useState(mode === 'edit'); // Internal edit state for view mode
    const [formData, setFormData] = useState({
        headline: mentor.headline || '',            // Short tagline (replaces "bio")
        aboutMe: mentor.aboutMe || '',              // Full story (replaces "bioLong")
        teachingLanguages: mentor.teachingLanguages || [],  // NEW: Multi-select
        experienceYears: mentor.experienceYears || 0,
        specialties: mentor.specialties.join(', '), // Comma separated for editing
        videoIntro: mentor.videoIntro || ''
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLanguageToggle = (language: string) => {
        setFormData(prev => ({
            ...prev,
            teachingLanguages: prev.teachingLanguages.includes(language)
                ? prev.teachingLanguages.filter(lang => lang !== language)
                : [...prev.teachingLanguages, language]
        }));
    };

    const handleVideoUpload = (filename: string) => {
        setFormData(prev => ({ ...prev, videoIntro: filename }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updatedUser = await api.updateMentorProfile(mentor.id, {
                headline: formData.headline,
                aboutMe: formData.aboutMe,
                teachingLanguages: formData.teachingLanguages,
                experienceYears: formData.experienceYears,
                videoIntro: formData.videoIntro,
                specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s)
            });
            // Backend now returns full User object with updated mentorProfile
            // Update App context immediately with the response
            if (mode === 'view') {
                setIsEditing(false); // Close edit mode
            }
            onSave();
            success("Profile Updated", "Your mentor profile has been saved");
        } catch (err: any) {
            showError("Update Failed", err.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    // VIEW MODE: Display formatted mentor profile with Edit button
    if (mode === 'view' && !isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Mentor Profile</h3>
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all font-medium"
                    >
                        <Edit3 size={16} /> Edit Profile
                    </button>
                </div>

                {/* Video Intro */}
                {formData.videoIntro && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Video size={16} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Intro Video</span>
                        </div>
                        <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                            <video src={formData.videoIntro} controls className="w-full h-full" />
                        </div>
                    </div>
                )}

                {/* Headline */}
                <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Headline</span>
                    <p className="text-lg font-semibold text-slate-900">{formData.headline || 'No headline set'}</p>
                </div>

                {/* About Me */}
                <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About Me</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{formData.aboutMe || 'No description set'}</p>
                </div>

                {/* Teaching Languages */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Globe size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Languages I Teach</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.teachingLanguages.length > 0 ? (
                            formData.teachingLanguages.map(lang => {
                                const langInfo = TEACHING_LANGUAGES.find(l => l.value === lang);
                                return (
                                    <span key={lang} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg font-medium text-sm">
                                        {langInfo?.flag} {lang}
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-slate-400 text-sm">No languages set</span>
                        )}
                    </div>
                </div>

                {/* Specialties & Experience */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specialties</span>
                        <p className="text-slate-700">{formData.specialties || 'No specialties set'}</p>
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Experience</span>
                        <p className="text-slate-700">{formData.experienceYears} years</p>
                    </div>
                </div>
            </div>
        );
    }

    // EDIT MODE: Show form
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {mode === 'edit' && showBackButton && (
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900">Edit Mentor Profile</h1>
                    <button 
                        onClick={() => navigate('/mentor/profile')}
                        className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center"
                    >
                        <ArrowLeft size={16} className="mr-1"/> Back
                    </button>
                </div>
            )}
            {mode === 'view' && (
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Edit Mentor Profile</h3>
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                    >
                        Cancel
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Intro Video Section */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Intro Video</h3>
                        <VideoUpload 
                            currentVideo={formData.videoIntro} 
                            onUpload={handleVideoUpload} 
                        />
                    </div>

                    {/* Headline (Short Tagline) - NEW NAME */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Headline <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            A short, catchy tagline (e.g., "Native English speaker with 10 years teaching experience")
                        </p>
                        <input 
                            type="text"
                            name="headline"
                            value={formData.headline}
                            onChange={handleChange}
                            maxLength={100}
                            required
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-700"
                            placeholder="Native English speaker specializing in IELTS"
                        />
                        <p className="text-xs text-slate-400 mt-1">{formData.headline.length}/100 characters</p>
                    </div>

                    {/* About Me (Full Bio) - NEW NAME */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            About Me <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            Tell your story: education, teaching approach, why students should choose you.
                        </p>
                        <textarea 
                            name="aboutMe"
                            value={formData.aboutMe}
                            onChange={handleChange}
                            rows={8}
                            required
                            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-700 leading-relaxed"
                            placeholder="Hello, my name is... I have been teaching for..."
                        />
                    </div>

                    {/* Teaching Languages - NEW FIELD */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            <Globe size={16} className="inline mr-1" />
                            Languages I Teach <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-slate-500 mb-3">
                            Select all languages you can teach. This helps students find you easier.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TEACHING_LANGUAGES.map(lang => (
                                <button
                                    key={lang.value}
                                    type="button"
                                    onClick={() => handleLanguageToggle(lang.value)}
                                    className={`
                                        p-3 rounded-xl border-2 font-medium text-sm transition-all
                                        ${formData.teachingLanguages.includes(lang.value)
                                            ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-md'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }
                                    `}
                                >
                                    <span className="text-lg mr-1">{lang.flag}</span>
                                    {lang.value}
                                </button>
                            ))}
                        </div>
                        {formData.teachingLanguages.length === 0 && (
                            <p className="text-xs text-red-500 mt-2">Please select at least one language</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Years of Experience</label>
                            <input 
                                type="number" 
                                name="experienceYears"
                                value={formData.experienceYears}
                                onChange={handleChange}
                                min={0}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Specialties (comma separated)</label>
                            <input 
                                type="text" 
                                name="specialties"
                                value={formData.specialties}
                                onChange={handleChange}
                                placeholder="IELTS, Business, Kids"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={saving || formData.teachingLanguages.length === 0}
                            className="flex items-center px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-lg shadow-brand-100"
                        >
                            <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
