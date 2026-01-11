import React, { useState } from 'react';
import { Video, CheckCircle, AlertTriangle } from 'lucide-react';
import { Mentor } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';

interface MeetingSettingsCardProps {
    user: Mentor;
    onSave: () => void;
}

export const MeetingSettingsCard: React.FC<MeetingSettingsCardProps> = ({ user, onSave }) => {
    const { success, error: showError } = useToast();
    const [meetingLink, setMeetingLink] = useState(user.meetingLink || '');
    const [meetingPlatform, setMeetingPlatform] = useState(user.meetingPlatform || 'zoom');
    const [saving, setSaving] = useState(false);
    const [validating, setValidating] = useState(false);

    const validateLink = (link: string): { valid: boolean; message: string } => {
        if (!link || link.trim().length === 0) {
            return { valid: false, message: 'Meeting link is required' };
        }

        if (!link.startsWith('https://')) {
            return { valid: false, message: 'Link must start with https://' };
        }

        // Check common patterns
        const patterns = {
            zoom: /zoom\.us\/j\/\d+/,
            google_meet: /meet\.google\.com\/[a-z-]+/
        };

        const isValidFormat = Object.values(patterns).some(pattern => pattern.test(link));

        if (!isValidFormat) {
            return {
                valid: false,
                message: 'Link format not recognized. Please use Zoom or Google Meet format.'
            };
        }

        return { valid: true, message: 'Valid meeting link' };
    };

    const handleTestLink = () => {
        const validation = validateLink(meetingLink);
        if (validation.valid) {
            window.open(meetingLink, '_blank');
            success('Link Opened', 'Check if the meeting link works correctly');
        } else {
            showError('Invalid Link', validation.message);
        }
    };

    const handleSave = async () => {
        const validation = validateLink(meetingLink);
        if (!validation.valid) {
            showError('Invalid Link', validation.message);
            return;
        }

        setSaving(true);
        try {
            await api.updateMentorProfile(user.id, {
                meetingLink: meetingLink.trim(),
                meetingPlatform
            });
            success('Meeting Settings Saved', 'Your meeting link has been updated');
            onSave();
        } catch (err: any) {
            showError('Save Failed', err.message || 'Failed to update meeting settings');
        } finally {
            setSaving(false);
        }
    };

    const validation = validateLink(meetingLink);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Video size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Meeting Settings</h3>
                    <p className="text-sm text-slate-500">Configure your video call link for lessons</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Platform Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        Meeting Platform
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: 'zoom', label: 'Zoom' },
                            { value: 'google_meet', label: 'Google Meet' }
                        ].map(platform => (
                            <label
                                key={platform.value}
                                className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    meetingPlatform === platform.value
                                        ? 'border-brand-500 bg-brand-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="platform"
                                    value={platform.value}
                                    checked={meetingPlatform === platform.value}
                                    onChange={(e) => setMeetingPlatform(e.target.value)}
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
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="https://zoom.us/j/123456789 hoặc https://meet.google.com/abc-defg-hij"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:outline-none transition-colors"
                    />
                    {meetingLink && (
                        <div className={`mt-2 flex items-start gap-2 text-sm ${validation.valid ? 'text-green-600' : 'text-amber-600'}`}>
                            {validation.valid ? (
                                <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                            ) : (
                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                            )}
                            <span>{validation.message}</span>
                        </div>
                    )}
                </div>

                {/* Important Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                            <p className="font-medium mb-1">Important Security Tips:</p>
                            <ul className="list-disc list-inside space-y-1 text-amber-800">
                                <li>This link will be shared with all your students</li>
                                <li>Enable waiting room to control who joins</li>
                                <li>Set a password for extra security (optional)</li>
                                <li>Use your personal meeting room link for consistency</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleTestLink}
                        disabled={!validation.valid}
                        className="px-6 py-3 rounded-xl border-2 border-slate-300 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Test Link
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!validation.valid || saving}
                        className="flex-1 px-6 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Meeting Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};
