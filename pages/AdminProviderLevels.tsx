
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout, ConfirmDialog } from '../components/AdminComponents';
import { ProviderLevel } from '../types';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';

export default function AdminProviderLevels() {
    const [levels, setLevels] = useState<ProviderLevel[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<ProviderLevel | null>(null);
    const [deletingLevel, setDeletingLevel] = useState<ProviderLevel | null>(null);
    const [form, setForm] = useState({ id: '', name: '', commissionPercent: 5 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await api.getProviderLevels();
        setLevels(data);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingLevel) {
                await api.updateProviderLevel(form.id, form);
            } else {
                await api.addProviderLevel(form);
            }
            await loadData();
            setIsModalOpen(false);
            setEditingLevel(null);
            setForm({ id: '', name: '', commissionPercent: 5 });
        } catch (err) {
            alert("Error saving level: " + err);
        }
    };

    const handleDelete = async () => {
        if (!deletingLevel) return;
        await api.deleteProviderLevel(deletingLevel.id);
        await loadData();
        setDeletingLevel(null);
    };

    const openEdit = (level: ProviderLevel) => {
        setEditingLevel(level);
        setForm(level);
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingLevel(null);
        setForm({ id: '', name: '', commissionPercent: 5 });
        setIsModalOpen(true);
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="text-brand-600" /> Provider Levels
                        </h1>
                        <p className="text-slate-500 mt-1">Manage Affiliate Tiers and Commission Rates.</p>
                    </div>
                    <button onClick={openAdd} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center hover:bg-slate-800">
                        <Plus size={18} className="mr-2" /> Add Level
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                            <tr>
                                <th className="px-6 py-4">Level ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Commission %</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {levels.map(lvl => (
                                <tr key={lvl.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono font-medium text-slate-600">{lvl.id}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{lvl.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                                            {lvl.commissionPercent}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(lvl)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => setDeletingLevel(lvl)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MODAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingLevel ? 'Edit Level' : 'Add Level'}</h3>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID</label>
                                    <input 
                                        type="text" 
                                        required 
                                        disabled={!!editingLevel}
                                        value={form.id}
                                        onChange={e => setForm({...form, id: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={form.name}
                                        onChange={e => setForm({...form, name: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commission %</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="0"
                                        max="100"
                                        value={form.commissionPercent}
                                        onChange={e => setForm({...form, commissionPercent: Number(e.target.value)})}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <ConfirmDialog 
                    isOpen={!!deletingLevel}
                    onClose={() => setDeletingLevel(null)}
                    onConfirm={handleDelete}
                    title="Delete Level"
                    message={`Are you sure you want to delete ${deletingLevel?.name}?`}
                />
            </div>
        </AdminLayout>
    );
}
