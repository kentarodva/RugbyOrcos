import React from 'react';

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
};

const COLORS = {
  success: 'var(--color-primary)',
  error: 'var(--color-red)',
  warning: 'var(--color-gold)',
  info: 'var(--color-blue)'
};

function Toast({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '380px',
      pointerEvents: 'none'
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="animated-slide"
          onClick={() => removeToast(t.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-solid)',
            border: `1px solid ${COLORS[t.type] || COLORS.info}`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${COLORS[t.type] || COLORS.info}22`,
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
          }}
        >
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{ICONS[t.type] || ICONS.info}</span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export default Toast;
