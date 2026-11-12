import { describe, it, expect } from 'vitest';
import {
  drawingReducer, initialDrawing, appendPoint, pathLength, toSvgPath, arrowHead, toCanonical, fromCanonical,
} from '../../components/CanchaTactica/drawing';

const stroke = (id) => ({ id, tool: 'run', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });

describe('Pizarra drawing history', () => {
  it('adds strokes and clears redo on a new stroke', () => {
    let s = drawingReducer(initialDrawing, { type: 'add', stroke: stroke('a') });
    s = drawingReducer(s, { type: 'undo' });
    expect(s.present).toEqual([]);
    expect(s.future).toHaveLength(1);
    s = drawingReducer(s, { type: 'add', stroke: stroke('b') });
    expect(s.present.map(x => x.id)).toEqual(['b']);
    expect(s.future).toEqual([]);
  });

  it('undo and redo walk the history', () => {
    let s = drawingReducer(initialDrawing, { type: 'add', stroke: stroke('a') });
    s = drawingReducer(s, { type: 'add', stroke: stroke('b') });
    s = drawingReducer(s, { type: 'undo' });
    expect(s.present.map(x => x.id)).toEqual(['a']);
    s = drawingReducer(s, { type: 'redo' });
    expect(s.present.map(x => x.id)).toEqual(['a', 'b']);
  });

  it('clear is undoable and a no-op when empty', () => {
    expect(drawingReducer(initialDrawing, { type: 'clear' })).toBe(initialDrawing);
    let s = drawingReducer(initialDrawing, { type: 'add', stroke: stroke('a') });
    s = drawingReducer(s, { type: 'clear' });
    expect(s.present).toEqual([]);
    s = drawingReducer(s, { type: 'undo' });
    expect(s.present.map(x => x.id)).toEqual(['a']);
  });

  it('undo/redo at the ends do nothing', () => {
    expect(drawingReducer(initialDrawing, { type: 'undo' })).toBe(initialDrawing);
    expect(drawingReducer(initialDrawing, { type: 'redo' })).toBe(initialDrawing);
  });

  it('load replaces strokes and resets history; ignores bad input', () => {
    const s = drawingReducer({ past: [[]], present: [], future: [[]] }, { type: 'load', strokes: [stroke('x')] });
    expect(s).toEqual({ past: [], present: [stroke('x')], future: [] });
    expect(drawingReducer(s, { type: 'load', strokes: 'garbage' }).present).toEqual([]);
  });
});

describe('Pizarra drawing geometry', () => {
  it('skips points closer than the minimum distance', () => {
    const pts = appendPoint([{ x: 0, y: 0 }], { x: 0.1, y: 0.1 });
    expect(pts).toHaveLength(1);
    expect(appendPoint(pts, { x: 5, y: 0 })).toHaveLength(2);
  });

  it('measures polyline length', () => {
    expect(pathLength([{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 3, y: 10 }])).toBe(11);
  });

  it('builds an SVG path that starts and ends on the stroke', () => {
    const d = toSvgPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 10 }]);
    expect(d.startsWith('M0,0')).toBe(true);
    expect(d.endsWith('L20,10')).toBe(true);
    expect(toSvgPath([])).toBe('');
  });

  it('points the arrowhead along the end of the stroke', () => {
    const [tip, a, b] = arrowHead([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }], 12);
    expect(tip).toEqual({ x: 100, y: 0 });
    expect(a.x).toBeLessThan(100);
    expect(b.x).toBeLessThan(100);
    expect(Math.sign(a.y)).toBe(-Math.sign(b.y));
    expect(arrowHead([{ x: 1, y: 1 }])).toBeNull();
  });

  it('orientation conversion is reversible', () => {
    const p = { x: 12, y: 80 };
    expect(fromCanonical(toCanonical(p, 'vertical'), 'vertical')).toEqual(p);
    expect(toCanonical(p, 'horizontal')).toEqual(p);
  });
});
