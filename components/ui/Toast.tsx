
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
    id: string;
    title: string;
    description?: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

interface ToastContextType {
    toast: (props: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((props: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { id, duration: 5000, ...props };
        setToasts((prev) => [...prev, newToast]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, newToast.duration);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
                {toasts.map((t) => (
                    <div 
                        key={t.id} 
                        className={`min-w-[300px] max-w-sm rounded-xl p-4 shadow-lg border flex items-start gap-3 animate-slide-up bg-white ${
                            t.type === 'success' ? 'border-green-200' :
                            t.type === 'error' ? 'border-red-200' :
                            'border-slate-200'
                        }`}
                    >
                        {t.type === 'success' && <CheckCircle size={20} className="text-green-600 mt-0.5" />}
                        {t.type === 'error' && <AlertCircle size={20} className="text-red-600 mt-0.5" />}
                        {t.type === 'info' && <Info size={20} className="text-blue-600 mt-0.5" />}
                        
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                            {t.description && <p className="text-slate-600 text-xs mt-1">{t.description}</p>}
                        </div>
                        
                        <button 
                            onClick={() => removeToast(t.id)} 
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
