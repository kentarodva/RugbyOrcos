import { describe, it, expect, vi } from 'vitest';

vi.mock('../../services/trainingService', () => ({ getExerciseCatalog: vi.fn() }));

import { resolveCatalogExercise } from '../../components/workout/exerciseLookup';

const catalog = [
  { code: 'EX1', name_local: 'Sentadilla frontal', name_technical: 'Front Squat' },
  { code: 'EX2', name_local: 'Press de banca', name_technical: 'Barbell Bench Press' },
  { code: 'EX3', name_local: 'Sentadilla frontal con kettlebell', name_technical: 'kettlebell front squat' },
  { code: 'EX4', name_local: 'Sentadilla frontal con barra', name_technical: 'barbell front squat' },
];

describe('resolveCatalogExercise', () => {
  it('rutinas manuales: por código', () => {
    expect(resolveCatalogExercise({ code: 'EX2', name: 'Lo que sea' }, catalog).code).toBe('EX2');
  });
  it('planes IA: nombre "Español (English)" casa por cualquiera de las dos partes', () => {
    expect(resolveCatalogExercise({ name: 'Sentadilla Frontal (Front Squat)' }, catalog).code).toBe('EX1');
    expect(resolveCatalogExercise({ name: 'Press de Banca' }, catalog).code).toBe('EX2');
  });
  it('por palabras: "Front Squat" casa con la variante más básica del dataset', () => {
    const cat = catalog.filter(c => c.code !== 'EX1');
    expect(resolveCatalogExercise({ name: 'Sentadilla Frontal Pesada (Front Squat)' }, cat).code).toBe('EX4');
  });
  it('una sola palabra no basta para emparejar', () => {
    expect(resolveCatalogExercise({ name: 'Press' }, catalog)).toBeNull();
  });
  it('drills de campo sin equivalente devuelven null', () => {
    expect(resolveCatalogExercise({ name: 'Pase Básico Estático y en Carrera' }, catalog)).toBeNull();
    expect(resolveCatalogExercise({ name: 'x' }, [])).toBeNull();
  });
});
