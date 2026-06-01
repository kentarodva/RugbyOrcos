import React from 'react';

export default function NavBar({ onClick, open }) {
  return (
    <button
      onClick={onClick}
      className="btn-outline"
      title="Menu de navegacion"
      style={{
        padding: '8px 12px',
        fontSize: '1.2rem',
        lineHeight: 1,
        borderColor: open ? 'var(--color-primary)' : 'var(--border-glass)',
        background: open ? 'rgba(0, 230, 118, 0.05)' : 'transparent',
      }}
    >
      ☰
    </button>
  );
}
