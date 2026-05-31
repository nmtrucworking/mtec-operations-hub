import React from 'react';
import { Modal } from './modal';
import { Button } from './button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 pt-2">
        <div className="text-sm text-secondary-foreground p-2">
          {message}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button variant="outline" className="rounded-md" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            disabled={isLoading}
            className={`rounded-md shadow-none border-0 text-primary-foreground flex items-center ${
              isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
            }`}
            onClick={() => {
              onConfirm();
              // Do not automatically close if isLoading is managed externally, 
              // the parent will close it when done. If we close immediately, 
              // the user won't see the loading state.
              if (isLoading === false || isLoading === undefined) {
                onClose();
              }
            }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
