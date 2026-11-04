import React from 'react';

export default function Footer() {
  return (
    <footer
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        padding: '16px 20px',
        fontSize: '0.75rem',
        color: 'var(--color-text-muted)',
        borderTop: '1px solid var(--border-glass)',
        background: 'rgba(7, 9, 14, 0.5)',
      }}
    >
      <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Rugby Orcos Negros 2026</span>
      <span>·</span>
      <span>Fuerza, Honor y Tercer Tiempo</span>
      <span>·</span>
      <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontFamily: 'Outfit' }}>Reino Manager v5.0</span>
    </footer>
  );
}
