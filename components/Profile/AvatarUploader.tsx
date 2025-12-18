
import React, { useState, useRef } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import { api } from '../../services/api';

interface AvatarUploaderProps {
    currentAvatar: string;
    onUpload: (newUrl: string) => void;
    size?: 'sm' | 'md' | 'lg';
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ currentAvatar, onUpload, size = 'md' }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Mock validation
        if (file.size > 2 * 1024 * 1024) {
            alert("File size too large (Max 2MB)");
            return;
        }

        setUploading(true);
        try {
            const url = await api.uploadFile(file);
            onUpload(url);
        } catch (error) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const sizeClasses = {
        sm: 'w-20 h-20',
        md: 'w-32 h-32',
        lg: 'w-48 h-48'
    };

    return (
        <div className="relative group inline-block">
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100`}>
                <img 
                    src={currentAvatar || 'https://via.placeholder.com/150'} 
                    alt="Avatar" 
                    className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-50' : 'group-hover:opacity-75'}`}
                />
                
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-brand-600" size={32} />
                    </div>
                )}

                <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Camera className="text-white" size={size === 'sm' ? 20 : 32} />
                </div>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
            />
        </div>
    );
};
