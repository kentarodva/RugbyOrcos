import React from 'react';
import { Icon } from './icons';

export function ConfigWarning() {
  return (
    <div className="glass-panel" style={{
      padding: '15px 20px',
      borderLeft: '4px solid var(--color-gold)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <Icon name="warning" size={20} style={{ flexShrink: 0, color: 'var(--color-gold)' }} />
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Ningun proveedor IA configurado. Ve a <strong>Configuracion (<Icon name="gear" size={14} />)</strong> y agrega al menos una API key (Groq, DeepSeek o Gemini).
      </p>
    </div>
  );
}
