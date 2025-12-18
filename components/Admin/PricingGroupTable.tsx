
import React from 'react';
import { PricingGroup } from '../../types';
import { Edit2, Trash2 } from 'lucide-react';

interface PricingGroupTableProps {
    data: PricingGroup[];
    onEdit: (group: PricingGroup) => void;
    onDelete: (group: PricingGroup) => void;
}

export const PricingGroupTable: React.FC<PricingGroupTableProps> = ({ data, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Group Name</th>
                        <th className="px-6 py-4">Multiplier</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono font-medium text-slate-600">{item.id}</td>
                            <td className="px-6 py-4 text-slate-900 font-bold">{item.name}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    item.multiplier > 1 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                    x{item.multiplier.toFixed(2)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => onEdit(item)} 
                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => onDelete(item)} 
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No mentor groups configured.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
