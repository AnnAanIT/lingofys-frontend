
import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface EvidenceUploaderProps {
    onUpload: (filename: string) => void;
    currentFile?: string;
    required?: boolean;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ onUpload, currentFile, required }) => {
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState(currentFile || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // In a real app, this would upload to server and return a URL/path
            // api.uploadFile mock returns a simulated filename or blob url
            const result = await api.uploadFile(file); 
            // We'll use a mocked filename for the record
            const mockName = `proof_${Date.now()}_${file.name}`;
            setFileName(mockName);
            onUpload(mockName);
        } catch (error) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setFileName('');
        onUpload('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (fileName) {
        return (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate text-sm">{fileName}</div>
                        <div className="text-xs text-green-600 flex items-center">
                            <CheckCircle size={10} className="mr-1" /> Uploaded
                        </div>
                    </div>
                </div>
                <button 
                    type="button"
                    onClick={handleRemove}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${required ? 'border-orange-200 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-300' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'}`}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,application/pdf"
            />
            {uploading ? (
                <div className="flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-brand-600 mb-2" size={24} />
                    <span className="text-sm text-slate-500">Uploading...</span>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-slate-500">
                    <Upload className="mb-2 text-slate-400" size={24} />
                    <span className="text-sm font-medium text-slate-700">Click to upload proof</span>
                    <span className="text-xs text-slate-400 mt-1">PDF, JPG, PNG (Max 5MB)</span>
                </div>
            )}
        </div>
    );
};
