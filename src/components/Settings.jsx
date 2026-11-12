import React, { useState, useEffect } from 'react';
import { clearCache, getCacheStats } from '../engine/aiCache';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { registerWebPush, unregisterWebPush, getWebPushStatus } from '../utils/pushNotifications';
import { getSetting, loadSettings } from '../data/clubSettings';
import { setProviderKey } from '../engine/multiProviderCoach';

function Settings({ onClose, theme, setTheme }) {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const isDev = profile?.system_role === 'desarrollador';
  const [pushStatus, setPushStatus] = useState({ supported: false, subscribed: false });

  useEffect(() => {
    getWebPushStatus().then(setPushStatus);
  }, []);

  const handleRegisterPush = async () => {
    const result = await registerWebPush();
    if (result.success) {
      showToast('Dispositivo registrado para notificaciones.', 'success');
      setPushStatus(prev => ({ ...prev, subscribed: true }));
    } else {
      showToast(result.error || 'Error al registrar.', 'error');
    }
  };

  const handleUnregisterPush = async () => {
    await unregisterWebPush();
    showToast('Dispositivo desregistrado.', 'info');
    setPushStatus(prev => ({ ...prev, subscribed: false }));
  };
  const cacheStats = getCacheStats();

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [apiKeys, setApiKeys] = useState({ gemini: '', openrouter: '', deepseek: '' });

  useEffect(() => {
    loadSettings().then(() => {
      setApiKeys({
        gemini: getSetting('gemini_key') || '',
        openrouter: getSetting('openrouter_key') || '',
        deepseek: getSetting('deepseek_key') || '',
      });
    });
  }, []);

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
          <h3 style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--color-text)' }}>
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

          {/* Notificaciones push */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)',
            padding: '15px', borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>🔔 Notificaciones Push</h4>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Recibí notificaciones en este dispositivo cuando el staff envíe anuncios o recordatorios.
            </div>
            {pushStatus.supported ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem' }}>
                  {pushStatus.subscribed ? '✅ Registrado' : '❌ No registrado'}
                </span>
                <button
                  onClick={pushStatus.subscribed ? handleUnregisterPush : handleRegisterPush}
                  className={pushStatus.subscribed ? 'btn-outline' : 'btn-neon'}
                  style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                >
                  {pushStatus.subscribed ? 'Desregistrar' : 'Registrar dispositivo'}
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                Push no soportado en este navegador. Usá la app nativa para recibir notificaciones.
              </div>
            )}
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
            background: 'rgba(46, 229, 122, 0.05)',
            border: '1px solid rgba(46, 229, 122, 0.2)',
            padding: '15px', borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>🌐 OpenRouter (Edge Function)</span>
                <span className="badge" style={{
                  marginLeft: '8px', background: 'rgba(46, 229, 122, 0.1)',
                  color: 'var(--color-primary)', border: '1px solid var(--color-primary)',
                  fontSize: '0.6rem', fontWeight: 700
                }}>Siempre activo</span>
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
              Conexión segura via Supabase Edge Function. Modelos gratuitos: DeepSeek R1, Llama 3, Nemotron, Gemma y más.
            </div>
            <div style={{
              background: 'rgba(46, 229, 122, 0.03)', border: '1px solid var(--border-glass)',
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

          {/* API Keys — Solo visible para rol Desarrollador */}
          {isDev && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)',
            padding: '15px', borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>🧠 Proveedores IA (Avanzado / Desarrollador)</h4>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
              Las API keys se guardan en la base de datos del club. Todos los miembros usan la misma key.
            </p>

            {/* Gemini */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>🤖 Gemini 2.5 Flash</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>1,500 req/día · Gratis</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="password" value={apiKeys.gemini}
                  onChange={e => setApiKeys(p => ({ ...p, gemini: e.target.value }))}
                  placeholder="AIzaSy..." className="form-input"
                  style={{ flex: 1, padding: '6px 8px', fontSize: '0.72rem' }} />
                <button onClick={() => { setProviderKey('gemini', apiKeys.gemini); showToast('Key de Gemini guardada.', 'success'); }}
                  className="btn-neon" style={{ padding: '5px 12px', fontSize: '0.7rem' }}>
                  {apiKeys.gemini ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                style={{ fontSize: '0.6rem', color: 'var(--color-blue)' }}>👉 Conseguir API key gratuita</a>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '2px 0' }} />

            {/* OpenRouter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>🌐 OpenRouter</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>26+ modelos · HTTP directo</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="password" value={apiKeys.openrouter}
                  onChange={e => setApiKeys(p => ({ ...p, openrouter: e.target.value }))}
                  placeholder="sk-or-v1-..." className="form-input"
                  style={{ flex: 1, padding: '6px 8px', fontSize: '0.72rem' }} />
                <button onClick={() => { setProviderKey('openrouter', apiKeys.openrouter); showToast('Key de OpenRouter guardada.', 'success'); }}
                  className="btn-neon" style={{ padding: '5px 12px', fontSize: '0.7rem' }}>
                  {apiKeys.openrouter ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
                style={{ fontSize: '0.6rem', color: 'var(--color-blue)' }}>👉 Conseguir API key</a>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '2px 0' }} />

            {/* DeepSeek */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>🐋 DeepSeek V3</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>500 req/día</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="password" value={apiKeys.deepseek}
                  onChange={e => setApiKeys(p => ({ ...p, deepseek: e.target.value }))}
                  placeholder="sk-..." className="form-input"
                  style={{ flex: 1, padding: '6px 8px', fontSize: '0.72rem' }} />
                <button onClick={() => { setProviderKey('deepseek', apiKeys.deepseek); showToast('Key de DeepSeek guardada.', 'success'); }}
                  className="btn-neon" style={{ padding: '5px 12px', fontSize: '0.7rem' }}>
                  {apiKeys.deepseek ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
              <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer"
                style={{ fontSize: '0.6rem', color: 'var(--color-blue)' }}>👉 Conseguir API key</a>
            </div>
          </div>
          )}

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
