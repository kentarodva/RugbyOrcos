import React, { useRef, useState } from 'react';
import AVATARS, { getAvatarPath } from '../data/mythicalAvatars';

const COMPRESS_WIDTH = 512;
const COMPRESS_QUALITY = 0.8;

function compressToWebP(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = COMPRESS_WIDTH / img.width;
      canvas.width = COMPRESS_WIDTH;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Compression failed'));
      }, 'image/webp', COMPRESS_QUALITY);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}

export function AvatarPicker({ currentAvatarId, onSelect, onPhoto, onClear, onClose }) {
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressToWebP(file);
      onPhoto(compressed);
      onClose();
    } catch {
      // fallback: upload original
      onPhoto(file);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>🎨 Elegir Avatar</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button onClick={() => fileInputRef.current.click()} className="btn-neon" style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}>
            📷 Subir Foto
          </button>
          {currentAvatarId && (
            <button onClick={() => { onClear(); onClose(); }} className="btn-outline" style={{ padding: '10px', fontSize: '0.8rem', color: 'var(--color-red)' }}>
              Quitar Avatar
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
          {AVATARS.map(a => {
            const isSelected = currentAvatarId === a.id;
            return (
              <div
                key={a.id}
                onClick={() => onSelect(a.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  padding: '8px 4px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'rgba(0,230,118,0.1)' : 'transparent',
                  border: '1px solid ' + (isSelected ? 'var(--color-primary)' : 'var(--border-glass)'),
                  transition: 'all 0.15s ease',
                }}
              >
                <img
                  src={getAvatarPath(a.id)}
                  alt={a.name}
                  style={{ width: '44px', height: '44px' }}
                />
                <span style={{ fontSize: '0.55rem', textAlign: 'center', color: 'var(--color-text-muted)', lineHeight: 1.2 }}>
                  {a.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
