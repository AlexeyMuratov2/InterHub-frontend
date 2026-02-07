import type { ReactNode } from 'react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional title id for aria-labelledby */
  titleId?: string;
  children: ReactNode;
  /** Width of the drawer panel (default 420px, use 520px or 600px for wide content) */
  width?: string | number;
}

/**
 * Drawer panel sliding from the right. Keeps list context visible.
 * Use for forms/configuration that need more space than a modal.
 */
export function Drawer({
  open,
  onClose,
  title,
  titleId = 'drawer-title',
  children,
  width = 480,
}: DrawerProps) {
  if (!open) return null;

  const widthValue = typeof width === 'number' ? `${width}px` : width;

  return (
    <div
      className="app-drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="app-drawer-panel"
        style={{ width: widthValue }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-drawer-header">
          <h3 id={titleId} className="app-drawer-title">
            {title}
          </h3>
          <button
            type="button"
            className="app-drawer-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="app-drawer-body">{children}</div>
      </div>
    </div>
  );
}
