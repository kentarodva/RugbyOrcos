import React from 'react';
import { Menu, X } from 'lucide-react';

export default function NavBar({ onClick, open }) {
  return (
    <button
      onClick={onClick}
      className="btn-outline"
      aria-label="Menú de navegación"
      title="Menú de navegación"
      style={{
        width: '40px',
        height: '40px',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        borderColor: open ? 'var(--color-primary)' : 'var(--border-glass)',
        background: open ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 255, 255, 0.03)',
        color: open ? 'var(--color-primary)' : 'var(--color-text)',
      }}
    >
      {open ? <X size={20} /> : <Menu size={20} />}
    </button>
  );
}
