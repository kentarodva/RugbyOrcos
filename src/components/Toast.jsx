import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  return (
    <div className="toast-container" style={{
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
      <AnimatePresence>
      {toasts.map(t => (
        <motion.div
          key={t.id}
          onClick={() => removeToast(t.id)}
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
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
          }}
        >
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{ICONS[t.type] || ICONS.info}</span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
        </motion.div>
      ))}
      </AnimatePresence>
    </div>
  );
}

export default Toast;
