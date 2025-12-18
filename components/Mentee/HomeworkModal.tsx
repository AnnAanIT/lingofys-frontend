
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

    if (!isOpen) return null;

    const handleUpload = async () => {
        setLoading(true);
        try {
            await api.updateHomework(homework.id, {
                status: 'SUBMITTED',
                studentNote: note,
                studentSubmission: 'file_uploaded.pdf'
            });
            onRefresh();
            onClose();
        } catch (e) {
            alert("Submission Error");
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

                    {homework.status === 'PENDING' ? (
                        <div className="space-y-6">
                            <textarea 
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder={t.placeholder}
                                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none h-40 font-medium"
                            />
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                                <Upload className="mx-auto mb-2 text-slate-300 group-hover:text-brand-500 transition-colors" size={32} />
                                <p className="text-slate-400 font-bold">{t.dropzone}</p>
                            </div>
                            <button 
                                onClick={handleUpload}
                                disabled={loading}
                                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                                {t.submitNow}
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
