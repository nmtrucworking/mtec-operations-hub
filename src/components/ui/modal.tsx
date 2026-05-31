import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, className }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={cn(
        "bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] shadow-lg overflow-hidden flex flex-col relative animate-in zoom-in-95 slide-in-from-bottom-2 duration-200", 
        className
      )}>
        <div className="flex justify-between items-center p-4 border-b border-border bg-card">
          <h3 className="font-semibold text-base text-primary">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-brand-light transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 bg-background border-t border-border flex flex-col-reverse sm:flex-row justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
