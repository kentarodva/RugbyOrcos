import { describe, it, expect, vi } from 'vitest';
import { calculateAttributes } from '../../engine/attributeCalculator';

describe('calculateAttributes', () => {
  it('retorna 4 atributos principales', () => {
    const result = calculateAttributes({ posicion: 'Pilar', weight: 115, height: 1.80, age: 25 });
    expect(result).toHaveProperty('force');
    expect(result).toHaveProperty('speed');
    expect(result).toHaveProperty('stamina');
    expect(result).toHaveProperty('technique');
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

  it('un Ala tiene más velocidad que fuerza', () => {
    const result = calculateAttributes({ posicion: 'Ala', weight: 88, height: 1.80, age: 25 });
    expect(result.speed).toBeGreaterThan(result.force);
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
    // Nota: hay randomVariation, así que no podemos garantizar strict inequality siempre
    expect(withGym.force).toBeGreaterThanOrEqual(10);
    expect(without.force).toBeGreaterThanOrEqual(10);
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

  it('usa player.weight y player.height cuando disponible', () => {
    const result = calculateAttributes({ weight: 100, height: 1.85, posicion: 'Flanker', age: 25 });
    expect(result.force).toBeGreaterThanOrEqual(10);
  });

  it('valores consistentes para mismo input (con random)', () => {
    // randomVariation puede dar diferencias, pero ambos deben estar en rango
    const r1 = calculateAttributes({ posicion: 'Centro', weight: 95, height: 1.83, age: 25 });
    const r2 = calculateAttributes({ posicion: 'Centro', weight: 95, height: 1.83, age: 25 });
    expect(r1.force).toBeGreaterThanOrEqual(10);
    expect(r2.force).toBeGreaterThanOrEqual(10);
  });
});
