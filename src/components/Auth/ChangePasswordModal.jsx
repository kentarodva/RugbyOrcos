import React, { useState } from 'react';
import { supabase } from '../../supabaseClient.js';

export function ChangePasswordModal({ onPasswordChanged }) {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError('');
    if (newPass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
      if (updateError) throw updateError;

      await supabase.auth.updateUser({ data: { temp_password: false } });
      onPasswordChanged();
    } catch (err) {
      setError(err.message || 'Error al cambiar la contraseña. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 99999, background: 'rgba(0,0,0,0.85)' }}>
      <div className="modal-content animated-slide" style={{ maxWidth: '440px', textAlign: 'center', border: '2px solid var(--color-gold)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🛡️</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-gold)', marginBottom: '8px' }}>
          Bienvenido a Rugby Orcos
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
          Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <input
            type="password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            className="form-input"
            style={{ padding: '12px', fontSize: '0.9rem', textAlign: 'center' }}
            autoFocus
          />
          <input
            type="password"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            placeholder="Confirmar contraseña"
            className="form-input"
            style={{ padding: '12px', fontSize: '0.9rem', textAlign: 'center' }}
          />
        </div>

        {error && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-red)', marginBottom: '12px' }}>{error}</p>
        )}

        <button
          onClick={handleSave}
          className="btn-neon"
          disabled={saving}
          style={{ width: '100%', padding: '12px', opacity: saving ? 0.5 : 1, fontSize: '0.95rem' }}
        >
          {saving ? '💾 Guardando...' : '💾 Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
