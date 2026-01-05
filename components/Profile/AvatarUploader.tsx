
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
            console.log('Uploading file:', file.name, file.type, file.size);
            const url = await api.uploadFile(file, 'avatar');
            console.log('Upload successful, URL:', url);
            onUpload(url);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message || 'Unknown error'}`);
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
                    src={currentAvatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23e2e8f0" width="150" height="150"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="48" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E%3F%3C/text%3E%3C/svg%3E'} 
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
