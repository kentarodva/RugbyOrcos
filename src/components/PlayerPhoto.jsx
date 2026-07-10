import React, { useState, useEffect } from 'react';
import { getAvatarPath } from '../data/mythicalAvatars';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

export function PlayerPhoto({ player, size = 60, editable = false, onClick }) {
  const avatarId = player?.avatar_id;
  const photoUrl = player?.photo_url;
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => { setPhotoError(false); }, [photoUrl]);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-input)',
    border: '2px solid var(--border-glass)',
    flexShrink: 0,
    position: 'relative',
    cursor: editable ? 'pointer' : 'default',
  };

  const content = (photoUrl && !photoError) ? (
    <img
      src={photoUrl}
      alt=""
      onError={() => setPhotoError(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  ) : avatarId ? (
    <img
      src={getAvatarPath(avatarId)}
      alt=""
      style={{ width: '55%', height: '55%' }}
    />
  ) : (
    <span style={{ fontSize: size * 0.38, fontWeight: 800, color: 'var(--color-text-muted)' }}>
      {getInitials(player?.name)}
    </span>
  );

  return (
    <div style={containerStyle} onClick={onClick} title={editable ? 'Cambiar avatar' : ''}>
      {content}
      {editable && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.15s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.25, color: '#fff',
        }}
          className="player-photo-overlay"
        >
          📷
        </div>
      )}
      <style>{`.player-photo-overlay:hover { opacity: 1 !important; }`}</style>
    </div>
  );
}
