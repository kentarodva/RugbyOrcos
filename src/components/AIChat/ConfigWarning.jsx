import React from 'react';

export function ConfigWarning() {
  return (
    <div className="glass-panel" style={{
      padding: '15px 20px',
      borderLeft: '4px solid var(--color-gold)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <span style={{ fontSize: '1.3rem' }}>??</span>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Ningun proveedor IA configurado. Ve a <strong>Configuracion (??)</strong> y agrega al menos una API key (Groq, DeepSeek o Gemini).
      </p>
    </div>
  );
}
