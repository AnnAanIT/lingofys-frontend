
import React from 'react';
import { useApp } from '../App';
import { api } from '../services/api';
import { AvatarUploader } from '../components/Profile/AvatarUploader';
import { ProfileForm } from '../components/Profile/ProfileForm';
import { AdminLayout } from '../components/AdminComponents';

export default function AdminProfile() {
    const { user, refreshUser } = useApp();

    if (!user) return null;

    const handleAvatarUpload = async (newUrl: string) => {
        await api.updateUserProfile({ avatar: newUrl });
        refreshUser();
    };

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                <h1 className="text-3xl font-bold text-slate-900">Admin Profile</h1>
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-100">
                        <AvatarUploader 
                            currentAvatar={user.avatar} 
                            onUpload={handleAvatarUpload}
                            size="lg"
                        />
                    </div>

                    <ProfileForm user={user} onSave={refreshUser} />
                </div>
            </div>
        </AdminLayout>
    );
}
