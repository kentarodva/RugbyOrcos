import React, { useState } from 'react';
import { clearCache, getCacheStats } from '../engine/aiCache';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

function Settings({ onClose, theme, setTheme }) {
  const { showToast } = useToast();
  const cacheStats = getCacheStats();

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleClearCache = () => {
    clearCache();
    showToast('Cache de IA limpiada.', 'info');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    showToast(`Tema ${theme === 'dark' ? 'claro' : 'oscuro'} activado.`, 'success');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPass.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      showToast('Las contraseñas no coinciden.', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass });
      if (error) throw error;
      showToast('Contraseña actualizada exitosamente.', 'success');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      showToast(err.message || 'Error al cambiar contraseña.', 'error');
    }
    setChangingPassword(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel animated-slide"
        style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
            ⚙️ Configuración
          </h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          {/* Apariencia */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)',
            padding: '15px', borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>🎨 Apariencia</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem' }}>Tema</span>
              <button onClick={toggleTheme} className="btn-neon" style={{ padding: '6px 16px', fontSize: '0.78rem' }}>
                {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
              </button>
            </div>
          </div>

          {/* Notificaciones */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)',
            padding: '15px', borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>🔔 Notificaciones</h4>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Las notificaciones se gestionan desde los botones de notificación en el header.
              <br />Próximamente: configuración granular de notificaciones por tipo de evento.
            </div>
          </div>

          {/* Cuenta */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)',
            padding: '15px', borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>🔐 Cuenta</h4>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.72rem' }}>Nueva contraseña</label>
                <input
                  type="password" value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                  placeholder="Mínimo 6 caracteres" className="form-input"
                  style={{ padding: '6px 8px', fontSize: '0.78rem' }} minLength={6} required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.72rem' }}>Confirmar contraseña</label>
                <input
                  type="password" value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repite la contraseña" className="form-input"
                  style={{ padding: '6px 8px', fontSize: '0.78rem' }} required
                />
              </div>
              <button type="submit" disabled={changingPassword} className="btn-neon" style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.78rem' }}>
                {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>

          {/* OpenRouter */}
          <div style={{
            background: 'rgba(0, 230, 118, 0.05)',
            border: '1px solid rgba(0, 230, 118, 0.2)',
            padding: '15px', borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>🌐 OpenRouter (Edge Function)</span>
                <span className="badge" style={{
                  marginLeft: '8px', background: 'rgba(0, 230, 118, 0.1)',
                  color: 'var(--color-primary)', border: '1px solid var(--color-primary)',
                  fontSize: '0.6rem', fontWeight: 700
                }}>Siempre activo</span>
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
              Conexión segura via Supabase Edge Function. Modelos gratuitos: DeepSeek R1, Llama 3, Nemotron, Gemma y más.
            </div>
            <div style={{
              background: 'rgba(0, 230, 118, 0.03)', border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.68rem', color: 'var(--color-text-muted)'
            }}>
              <strong style={{ color: 'var(--color-text)' }}>Estado:</strong>{' '}
              <span style={{ color: 'var(--color-primary)' }}>✅ Conectado</span>
              {' | '}
              <strong style={{ color: 'var(--color-text)' }}>Router:</strong> openrouter/free
              {' | '}
              <strong style={{ color: 'var(--color-text)' }}>Modelos:</strong> 26+ gratuitos
            </div>
          </div>

          {/* Avanzado */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)',
            padding: '15px', borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>⚡ Avanzado</h4>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.72rem', color: 'var(--color-text-muted)',
              background: 'var(--bg-dark)', padding: '10px 12px', borderRadius: 'var(--radius-sm)'
            }}>
              <div>
                <span>Cache de respuestas IA</span>
                <p style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                  {cacheStats.entries} / {cacheStats.maxEntries}
                </p>
              </div>
              <button onClick={handleClearCache} className="btn-outline" style={{ padding: '5px 10px', fontSize: '0.68rem' }}>
                Limpiar
              </button>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-dark)', padding: '15px', borderRadius: 'var(--radius-md)',
            fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.6
          }}>
            <strong style={{ color: 'var(--color-text)' }}>Rugby Orcos Club Manager v4.1</strong><br />
            IA via OpenRouter con modelos gratuitos. Sin necesidad de API keys locales.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={onClose} className="btn-neon">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
