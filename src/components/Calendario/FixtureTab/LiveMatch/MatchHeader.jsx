import React, { useState } from 'react';
import MatchTimer from './MatchTimer';
import { buildMatchWhatsAppText, copyOrDownloadMatchBanner } from '../../../../utils/exportMatchBanner';
import { playRugbyWhistle, isSoundEnabled, setSoundEnabled } from '../../../../utils/rugbyAudio';

function MatchHeader({ liveMatch, liveEvents, onPause, onResume, onEnd, onClose, onDelete }) {
  const [copyStatus, setCopyStatus] = useState('');
  const [bannerStatus, setBannerStatus] = useState('');
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const status = liveMatch?.status || 'finished';
  const score = (() => {
    let orcos = liveMatch?.orcos_score || 0, opponent = liveMatch?.opponent_score || 0;
    const SCORING = { try: 5, conversion: 2, penalty: 3, drop_goal: 3 };
    for (const ev of liveEvents) {
      const pts = SCORING[ev.event_type] || 0;
      if (ev.team === 'orcos') orcos += pts;
    }
    return { orcos, opponent };
  })();

  const opponentName = liveMatch?.opponent_name || 'Rival';

  // Calculate approximate match minute
  const currentMinute = (() => {
    const acc = liveMatch?.elapsed_seconds || 0;
    if (status === 'paused' || status === 'finished') {
      return Math.floor(acc / 60);
    }
    if (liveMatch?.started_at) {
      const start = new Date(liveMatch.started_at).getTime();
      const delta = Math.max(0, Math.floor((Date.now() - start) / 1000));
      return Math.floor((acc + delta) / 60);
    }
    return Math.floor(acc / 60);
  })();

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playRugbyWhistle('pause');
  };

  const handlePause = () => {
    playRugbyWhistle('pause');
    onPause?.();
  };

  const handleResume = () => {
    playRugbyWhistle('kickoff');
    onResume?.();
  };

  const handleEnd = () => {
    playRugbyWhistle('fulltime');
    onEnd?.();
  };

  const handleShareWhatsApp = async () => {
    const text = buildMatchWhatsAppText({
      liveMatch,
      liveEvents,
      score,
      status,
      currentMinute,
    });
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopyStatus('✅ Marcador copiado');
      } else {
        setCopyStatus('⚠️ Error portapapeles');
      }
    } catch {
      setCopyStatus('⚠️ No se pudo copiar');
    }
    setTimeout(() => setCopyStatus(''), 3000);
  };

  const handleExportBanner = async () => {
    setBannerStatus('Generando Placa...');
    try {
      const res = await copyOrDownloadMatchBanner({
        liveMatch,
        liveEvents,
        score,
        status,
        currentMinute,
      });
      if (res?.copied) {
        setBannerStatus('✅ Placa copiada + descargada');
      } else {
        setBannerStatus('✅ Placa PNG descargada');
      }
    } catch {
      setBannerStatus('⚠️ Error placa');
    }
    setTimeout(() => setBannerStatus(''), 4000);
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span className="badge" style={{
          background: status === 'live' ? 'rgba(0, 230, 118, 0.1)' : status === 'paused' ? 'rgba(255, 234, 0, 0.1)' : 'rgba(255, 61, 0, 0.1)',
          color: status === 'live' ? 'var(--color-primary)' : status === 'paused' ? 'var(--color-gold)' : 'var(--color-text-muted)',
          border: `1px solid ${status === 'live' ? 'var(--color-primary)' : status === 'paused' ? 'var(--color-gold)' : 'var(--color-border)'}`,
          fontSize: '0.65rem', fontWeight: 700
        }}>
          {status === 'live' ? '🔴 EN VIVO' : status === 'paused' ? '⏸ PAUSADO' : '✅ FINALIZADO'}
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Silenciar silbato y efectos de sonido' : 'Activar silbato y efectos arbitrales'}
            style={{
              background: 'transparent', border: 'none', color: soundOn ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer', fontSize: '0.9rem', opacity: soundOn ? 1 : 0.6,
            }}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
          {onDelete && (
            <button onClick={onDelete} title="Eliminar" style={{
              background: 'transparent', border: 'none', color: 'var(--color-red)',
              cursor: 'pointer', fontSize: '0.8rem', opacity: 0.6,
            }}>🗑</button>
          )}
          <button onClick={onClose} title="Cerrar" style={{
            background: 'transparent', border: 'none', color: 'var(--color-text-muted)',
            cursor: 'pointer', fontSize: '0.8rem', opacity: 0.6,
          }}>✕</button>
        </div>
      </div>

      <MatchTimer liveMatch={liveMatch} status={status} />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        gap: '15px', alignItems: 'center', margin: '15px 0',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)' }}>Orcos</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'Outfit', color: 'var(--color-primary)', textShadow: '0 0 20px rgba(0, 230, 118, 0.3)' }}>
            {score.orcos}
          </div>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)' }}>{opponentName}</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'Outfit', color: 'var(--color-text)' }}>
            {score.opponent}
          </div>
        </div>
      </div>

      {/* Action Controls & WhatsApp Sharing */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
        {status === 'live' && (
          <button onClick={handlePause} className="btn-outline" style={{ fontSize: '0.75rem', padding: '8px 16px' }}>
            ⏸ Pausar
          </button>
        )}
        {status === 'paused' && (
          <button onClick={handleResume} className="btn-outline" style={{ fontSize: '0.75rem', padding: '8px 16px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
            ▶ Reanudar
          </button>
        )}
        {(status === 'live' || status === 'paused') && (
          <button onClick={handleEnd} className="btn-gold" style={{ fontSize: '0.75rem', padding: '8px 16px' }}>
            ⏹ Finalizar
          </button>
        )}

        <button
          onClick={handleShareWhatsApp}
          className="btn-outline"
          style={{
            fontSize: '0.75rem',
            padding: '8px 14px',
            borderColor: 'rgba(0, 230, 118, 0.4)',
            color: 'var(--color-primary)',
            fontWeight: 800,
          }}
          title="Copiar marcador formateado con puntos para enviar al grupo de WhatsApp"
        >
          📢 {copyStatus || 'Compartir Marcador WA'}
        </button>

        <button
          onClick={handleExportBanner}
          className="btn-primary"
          style={{
            fontSize: '0.75rem',
            padding: '8px 14px',
            fontWeight: 800,
          }}
          title="Generar y descargar la placa gráfica HD 1200x630 de transmisión oficial para redes y WhatsApp"
        >
          📸 {bannerStatus || 'Placa HD Marcador'}
        </button>
      </div>
    </div>
  );
}

export default MatchHeader;
