import type { ReactNode } from 'react';

export type ConfirmModalVariant = 'primary' | 'danger';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel: string;
  confirmLabel: string;
  confirmDisabled?: boolean;
  confirmVariant?: ConfirmModalVariant;
}

export function ConfirmModal({
  open,
  title,
  message,
  children,
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
  confirmDisabled = false,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="department-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div className="department-modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-modal-title">{title}</h3>
        {children ?? (message != null ? <p>{message}</p> : null)}
        <div className="department-modal-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-delete"
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
