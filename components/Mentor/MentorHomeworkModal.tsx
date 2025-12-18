
import React, { useState } from 'react';
import { X, CheckCircle, MessageSquare, FileText, Upload, Download, Star } from 'lucide-react';
import { Homework } from '../../types';
import { api } from '../../services/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    homework: Homework;
    onRefresh: () => void;
}

export const MentorHomeworkModal: React.FC<Props> = ({ isOpen, onClose, homework, onRefresh }) => {
    const [feedback, setFeedback] = useState(homework.mentorFeedback || '');
    const [grade, setGrade] = useState(homework.grade || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await api.updateHomework(homework.id, {
                status: 'REVIEWED',
                mentorFeedback: feedback,
                grade: grade
            });
            onRefresh();
            onClose();
        } catch (error) {
            alert("Error saving feedback.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up relative flex flex-col max-h-[90vh]">
                
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Review Assignment</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Student ID: {homework.menteeId}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 className="font-black text-slate-800 mb-2 text-xs uppercase tracking-widest">Assignment Topic</h3>
                        <p className="text-slate-900 font-bold">{homework.title}</p>
                        <p className="text-slate-500 text-sm mt-2">{homework.description}</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Student's Submission</h3>
                        {homework.status === 'PENDING' ? (
                            <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 italic">
                                Waiting for student to upload...
                            </div>
                        ) : (
                            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{homework.studentNote || 'No text content provided.'}</p>
                                {homework.studentSubmission && (
                                    <div className="mt-4 flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-200 w-fit">
                                        <FileText className="text-blue-600" size={18} />
                                        <span className="text-xs font-bold text-blue-700">{homework.studentSubmission}</span>
                                        <button className="p-1 hover:bg-slate-50 rounded"><Download size={14}/></button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {homework.status !== 'PENDING' && (
                        <div className="space-y-6 pt-6 border-t border-slate-100">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Your Feedback</label>
                                <textarea 
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Good job! You should focus more on..."
                                    className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm min-h-[120px]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Grade (A, B, C, D...)</label>
                                <div className="flex gap-2">
                                    {['A+', 'A', 'B', 'C', 'D'].map(g => (
                                        <button 
                                            key={g}
                                            onClick={() => setGrade(g)}
                                            className={`px-6 py-2 rounded-xl font-black transition-all ${grade === g ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                    <input 
                                        type="text" 
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value.toUpperCase())}
                                        placeholder="Custom"
                                        className="w-24 p-2 border border-slate-200 rounded-xl text-center font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {homework.status !== 'PENDING' && (
                    <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                        <button onClick={onClose} className="px-6 py-3 text-slate-400 font-black uppercase text-xs">Close</button>
                        <button 
                            onClick={handleSave}
                            disabled={isSubmitting || !feedback || !grade}
                            className="px-10 py-3 bg-brand-600 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-brand-700 shadow-xl disabled:opacity-30"
                        >
                            {isSubmitting ? 'Saving...' : 'Complete Review'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
