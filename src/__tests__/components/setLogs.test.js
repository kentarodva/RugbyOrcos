import { describe, it, expect } from 'vitest';
import { buildInitialSets, nextSetType, findPreviousSets, ghostFor, isPR, summarizeSets } from '../../components/workout/setLogs';

describe('buildInitialSets', () => {
  it('crea filas de calentamiento + efectivas con la prescripción del plan', () => {
    const rows = buildInitialSets({ warmupSets: 2, sets: 3, reps: 5, weight: 100 });
    expect(rows.map(r => r.type)).toEqual(['warmup', 'warmup', 'normal', 'normal', 'normal']);
    expect(rows[2]).toEqual({ type: 'normal', weight: '100', reps: '5', done: false });
  });
});

describe('nextSetType', () => {
  it('rota efectiva → calentamiento → fallo → drop → efectiva', () => {
    expect(['normal', 'warmup', 'failure', 'drop'].map(nextSetType)).toEqual(['warmup', 'failure', 'drop', 'normal']);
  });
});

describe('findPreviousSets', () => {
  const log = [
    { exerciseLogs: [{ exerciseId: 'sq', name: 'Sentadilla', setLogs: [
      { type: 'warmup', weight: '60', reps: '8', done: true },
      { type: 'normal', weight: '100', reps: '5', done: true },
      { type: 'normal', weight: '100', reps: '4', done: true },
    ] }] },
    { ejercicios: [{ name: 'Press Banca', sets: 3, reps: 8, weight: 70 }] },
  ];
  it('toma la sesión más reciente que incluyó el ejercicio (por id)', () => {
    expect(findPreviousSets(log, { exerciseId: 'sq' })).toHaveLength(3);
  });
  it('logs antiguos sin series: sintetiza desde sets/reps/peso, emparejando por nombre sin tildes', () => {
    expect(findPreviousSets(log, { name: 'press banca' })).toEqual([
      { type: 'normal', weight: 70, reps: 8 }, { type: 'normal', weight: 70, reps: 8 }, { type: 'normal', weight: 70, reps: 8 },
    ]);
  });
  it('sin historial devuelve vacío', () => {
    expect(findPreviousSets(log, { name: 'Peso muerto' })).toEqual([]);
  });
});

describe('ghostFor', () => {
  const prev = [{ type: 'warmup', weight: 60, reps: 8 }, { type: 'normal', weight: 100, reps: 5 }, { type: 'normal', weight: 100, reps: 4 }];
  const current = buildInitialSets({ warmupSets: 1, sets: 2, reps: 5 });
  it('empareja calentamiento con calentamiento y efectivas por orden', () => {
    expect(ghostFor(prev, current, 0)).toEqual({ type: 'warmup', weight: 60, reps: 8 });
    expect(ghostFor(prev, current, 2)).toEqual({ type: 'normal', weight: 100, reps: 4 });
  });
});

describe('isPR', () => {
  const ghost = { type: 'normal', weight: 100, reps: 5 };
  it('más peso o mismas kg con más reps es récord', () => {
    expect(isPR({ type: 'normal', weight: '102.5', reps: '3', done: true }, ghost)).toBe(true);
    expect(isPR({ type: 'normal', weight: '100', reps: '6', done: true }, ghost)).toBe(true);
  });
  it('no cuenta si no está hecha, si es calentamiento o si no supera', () => {
    expect(isPR({ type: 'normal', weight: '110', reps: '5', done: false }, ghost)).toBe(false);
    expect(isPR({ type: 'warmup', weight: '110', reps: '5', done: true }, ghost)).toBe(false);
    expect(isPR({ type: 'normal', weight: '100', reps: '5', done: true }, ghost)).toBe(false);
  });
});

describe('summarizeSets', () => {
  it('agrega solo series hechas; calentamiento aparte; peso = máximo efectivo', () => {
    expect(summarizeSets([
      { type: 'warmup', weight: '60', reps: '8', done: true },
      { type: 'normal', weight: '100', reps: '5', done: true },
      { type: 'failure', weight: '95', reps: '7', done: true },
      { type: 'normal', weight: '100', reps: '5', done: false },
    ])).toEqual({ sets: 2, warmupSets: 1, reps: 7, weight: 100 });
  });
});
