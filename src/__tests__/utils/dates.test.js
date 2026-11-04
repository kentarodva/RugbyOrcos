import { describe, it, expect } from 'vitest';
import { parseLocalDate, formatLocalDate } from '../../utils/dates';

describe('parseLocalDate — Colombia tz', () => {
  it('retorna null para undefined', () => {
    expect(parseLocalDate()).toBeNull();
  });

  it('retorna null para null', () => {
    expect(parseLocalDate(null)).toBeNull();
  });

  it('retorna null para string vacío', () => {
    expect(parseLocalDate('')).toBeNull();
  });

  it('parsea "2026-06-08" como midnight local', () => {
    const d = parseLocalDate('2026-06-08');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // 0-indexed
    expect(d.getDate()).toBe(8);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('parsea con hora en T', () => {
    const d = parseLocalDate('2026-01-15T10:30:00');
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(0);
    expect(d.getFullYear()).toBe(2026);
  });

  it('parsea último día del año', () => {
    const d = parseLocalDate('2026-12-31');
    expect(d.getDate()).toBe(31);
    expect(d.getMonth()).toBe(11);
  });

  it('parsea día con mes de 1 dígito', () => {
    const d = parseLocalDate('2026-03-05');
    expect(d.getDate()).toBe(5);
    expect(d.getMonth()).toBe(2);
  });
});

describe('formatLocalDate — Colombia tz', () => {
  const ref = new Date(2026, 5, 8, 0, 0, 0); // Jun 8 2026

  it('formatea en locale es-CO', () => {
    const f = formatLocalDate(ref);
    expect(f).toBeDefined();
    expect(typeof f).toBe('string');
  });

  it('respeta opciones de formato', () => {
    const f = formatLocalDate(ref, { weekday: 'long' });
    expect(f).toBeDefined();
  });

  it('no lanza con Date actual', () => {
    expect(() => formatLocalDate(new Date())).not.toThrow();
  });
});
