'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: ReactNode }> = {
    success: {
        bg: 'bg-green-900/90',
        border: 'border-green-500/50',
        icon: <CheckCircle className="w-5 h-5 text-green-400" />,
    },
    error: {
        bg: 'bg-red-900/90',
        border: 'border-red-500/50',
        icon: <AlertCircle className="w-5 h-5 text-red-400" />,
    },
    warning: {
        bg: 'bg-yellow-900/90',
        border: 'border-yellow-500/50',
        icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    },
    info: {
        bg: 'bg-blue-900/90',
        border: 'border-blue-500/50',
        icon: <Info className="w-5 h-5 text-blue-400" />,
    },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const contextValue: ToastContextType = {
        toast: addToast,
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error', 6000),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence mode="sync">
                    {toasts.map((toast) => {
                        const style = toastStyles[toast.type];
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className={`${style.bg} ${style.border} border backdrop-blur-md rounded-xl px-4 py-3 shadow-xl pointer-events-auto flex items-start gap-3`}
                            >
                                {style.icon}
                                <p className="flex-1 text-sm text-white">{toast.message}</p>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="text-white/60 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export default ToastProvider;
