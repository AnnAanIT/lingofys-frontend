
import React, { useState } from 'react';
import { Mentor } from '../types';
import { api } from '../services/api';
import { VideoUpload } from './Profile/VideoUpload';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MentorBioEditorProps {
    mentor: Mentor;
    onSave: () => void;
}

export const MentorBioEditor: React.FC<MentorBioEditorProps> = ({ mentor, onSave }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        bioLong: mentor.bioLong || '',
        teachingStyle: mentor.teachingStyle || '',
        experienceYears: mentor.experienceYears || 0,
        specialties: mentor.specialties.join(', '), // Comma separated for editing
        videoIntro: mentor.videoIntro || ''
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVideoUpload = (filename: string) => {
        setFormData(prev => ({ ...prev, videoIntro: filename }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.updateUserProfile(mentor.id, {
                ...formData,
                specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s)
            });
            onSave();
            alert("Bio updated successfully!");
        } catch (error) {
            alert("Failed to update bio.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Edit Mentor Bio</h1>
                <button 
                    onClick={() => navigate('/mentor/profile')}
                    className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center"
                >
                    <ArrowLeft size={16} className="mr-1"/> Back
                </button>
            </div>

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

                    {/* Long Bio */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Long Bio (About Me)</label>
                        <p className="text-xs text-slate-500 mb-2">Share your story, education, and why students should choose you.</p>
                        <textarea 
                            name="bioLong"
                            value={formData.bioLong}
                            onChange={handleChange}
                            rows={6}
                            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-700 leading-relaxed"
                            placeholder="Hello, my name is..."
                        />
                    </div>

                    {/* Teaching Style */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Teaching Style</label>
                        <textarea 
                            name="teachingStyle"
                            value={formData.teachingStyle}
                            onChange={handleChange}
                            rows={4}
                            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="I focus on conversation..."
                        />
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
                            disabled={saving}
                            className="flex items-center px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-lg shadow-brand-100"
                        >
                            <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save Bio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
