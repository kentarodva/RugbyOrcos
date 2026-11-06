import React, { useState } from 'react';
import { PRESET_TV_PLAYS } from './presetPlays';

function PlaybookBar({
  activePlayId,
  onSelectPresetPlay,
  onExitPlaybook,
  phases = [],
  activePhaseIndex = 0,
  onSelectPhase,
  isPlayingPlay = false,
  onTogglePlay,
  playbackSpeed = '0.75x',
  onSpeedChange,
  onPrevPhase,
  onNextPhase,
  onCaptureCustomPhase,
  onClearCustomPhases,
  showRivals = false,
  onToggleRivals,
  showBall = true,
  onToggleBall,
  onExportImage,
  onCopyWhatsAppText,
  onPrintOfficialPdf,
  onOpenAcademia,
  section = 'all',
}) {
  const showPlay = section !== 'share';
  const showShare = section !== 'play';
  const [exportStatus, setExportStatus] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const handleImageClick = async () => {
    setExportStatus('Generando TV HD...');
    try {
      const res = await onExportImage?.();
      if (res?.copied) {
        setExportStatus('✅ Copiada al portapapeles (Pégala en WhatsApp) + PNG');
      } else {
        setExportStatus('✅ Imagen PNG descargada');
      }
    } catch {
      setExportStatus('⚠️ Error al exportar');
    }
    setTimeout(() => setExportStatus(''), 4000);
  };

  const handleTextClick = async () => {
    await onCopyWhatsAppText?.();
    setCopyStatus('✅ XV copiado para WhatsApp');
    setTimeout(() => setCopyStatus(''), 3000);
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Top Row: TV Playbook Selector + Rivals/Ball Toggles + WhatsApp Exports */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        {showPlay && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 320px', minWidth: 0 }}>
          {section === 'all' && <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            Jugadas
          </span>}

          <select
            value={activePlayId || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) onExitPlaybook?.();
              else onSelectPresetPlay?.(val);
            }}
            className="form-select"
            style={{
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              minWidth: 0,
              flex: '1 1 240px',
              borderColor: activePlayId ? 'var(--color-primary)' : 'rgba(255,255,255,0.14)',
            }}
          >
            <option value="">🎯 Modo Libre (Alineación XV / Crear jugada propia)</option>
            <optgroup label="Jugadas Animadas de Televisión (Explicación Paso a Paso)">
              {PRESET_TV_PLAYS.map(play => (
                <option key={play.id} value={play.id}>
                  {play.name} [{play.category}] ({play.phases.length} fases)
                </option>
              ))}
            </optgroup>
          </select>
        </div>}

        {/* Interactive Elements Toggles */}
        {showPlay && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button type="button" onClick={onToggleRivals} aria-pressed={showRivals}
            className={`btn-outline btn-sm${showRivals ? ' is-on' : ''}`}
            style={showRivals ? { borderColor: 'var(--color-primary)', color: 'var(--color-text)' } : undefined}
            title="Mostrar u ocultar los 15 jugadores rivales en la cancha">
            Rivales
          </button>
          <button type="button" onClick={onToggleBall} aria-pressed={showBall}
            className={`btn-outline btn-sm${showBall ? ' is-on' : ''}`}
            style={showBall ? { borderColor: 'var(--color-primary)', color: 'var(--color-text)' } : undefined}
            title="Mostrar u ocultar el balón interactivo (arrástralo para trazar pases)">
            Balón
          </button>
        </div>}
        {showShare && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', width: '100%' }}>
          <button type="button" onClick={handleImageClick} className="btn-neon btn-sm"
            title="Genera una imagen HD estilo TV con cancha, flechas y alineación XV (se copia para pegar en WhatsApp y se descarga)">
            {exportStatus || 'Compartir imagen'}
          </button>
          <button type="button" onClick={handleTextClick} className="btn-outline btn-sm"
            title="Copia la lista del XV titular y suplentes formateada para pegar en el grupo de WhatsApp">
            {copyStatus || 'Copiar alineación'}
          </button>
          <button type="button" onClick={onPrintOfficialPdf} className="btn-outline btn-sm"
            title="Genera e imprime la Planilla Oficial de Partido en PDF para la Federación / Mesa Técnica">
            Planilla PDF
          </button>
          {onOpenAcademia && (
            <button type="button" onClick={onOpenAcademia} className="btn-outline btn-sm"
              title="Academia de Rugby, Leyes FCR y Certificaciones World Rugby Passport">
              Academia
            </button>
          )}
        </div>}
      </div>

      {/* Bottom Row: Phase Timeline & Animation Controls */}
      {showPlay && <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {phases.length > 0 && (
            <>
              <button
                type="button"
                onClick={onPrevPhase}
                disabled={phases.length <= 1}
                className="btn-outline"
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                }}
                title="Paso anterior (Fase anterior)"
              >
                ⏮️
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isPlayingPlay ? '#E8B931' : 'var(--color-primary)',
                  color: '#090C0A',
                  fontWeight: 900,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isPlayingPlay
                    ? '0 0 14px rgba(232, 185, 49, 0.45)'
                    : '0 0 14px rgba(46, 229, 122, 0.35)',
                }}
              >
                {isPlayingPlay ? '⏸️ Pausar Animación' : '▶️ Reproducir TV'}
              </button>

              <button
                type="button"
                onClick={onNextPhase}
                disabled={phases.length <= 1}
                className="btn-outline"
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                }}
                title="Siguiente paso (Siguiente fase)"
              >
                ⏭️
              </button>
            </>
          )}

          {/* Speed Selector */}
          {phases.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>VEL:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => onSpeedChange?.(e.target.value)}
                className="form-select"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  width: 'auto',
                  background: 'rgba(21, 24, 22, 0.85)',
                  borderColor: 'rgba(46, 229, 122, 0.4)',
                  color: '#E8B931',
                }}
                title="Velocidad de reproducción de la animación de pizarra"
              >
                <option value="0.5x">🐢 0.5x Lento</option>
                <option value="0.75x">📺 0.75x Pausado TV (Recomendado)</option>
                <option value="1x">⚡ 1x Normal</option>
                <option value="1.5x">🚀 1.5x Rápido</option>
              </select>
            </div>
          )}

          {phases.map((ph, idx) => {
            const isCurrent = idx === activePhaseIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPhase?.(idx)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: isCurrent ? 'rgba(46, 229, 122, 0.22)' : 'rgba(255,255,255,0.05)',
                  border: isCurrent ? '1.5px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.12)',
                  color: isCurrent ? '#fff' : 'var(--color-text-muted)',
                  boxShadow: isCurrent ? '0 0 10px rgba(46, 229, 122, 0.4)' : 'none',
                }}
              >
                Fase {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Custom Phase Recording Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button type="button" onClick={onCaptureCustomPhase} className="btn-outline btn-sm"
            title="Mueve jugadores, rivales o el balón y guarda la posición como una nueva fase animada">
            + Capturar fase {phases.length + 1}
          </button>
          {phases.length > 0 && (
            <button type="button" onClick={onClearCustomPhases} className="btn-outline btn-sm">
              Salir de fases
            </button>
          )}
        </div>
      </div>}
    </div>
  );
}

export default PlaybookBar;
