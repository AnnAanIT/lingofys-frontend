
import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    userName: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, onConfirm, userName }) => {
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(password);
        setPassword('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="text-orange-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h3>
                <p className="text-sm text-slate-500 mb-6">Enter a new password for <strong>{userName}</strong>.</p>
                
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        required
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none mb-4"
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700">
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
