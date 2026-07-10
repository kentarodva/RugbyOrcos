import React, { useRef, useState } from 'react';
import AVATARS, { getAvatarPath } from '../data/mythicalAvatars';
import { PhotoEditor } from './PhotoEditor';

export function AvatarPicker({ currentAvatarId, hasPhoto, photoUrl, onSelect, onPhoto, onClear, onClose }) {
  const fileInputRef = useRef(null);
  const [editingFile, setEditingFile] = useState(null);
  const [reEditing, setReEditing] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditingFile(file);
    e.target.value = '';
  };

  const handlePhotoSave = (blob) => {
    setEditingFile(null);
    setReEditing(false);
    onPhoto(blob);
    onClose();
  };

  const handleReEdit = () => setReEditing(true);

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>🎨 Elegir Avatar</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button onClick={() => fileInputRef.current.click()} className="btn-neon" style={{ flex: 1, padding: '10px', fontSize: '0.85rem', minWidth: '120px' }}>
            📷 {hasPhoto ? 'Nueva Foto' : 'Subir Foto'}
          </button>
          {hasPhoto && (
            <button onClick={handleReEdit} className="btn-outline" style={{ padding: '10px', fontSize: '0.82rem', minWidth: '120px' }}>
              ✂️ Re-editar Foto
            </button>
          )}
          {(currentAvatarId || hasPhoto) && (
            <button onClick={() => {
              if (currentAvatarId) onSelect(null);
              if (hasPhoto) onClear();
              onClose();
            }} className="btn-outline" style={{ padding: '10px', fontSize: '0.8rem', color: 'var(--color-red)' }}>
              {currentAvatarId ? 'Quitar Avatar' : 'Quitar Foto'}
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
    {editingFile && (
      <PhotoEditor
        file={editingFile}
        onSave={handlePhotoSave}
        onClose={() => setEditingFile(null)}
      />
    )}
    {reEditing && photoUrl && (
      <PhotoEditor
        photoUrl={photoUrl}
        onSave={handlePhotoSave}
        onClose={() => setReEditing(false)}
      />
    )}
    </>
  );
}
