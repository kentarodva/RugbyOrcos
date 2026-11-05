import { useState } from 'react';
import { crestInitials } from '../../utils/crests';

/**
 * Team crest with a safe fallback: if there is no URL (or it fails to load)
 * it renders the team's initials over its colour — never another team's crest.
 */
export default function TeamCrest({ url, name, color = '#00e676', size = 64, rounded = '22%', glow = false }) {
  const [failed, setFailed] = useState(false);
  const showImg = url && !failed;

  return (
    <div
      role="img"
      aria-label={`Escudo de ${name || 'equipo'}`}
      style={{
        width: size, height: size, borderRadius: rounded, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        background: showImg ? 'transparent' : `linear-gradient(135deg, ${color}33, ${color}11)`,
        border: showImg ? 'none' : `2px solid ${color}`,
        boxShadow: glow ? `0 0 ${Math.round(size / 3)}px ${color}55` : 'none',
      }}
    >
      {showImg ? (
        <img src={url} alt="" loading="lazy" onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <span aria-hidden="true" style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: Math.round(size * 0.36), color, letterSpacing: '0.5px' }}>
          {crestInitials(name)}
        </span>
      )}
    </div>
  );
}
