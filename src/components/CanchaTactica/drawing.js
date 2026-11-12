// Free drawing on the tactical board (runs, passes, marks).
// Strokes are stored in canonical *horizontal* pitch percentages (0-100), the same
// convention used by plays and the image export, so they survive orientation changes.

export const DRAW_TOOLS = {
  run: { label: 'Carrera', color: '#FFD54A', width: 3.5, dash: null, arrow: true },
  pass: { label: 'Pase', color: '#FFFFFF', width: 3, dash: '7 6', arrow: true },
  mark: { label: 'Marcar', color: '#FF5C4D', width: 3.5, dash: null, arrow: false },
};

export const toCanonical = (pt, orientation) => (orientation === 'vertical' ? { x: pt.y, y: pt.x } : { x: pt.x, y: pt.y });
export const fromCanonical = toCanonical; // swapping x/y is its own inverse

/** Append a point only if it moved at least `minDist` from the last one. */
export function appendPoint(points, pt, minDist = 0.6) {
  const last = points[points.length - 1];
  if (last && Math.hypot(pt.x - last.x, pt.y - last.y) < minDist) return points;
  return [...points, pt];
}

/** Total length of a polyline. */
export function pathLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i++) len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return len;
}

/** Smooth SVG path through pixel points (quadratic curves via midpoints). */
export function toSvgPath(px) {
  if (px.length === 0) return '';
  if (px.length < 3) return `M${px[0].x},${px[0].y}` + px.slice(1).map(p => ` L${p.x},${p.y}`).join('');
  let d = `M${px[0].x},${px[0].y}`;
  for (let i = 1; i < px.length - 1; i++) {
    const mx = (px[i].x + px[i + 1].x) / 2;
    const my = (px[i].y + px[i + 1].y) / 2;
    d += ` Q${px[i].x},${px[i].y} ${mx},${my}`;
  }
  const last = px[px.length - 1];
  return `${d} L${last.x},${last.y}`;
}

/** Triangle at the end of a pixel polyline, aimed along its last `back` pixels. */
export function arrowHead(px, size = 12, back = 14) {
  if (px.length < 2) return null;
  const tip = px[px.length - 1];
  let from = px[0];
  for (let i = px.length - 2; i >= 0; i--) {
    if (Math.hypot(tip.x - px[i].x, tip.y - px[i].y) >= back) { from = px[i]; break; }
  }
  const a = Math.atan2(tip.y - from.y, tip.x - from.x);
  if (!Number.isFinite(a)) return null;
  const p1 = { x: tip.x - size * Math.cos(a - Math.PI / 6), y: tip.y - size * Math.sin(a - Math.PI / 6) };
  const p2 = { x: tip.x - size * Math.cos(a + Math.PI / 6), y: tip.y - size * Math.sin(a + Math.PI / 6) };
  return [tip, p1, p2];
}

/** Undo/redo history of strokes. */
export const initialDrawing = { past: [], present: [], future: [] };

export function drawingReducer(state, action) {
  switch (action.type) {
    case 'add':
      return { past: [...state.past, state.present], present: [...state.present, action.stroke], future: [] };
    case 'undo':
      if (state.past.length === 0) return state;
      return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future] };
    case 'redo':
      if (state.future.length === 0) return state;
      return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
    case 'clear':
      if (state.present.length === 0) return state;
      return { past: [...state.past, state.present], present: [], future: [] };
    case 'load':
      return { past: [], present: Array.isArray(action.strokes) ? action.strokes : [], future: [] };
    default:
      return state;
  }
}
