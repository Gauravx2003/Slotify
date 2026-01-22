import { Fragment, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className={cn(
                'w-full bg-white rounded-2xl shadow-2xl overflow-hidden',
                sizeClasses[size]
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between p-6 border-b border-surface-100">
                  <div>
                    {title && (
                      <h2 className="text-xl font-bold text-surface-900">{title}</h2>
                    )}
                    {description && (
                      <p className="text-sm text-surface-500 mt-1">{description}</p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-surface-600 transition-colors -mt-1 -mr-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">{children}</div>
            </div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}

// Confirm Modal for delete/deactivate/confirm actions
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary' | 'success';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };

  const bgStyles = {
    danger: 'bg-red-100',
    warning: 'bg-amber-100',
    info: 'bg-blue-100',
    primary: 'bg-primary-100',
    success: 'bg-green-100',
  };

  const iconStyles = {
    danger: 'text-red-600',
    warning: 'text-amber-600',
    info: 'text-blue-600',
    primary: 'text-primary-600',
    success: 'text-green-600',
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <X className={cn("w-7 h-7", iconStyles[variant])} />;
      case 'warning':
        return <AlertTriangle className={cn("w-7 h-7", iconStyles[variant])} />;
      case 'success':
      case 'primary':
        return <CheckCircle className={cn("w-7 h-7", iconStyles[variant])} />;
      case 'info':
      default:
        return <Info className={cn("w-7 h-7", iconStyles[variant])} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className={cn(
          "w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center",
          bgStyles[variant]
        )}>
          {getIcon()}
        </div>
        <h3 className="text-lg font-bold text-surface-900 mb-2">{title}</h3>
        <p className="text-surface-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 border border-surface-200 rounded-xl font-medium text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2",
              variantStyles[variant]
            )}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default Modal;

