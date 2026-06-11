import React from 'react';
import { Icon } from './icons';
import { sanitizeAndFormatAI } from '../../engine/contentFilter';
import { CHAT_MODES } from '../../engine/aiConfig';
import { PROVIDERS } from '../../engine/multiProviderCoach';

export function ChatMessage({ msg }) {
  const getProviderBadge = (providerId) => {
    const p = PROVIDERS[providerId];
    if (!p) return null;
    return { icon: p.icon, name: p.name, color: 'var(--color-gold)' };
  };

  const pBadge = msg.provider ? getProviderBadge(msg.provider) : null;

  return (
    <div
      className="animated-fade"
      style={{
        display: 'flex',
        gap: '10px',
        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
      }}
    >
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-gold)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '0.8rem',
        flexShrink: 0,
        color: '#000',
        fontWeight: 800
      }}>
        {msg.role === 'user' ? <Icon name="user" size={16} /> : <Icon name="ai" size={16} />}
      </div>
      <div style={{
        padding: '12px 15px',
        borderRadius: 'var(--radius-md)',
        background: msg.isError ? 'rgba(255, 61, 0, 0.05)' : msg.role === 'user' ? 'rgba(0, 230, 118, 0.05)' : 'var(--bg-surface-solid)',
        border: '1px solid ' + (msg.isError ? 'var(--color-red)' : msg.role === 'user' ? 'rgba(0, 230, 118, 0.2)' : 'var(--border-glass)'),
        fontSize: '0.82rem',
        lineHeight: 1.6,
        color: msg.isError ? 'var(--color-red)' : 'var(--color-text)'
      }}>
        <span dangerouslySetInnerHTML={{ __html: sanitizeAndFormatAI(msg.text) }} />
        <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '6px', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{msg.mode ? CHAT_MODES[msg.mode]?.icon : ''} {pBadge ? pBadge.icon + ' ' + pBadge.name : ''}</span>
          <span>{new Date(msg.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}
