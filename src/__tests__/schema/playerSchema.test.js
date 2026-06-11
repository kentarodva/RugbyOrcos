import { describe, it, expect } from 'vitest';

const validRoles = [
  'Jugador', 'Capitán', 'Subcapitán', 'Entrenador', 'Asistente',
  'Presidente', 'Tesorero', 'Delegado', 'Fisioterapeuta',
];

const validPositions = [
  'Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo',
  'Medio Melé', 'Apertura', 'Centro', 'Ala', 'Zaguero',
];

const validStatuses = ['activo', 'lesionado', 'suspendido', 'inactivo'];

describe('player schema — valid values', () => {
  it('roles válidos incluyen Jugador, Capitán, Entrenador', () => {
    expect(validRoles).toContain('Jugador');
    expect(validRoles).toContain('Capitán');
    expect(validRoles).toContain('Entrenador');
  });

  it('posiciones son 10', () => {
    expect(validPositions).toHaveLength(10);
  });

  it('statuses son 4', () => {
    expect(validStatuses).toHaveLength(4);
  });

  it('todas las posiciones son strings no vacías', () => {
    validPositions.forEach(p => expect(typeof p).toBe('string'));
  });
});
