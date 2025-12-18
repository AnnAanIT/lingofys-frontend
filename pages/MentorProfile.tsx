
import React from 'react';
import { useApp } from '../App';
import { api } from '../services/api';
import { AvatarUploader } from '../components/Profile/AvatarUploader';
import { ProfileForm } from '../components/Profile/ProfileForm';
import { useNavigate } from 'react-router-dom';
import { Video, FileText, ChevronRight } from 'lucide-react';
import { Mentor } from '../types';

export default function MentorProfile() {
    const { user, refreshUser } = useApp();
    const navigate = useNavigate();

    if (!user) return null;

    const handleAvatarUpload = async (newUrl: string) => {
        await api.updateUserProfile(user.id, { avatar: newUrl });
        refreshUser();
    };

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
                        <p className="text-sm text-slate-500">{(user as Mentor).specialties?.join(' • ')}</p>
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

                {/* Right Column: Basic Info Form */}
                <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Basic Information</h3>
                    <ProfileForm user={user} onSave={refreshUser} />
                </div>
            </div>
        </div>
    );
}
