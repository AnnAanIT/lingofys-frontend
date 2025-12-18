
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AdminLayout, ConfirmDialog } from '../components/AdminComponents';
import { PricingCountryTable } from '../components/Admin/PricingCountryTable';
import { PricingCountryModal } from '../components/Admin/PricingCountryModal';
import { PricingCountry } from '../types';
import { Search, Plus, ArrowLeft } from 'lucide-react';

export default function AdminPricingCountries() {
    const navigate = useNavigate();
    const [countries, setCountries] = useState<PricingCountry[]>([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PricingCountry | null>(null);
    const [deletingItem, setDeletingItem] = useState<PricingCountry | null>(null);

    const loadData = async () => {
        const data = await api.getPricingCountries();
        setCountries(data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (data: PricingCountry) => {
        try {
            if (editingItem) {
                await api.updatePricingCountry(data.id, data);
            } else {
                await api.addPricingCountry(data);
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
            await api.deletePricingCountry(deletingItem.id);
            await loadData();
            setDeletingItem(null);
        }
    };

    const filtered = countries.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                <button onClick={() => navigate('/admin/pricing')} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft size={18} className="mr-2" /> Back to Pricing
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Country Multipliers</h1>
                        <p className="text-slate-500 mt-1">Set localized pricing rules.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search country..." 
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                            className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold flex items-center hover:bg-brand-700 shadow-sm"
                        >
                            <Plus size={18} className="mr-2" /> Add Country
                        </button>
                    </div>
                </div>

                <PricingCountryTable 
                    data={filtered} 
                    onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                    onDelete={(item) => setDeletingItem(item)}
                />

                <PricingCountryModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    country={editingItem}
                    onSave={handleSave}
                />

                <ConfirmDialog 
                    isOpen={!!deletingItem}
                    onClose={() => setDeletingItem(null)}
                    onConfirm={handleDelete}
                    title="Delete Country Pricing"
                    message={`Are you sure you want to remove pricing for ${deletingItem?.name}?`}
                />
            </div>
        </AdminLayout>
    );
}
