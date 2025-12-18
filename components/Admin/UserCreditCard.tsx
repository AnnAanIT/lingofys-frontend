
import React, { useState } from 'react';
import { DollarSign, Edit } from 'lucide-react';
import { CreditAdjustmentModal } from './CreditAdjustmentModal';

interface UserCreditCardProps {
    userId: string;
    credit: number;
    onUpdate: () => void;
}

export const UserCreditCard: React.FC<UserCreditCardProps> = ({ userId, credit, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div>
                <h3 className="text-slate-500 font-medium text-sm mb-2 uppercase tracking-wide">Credit Balance</h3>
                <div className="flex items-center space-x-2">
                    <div className="text-4xl font-extrabold text-slate-900">{credit}</div>
                    <span className="text-slate-400 font-medium">Credits</span>
                </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                >
                    <Edit size={16} className="mr-2" /> Adjust Balance
                </button>
            </div>

            <CreditAdjustmentModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={userId}
                onSuccess={onUpdate}
                resourceName="Credit"
            />
        </div>
    );
};
