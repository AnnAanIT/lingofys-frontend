
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Toast {
    id: string;
    title: string;
    description?: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

interface ToastContextType {
    toast: (props: Omit<Toast, 'id'>) => void;
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast: t, onRemove }) => {
    const [isExiting, setIsExiting] = React.useState(false);

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(t.id), 300);
    };

    React.useEffect(() => {
        if (t.duration) {
            const timer = setTimeout(handleRemove, t.duration);
            return () => clearTimeout(timer);
        }
    }, [t.duration, t.id]);

    const typeConfig = {
        success: {
            bgClass: 'bg-success-50 border-success-300',
            iconClass: 'text-success-600',
            titleClass: 'text-success-900',
            descClass: 'text-success-700',
            Icon: CheckCircle,
            progressClass: 'bg-success-500',
        },
        error: {
            bgClass: 'bg-danger-50 border-danger-300',
            iconClass: 'text-danger-600',
            titleClass: 'text-danger-900',
            descClass: 'text-danger-700',
            Icon: AlertCircle,
            progressClass: 'bg-danger-500',
        },
        warning: {
            bgClass: 'bg-warning-50 border-warning-300',
            iconClass: 'text-warning-600',
            titleClass: 'text-warning-900',
            descClass: 'text-warning-700',
            Icon: AlertTriangle,
            progressClass: 'bg-warning-500',
        },
        info: {
            bgClass: 'bg-blue-50 border-blue-300',
            iconClass: 'text-blue-600',
            titleClass: 'text-blue-900',
            descClass: 'text-blue-700',
            Icon: Info,
            progressClass: 'bg-blue-500',
        },
    };

    const config = typeConfig[t.type];
    const ToastIcon = config.Icon;

    return (
        <div
            className={`min-w-[320px] max-w-md rounded-xl border-2 shadow-soft-lg overflow-hidden ${
                isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
            } ${config.bgClass}`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start gap-3 p-4">
                <div className={`flex-shrink-0 ${config.iconClass}`}>
                    <ToastIcon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm ${config.titleClass}`}>{t.title}</h4>
                    {t.description && (
                        <p className={`text-xs mt-1 ${config.descClass}`}>{t.description}</p>
                    )}
                </div>

                <button
                    onClick={handleRemove}
                    className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Close notification"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Progress bar */}
            {t.duration && (
                <div className="h-1 bg-slate-200/50">
                    <div
                        className={`h-full ${config.progressClass} transition-all ease-linear`}
                        style={{
                            width: '100%',
                            animation: `shrink ${t.duration}ms linear forwards`,
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((props: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 11);
        const newToast = { id, duration: 5000, ...props };
        setToasts((prev) => [...prev, newToast]);
    }, []);

    const success = useCallback((title: string, description?: string) => {
        toast({ title, description, type: 'success' });
    }, [toast]);

    const error = useCallback((title: string, description?: string) => {
        toast({ title, description, type: 'error' });
    }, [toast]);

    const info = useCallback((title: string, description?: string) => {
        toast({ title, description, type: 'info' });
    }, [toast]);

    const warning = useCallback((title: string, description?: string) => {
        toast({ title, description, type: 'warning' });
    }, [toast]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast, success, error, info, warning }}>
            {children}
            <div className="fixed bottom-0 right-0 z-[9999] p-4 flex flex-col gap-3 pointer-events-none">
                <div className="flex flex-col gap-3 pointer-events-auto">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                @keyframes slide-out-right {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(calc(100% + 1rem));
                        opacity: 0;
                    }
                }
                .animate-slide-out-right {
                    animation: slide-out-right 0.3s ease-out forwards;
                }
            `}</style>
        </ToastContext.Provider>
    );
};

// Re-export Toast type for external use
export type { Toast };
