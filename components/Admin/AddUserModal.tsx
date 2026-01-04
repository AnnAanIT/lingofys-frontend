
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { UserRole, PricingCountry } from '../../types';
import { api } from '../../services/api';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSave }) => {
    const [role, setRole] = useState<UserRole>(UserRole.MENTEE);
    const [countries, setCountries] = useState<PricingCountry[]>([]);
    const [error, setError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        country: '',
        password: '',
        payoutMethod: 'Bank',
        bio: ''
    });

    useEffect(() => {
        if (isOpen) {
            api.getPricingCountries().then(setCountries);
            setError('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await onSave({ ...formData, role });
            onClose();
            setFormData({ name: '', email: '', country: '', password: '', payoutMethod: 'Bank', bio: '' });
        } catch (err: any) {
            setError(err.message || 'Failed to create user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-slide-up relative overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Create New User</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                            <option value={UserRole.MENTEE}>Student</option>
                            <option value={UserRole.MENTOR}>Teacher</option>
                            <option value={UserRole.PROVIDER}>Provider</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} autoComplete="name" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} autoComplete="email" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                minLength={6}
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                            <select
                                name="country"
                                required
                                value={formData.country}
                                onChange={handleChange}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="">Select Country</option>
                                {countries.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {role === UserRole.MENTOR && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                                <textarea name="bio" rows={3} value={formData.bio} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                            </div>
                        </>
                    )}

                    {role === UserRole.PROVIDER && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payout Method</label>
                            <select name="payoutMethod" value={formData.payoutMethod} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                                <option value="Bank">Bank</option>
                                <option value="Paypay">Paypay</option>
                                <option value="Wise">Wise</option>
                                <option value="Momo">Momo</option>
                            </select>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating...' : 'Create User'}
                    </button>
                </form>
            </div>
        </div>
    );
};
