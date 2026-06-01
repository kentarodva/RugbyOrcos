import React, { useState } from 'react';

function ResetPasswordModal({ player, onClose, onReset }) {
  const [pass, setPass] = useState('');

  const handleReset = async () => {
    if (!pass || pass.length < 6) return;
    await onReset(pass);
    setPass('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={() => { onClose(); setPass(''); }}>
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔑</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '8px', color: 'var(--color-gold)' }}>
          Restablecer Contrasena
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
          {player.name}<br/>
          Usuario: <strong style={{ color: 'var(--color-primary)' }}>{player.username}</strong>
        </p>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)}
          placeholder="Nueva contrasena (min. 6)" className="form-input"
          style={{ textAlign: 'center', padding: '12px', marginBottom: '15px', width: '100%', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => { onClose(); setPass(''); }} className="btn-outline">Cancelar</button>
          <button onClick={handleReset} className="btn-neon" style={{ background: 'linear-gradient(135deg, var(--color-gold), #ff8f00)', color: '#000' }}>Restablecer</button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordModal;
