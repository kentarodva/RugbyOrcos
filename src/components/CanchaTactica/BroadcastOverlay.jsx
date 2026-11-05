import React from 'react';

function BroadcastOverlay({
  pitchOrientation = 'horizontal',
  showRivals = false,
  rivalPositions = [],
  prevRivalPositions = [],
  fieldPositions = [],
  prevFieldPositions = [],
  showBall = true,
  ballPosition = { x: 46, y: 45 },
  passFrom = null,
  gainLineX = null,
  highlightZone = null,
  activePhaseInfo = null,
  isAnimating = false,
  animDuration = 1.9,
  draggingId = null,
  onStartDrag,
  onEndDrag,
}) {
  const isVert = pitchOrientation === 'vertical';
  const toScreen = (pt) => {
    if (!pt) return { x: 50, y: 50 };
    return { x: pt.x, y: pt.y };
  };

  const screenBall = toScreen(ballPosition);
  const screenPassFrom = passFrom ? toScreen(passFrom) : null;
  const screenZone = highlightZone ? toScreen(highlightZone) : null;

  // Build allied movement vectors between previous phase and current phase
  const alliedVectors = [];
  if (prevFieldPositions && prevFieldPositions.length > 0) {
    fieldPositions.forEach(curr => {
      const prev = prevFieldPositions.find(p => p.id === curr.id);
      if (prev) {
        const sPrev = toScreen(prev);
        const sCurr = toScreen(curr);
        const dist = Math.hypot(sCurr.x - sPrev.x, sCurr.y - sPrev.y);
        if (dist > 2.8) {
          alliedVectors.push({
            id: curr.id,
            x1: sPrev.x,
            y1: sPrev.y,
            x2: sCurr.x,
            y2: sCurr.y,
            isForward: curr.id <= 8,
          });
        }
      }
    });
  }

  // Build rival movement vectors
  const rivalVectors = [];
  if (showRivals && prevRivalPositions && prevRivalPositions.length > 0) {
    rivalPositions.forEach(curr => {
      const prev = prevRivalPositions.find(p => p.id === curr.id);
      if (prev) {
        const sPrev = toScreen(prev);
        const sCurr = toScreen(curr);
        const dist = Math.hypot(sCurr.x - sPrev.x, sCurr.y - sPrev.y);
        if (dist > 2.8) {
          rivalVectors.push({
            id: curr.id,
            x1: sPrev.x,
            y1: sPrev.y,
            x2: sCurr.x,
            y2: sCurr.y,
          });
        }
      }
    });
  }

  // Curved Bezier control point for ball pass trajectory
  let passPathD = null;
  if (screenPassFrom) {
    const dx = screenBall.x - screenPassFrom.x;
    const dy = screenBall.y - screenPassFrom.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 2) {
      const midX = (screenPassFrom.x + screenBall.x) / 2 - dy * 0.18;
      const midY = (screenPassFrom.y + screenBall.y) / 2 + dx * 0.18;
      passPathD = `M ${screenPassFrom.x} ${screenPassFrom.y} Q ${midX} ${midY} ${screenBall.x} ${screenBall.y}`;
    }
  }

  return (
    <>
      {/* SVG TV Telestrator Layer */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        <defs>
          <marker id="arrow-ally" markerWidth="3.2" markerHeight="3.2" refX="2.4" refY="1.6" orient="auto">
            <path d="M0,0 L3.2,1.6 L0,3.2 Z" fill="#00e676" />
          </marker>
          <marker id="arrow-forward" markerWidth="3.2" markerHeight="3.2" refX="2.4" refY="1.6" orient="auto">
            <path d="M0,0 L3.2,1.6 L0,3.2 Z" fill="#ffb300" />
          </marker>
          <marker id="arrow-rival" markerWidth="2.8" markerHeight="2.8" refX="2.1" refY="1.4" orient="auto">
            <path d="M0,0 L2.8,1.4 L0,2.8 Z" fill="#ff5252" />
          </marker>
          <marker id="arrow-ball" markerWidth="3.6" markerHeight="3.6" refX="2.6" refY="1.8" orient="auto">
            <path d="M0,0 L3.6,1.8 L0,3.6 Z" fill="#ffd740" />
          </marker>
        </defs>

        {/* Broadcast Gain Line (Línea de Ventaja) */}
        {gainLineX != null && (
          isVert ? (
            <line
              x1="0"
              y1={gainLineX}
              x2="100"
              y2={gainLineX}
              stroke="rgba(64, 196, 255, 0.75)"
              strokeWidth="0.45"
              strokeDasharray="1.5 1"
            />
          ) : (
            <line
              x1={gainLineX}
              y1="0"
              x2={gainLineX}
              y2="100"
              stroke="rgba(64, 196, 255, 0.75)"
              strokeWidth="0.45"
              strokeDasharray="1.5 1"
            />
          )
        )}

        {/* Broadcast Target / Gap Zone */}
        {screenZone && (
          <g>
            <ellipse
              cx={screenZone.x}
              cy={screenZone.y}
              rx={highlightZone.r || 8}
              ry={(highlightZone.r || 8) * 1.25}
              fill="rgba(0, 230, 118, 0.14)"
              stroke="#00e676"
              strokeWidth="0.4"
              strokeDasharray="1.2 0.8"
            />
            <ellipse
              cx={screenZone.x}
              cy={screenZone.y}
              rx={(highlightZone.r || 8) * 0.55}
              ry={(highlightZone.r || 8) * 0.7}
              fill="rgba(0, 230, 118, 0.18)"
            />
          </g>
        )}

        {/* Rival Drift Vectors */}
        {rivalVectors.map(v => (
          <line
            key={`rv_${v.id}`}
            x1={v.x1}
            y1={v.y1}
            x2={v.x2}
            y2={v.y2}
            stroke="rgba(255, 82, 82, 0.65)"
            strokeWidth="0.38"
            strokeDasharray="0.9 0.7"
            markerEnd="url(#arrow-rival)"
          />
        ))}

        {/* Allied Run Vectors */}
        {alliedVectors.map(v => (
          <line
            key={`av_${v.id}`}
            x1={v.x1}
            y1={v.y1}
            x2={v.x2}
            y2={v.y2}
            stroke={v.isForward ? 'rgba(255, 179, 0, 0.85)' : 'rgba(0, 230, 118, 0.9)'}
            strokeWidth="0.5"
            markerEnd={v.isForward ? 'url(#arrow-forward)' : 'url(#arrow-ally)'}
          />
        ))}

        {/* Curved Ball Pass Trajectory */}
        {passPathD && (
          <g>
            <path
              d={passPathD}
              fill="none"
              stroke="rgba(255, 215, 64, 0.32)"
              strokeWidth="1.2"
            />
            <path
              d={passPathD}
              fill="none"
              stroke="#ffd740"
              strokeWidth="0.6"
              strokeDasharray="1.4 0.9"
              markerEnd="url(#arrow-ball)"
            />
          </g>
        )}
      </svg>

      {/* Highlight Zone Label Badge */}
      {screenZone && highlightZone?.label && (
        <div
          style={{
            position: 'absolute',
            left: `${screenZone.x}%`,
            top: `${Math.max(4, screenZone.y - (highlightZone.r || 8) - 3)}%`,
            transform: 'translate(-50%, -50%)',
            background: 'rgba(5, 15, 10, 0.88)',
            border: '1px solid #00e676',
            color: '#00e676',
            fontSize: '0.58rem',
            fontWeight: 900,
            letterSpacing: '0.06em',
            padding: '2px 7px',
            borderRadius: '999px',
            pointerEvents: 'none',
            zIndex: 6,
            whiteSpace: 'nowrap',
            boxShadow: '0 0 12px rgba(0, 230, 118, 0.35)',
          }}
        >
          🎯 {highlightZone.label}
        </div>
      )}

      {/* Rival Tokens (🔴 R1..R15) */}
      {showRivals && rivalPositions.map(r => {
        const pt = toScreen(r);
        const isDraggingThis = draggingId === r.id;
        return (
          <div
            key={r.id}
            onMouseDown={(e) => { e.stopPropagation(); onStartDrag?.(e, r.id); }}
            onTouchStart={(e) => { e.stopPropagation(); onStartDrag?.(e, r.id); }}
            onMouseUp={() => onEndDrag?.(r.id, r.name)}
            onTouchEnd={() => onEndDrag?.(r.id, r.name)}
            title={`Rival #${r.num || r.id.replace('R', '')} (Arrastra para ubicar defensa rival)`}
            style={{
              position: 'absolute',
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #ef4444, #7f1d1d)',
              border: isDraggingThis ? '2.5px solid #ffd740' : '2px solid #fca5a5',
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDraggingThis ? 'grabbing' : 'grab',
              zIndex: isDraggingThis ? 110 : 9,
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.55)',
              userSelect: 'none',
              touchAction: 'none',
              transition: isDraggingThis
                ? 'none'
                : isAnimating
                  ? `left ${animDuration}s cubic-bezier(0.22, 1, 0.36, 1), top ${animDuration}s cubic-bezier(0.22, 1, 0.36, 1)`
                  : 'left 0.25s ease-out, top 0.25s ease-out',
            }}
          >
            <span>R{r.num || r.id.replace('R', '')}</span>
          </div>
        );
      })}

      {/* Interactive Rugby Ball Node (🏉) */}
      {showBall && ballPosition && (
        <div
          onMouseDown={(e) => { e.stopPropagation(); onStartDrag?.(e, 'BALL'); }}
          onTouchStart={(e) => { e.stopPropagation(); onStartDrag?.(e, 'BALL'); }}
          onMouseUp={() => onEndDrag?.('BALL', 'Balón')}
          onTouchEnd={() => onEndDrag?.('BALL', 'Balón')}
          title="Balón de Rugby (Arrástralo para explicar hacia dónde va el pase o patada)"
          style={{
            position: 'absolute',
            left: `${screenBall.x}%`,
            top: `${screenBall.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: draggingId === 'BALL' ? 130 : 35,
            cursor: draggingId === 'BALL' ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            transition: draggingId === 'BALL'
              ? 'none'
              : isAnimating
                ? `left ${Math.max(0.7, animDuration - 0.25)}s cubic-bezier(0.22, 1, 0.36, 1), top ${Math.max(0.7, animDuration - 0.25)}s cubic-bezier(0.22, 1, 0.36, 1)`
                : 'left 0.22s ease-out, top 0.22s ease-out',
          }}
        >
          {/* Broadcast Spotlight Halo */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 215, 64, 0.42) 0%, rgba(255, 215, 64, 0.08) 65%, transparent 100%)',
              border: '1.5px solid rgba(255, 215, 64, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 18px rgba(255, 215, 64, 0.75)',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '18px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fff8e1 0%, #ffd54f 55%, #f57f17 100%)',
                border: '2px solid #1a1200',
                transform: 'rotate(-25deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.75)',
              }}
            >
              <div style={{ width: '12px', height: '2px', background: '#1a1200', borderRadius: '1px' }} />
            </div>
          </div>
        </div>
      )}

      {/* Lower-Third TV Broadcast Explanation Overlay */}
      {activePhaseInfo && (
        <div
          style={{
            position: 'absolute',
            left: '14px',
            right: '14px',
            bottom: '12px',
            zIndex: 40,
            background: 'linear-gradient(90deg, rgba(6, 11, 19, 0.94) 0%, rgba(11, 22, 34, 0.92) 100%)',
            border: '1px solid rgba(0, 230, 118, 0.45)',
            borderLeft: '4px solid var(--color-primary)',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.65)',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: 'var(--color-primary)',
                  color: '#04080e',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                📺 ORCOS TV · FASE {activePhaseInfo.index + 1}/{activePhaseInfo.total}
              </span>
              <strong style={{ fontSize: '0.82rem', color: '#fff', fontFamily: 'Outfit' }}>
                {activePhaseInfo.title}
              </strong>
            </div>
          </div>
          {activePhaseInfo.description && (
            <div style={{ fontSize: '0.73rem', color: 'rgba(226, 232, 240, 0.92)', lineHeight: 1.38 }}>
              {activePhaseInfo.description}
            </div>
          )}
          {/* Phase Progress Bar */}
          <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
            <div
              style={{
                height: '100%',
                width: `${((activePhaseInfo.index + 1) / activePhaseInfo.total) * 100}%`,
                background: 'linear-gradient(90deg, var(--color-primary) 0%, #ffd740 100%)',
                boxShadow: '0 0 8px var(--color-primary)',
                transition: `width ${animDuration}s cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default BroadcastOverlay;
