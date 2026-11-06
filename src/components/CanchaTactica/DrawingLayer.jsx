import React, { useEffect, useRef, useState } from 'react';
import { DRAW_TOOLS, appendPoint, arrowHead, fromCanonical, pathLength, toCanonical, toSvgPath } from './drawing';

function StrokeShape({ stroke, size }) {
  const tool = DRAW_TOOLS[stroke.tool] || DRAW_TOOLS.run;
  const px = stroke.points.map(p => ({ x: (p.x / 100) * size.w, y: (p.y / 100) * size.h }));
  const head = tool.arrow ? arrowHead(px, 13) : null;
  return (
    <g>
      <path d={toSvgPath(px)} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={tool.width + 2.5}
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray={tool.dash || undefined} />
      <path d={toSvgPath(px)} fill="none" stroke={tool.color} strokeWidth={tool.width}
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray={tool.dash || undefined} />
      {head && <polygon points={head.map(p => `${p.x},${p.y}`).join(' ')} fill={tool.color} stroke="rgba(0,0,0,0.45)" strokeWidth="1" />}
    </g>
  );
}

/**
 * SVG layer over the pitch. While `active`, it captures the finger/mouse to draw
 * (and stops the page from scrolling); otherwise it only shows the strokes.
 */
function DrawingLayer({ strokes, orientation, active, tool, onAdd }) {
  const svgRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [draft, setDraft] = useState(null); // points in screen-orientation %

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toPct = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };

  const onPointerDown = (e) => {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDraft([toPct(e)]);
  };
  const onPointerMove = (e) => {
    if (!active || !draft) return;
    e.preventDefault();
    setDraft(prev => (prev ? appendPoint(prev, toPct(e)) : prev));
  };
  const finish = () => {
    if (draft && draft.length >= 2 && pathLength(draft) >= 2) {
      onAdd({
        id: `s${Date.now()}${Math.round(Math.random() * 1e4)}`,
        tool,
        points: draft.map(p => {
          const c = toCanonical(p, orientation);
          return { x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10 };
        }),
      });
    }
    setDraft(null);
  };

  const shown = strokes.map(s => ({ ...s, points: s.points.map(p => fromCanonical(p, orientation)) }));

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      aria-hidden={!active}
      role={active ? 'img' : undefined}
      aria-label={active ? 'Zona de dibujo: arrastra el dedo para trazar' : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={() => setDraft(null)}
      style={{
        position: 'absolute', inset: 0,
        zIndex: active ? 200 : 40,
        pointerEvents: active ? 'auto' : 'none',
        touchAction: active ? 'none' : 'auto',
        cursor: active ? 'crosshair' : 'default',
      }}
    >
      {size.w > 0 && shown.map(s => <StrokeShape key={s.id} stroke={s} size={size} />)}
      {size.w > 0 && draft && <StrokeShape stroke={{ id: 'draft', tool, points: draft }} size={size} />}
    </svg>
  );
}

export default DrawingLayer;
