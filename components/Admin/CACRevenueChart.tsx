
import React from 'react';
import { CACTimeSeriesPoint } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CACRevenueChartProps {
    data: CACTimeSeriesPoint[];
}

export const CACRevenueChart: React.FC<CACRevenueChartProps> = ({ data }) => {
    if (data.length === 0) return <div className="h-80 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">No data available</div>;

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCac" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                        tick={{fontSize: 12, fill: '#64748b'}}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis 
                        tickFormatter={(val) => `$${val}`}
                        tick={{fontSize: 12, fill: '#64748b'}}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        formatter={(value: number) => [`$${value}`, '']}
                    />
                    <Legend />
                    <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Total Revenue" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                        strokeWidth={2}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="cac" 
                        name="Provider CAC" 
                        stroke="#ef4444" 
                        fillOpacity={1} 
                        fill="url(#colorCac)" 
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
