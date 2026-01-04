
import React, { useState } from 'react';
import { useApp } from '../App';
import { api } from '../services/api';
import { AvatarUploader } from '../components/Profile/AvatarUploader';
import { ProfileForm } from '../components/Profile/ProfileForm';
import { translations } from '../lib/i18n';
import { User, Shield, LogOut } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function MenteeProfile() {
    const { user, refreshUser, language, logout } = useApp();
    const { success, error: showError, warning } = useToast();
    const t = translations[language].mentee;
    const nav = translations[language].nav;
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY'>('GENERAL');
    
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    if (!user) return null;

    const handleAvatarUpload = async (newUrl: string) => {
        await api.updateUserProfile({ avatar: newUrl });
        refreshUser();
    };

    const handlePasswordChange = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            warning('Missing Fields', t.profile.allFieldsRequired || 'All fields are required');
            return;
        }

        if (newPassword.length < 6) {
            warning('Weak Password', t.profile.passwordTooShort || 'Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            warning('Mismatch', t.profile.passwordMismatch || 'Passwords do not match');
            return;
        }

        setPasswordLoading(true);
        try {
            await api.changePassword(currentPassword, newPassword);
            success('Password Changed', t.profile.passwordChanged || 'Your password has been updated successfully');
            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Password change error:', error);
            showError('Change Failed', error.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
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
                        <input 
                            type="password" 
                            autoComplete="current-password" 
                            placeholder="••••••••" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.profile.newPassword}</label>
                        <input 
                            type="password" 
                            autoComplete="new-password" 
                            placeholder="••••••••" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.profile.confirmNewPassword}</label>
                        <input 
                            type="password" 
                            autoComplete="new-password" 
                            placeholder="••••••••" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                        />
                    </div>
                </div>
            </div>
            <div className="flex justify-end">
                <button 
                    onClick={handlePasswordChange}
                    disabled={passwordLoading}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {passwordLoading && <span className="animate-spin">⏳</span>}
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
