import React, { useState } from 'react';
import MatchTimer from './MatchTimer';
import MatchDelayModal from './MatchDelayModal';
import { buildMatchWhatsAppText, copyOrDownloadMatchBanner } from '../../../../utils/exportMatchBanner';
import { playRugbyWhistle, isSoundEnabled, setSoundEnabled } from '../../../../utils/rugbyAudio';
import { liveScore } from '../../../../utils/liveScore';
import {
  OrcosWhistleIcon,
  OrcosDelayClockIcon,
  OrcosThirdTimeHornIcon,
  OrcosWarBannerIcon,
  OrcosRugbyBallIcon,
} from '../../../common/OrcosIcons';

function MatchHeader({ liveMatch, liveEvents, onPause, onResume, onDelay, onEnd, onClose, onDelete, onOpenThirdTime }) {
  const [copyStatus, setCopyStatus] = useState('');
  const [bannerStatus, setBannerStatus] = useState('');
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [showDelayModal, setShowDelayModal] = useState(false);

  const status = liveMatch?.status || 'finished';
  // Solo desde los eventos (misma regla que la BD); sin eventos, lo guardado.
  const score = liveEvents?.length
    ? liveScore(liveEvents)
    : { orcos: liveMatch?.orcos_score || 0, opponent: liveMatch?.opponent_score || 0 };

  const opponentName = liveMatch?.opponent_name || 'Rival';

  // Calculate approximate match minute
  const currentMinute = (() => {
    const acc = liveMatch?.elapsed_seconds || 0;
    if (status === 'paused' || status === 'delayed' || status === 'finished') {
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
          background: status === 'live' ? 'rgba(46, 229, 122, 0.1)' : status === 'delayed' ? 'rgba(255, 171, 0, 0.15)' : status === 'paused' ? 'rgba(255, 234, 0, 0.1)' : 'rgba(255, 92, 77, 0.1)',
          color: status === 'live' ? 'var(--color-primary)' : status === 'delayed' ? 'var(--color-orange, #F59E3D)' : status === 'paused' ? 'var(--color-gold)' : 'var(--color-text-muted)',
          border: `1px solid ${status === 'live' ? 'var(--color-primary)' : status === 'delayed' ? 'var(--color-orange, #F59E3D)' : status === 'paused' ? 'var(--color-gold)' : 'var(--color-border)'}`,
          fontSize: '0.65rem', fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: '5px'
        }}>
          {status === 'live' && <>🔴 EN VIVO</>}
          {status === 'delayed' && <><OrcosDelayClockIcon size={14} color="var(--color-orange, #F59E3D)" /> ⏳ EN ESPERA / RETRASADO</>}
          {status === 'paused' && <>⏸ PAUSADO</>}
          {status === 'finished' && <>✅ FINALIZADO</>}
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Silenciar silbato y efectos de sonido' : 'Activar silbato y efectos arbitrales'}
            style={{
              background: 'transparent', border: 'none', color: soundOn ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer', fontSize: '0.9rem', opacity: soundOn ? 1 : 0.6,
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <OrcosWhistleIcon size={18} color={soundOn ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
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

      {status === 'delayed' && (
        <div style={{
          background: 'rgba(255, 171, 0, 0.1)',
          border: '1px solid var(--color-orange, #F59E3D)',
          borderRadius: '8px',
          padding: '10px 14px',
          margin: '10px 0 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textAlign: 'left'
        }}>
          <OrcosDelayClockIcon size={24} color="var(--color-orange, #F59E3D)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-orange, #F59E3D)' }}>
              PARTIDO EN ESPERA EN COROZAL, SUCRE
            </div>
            <div style={{ fontSize: '0.74rem', color: '#fff' }}>
              {liveMatch?.delay_reason || 'Esperando inicio oficial'}. El cronómetro oficial permanece detenido hasta el pitazo inicial real.
            </div>
          </div>
          <button
            onClick={() => setShowDelayModal(true)}
            className="btn-outline"
            style={{ fontSize: '0.68rem', padding: '4px 8px', whiteSpace: 'nowrap' }}
          >
            Ajustar
          </button>
        </div>
      )}

      <MatchTimer liveMatch={liveMatch} status={status} />

      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
        gap: '15px', alignItems: 'center', margin: '15px 0',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <OrcosRugbyBallIcon size={14} color="var(--color-primary)" /> Orcos
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-primary)', textShadow: '0 0 20px rgba(46, 229, 122, 0.3)' }}>
            {score.orcos}
          </div>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)' }}>{opponentName}</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
            {score.opponent}
          </div>
        </div>
      </div>

      {/* Action Controls & WhatsApp Sharing */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
        {status === 'delayed' && (
          <button
            onClick={handleResume}
            className="btn-primary"
            style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 900 }}
          >
            <OrcosWhistleIcon size={16} color="#000" />
            ¡Pitazo Inicial Real!
          </button>
        )}

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
          <button
            onClick={() => setShowDelayModal(true)}
            className="btn-outline"
            style={{ fontSize: '0.75rem', padding: '8px 14px', borderColor: 'rgba(255, 171, 0, 0.4)', color: 'var(--color-orange, #F59E3D)' }}
            title="Registrar retraso logístico o de transporte en Corozal"
          >
            ⏳ Retraso / Espera
          </button>
        )}

        {(status === 'live' || status === 'paused' || status === 'delayed') && (
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
            borderColor: 'rgba(46, 229, 122, 0.4)',
            color: 'var(--color-primary)',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
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
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Generar y descargar la placa gráfica HD 1200x630 de transmisión oficial para redes y WhatsApp"
        >
          <OrcosWarBannerIcon size={16} color="#000" />
          {bannerStatus || 'Placa HD Marcador'}
        </button>

        {onOpenThirdTime && (
          <button
            onClick={onOpenThirdTime}
            className="btn-outline"
            style={{
              fontSize: '0.75rem',
              padding: '8px 14px',
              fontWeight: 800,
              borderColor: 'rgba(255, 215, 64, 0.5)',
              color: 'var(--color-gold)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Elegir MVP Orcos y MVP Rival, y generar la placa oficial de honor del Tercer Tiempo"
          >
            <OrcosThirdTimeHornIcon size={16} color="var(--color-gold)" />
            Tercer Tiempo & MVP
          </button>
        )}
      </div>

      <MatchDelayModal
        isOpen={showDelayModal}
        onClose={() => setShowDelayModal(false)}
        currentReason={liveMatch?.delay_reason}
        status={status}
        onSetDelay={(reason) => {
          onDelay?.(reason);
        }}
        onConfirmKickoff={() => {
          handleResume();
        }}
      />
    </div>
  );
}

export default MatchHeader;
