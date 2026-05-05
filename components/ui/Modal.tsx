'use client';

import { ReactNode, useEffect } from 'react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  /** Masalan max-w-4xl — kengroq forma uchun */
  panelClassName?: string;
  /** Tasdiqlash tugmasi yuklanmoqda (async saqlash) */
  confirmLoading?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Save',
  cancelText = 'Cancel',
  panelClassName = 'max-w-lg',
  confirmLoading = false,
}: ModalProps) {
  useEffect(() => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-auto animate-slide-up ${panelClassName}`}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
        {onConfirm && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={confirmLoading}>
              {cancelText}
            </Button>
            <Button
              onClick={async () => {
                if (!onConfirm || confirmLoading) return;
                await Promise.resolve(onConfirm());
              }}
              isLoading={confirmLoading}
              disabled={confirmLoading}
            >
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}