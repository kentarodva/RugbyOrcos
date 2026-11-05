import { describe, it, expect } from 'vitest';
import { filterCatalog, MUSCLE_GROUPS, EQUIP_GROUPS } from '../../components/workout/catalogFilters';

const ex = [
  { code: '1', name_local: 'Press de banca', name_technical: 'Barbell Bench Press', target_muscle: 'pectorals', equipment: 'barbell' },
  { code: '2', name_local: 'Curl de bíceps', name_technical: 'Dumbbell Curl', target_muscle: 'biceps', equipment: 'dumbbell' },
  { code: '3', name_local: 'Sentadilla búlgara', name_technical: 'Bulgarian Split Squat', target_muscle: 'quads', equipment: 'dumbbell' },
  { code: '4', name_local: 'Plancha', name_technical: 'Front Plank', target_muscle: 'abs', equipment: 'body weight' },
];
const codes = (list) => list.map(e => e.code);

describe('filterCatalog', () => {
  it('busca sin tildes, en español o inglés, todas las palabras', () => {
    expect(codes(filterCatalog(ex, { search: 'biceps' }))).toEqual(['2']);
    expect(codes(filterCatalog(ex, { search: 'split squat' }))).toEqual(['3']);
    expect(codes(filterCatalog(ex, { search: 'sentadilla bulgara' }))).toEqual(['3']);
  });
  it('filtra por grupo muscular y equipo combinados', () => {
    expect(codes(filterCatalog(ex, { muscle: 'piernas' }))).toEqual(['3']);
    expect(codes(filterCatalog(ex, { equip: 'mancuernas' }))).toEqual(['2', '3']);
    expect(codes(filterCatalog(ex, { muscle: 'brazos', equip: 'mancuernas' }))).toEqual(['2']);
    expect(codes(filterCatalog(ex, { equip: 'corporal', search: 'plank' }))).toEqual(['4']);
  });
  it('sin filtros devuelve todo', () => {
    expect(filterCatalog(ex)).toHaveLength(4);
  });
  it('cada valor del dataset pertenece a un solo grupo', () => {
    [MUSCLE_GROUPS, EQUIP_GROUPS].forEach(groups => {
      const all = groups.flatMap(g => g.values);
      expect(new Set(all).size).toBe(all.length);
    });
  });
});

describe('muscleLabel', () => {
  it('traduce músculos del dataset y capitaliza los desconocidos', async () => {
    const { muscleLabel } = await import('../../components/workout/catalogFilters');
    expect(muscleLabel('glutes')).toBe('Glúteos');
    expect(muscleLabel('quadriceps')).toBe('Cuádriceps');
    expect(muscleLabel('quads')).toBe('Cuádriceps');
    expect(muscleLabel('tibialis')).toBe('Tibialis');
  });
});
