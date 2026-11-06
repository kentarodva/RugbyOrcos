import React from 'react';
import PositionNode from './PositionNode';
import BroadcastOverlay from './BroadcastOverlay';

function PitchField({
  fieldPositions,
  prevFieldPositions = [],
  lineup,
  teamPlayers,
  draggingId,
  pitchOrientation,
  pitchSize,
  pitchRef,
  showRivals = false,
  rivalPositions = [],
  prevRivalPositions = [],
  showBall = true,
  ballPosition = { x: 46, y: 45 },
  passFrom = null,
  gainLineX = null,
  highlightZone = null,
  activePhaseInfo = null,
  isAnimating = false,
  animDuration = 1.9,
  onStartDrag,
  onDragMove,
  onEndDrag
}) {
  return (
    <div
      ref={pitchRef}
      className="rugby-pitch"
      onMouseMove={onDragMove}
      onTouchMove={onDragMove}
      onMouseUp={() => onStartDrag(null, null)}
      onTouchEnd={() => onStartDrag(null, null)}
      style={{
        position: 'relative',
        width: pitchSize === 'small' ? '60%' : '100%',
        maxWidth: pitchSize === 'small' ? '480px' : pitchSize === 'medium' ? '800px' : 'none',
        margin: pitchSize === 'large' ? '0' : '0 auto',
        ...(pitchSize === 'large'
          ? { minHeight: '70vh' }
          : { aspectRatio: pitchOrientation === 'horizontal' ? '1.6' : '1.2' }
        ),
        background: pitchOrientation === 'horizontal'
          ? 'repeating-linear-gradient(90deg, #212422, #212422 5%, #1A1D1B 5%, #1A1D1B 10%)'
          : 'repeating-linear-gradient(180deg, #212422, #212422 5%, #1A1D1B 5%, #1A1D1B 10%)',
        borderRadius: 'var(--radius-lg)',
        border: pitchSize === 'large' ? '3px solid var(--color-primary)' : '3px solid rgba(255,255,255,0.85)',
        overflow: 'hidden',
        boxShadow: pitchSize === 'large'
          ? '0 0 40px var(--color-primary-glow), inset 0 0 30px rgba(0,0,0,0.6)'
          : '0 0 25px rgba(46, 229, 122, 0.15), inset 0 0 30px rgba(0,0,0,0.6)',
        backgroundSize: '100% 100%',
        userSelect: 'none',
        transition: 'min-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), aspect-ratio 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), border 0.3s, box-shadow 0.3s'
      }}
    >
      {pitchOrientation === 'horizontal' ? (
        <>
          <div style={{ position: 'absolute', left: '8%', top: 0, bottom: 0, width: '2px', background: '#fff', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '26%', top: 0, bottom: 0, width: '1.5px', background: 'rgba(255,255,255,0.65)', borderLeft: '1.5px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '42%', top: 0, bottom: 0, width: '1.5px', background: 'rgba(255,255,255,0.4)', borderLeft: '1.5px dashed rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '3px', background: '#fff', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '58%', top: 0, bottom: 0, width: '1.5px', background: 'rgba(255,255,255,0.4)', borderLeft: '1.5px dashed rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '74%', top: 0, bottom: 0, width: '1.5px', background: 'rgba(255,255,255,0.65)', borderLeft: '1.5px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '8%', top: 0, bottom: 0, width: '2px', background: '#fff', pointerEvents: 'none' }} />

          {['left', 'right'].map((side, idx) => (
            <React.Fragment key={side}>
              <div style={{ position: 'absolute', [side === 'left' ? 'left' : 'right']: '8%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
              <div style={{ position: 'absolute', [side === 'left' ? 'left' : 'right']: side === 'left' ? '26%' : '74%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', [side === 'left' ? 'left' : 'right']: side === 'left' ? '42%' : '58%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', left: '50%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: idx === 0 ? 'var(--color-primary)' : 'var(--color-primary)', pointerEvents: 'none', fontFamily: 'monospace' }}>MITAD</div>
            </React.Fragment>
          ))}
          <div style={{ position: 'absolute', left: '8%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
          <div style={{ position: 'absolute', left: '26%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
          <div style={{ position: 'absolute', left: '42%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
          <div style={{ position: 'absolute', left: '50%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-primary)', pointerEvents: 'none', fontFamily: 'monospace' }}>MITAD</div>
          <div style={{ position: 'absolute', left: '58%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
          <div style={{ position: 'absolute', left: '74%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
          <div style={{ position: 'absolute', right: '8%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
        </>
      ) : (
        <>
          <div style={{ position: 'absolute', top: '5%', left: 0, right: 0, height: '2px', background: '#fff', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '22%', left: 0, right: 0, height: '1.5px', background: 'rgba(255,255,255,0.65)', borderTop: '1.5px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, height: '1.5px', background: 'rgba(255,255,255,0.4)', borderTop: '1.5px dashed rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '3px', background: '#fff', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '60%', left: 0, right: 0, height: '1.5px', background: 'rgba(255,255,255,0.4)', borderTop: '1.5px dashed rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '78%', left: 0, right: 0, height: '1.5px', background: 'rgba(255,255,255,0.65)', borderTop: '1.5px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '5%', left: 0, right: 0, height: '2px', background: '#fff', pointerEvents: 'none' }} />

          {['left', 'right'].map(side => (
            <React.Fragment key={side}>
              <div style={{ position: 'absolute', top: '5.5%', [side]: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1px', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
              <div style={{ position: 'absolute', top: '22.5%', [side]: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', top: '40.5%', [side]: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', top: '50.5%', [side]: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-primary)', pointerEvents: 'none', fontFamily: 'monospace' }}>MITAD</div>
              <div style={{ position: 'absolute', top: '60.5%', [side]: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', top: '78.5%', [side]: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', bottom: '6.5%', [side]: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1px', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
            </React.Fragment>
          ))}
        </>
      )}

      <BroadcastOverlay
        pitchOrientation={pitchOrientation}
        showRivals={showRivals}
        rivalPositions={rivalPositions}
        prevRivalPositions={prevRivalPositions}
        fieldPositions={fieldPositions}
        prevFieldPositions={prevFieldPositions}
        showBall={showBall}
        ballPosition={ballPosition}
        passFrom={passFrom}
        gainLineX={gainLineX}
        highlightZone={highlightZone}
        activePhaseInfo={activePhaseInfo}
        isAnimating={isAnimating}
        animDuration={animDuration}
        draggingId={draggingId}
        onStartDrag={onStartDrag}
        onEndDrag={onEndDrag}
      />

      {fieldPositions.map(pos => {
        const assignedPlayerId = lineup[pos.id];
        const player = teamPlayers.find(p => p.id === assignedPlayerId);
        const isDraggingThis = draggingId === pos.id;

        return (
          <PositionNode
            key={pos.id}
            pos={pos}
            player={player}
            isDraggingThis={isDraggingThis}
            isAnimating={isAnimating}
            animDuration={animDuration}
            onStartDrag={onStartDrag}
            onEndDrag={onEndDrag}
          />
        );
      })}
    </div>
  );
}

export default PitchField;
