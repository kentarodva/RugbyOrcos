import React from 'react';
import { POS_ABREVIATIONS } from './constants';

function PositionNode({ pos, player, isDraggingThis, isAnimating = false, animDuration = 1.9, onStartDrag, onEndDrag }) {
  const isForward = pos.id <= 8;
  const isReserve = pos.name.includes('Reserva');
  const departmentColor = isReserve
    ? 'rgba(150, 160, 175, 0.85)'
    : isForward
      ? 'var(--color-gold)'
      : 'var(--color-primary)';

  return (
    <div
      onMouseDown={(e) => onStartDrag(e, pos.id)}
      onTouchStart={(e) => onStartDrag(e, pos.id)}
      onMouseUp={() => onEndDrag(pos.id, pos.name)}
      onTouchEnd={() => onEndDrag(pos.id, pos.name)}
      title={player ? `${pos.name}: ${player.name}` : pos.name}
      aria-label={player ? `${pos.name}: ${player.name}` : pos.name}
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: isDraggingThis ? 'grabbing' : 'grab',
        zIndex: isDraggingThis ? 100 : 10,
        touchAction: 'none',
        transition: isDraggingThis
          ? 'none'
          : isAnimating
            ? `left ${animDuration}s cubic-bezier(0.22, 1, 0.36, 1), top ${animDuration}s cubic-bezier(0.22, 1, 0.36, 1)`
            : 'left 0.12s ease-out, top 0.12s ease-out'
      }}
    >
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        background: player ? 'var(--bg-surface-solid)' : 'rgba(10, 20, 15, 0.82)',
        border: isDraggingThis
          ? '3px solid var(--color-gold)'
          : player
            ? player.rol === 'Capitan'
              ? '2px solid var(--color-gold)'
              : `2px solid ${departmentColor}`
            : `1.5px dashed ${isReserve ? 'rgba(255,255,255,0.2)' : 'rgba(255, 255, 255, 0.45)'}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '0.72rem',
        fontWeight: '800',
        color: isDraggingThis
          ? 'var(--color-gold)'
          : player
            ? player.rol === 'Capitan'
              ? 'var(--color-gold)'
              : departmentColor
            : 'rgba(255,255,255,0.7)',
        boxShadow: isDraggingThis
          ? '0 0 15px var(--color-gold)'
          : player
            ? `0 0 12px ${isForward ? 'rgba(232, 185, 49, 0.3)' : 'rgba(46, 229, 122, 0.3)'}`
            : 'none',
        scale: isDraggingThis ? '1.18' : '1',
        transition: 'border 0.2s, box-shadow 0.2s, scale 0.2s, background 0.2s',
        position: 'relative'
      }}>
        {POS_ABREVIATIONS[pos.id] || 'RES'}
        <div style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#0E110F',
          border: `1.2px solid ${departmentColor}`,
          color: player ? '#fff' : 'rgba(255,255,255,0.7)',
          fontSize: '0.55rem',
          fontWeight: '900',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.6)'
        }}>
          {pos.id}
        </div>
      </div>

      {player && (<div style={{
        marginTop: '4px',
        background: 'rgba(14, 17, 15, 0.92)',
        padding: '3px 6px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.62rem',
        fontWeight: '700',
        maxWidth: '72px',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        border: player
          ? `1px solid ${isForward ? 'rgba(232, 185, 49,0.3)' : 'rgba(46, 229, 122,0.3)'}`
          : '1px solid rgba(255, 255, 255, 0.08)',
        color: player ? '#fff' : 'var(--color-text-muted)',
        boxShadow: isDraggingThis ? '0 4px 10px rgba(0,0,0,0.6)' : 'none',
        transition: 'background 0.2s, border 0.2s, color 0.2s'
      }}>
        {player.apodo || player.name.split(' ').slice(0, 2).join(' ')}
      </div>)}
    </div>
  );
}

export default PositionNode;
