import React, { useState } from 'react';

function ClothingSection({ player, onClothingSubmit }) {
  const [showForm, setShowForm] = useState(false);
  const [sizes, setSizes] = useState({
    jersey: player.clothingSizes?.jersey || 'M',
    shorts: player.clothingSizes?.shorts || 'M',
    socks: player.clothingSizes?.socks || '40-42'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onClothingSubmit(sizes);
    setShowForm(false);
  };

  return (
    <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-gold)' }}>Tallas de Uniforme</h4>
        <button
          onClick={() => {
            if (showForm) { setShowForm(false); return; }
            setSizes({
              jersey: player.clothingSizes?.jersey || 'M',
              shorts: player.clothingSizes?.shorts || 'M',
              socks: player.clothingSizes?.socks || '40-42'
            });
            setShowForm(true);
          }}
          className="btn-outline"
          style={{ padding: '3px 6px', fontSize: '0.7rem' }}
        >
          {showForm ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      {!showForm ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', fontSize: '0.8rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 5px', borderRadius: '4px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>JERSEY</span>
            <strong>{player.clothingSizes?.jersey || 'N/A'}</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 5px', borderRadius: '4px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>SHORTS</span>
            <strong>{player.clothingSizes?.shorts || 'N/A'}</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 5px', borderRadius: '4px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>MEDIAS</span>
            <strong>{player.clothingSizes?.socks || 'N/A'}</strong>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.6rem' }}>Jersey</label>
              <input type="text" value={sizes.jersey} onChange={(e) => setSizes(prev => ({ ...prev, jersey: e.target.value.toUpperCase() }))} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} required />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.6rem' }}>Shorts</label>
              <input type="text" value={sizes.shorts} onChange={(e) => setSizes(prev => ({ ...prev, shorts: e.target.value.toUpperCase() }))} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} required />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.6rem' }}>Medias</label>
              <input type="text" value={sizes.socks} onChange={(e) => setSizes(prev => ({ ...prev, socks: e.target.value }))} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} required />
            </div>
          </div>
          <button type="submit" className="btn-neon" style={{ padding: '5px', fontSize: '0.7rem', justifyContent: 'center' }}>
            Guardar Tallas
          </button>
        </form>
      )}
    </div>
  );
}

export default ClothingSection;
