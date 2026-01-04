
import React, { useState, useRef } from 'react';
import { Upload, X, FileVideo, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface VideoUploadProps {
    currentVideo?: string;
    onUpload: (filename: string) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ currentVideo, onUpload }) => {
    const [uploading, setUploading] = useState(false);
    const [videoName, setVideoName] = useState(currentVideo || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            alert("Video too large (Max 100MB)");
            return;
        }

        setUploading(true);
        try {
            // Upload file to Supabase and get back the URL
            const url = await api.uploadFile(file, 'media'); // Use media category for video files
            console.log('Video uploaded successfully, URL:', url);
            // Save the real URL to database
            setVideoName(url);
            onUpload(url);
        } catch (error: any) {
            console.error('Video upload error:', error);
            alert(`Video upload failed: ${error.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setVideoName('');
        onUpload('');
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-400 transition-colors bg-slate-50">
            {uploading ? (
                <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
                    <span className="text-sm text-slate-500">Uploading video...</span>
                </div>
            ) : videoName ? (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
                            <FileVideo size={24} />
                        </div>
                        <div className="text-left min-w-0">
                            <div className="font-medium text-slate-900 truncate max-w-[200px]">{videoName}</div>
                            <div className="text-xs text-green-600 flex items-center mt-0.5">
                                <CheckCircle size={10} className="mr-1" /> Uploaded successfully
                            </div>
                        </div>
                    </div>
                    <button onClick={handleRemove} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <div 
                    className="cursor-pointer py-4"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500">
                        <Upload size={24} />
                    </div>
                    <h4 className="font-bold text-slate-700">Upload Intro Video</h4>
                    <p className="text-xs text-slate-500 mt-1">MP4, WebM up to 100MB</p>
                </div>
            )}
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="video/mp4,video/webm,video/quicktime" 
                className="hidden" 
            />
        </div>
    );
};
