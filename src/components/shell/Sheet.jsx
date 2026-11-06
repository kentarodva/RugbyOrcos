import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Bottom sheet on phones, anchored panel on wider screens.
 * Closes on backdrop tap and Escape.
 */
export default function Sheet({ open, title, onClose, children, labelledBy }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          <span className="sheet-title">{title}</span>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/** One tappable row inside a Sheet. */
export function SheetItem({ icon: Icon, label, hint, onClick, active, tone, trailing }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`sheet-item${active ? ' is-active' : ''}${tone === 'danger' ? ' is-danger' : ''}`}
    >
      {Icon && (
        <span className="sheet-item-icon" aria-hidden="true">
          <Icon size={20} />
        </span>
      )}
      <span className="sheet-item-text">
        <span>{label}</span>
        {hint && <span className="sheet-item-hint">{hint}</span>}
      </span>
      {trailing}
    </button>
  );
}

export function SheetSection({ label, children }) {
  return (
    <div className="sheet-section">
      {label && <div className="sheet-section-label">{label}</div>}
      {children}
    </div>
  );
}
