
import React from 'react';
import { Download } from 'lucide-react';
import { SystemLog } from '../../types';

interface LogDownloadButtonProps {
    logs: SystemLog[];
    format?: 'json' | 'txt';
}

export const LogDownloadButton: React.FC<LogDownloadButtonProps> = ({ logs, format = 'json' }) => {
    
    const handleDownload = () => {
        let content = '';
        let mimeType = '';
        let fileName = `system_logs_${new Date().toISOString().split('T')[0]}`;

        if (format === 'json') {
            content = JSON.stringify(logs, null, 2);
            mimeType = 'application/json';
            fileName += '.json';
        } else {
            content = logs.map(l => `[${new Date(l.ts).toISOString()}] [${l.lvl.toUpperCase()}] [${l.src}] ${l.msg}`).join('\n');
            mimeType = 'text/plain';
            fileName += '.txt';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <button 
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
        >
            <Download size={16} />
            <span>Download {format.toUpperCase()}</span>
        </button>
    );
};
