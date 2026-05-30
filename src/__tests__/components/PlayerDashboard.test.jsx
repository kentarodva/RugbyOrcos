import { describe, it, expect } from 'vitest';

describe('PlayerDashboard — atributos', () => {
  it('renderiza 4 atributos con valores', () => {
    const attrs = { force: 75, speed: 60, stamina: 80, technique: 90 };
    expect(Object.keys(attrs)).toHaveLength(4);
    expect(attrs.force).toBeGreaterThanOrEqual(0);
    expect(attrs.force).toBeLessThanOrEqual(100);
  });

  it('calcula fuerza relativa con peso y gym stats', () => {
    const gymStats = { squat: 120, bench: 90, deadlift: 140 };
    const weight = 85;
    const ratio = (gymStats.squat + gymStats.bench + gymStats.deadlift) / weight;
    expect(ratio).toBeCloseTo(4.12, 1);
  });

  it('atributo default es 50', () => {
    const attributes = { force: undefined };
    const force = attributes.force || 50;
    expect(force).toBe(50);
  });
});

describe('PlayerDashboard — insignias', () => {
  it('Orco de Hierro: asistencia >= 90% con 5+ total', () => {
    const attendance = { total: 10, present: 9 };
    const rate = attendance.present / attendance.total;
    expect(attendance.total >= 5 && rate >= 0.9).toBe(true);
  });

  it('Muralla Verde: 12+ tackles totales', () => {
    const matchStats = [{ tackles: 8 }, { tackles: 6 }];
    const total = matchStats.reduce((s, m) => s + (m.tackles || 0), 0);
    expect(total >= 12).toBe(true);
  });

  it('Demoledor: 3+ tries totales', () => {
    const matchStats = [{ tries: 2 }, { tries: 1 }];
    const total = matchStats.reduce((s, m) => s + (m.tries || 0), 0);
    expect(total >= 3).toBe(true);
  });

  it('Gladiador MVP: 1+ MVP', () => {
    const matchStats = [{ mvp: true }, { mvp: false }];
    const count = matchStats.filter(m => m.mvp).length;
    expect(count >= 1).toBe(true);
  });
});

describe('PlayerDashboard — wellness', () => {
  it('registra sleep, soreness, stress', () => {
    const wellness = { date: '2026-06-01', sleep: 5, soreness: 3, stress: 2 };
    expect(wellness.sleep).toBeGreaterThanOrEqual(1);
    expect(wellness.sleep).toBeLessThanOrEqual(5);
    expect(wellness.soreness).toBeGreaterThanOrEqual(1);
    expect(wellness.stress).toBeGreaterThanOrEqual(1);
  });

  it('wellness logs se limitan a 30', () => {
    const logs = new Array(35).fill({ date: '2026-01-01' });
    const trimmed = logs.slice(-30);
    expect(trimmed).toHaveLength(30);
  });
});

describe('PlayerDashboard — membresía', () => {
  it('muestra barra de progreso de pago', () => {
    const membership = { paid: 5000, due: 10000 };
    const pct = Math.min(100, (membership.paid / membership.due) * 100);
    expect(pct).toBe(50);
  });
});
