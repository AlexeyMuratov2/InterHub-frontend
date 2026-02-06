import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional title id for aria-labelledby */
  titleId?: string;
  children: ReactNode;
  /** 'form' – wider modal with form spacing */
  variant?: 'default' | 'form';
  /** Optional extra class for the modal box (e.g. academic-semester-modal) */
  modalClassName?: string;
}

export function Modal({
  open,
  onClose,
  title,
  titleId = 'modal-title',
  children,
  variant = 'default',
  modalClassName,
}: ModalProps) {
  if (!open) return null;

  const modalClass = [
    variant === 'form' ? 'department-modal department-modal--form' : 'department-modal',
    modalClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="department-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        <h3 id={titleId} className="department-modal-title">
          {title}
        </h3>
        <div className="department-modal-body">{children}</div>
      </div>
    </div>
  );
}
