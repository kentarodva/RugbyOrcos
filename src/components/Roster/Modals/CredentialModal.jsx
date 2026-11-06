import React, { useState } from 'react';

function CredentialModal({ player, onClose, onGenerate }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await onGenerate();
    if (res) {
      setResult(res);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `🏉 Rugby Orcos — Tus credenciales\nUsuario: ${result.username}\nEmail: ${result.email || (result.username + '@orcos.club')}\nContraseña: ${result.password}\nIngresa en: ${window.location.origin}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      setCopied(false);
    });
  };

  if (!result) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚔️</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
            Forjar Credenciales
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
            {player.name}<br/>
            Usuario: <strong style={{ color: 'var(--color-primary)' }}>{player.username || '(se generará auto)'}</strong>
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            Se generará una contraseña temporal. El jugador deberá cambiarla al iniciar sesión.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={onClose} className="btn-outline">Cancelar</button>
            <button onClick={handleGenerate} className="btn-neon" disabled={loading} style={{ opacity: loading ? 0.5 : 1 }}>
              {loading ? '⚙️ Generando...' : '🔨 Forjar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚔️</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
          ✅ Credenciales Creadas
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
          {player.name}
        </p>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', textAlign: 'left', fontSize: '0.85rem' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>USUARIO</span><br/>
            <strong style={{ fontSize: '1rem', color: '#fff' }}>{result.username}</strong>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>EMAIL (para iniciar sesión)</span><br/>
            <strong style={{ fontSize: '0.9rem', color: 'var(--color-blue)' }}>{result.email || (result.username + '@orcos.club')}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>CONTRASEÑA TEMPORAL</span><br/>
            <strong style={{ fontSize: '1rem', color: 'var(--color-gold)', fontFamily: 'monospace', letterSpacing: '2px' }}>{result.password}</strong>
          </div>
        </div>
        <button onClick={handleCopy} className="btn-neon" style={{ marginBottom: '12px', width: '100%', padding: '10px' }}>
          {copied ? '✅ Copiado' : '📋 Copiar credenciales'}
        </button>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          Pega en WhatsApp para enviar al jugador.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onClose} className="btn-outline">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default CredentialModal;
