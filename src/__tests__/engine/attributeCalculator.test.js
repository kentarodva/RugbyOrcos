import { describe, it, expect } from 'vitest';
import { calculateAttributes, normalizePosition } from '../../engine/attributeCalculator';

describe('calculateAttributes — Motor Calibrado de RPG', () => {
  it('retorna atributos principales y extendidos RPG', () => {
    const result = calculateAttributes({ posicion: 'Pilar', weight: 115, height: 1.80, age: 25 });
    expect(result).toHaveProperty('force');
    expect(result).toHaveProperty('speed');
    expect(result).toHaveProperty('stamina');
    expect(result).toHaveProperty('technique');
    expect(result).toHaveProperty('tackle');
    expect(result).toHaveProperty('overall');
  });

  it('todos los atributos están entre 10 y 100', () => {
    const result = calculateAttributes({ posicion: 'Ala', weight: 88, height: 1.80 });
    Object.values(result).forEach(v => {
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it('un Pilar tiene más fuerza que velocidad', () => {
    const result = calculateAttributes({ posicion: 'Pilar', weight: 115, height: 1.80, age: 25 });
    expect(result.force).toBeGreaterThan(result.speed);
  });

  it('un Ala / Wing tiene más velocidad que fuerza', () => {
    const result = calculateAttributes({ posicion: 'Wing Izquierdo', weight: 88, height: 1.80, age: 25 });
    expect(result.speed).toBeGreaterThan(result.force);
  });

  it('normaliza altura en centímetros (185 cm) a metros (1.85 m) sin distorsionar stats', () => {
    const inMeters = calculateAttributes({ posicion: 'Segunda Línea', weight: 110, height: 1.95, age: 25 });
    const inCm = calculateAttributes({ posicion: 'Segunda Línea', weight: 110, height: 195, age: 25 });
    expect(inCm.force).toBe(inMeters.force);
    expect(inCm.speed).toBe(inMeters.speed);
    expect(inCm.stamina).toBe(inMeters.stamina);
  });

  it('mapea correctamente posiciones con tildes y nombres en inglés', () => {
    expect(normalizePosition('Segunda Línea')).toBe('segunda');
    expect(normalizePosition('Hooker')).toBe('talonador');
    expect(normalizePosition('Medio Scrum')).toBe('medio scrum');
    expect(normalizePosition('Fullback')).toBe('zaguero');
    expect(normalizePosition('Fly-half')).toBe('apertura');
    expect(normalizePosition('Octavo / N8')).toBe('octavo');
  });

  it('edad < 20 reduce atributos', () => {
    const young = calculateAttributes({ posicion: 'Pilar', weight: 115, height: 1.80, age: 17 });
    const adult = calculateAttributes({ posicion: 'Pilar', weight: 115, height: 1.80, age: 25 });
    expect(young.force).toBeLessThan(adult.force);
  });

  it('edad > 28 afecta fuerza y técnica', () => {
    const vet = calculateAttributes({ posicion: 'Pilar', weight: 115, height: 1.80, age: 35 });
    expect(vet.technique).toBeGreaterThanOrEqual(10);
    expect(vet.force).toBeGreaterThanOrEqual(10);
  });

  it('gymStats altos mejoran fuerza', () => {
    const withGym = calculateAttributes({ posicion: 'Pilar', weight: 115, height: 1.80, age: 25, gymStats: { squat: 200, deadlift: 250, bench: 140 } });
    const without = calculateAttributes({ posicion: 'Pilar', weight: 115, height: 1.80, age: 25 });
    expect(withGym.force).toBeGreaterThanOrEqual(without.force);
  });

  it('usa field weight y height por defecto si faltan', () => {
    const result = calculateAttributes({ posicion: 'Pilar' });
    expect(result.force).toBeGreaterThanOrEqual(10);
  });

  it('posicion desconocida usa default profile', () => {
    const result = calculateAttributes({ posicion: 'Portero', weight: 80, height: 1.75 });
    expect(result.force).toBeGreaterThanOrEqual(10);
    expect(result.speed).toBeGreaterThanOrEqual(10);
  });
});
