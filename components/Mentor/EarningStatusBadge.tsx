
import React from 'react';

interface EarningStatusBadgeProps {
    status: 'pending' | 'payable' | 'paid';
}

export const EarningStatusBadge: React.FC<EarningStatusBadgeProps> = ({ status }) => {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        payable: 'bg-green-100 text-green-800 border-green-200',
        paid: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    const labels = {
        pending: 'Pending',
        payable: 'Payable',
        paid: 'Paid Out'
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
            {labels[status]}
        </span>
    );
};
