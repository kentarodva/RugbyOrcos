import React from 'react';
import { Icon } from './icons';
import { sanitizeAndFormatAI } from '../../engine/contentFilter';
import { PROVIDERS } from '../../engine/multiProviderCoach';

export function StreamingMessage({ streamingText, streamingProvider }) {
  const getProviderBadge = (providerId) => {
    const p = PROVIDERS[providerId];
    if (!p) return null;
    return { icon: p.icon, name: p.name };
  };

  const badge = streamingProvider ? getProviderBadge(streamingProvider) : null;

  return (
    <div className="animated-fade" style={{
      display: 'flex',
      gap: '10px',
      alignSelf: 'flex-start',
      maxWidth: '85%'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'var(--color-gold)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '0.8rem',
        flexShrink: 0,
        color: '#000',
        fontWeight: 800
      }}>
        <Icon name="ai" size={16} />
      </div>
      <div style={{
        padding: '12px 15px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface-solid)',
        border: '1px solid var(--border-glass)',
        fontSize: '0.82rem',
        lineHeight: 1.6,
        color: 'var(--color-text)'
      }}>
        <span dangerouslySetInnerHTML={{ __html: sanitizeAndFormatAI(streamingText) }} />
        <Icon name="typing" size={16} className="ai-blink" style={{ marginLeft: '2px', color: 'var(--color-primary)', verticalAlign: 'middle' }} />
        {badge && (
          <div style={{ fontSize: '0.6rem', color: 'var(--color-gold)', marginTop: '2px' }}>
            {badge.icon} {badge.name}
          </div>
        )}
      </div>
    </div>
  );
}
