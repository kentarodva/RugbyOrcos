import { describe, it, expect } from 'vitest';
import { formatTeamCategory } from '../../context/constants';
import {
  getCategoryDistribution,
  getPhysicalAveragesByCategory,
  getIMCByCategory,
  getFracturesByCategory,
} from '../../services/statsService';

describe('formatTeamCategory helper', () => {
  it('formats raw snake_case database categories into human-readable titles', () => {
    expect(formatTeamCategory('orcos_masculina_mayor')).toBe('Masculina Mayor');
    expect(formatTeamCategory('masculina_mayor')).toBe('Masculina Mayor');
    expect(formatTeamCategory('orcos_juveniles_masculina')).toBe('Juveniles Masculina');
    expect(formatTeamCategory('juveniles_masculina')).toBe('Juveniles Masculina');
    expect(formatTeamCategory('orcos_femenina_mayor')).toBe('Femenina Mayor');
    expect(formatTeamCategory('femenina_mayor')).toBe('Femenina Mayor');
    expect(formatTeamCategory('orcos_juveniles_femenina')).toBe('Juveniles Femenina');
    expect(formatTeamCategory('juveniles_femenina')).toBe('Juveniles Femenina');
  });

  it('handles empty, null, or fallback categories cleanly', () => {
    expect(formatTeamCategory(null)).toBe('Sin Categoría');
    expect(formatTeamCategory('')).toBe('Sin Categoría');
    expect(formatTeamCategory('sin_categoria')).toBe('Sin Categoría');
    expect(formatTeamCategory('otros')).toBe('Otros');
    expect(formatTeamCategory('orcos_m18_especial')).toBe('M18 Especial');
  });
});

describe('statsService with formatted categories', () => {
  const samplePlayers = [
    { id: '1', name: 'Grommash', teamCategory: 'orcos_masculina_mayor', weight: 105, height: 1.88, had_fractures: true },
    { id: '2', name: 'Thrall', teamCategory: 'orcos_masculina_mayor', weight: 95, height: 1.82, had_fractures: false },
    { id: '3', name: 'Garona', teamCategory: 'orcos_femenina_mayor', weight: 68, height: 1.68, had_fractures: false },
    { id: '4', name: 'Jaina', teamCategory: 'femenina_mayor', weight: 62, height: 1.65, had_fractures: true },
    { id: '5', name: 'Anduin', teamCategory: 'orcos_juveniles_masculina', weight: 75, height: 1.78, had_fractures: false },
    { id: '6', name: 'Valeera', teamCategory: 'juveniles_femenina', weight: 58, height: 1.62, had_fractures: false },
  ];

  it('getCategoryDistribution returns formatted labels', () => {
    const dist = getCategoryDistribution(samplePlayers);
    const labels = dist.map(d => d.label);
    expect(labels).toContain('Masculina Mayor');
    expect(labels).toContain('Femenina Mayor');
    expect(labels).toContain('Juveniles Masculina');
    expect(labels).toContain('Juveniles Femenina');
    expect(labels).not.toContain('masculina_mayor');
    expect(labels).not.toContain('juveniles_femenin');
  });

  it('getPhysicalAveragesByCategory groups by formatted category', () => {
    const averages = getPhysicalAveragesByCategory(samplePlayers);
    const weightLabels = averages.weightData.map(d => d.label);
    expect(weightLabels).toContain('Masculina Mayor');
    expect(weightLabels).toContain('Femenina Mayor');
    expect(weightLabels).not.toContain('orcos_masculina_mayor');
  });

  it('getIMCByCategory returns clean category labels', () => {
    const imc = getIMCByCategory(samplePlayers);
    const labels = imc.map(d => d.label);
    expect(labels).toContain('Masculina Mayor');
    expect(labels).not.toContain('masculina_mayor');
  });

  it('getFracturesByCategory returns clean category labels', () => {
    const fractures = getFracturesByCategory(samplePlayers);
    const labels = fractures.map(d => d.label);
    expect(labels).toContain('Masculina Mayor');
    expect(labels).toContain('Femenina Mayor');
  });
});
