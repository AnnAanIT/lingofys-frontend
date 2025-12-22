
import React, { useState } from 'react';
import { useApp } from '../App';
import { api } from '../services/api';
import { AvatarUploader } from '../components/Profile/AvatarUploader';
import { ProfileForm } from '../components/Profile/ProfileForm';
import { translations } from '../lib/i18n';
import { User, Shield, LogOut } from 'lucide-react';

export default function MenteeProfile() {
    const { user, refreshUser, language, logout } = useApp();
    const t = translations[language].mentee;
    const nav = translations[language].nav;
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY'>('GENERAL');

    if (!user) return null;

    const handleAvatarUpload = async (newUrl: string) => {
        await api.updateUserProfile(user.id, { avatar: newUrl });
        refreshUser();
    };

    const renderSidebar = () => (
        <div className="space-y-1">
            <button
                onClick={() => setActiveTab('GENERAL')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'GENERAL' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <User size={18} />
                <span>{t.profile.generalInformation}</span>
            </button>
            <button
                onClick={() => setActiveTab('SECURITY')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'SECURITY' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <Shield size={18} />
                <span>{t.profile.security}</span>
            </button>

            <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
                >
                    <LogOut size={18} />
                    <span>{nav.signOut}</span>
                </button>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="animate-fade-in space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">{t.profile.changePassword}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.profile.currentPassword}</label>
                        <input type="password" placeholder="••••••••" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.profile.newPassword}</label>
                        <input type="password" placeholder="••••••••" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.profile.confirmNewPassword}</label>
                        <input type="password" placeholder="••••••••" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                </div>
            </div>
            <div className="flex justify-end">
                <button className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-slate-800">
                    {t.profile.updatePassword}
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-900">{t.profile.settings}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                        {renderSidebar()}
                    </div>
                </div>

                {/* Content */}
                <div className="md:col-span-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[500px]">
                        {activeTab === 'GENERAL' && (
                            <div className="animate-fade-in">
                                <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-100">
                                    <AvatarUploader 
                                        currentAvatar={user.avatar} 
                                        onUpload={handleAvatarUpload}
                                        size="lg"
                                    />
                                    <p className="text-sm text-slate-500 mt-4">{t.changeAvatar}</p>
                                </div>
                                <ProfileForm user={user} onSave={refreshUser} />
                            </div>
                        )}
                        {activeTab === 'SECURITY' && renderSecurity()}
                    </div>
                </div>
            </div>
        </div>
    );
}
