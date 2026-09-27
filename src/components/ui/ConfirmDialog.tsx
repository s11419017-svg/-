import React, { memo } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = memo(({
  isOpen,
  title,
  message,
  confirmLabel = '確定執行',
  cancelLabel = '取消',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const iconMap = {
    danger: <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
  };

  const btnColorMap = {
    danger: 'bg-[#9e2a2b] hover:bg-[#852324] text-white border border-[#852324] shadow-sm',
    warning: 'bg-[#b45309] hover:bg-[#92400e] text-white border border-[#92400e] shadow-sm',
    info: 'bg-[#0369a1] hover:bg-[#075985] text-white border border-[#075985] shadow-sm',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[var(--theme-card-bg,#fefdfa)] dark:bg-[#18181b] rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-300 dark:border-stone-800">
        <div className="p-5 flex items-start gap-4">
          <div className="p-2.5 bg-stone-100 dark:bg-stone-800/80 rounded-full shrink-0">{iconMap[variant]}</div>
          <div className="flex-1 space-y-1.5 pt-0.5">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-sans tracking-tight">{title}</h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">{message}</p>
          </div>
          <button
            onClick={onCancel}
            aria-label="關閉"
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3.5 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs font-bold rounded-md cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#9e2a2b] ${btnColorMap[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

