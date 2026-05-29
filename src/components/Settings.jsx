import React, { useState, useEffect } from 'react';
import {
  getRateLimitInfoAll,
  debugProviderConnection, getActiveProvider,
  PROVIDERS, DEFAULT_PROVIDER_ORDER
} from '../engine/geminiCoach';
import { clearCache, getCacheStats } from '../engine/aiCache';
import { useToast } from '../context/ToastContext';
import * as groqProvider from '../engine/providers/groqProvider';
import * as deepseekProvider from '../engine/providers/deepseekProvider';
import * as geminiProvider from '../engine/providers/geminiProvider';

const KEY_INPUTS_KEY = 'orcos_settings_keys';

function Settings({ onClose }) {
  const { showToast } = useToast();
  const [keyInputs, setKeyInputs] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY_INPUTS_KEY);
      return saved ? JSON.parse(saved) : { groq: '', deepseek: '', gemini: '' };
    } catch { return { groq: '', deepseek: '', gemini: '' }; }
  });
  const [showKeys, setShowKeys] = useState({});
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(null);
  const [activeProvider, setActiveProvider] = useState(() => getActiveProvider());
  const [streamingEnabled, setStreamingEnabled] = useState(() => {
    return localStorage.getItem('orcos_ai_streaming') !== 'false';
  });

  const rateInfo = getRateLimitInfoAll();
  const cacheStats = getCacheStats();

  useEffect(() => {
    setStreamingEnabled(localStorage.getItem('orcos_ai_streaming') !== 'false');
  }, []);

  const saveKeyInputs = (newKeys) => {
    setKeyInputs(newKeys);
    localStorage.setItem(KEY_INPUTS_KEY, JSON.stringify(newKeys));
  };

  const handleSaveKey = (providerId) => {
    const key = keyInputs[providerId]?.trim();
    if (!key) return;

    switch (providerId) {
      case 'groq': groqProvider.setApiKey(key); break;
      case 'deepseek': deepseekProvider.setApiKey(key); break;
      case 'gemini': geminiProvider.setApiKey(key); break;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    saveKeyInputs({ ...keyInputs, [providerId]: '' });
    showToast(`API key de ${PROVIDERS[providerId]?.name} guardada.`, 'success');
  };

  const handleDeleteKey = (providerId) => {
    switch (providerId) {
      case 'groq': groqProvider.setApiKey(null); break;
      case 'deepseek': deepseekProvider.setApiKey(null); break;
      case 'gemini': geminiProvider.setApiKey(null); break;
    }
    showToast(`API key de ${PROVIDERS[providerId]?.name} eliminada.`, 'info');
  };

  const handleTestConnection = async (providerId) => {
    setTesting(providerId);
    const result = await debugProviderConnection(providerId);
    setTesting(null);
    if (result.error) {
      showToast(`Error: ${result.message}`, 'error');
    } else {
      showToast(`Conexión exitosa con ${PROVIDERS[providerId]?.name}.`, 'success');
    }
  };

  const handleProviderChange = (id) => {
    setActiveProvider(id);
    localStorage.setItem('orcos_ai_provider', id);
    showToast(id === 'auto'
      ? 'Modo automático: probará proveedores en orden.'
      : `Proveedor fijado: ${PROVIDERS[id]?.name}`, 'success');
  };

  const handleClearCache = () => {
    clearCache();
    showToast('Caché de IA limpiada.', 'info');
  };

  const handleToggleStreaming = () => {
    const newVal = !streamingEnabled;
    setStreamingEnabled(newVal);
    localStorage.setItem('orcos_ai_streaming', String(newVal));
  };

  const toggleShowKey = (id) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getRateBarColor = (pct) => {
    if (pct > 80) return 'var(--color-red)';
    if (pct > 50) return 'var(--color-gold)';
    return 'var(--color-primary)';
  };

  const providerLinks = {
    groq: 'https://console.groq.com/keys',
    deepseek: 'https://platform.deepseek.com/api_keys',
    gemini: 'https://aistudio.google.com/apikey'
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
            ⚙️ Configuración Multi-Proveedor IA
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          {/* Selector de proveedor activo */}
          <div style={{
            background: 'rgba(0, 230, 118, 0.03)',
            border: '1px solid var(--border-glass)',
            padding: '15px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>🔀 Proveedor Activo</h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleProviderChange('auto')}
                className={activeProvider === 'auto' ? 'btn-neon' : 'btn-outline'}
                style={{ padding: '6px 10px', fontSize: '0.7rem', justifyContent: 'center' }}
              >
                🤖 Auto (fallback)
              </button>
              {DEFAULT_PROVIDER_ORDER.map(id => {
                const p = PROVIDERS[id];
                if (!p) return null;
                const isConfigured = !!localStorage.getItem(p.apiKeyStorage);
                return (
                  <button
                    key={id}
                    onClick={() => handleProviderChange(id)}
                    className={activeProvider === id ? 'btn-neon' : 'btn-outline'}
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.7rem',
                      justifyContent: 'center',
                      opacity: isConfigured ? 1 : 0.4
                    }}
                  >
                    {p.icon} {p.name}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
              {activeProvider === 'auto'
                ? 'Auto: prueba Groq → DeepSeek → Gemini en orden.'
                : `Fijo: siempre usa ${PROVIDERS[activeProvider]?.name}.`}
            </p>
          </div>

          {/* Cada proveedor */}
          {DEFAULT_PROVIDER_ORDER.map(providerId => {
            const p = PROVIDERS[providerId];
            if (!p) return null;
            const isCfg = !!localStorage.getItem(p.apiKeyStorage);
            const ri = rateInfo[providerId] || { used: 0, limit: p.models[p.defaultModel]?.dailyLimit || 999 };
            const pct = ri.limit > 0 ? Math.round((ri.used / ri.limit) * 100) : 0;

            return (
              <div key={providerId} style={{
                background: isCfg ? 'rgba(0, 230, 118, 0.02)' : 'rgba(255,255,255,0.01)',
                border: `1px solid ${isCfg ? 'rgba(0, 230, 118, 0.15)' : 'var(--border-glass)'}`,
                padding: '12px 15px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                      {p.icon} {p.name}
                    </span>
                    <span className="badge" style={{
                      marginLeft: '8px',
                      background: isCfg ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 61, 0, 0.1)',
                      color: isCfg ? 'var(--color-primary)' : 'var(--color-red)',
                      border: `1px solid ${isCfg ? 'var(--color-primary)' : 'var(--color-red)'}`,
                      fontSize: '0.6rem', fontWeight: 700
                    }}>
                      {isCfg ? '🟢 Activo' : '🔴 Sin key'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleTestConnection(providerId)}
                    disabled={testing === providerId || !isCfg}
                    className="btn-outline"
                    style={{ padding: '4px 8px', fontSize: '0.62rem', opacity: isCfg ? 1 : 0.5 }}
                  >
                    {testing === providerId ? '⏳' : '🔗 Probar'}
                  </button>
                </div>

                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                  {p.desc}
                </div>

                {/* Rate limit bar */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  fontSize: '0.65rem',
                  color: 'var(--color-text-muted)',
                  background: 'var(--bg-dark)',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Consultas hoy: <strong style={{ color: 'var(--color-primary)' }}>{ri.used}</strong> / {ri.limit}</span>
                    <span>{pct > 80 ? '⚠️' : ''}</span>
                  </div>
                  <div style={{
                    width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`,
                      height: '100%',
                      background: getRateBarColor(pct),
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* API Key */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showKeys[providerId] ? 'text' : 'password'}
                      value={keyInputs[providerId]}
                      onChange={(e) => saveKeyInputs({ ...keyInputs, [providerId]: e.target.value })}
                      placeholder={isCfg ? '••••••••••••••••' : `API key de ${p.name}`}
                      className="form-input"
                      style={{ paddingRight: '36px', fontSize: '0.72rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(providerId)}
                      style={{
                        position: 'absolute', right: '6px', top: '50%',
                        transform: 'translateY(-50%)', background: 'transparent',
                        border: 'none', color: 'var(--color-text-muted)',
                        cursor: 'pointer', fontSize: '0.75rem'
                      }}
                    >
                      {showKeys[providerId] ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <button
                    onClick={() => handleSaveKey(providerId)}
                    disabled={!keyInputs[providerId]?.trim()}
                    className="btn-neon"
                    style={{ padding: '4px 10px', fontSize: '0.65rem', justifyContent: 'center', opacity: keyInputs[providerId]?.trim() ? 1 : 0.5 }}
                  >
                    💾
                  </button>
                  {isCfg && (
                    <button
                      onClick={() => handleDeleteKey(providerId)}
                      className="btn-outline"
                      style={{ padding: '4px 8px', fontSize: '0.65rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.2)' }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                  🔗 Key gratis:{' '}
                  <a href={providerLinks[providerId]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                    {providerLinks[providerId].replace('https://', '').split('/')[0]}
                  </a>
                </p>
              </div>
            );
          })}

          {saved && (
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }} className="animated-fade">
              ✅ Configuración guardada
            </div>
          )}

          {/* Sección Avanzada */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-glass)',
            padding: '15px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>🔧 Avanzado</h4>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>📡 Streaming</span>
                <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Respuesta palabra por palabra
                </p>
              </div>
              <button
                onClick={handleToggleStreaming}
                className={streamingEnabled ? 'btn-neon' : 'btn-outline'}
                style={{ padding: '6px 14px', fontSize: '0.72rem', minWidth: '70px', justifyContent: 'center' }}
              >
                {streamingEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.72rem', color: 'var(--color-text-muted)',
              background: 'var(--bg-dark)', padding: '10px 12px', borderRadius: 'var(--radius-sm)'
            }}>
              <div>
                <span>💾 Caché de respuestas</span>
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
            <strong style={{ color: 'var(--color-text)' }}>Rugby Orcos Club Manager v2.0</strong><br />
            IA multi-proveedor con fallback automático. Si el primario falla o se agota, pasa al siguiente.<br />
            <span style={{ fontSize: '0.65rem' }}>
              Groq: 14,400/día | DeepSeek: 500/día | Gemini: 1,500/día (todos gratis)
            </span>
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
