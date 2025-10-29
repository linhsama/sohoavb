// app/components/Toast.tsx
'use client';

import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }
interface ToastContextType { addToast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextType | undefined>(undefined);
let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const addToast = (message: string, type: ToastType = 'info') => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {mounted && createPortal(
                <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
                    {toasts.map(t => (
                        <div key={t.id} className={`flex items-center gap-3 p-4 rounded-xl shadow-xl text-white font-medium animate-in slide-in-from-bottom ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
                            {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
                            {t.type === 'info' && <Info className="w-5 h-5" />}
                            <span>{t.message}</span>
                            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}