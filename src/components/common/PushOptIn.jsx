import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { getWebPushStatus, registerWebPush } from '../../utils/pushNotifications';

const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => typeof window !== 'undefined'
  && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

/**
 * Players had no way to register for push (only staff Settings had the button), so push_tokens
 * stayed empty and no notification reached anyone. Shows only while push is possible and not active.
 */
export default function PushOptIn() {
  const [state, setState] = useState('checking'); // checking | hidden | ask | denied | ios-install | busy
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (isIOS() && !isStandalone()) { if (alive) setState('ios-install'); return; }
      const status = await getWebPushStatus();
      if (!alive) return;
      if (!status.supported || status.subscribed) setState('hidden');
      else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') setState('denied');
      else setState('ask');
    })();
    return () => { alive = false; };
  }, []);

  if (state === 'checking' || state === 'hidden') return null;

  const activate = async () => {
    setState('busy');
    setError('');
    const res = await registerWebPush();
    if (res.success) setState('hidden');
    else { setError(res.error || 'No se pudo activar.'); setState(/denegado|denied/i.test(res.error || '') ? 'denied' : 'ask'); }
  };

  const box = {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px',
    background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)',
  };

  if (state === 'ios-install') {
    return (
      <div role="note" style={box}>
        <Bell size={22} color="#ffd700" aria-hidden="true" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text)' }}>
          Para recibir avisos de partidos en iPhone: toca <strong>Compartir → Añadir a pantalla de inicio</strong> y abre la app desde ese icono.
        </p>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div role="note" style={box}>
        <BellOff size={22} color="#ffd700" aria-hidden="true" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text)' }}>
          Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio y recarga.
        </p>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Activar notificaciones" style={{ ...box, flexWrap: 'wrap' }}>
      <Bell size={22} color="#ffd700" aria-hidden="true" style={{ flexShrink: 0 }} />
      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text)' }}>Activa las notificaciones</strong>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Entérate de partidos, cambios de horario y anuncios del club.</span>
        {error && <span role="alert" style={{ display: 'block', fontSize: '0.72rem', color: '#ff6b6b', marginTop: '4px' }}>{error}</span>}
      </div>
      <button type="button" onClick={activate} disabled={state === 'busy'} className="btn-neon"
        style={{ minHeight: '44px', padding: '0 16px', fontSize: '0.8rem' }}>
        {state === 'busy' ? 'Activando…' : 'Activar'}
      </button>
    </div>
  );
}
