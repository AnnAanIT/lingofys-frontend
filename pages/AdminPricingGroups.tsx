
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AdminLayout, ConfirmDialog } from '../components/AdminComponents';
import { PricingGroupTable } from '../components/Admin/PricingGroupTable';
import { PricingGroupModal } from '../components/Admin/PricingGroupModal';
import { PricingGroup } from '../types';
import { Search, Plus, ArrowLeft } from 'lucide-react';

export default function AdminPricingGroups() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<PricingGroup[]>([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PricingGroup | null>(null);
    const [deletingItem, setDeletingItem] = useState<PricingGroup | null>(null);

    const loadData = async () => {
        const data = await api.getPricingGroups();
        setGroups(data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (data: PricingGroup) => {
        try {
            if (editingItem) {
                await api.updatePricingGroup(data.id, data);
            } else {
                await api.addPricingGroup(data);
            }
            await loadData();
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (error: any) {
            alert(error);
        }
    };

    const handleDelete = async () => {
        if (deletingItem) {
            await api.deletePricingGroup(deletingItem.id);
            await loadData();
            setDeletingItem(null);
        }
    };

    const filtered = groups.filter(g => 
        g.name.toLowerCase().includes(search.toLowerCase()) || 
        g.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                <button onClick={() => navigate('/admin/pricing')} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft size={18} className="mr-2" /> Back to Pricing
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Mentor Groups</h1>
                        <p className="text-slate-500 mt-1">Define pricing tiers for mentors.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search groups..." 
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold flex items-center hover:bg-purple-700 shadow-sm"
                        >
                            <Plus size={18} className="mr-2" /> Add Group
                        </button>
                    </div>
                </div>

                <PricingGroupTable 
                    data={filtered} 
                    onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                    onDelete={(item) => setDeletingItem(item)}
                />

                <PricingGroupModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    group={editingItem}
                    onSave={handleSave}
                />

                <ConfirmDialog 
                    isOpen={!!deletingItem}
                    onClose={() => setDeletingItem(null)}
                    onConfirm={handleDelete}
                    title="Delete Pricing Group"
                    message={`Are you sure you want to remove the ${deletingItem?.name} group?`}
                />
            </div>
        </AdminLayout>
    );
}
