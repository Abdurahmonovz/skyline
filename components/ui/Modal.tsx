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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-auto animate-slide-up ${panelClassName}`}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 pl-4 pr-12 sm:px-6 py-3 sm:py-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="absolute top-3.5 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
        {onConfirm && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3 sm:px-6 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button variant="ghost" onClick={onClose} disabled={confirmLoading} className="w-full sm:w-auto">
              {cancelText}
            </Button>
            <Button
              onClick={async () => {
                if (!onConfirm || confirmLoading) return;
                await Promise.resolve(onConfirm());
              }}
              isLoading={confirmLoading}
              disabled={confirmLoading}
              className="w-full sm:w-auto"
            >
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}