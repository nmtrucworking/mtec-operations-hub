import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  leaving?: boolean;
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
  const timersRef = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissToast = useCallback(
    (id: string) => {
      const timer = timersRef.current[id];
      if (timer) {
        window.clearTimeout(timer);
        delete timersRef.current[id];
      }

      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      window.setTimeout(() => {
        removeToast(id);
      }, 220);
    },
    [removeToast]
  );

  const addToast = useCallback(
    ({ type, title, message, duration = 6000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration, leaving: false }]);

      if (duration !== Infinity) {
        timersRef.current[id] = window.setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback((message: string, title?: string) => addToast({ type: 'success', message, title }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ type: 'error', message, title }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ type: 'warning', message, title }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ type: 'info', message, title }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
            {toasts.map((t) => (
              <ToastItem key={t.id} {...t} onRemove={() => dismissToast(t.id)} />
            ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

const ToastItem = ({ type, title, message, leaving, onRemove }: Toast & { onRemove: () => void }) => {
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
        'pointer-events-auto w-full rounded-lg border shadow-md bg-card',
        leaving
          ? 'animate-out slide-out-to-right-2 fade-out duration-200'
          : 'animate-in slide-in-from-right-2 fade-in duration-300',
        bgColors[type]
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={cn(
            'p-2 rounded-md shrink-0',
            type === 'success' && 'bg-success-bg',
            type === 'error' && 'bg-danger-bg',
            type === 'warning' && 'bg-warning-bg',
            type === 'info' && 'bg-brand-light'
          )}
        >
          {icons[type]}
        </div>

        <div className="min-w-0 flex-1">
          {title && <h5 className="text-sm font-semibold leading-5 text-primary truncate">{title}</h5>}
          <p className={cn('text-sm text-secondary leading-5 break-words', title ? 'mt-1' : '')}>{message}</p>
        </div>

        <button
          onClick={onRemove}
          className="shrink-0 rounded-lg p-1.5 text-secondary/70 hover:text-secondary hover:bg-secondary/10 transition-colors"
          aria-label="Đóng thông báo"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
