import React, { useState } from 'react';

function CredentialModal({ player, onClose, onGenerate }) {
  const [pass, setPass] = useState('');
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!pass || pass.length < 6) return;
    const res = await onGenerate(pass);
    if (res) setResult(res);
  };

  return (
    <div className="modal-overlay" onClick={() => { onClose(); setPass(''); setResult(null); }}>
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚔️</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '8px', color: 'var(--color-gold)' }}>
          Forjar Credenciales
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
          {player.name}<br/>
          Usuario: <strong style={{ color: 'var(--color-primary)' }}>{player.username || '(se generara auto)'}</strong>
        </p>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)}
          placeholder="Contrasena (min. 6 caracteres)" className="form-input"
          style={{ textAlign: 'center', padding: '12px', marginBottom: '15px', width: '100%', boxSizing: 'border-box' }} />
        {result && (
          <div style={{ background: 'rgba(0,230,118,0.08)', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '15px', fontSize: '0.8rem' }}>
            Usuario: <strong>{result.username}</strong><br/>
            Email: <span style={{ fontSize: '0.75rem' }}>{result.email || result.username + '@orcos.local'}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => { onClose(); setPass(''); setResult(null); }} className="btn-outline">Cancelar</button>
          <button onClick={handleGenerate} className="btn-neon">Forjar</button>
        </div>
      </div>
    </div>
  );
}

export default CredentialModal;
