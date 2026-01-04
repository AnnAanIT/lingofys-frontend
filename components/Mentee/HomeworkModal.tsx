
import React, { useState } from 'react';
import { X, Upload, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { Homework } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../App';
import { translations } from '../../lib/i18n';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    homework: Homework;
    onRefresh: () => void;
}

export const HomeworkModal: React.FC<Props> = ({ isOpen, onClose, homework, onRefresh }) => {
    const { language } = useApp();
    const t = translations[language].mentee.homeworkModal;
    const commonT = translations[language].common;
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadedFileUrl, setUploadedFileUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Upload to Supabase and get the URL
            const url = await api.uploadFile(file, 'homework');
            console.log('Homework file uploaded successfully, URL:', url);
            setUploadedFileUrl(url);
        } catch (error: any) {
            console.error('Homework upload error:', error);
            alert(`Upload failed: ${error.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!uploadedFileUrl) {
            alert('Please upload a file first');
            return;
        }

        setLoading(true);
        try {
            // Pass both file URL and note to API
            await api.submitHomework(homework.id, uploadedFileUrl, note);
            onRefresh();
            onClose();
            // Reset state
            setNote('');
            setUploadedFileUrl('');
        } catch (e: any) {
            alert(e.message || "Submission Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase">{homework.title}</h2>
                            <p className="text-slate-500 mt-2">{homework.description}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                    </div>

                    {!homework.submittedAt ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
                                <textarea 
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder={t.placeholder}
                                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none h-32 font-medium"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Upload File <span className="text-red-500">*</span></label>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.txt,.zip"
                                    className="hidden"
                                />
                                {!uploadedFileUrl ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="mx-auto mb-2 text-brand-500 animate-spin" size={32} />
                                                <p className="text-slate-600 font-bold">Uploading...</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mx-auto mb-2 text-slate-300 group-hover:text-brand-500 transition-colors" size={32} />
                                                <p className="text-slate-400 font-bold">{t.dropzone || 'Click to upload file'}</p>
                                                <p className="text-xs text-slate-400 mt-2">PDF, DOC, DOCX, TXT, ZIP</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="text-green-600" size={24} />
                                            <div>
                                                <p className="font-bold text-green-900">File uploaded successfully</p>
                                                <p className="text-xs text-green-700">Ready to submit</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setUploadedFileUrl('');
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleSubmit}
                                disabled={loading || !uploadedFileUrl}
                                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                                {t.submitNow || 'Submit Homework'}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-green-50 p-8 rounded-3xl text-center border border-green-100">
                            <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
                            <h3 className="text-xl font-bold text-green-900">{t.submittedTitle}</h3>
                            <p className="text-green-700 mt-2">{t.submittedDesc.replace('{date}', new Date().toLocaleDateString())}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
