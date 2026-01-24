
import React, { useState } from 'react';
import { useApp } from '../App';
import { api } from '../services/api';
import { AvatarUploader } from '../components/Profile/AvatarUploader';
import { useNavigate } from 'react-router-dom';
import { Video, ChevronRight, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { Mentor } from '../types';
import { CountrySelector } from '../components/Admin/CountrySelector';
import { getTimezoneByCountry } from '../lib/timeUtils';
import { useToast } from '../components/ui/Toast';
import { security } from '../utils/security';

export default function MentorProfile() {
    const { user, refreshUser } = useApp();
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    const mentor = user as Mentor;

    // Unified form state for all profile fields
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        country: user?.country || '',
        timezone: user?.timezone || '',
        meetingLink: mentor?.meetingLink || '',
        meetingPlatform: mentor?.meetingPlatform || 'zoom'
    });
    const [saving, setSaving] = useState(false);

    if (!user) return null;

    const handleAvatarUpload = async (newUrl: string) => {
        await api.updateUserProfile({ avatar: newUrl });
        refreshUser();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const sanitizedValue = e.target.type === 'email' || e.target.type === 'select-one'
            ? e.target.value
            : security.sanitizeInput(e.target.value);
        setFormData({ ...formData, [e.target.name]: sanitizedValue });
    };

    const validateMeetingLink = (link: string): { valid: boolean; message: string } => {
        if (!link || link.trim().length === 0) {
            return { valid: false, message: 'Meeting link is required' };
        }
        if (!link.startsWith('https://')) {
            return { valid: false, message: 'Link must start with https://' };
        }
        const patterns = {
            zoom: /zoom\.us\/j\/\d+/,
            google_meet: /meet\.google\.com\/[a-z-]+/
        };
        const isValidFormat = Object.values(patterns).some(pattern => pattern.test(link));
        if (!isValidFormat) {
            return { valid: false, message: 'Link format not recognized. Please use Zoom or Google Meet format.' };
        }
        return { valid: true, message: 'Valid meeting link' };
    };

    const handleTestLink = () => {
        const validation = validateMeetingLink(formData.meetingLink);
        if (validation.valid) {
            window.open(formData.meetingLink, '_blank');
            success('Link Opened', 'Check if the meeting link works correctly');
        } else {
            showError('Invalid Link', validation.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate meeting link
        const meetingValidation = validateMeetingLink(formData.meetingLink);
        if (!meetingValidation.valid) {
            showError('Invalid Meeting Link', meetingValidation.message);
            return;
        }

        setSaving(true);
        try {
            // Call both APIs in parallel
            await Promise.all([
                // Update basic profile
                api.updateUserProfile({
                    name: security.sanitizeInput(formData.name),
                    email: formData.email,
                    country: security.sanitizeInput(formData.country),
                    timezone: formData.timezone || getTimezoneByCountry(formData.country)
                }),
                // Update mentor-specific fields
                api.updateMentorProfile(user.id, {
                    meetingLink: formData.meetingLink.trim(),
                    meetingPlatform: formData.meetingPlatform
                })
            ]);

            success('Profile Updated', 'All changes have been saved successfully');
            refreshUser();
        } catch (err: any) {
            console.error('Profile update error:', err);
            showError('Update Failed', err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const meetingValidation = validateMeetingLink(formData.meetingLink);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-900">Mentor Profile Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
                        <AvatarUploader
                            currentAvatar={user.avatar}
                            onUpload={handleAvatarUpload}
                            size="lg"
                        />
                        <h2 className="text-xl font-bold text-slate-900 mt-4">{user.name}</h2>
                        <p className="text-sm text-slate-500">{mentor.specialties?.join(' • ')}</p>
                    </div>

                    <div
                        onClick={() => navigate('/mentor/profile/bio')}
                        className="bg-brand-600 text-white rounded-2xl p-6 cursor-pointer hover:bg-brand-700 transition-colors shadow-lg shadow-brand-100 flex items-center justify-between group"
                    >
                        <div>
                            <div className="flex items-center mb-1">
                                <Video size={20} className="mr-2" />
                                <span className="font-bold">Edit Bio & Video</span>
                            </div>
                            <p className="text-brand-100 text-sm">Update your long bio, teaching style, and intro video.</p>
                        </div>
                        <ChevronRight className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

                {/* Right Column: Unified Profile Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
                        {/* Basic Information Section */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Basic Information</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div>
                                    <CountrySelector
                                        value={formData.country}
                                        onChange={(countryCode) => {
                                            const timezone = getTimezoneByCountry(countryCode);
                                            setFormData({ ...formData, country: countryCode, timezone });
                                        }}
                                        label="Country"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-200" />

                        {/* Meeting Settings Section */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Video size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Meeting Settings</h3>
                                    <p className="text-sm text-slate-500">Configure your video call link for lessons</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Platform Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Meeting Platform</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'zoom', label: 'Zoom' },
                                            { value: 'google_meet', label: 'Google Meet' }
                                        ].map(platform => (
                                            <label
                                                key={platform.value}
                                                className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                    formData.meetingPlatform === platform.value
                                                        ? 'border-brand-500 bg-brand-50'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="meetingPlatform"
                                                    value={platform.value}
                                                    checked={formData.meetingPlatform === platform.value}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                <span className="font-medium text-slate-700">{platform.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Meeting Link Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Your Meeting Link <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        name="meetingLink"
                                        value={formData.meetingLink}
                                        onChange={handleChange}
                                        placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:outline-none transition-colors"
                                    />
                                    {formData.meetingLink && (
                                        <div className={`mt-2 flex items-start gap-2 text-sm ${meetingValidation.valid ? 'text-green-600' : 'text-amber-600'}`}>
                                            {meetingValidation.valid ? (
                                                <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                            )}
                                            <span>{meetingValidation.message}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Test Link Button */}
                                <button
                                    type="button"
                                    onClick={handleTestLink}
                                    disabled={!meetingValidation.valid}
                                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Test Link
                                </button>

                                {/* Important Notice */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-amber-900">
                                            <p className="font-medium mb-1">Important Security Tips:</p>
                                            <ul className="list-disc list-inside space-y-1 text-amber-800">
                                                <li>This link will be shared with all your students</li>
                                                <li>Enable waiting room to control who joins</li>
                                                <li>Use your personal meeting room link for consistency</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Single Save Button */}
                        <div className="pt-4 border-t border-slate-200">
                            <button
                                type="submit"
                                disabled={saving || !meetingValidation.valid}
                                className="w-full md:w-auto flex items-center justify-center px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-lg shadow-brand-100"
                            >
                                <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save All Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
