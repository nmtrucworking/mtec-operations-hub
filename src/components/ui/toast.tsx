import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 5000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration !== Infinity) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => addToast({ type: 'success', message, title }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ type: 'error', message, title }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ type: 'warning', message, title }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ type: 'info', message, title }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" />
          <div className="flex flex-col gap-4 w-full max-w-md pointer-events-none z-10">
            {toasts.map((t) => (
              <ToastItem key={t.id} {...t} onRemove={() => removeToast(t.id)} />
            ))}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

const ToastItem = ({ type, title, message, onRemove }: Toast & { onRemove: () => void }) => {
  const icons = {
    success: <CheckCircle2 className="h-6 w-6 text-success-text" />,
    error: <AlertCircle className="h-6 w-6 text-danger-text" />,
    warning: <AlertTriangle className="h-6 w-6 text-warning-text" />,
    info: <Info className="h-6 w-6 text-brand-blue" />,
  };

  const bgColors = {
    success: 'bg-card border-success-border/50',
    error: 'bg-card border-danger-border/50',
    warning: 'bg-card border-warning-border/50',
    info: 'bg-card border-brand-blue/30',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full flex-col items-center text-center gap-3 rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-300 relative bg-card',
        bgColors[type]
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "p-3 rounded-full",
          type === 'success' && "bg-success-bg",
          type === 'error' && "bg-danger-bg",
          type === 'warning' && "bg-warning-bg",
          type === 'info' && "bg-brand-light",
        )}>
          {icons[type]}
        </div>
        <div className="space-y-2">
          {title && <h5 className="text-lg font-bold leading-none tracking-tight text-primary">{title}</h5>}
          <p className="text-sm text-secondary leading-relaxed font-medium">{message}</p>
        </div>
      </div>
      
      <div className="mt-4 w-full">
        <button
          onClick={onRemove}
          className="w-full py-2 px-4 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-primary font-semibold text-sm transition-all active:scale-95"
        >
          Đóng
        </button>
      </div>

      <button
        onClick={onRemove}
        className="absolute top-4 right-4 rounded-lg p-1 text-secondary opacity-50 hover:opacity-100 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  );
};
