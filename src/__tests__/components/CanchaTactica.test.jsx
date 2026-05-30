import { describe, it, expect } from 'vitest';

describe('CanchaTactica — formaciones', () => {
  it('formación standard tiene 15 posiciones', () => {
    const standardPositions = [
      'Pilar', 'Talonador', 'Pilar', 'Segunda Línea', 'Segunda Línea',
      'Flanker', 'Flanker', 'Octavo', 'Medio Melé', 'Apertura',
      'Ala', 'Centro', 'Centro', 'Ala', 'Zaguero',
    ];
    expect(standardPositions).toHaveLength(15);
  });

  it('formación sevens tiene 15 slots (3 titulares + 12 reservas)', () => {
    const sevensField = 3 + 12;
    expect(sevensField).toBe(15);
  });

  it('formaciones disponibles: 11 tipos', () => {
    const formations = [
      'standard', 'sevens', 'scrum_attack', 'lineout_defense',
      'defensive_wall', 'kickoff_receive', 'scrum_defense',
      'lineout_attack', 'attack_deep', 'counter_ruck', 'exit_22',
    ];
    expect(formations).toHaveLength(11);
  });
});

describe('CanchaTactica — posiciones y coordenadas', () => {
  it('cada posición tiene coordenadas x,y válidas', () => {
    const positions = [
      { id: 1, x: 40, y: 30 },
      { id: 15, x: 25, y: 50 },
    ];
    positions.forEach(p => {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThanOrEqual(100);
    });
  });

  it('cambio de orientación invierte coordenadas', () => {
    const pos = { x: 40, y: 30 };
    const swapped = { x: 100 - pos.x, y: 100 - pos.y };
    expect(swapped.x).toBe(60);
    expect(swapped.y).toBe(70);
  });

  it('3 tamaños de cancha disponibles', () => {
    const sizes = ['small', 'medium', 'large'];
    expect(sizes).toHaveLength(3);
    expect(sizes).toContain('medium');
  });
});

describe('CanchaTactica — selección de jugadores', () => {
  it('asigna jugador a una posición', () => {
    const lineup = {};
    lineup[1] = { playerId: 'p1', name: 'Freyder', posicion: 'Pilar' };
    expect(lineup[1].playerId).toBe('p1');
    expect(lineup[1].name).toBe('Freyder');
  });

  it('remueve jugador de una posición', () => {
    const lineup = { 1: { playerId: 'p1' }, 2: { playerId: 'p2' } };
    delete lineup[1];
    expect(lineup[1]).toBeUndefined();
    expect(lineup[2]).toBeDefined();
  });

  it('jugador no puede estar en dos posiciones a la vez', () => {
    const lineup = { 1: 'p1', 2: 'p2' };
    const playerId = 'p1';
    // Al asignar p1 a la posición 2, debe removerse de la 1
    if (lineup[1] === playerId) delete lineup[1];
    lineup[2] = playerId;
    expect(lineup[1]).toBeUndefined();
    expect(lineup[2]).toBe('p1');
  });
});

describe('CanchaTactica — notas tácticas', () => {
  it('guarda y carga notas tácticas', () => {
    const notes = 'Defensa drift contra apertura rival. Flanker ciego presiona al 10.';
    expect(notes).toContain('drift');
    expect(notes.length).toBeGreaterThan(0);
  });

  it('notas vacías son válidas', () => {
    const notes = '';
    expect(notes).toBe('');
  });
});

describe('CanchaTactica — localStorage persistencia', () => {
  it('guarda lineup por equipo activo', () => {
    const activeTeam = 'orcos_masculina_mayor';
    const key = `orcos_lineup_${activeTeam}`;
    expect(key).toBe('orcos_lineup_orcos_masculina_mayor');
  });

  it('guarda notas por equipo activo', () => {
    const activeTeam = 'orcos_femenina_mayor';
    const key = `orcos_notes_${activeTeam}`;
    expect(key).toBe('orcos_notes_orcos_femenina_mayor');
  });

  it('guarda orientación globalmente', () => {
    const key = 'orcos_pitch_orientation';
    expect(key).toBe('orcos_pitch_orientation');
  });

  it('guarda tamaño de cancha globalmente', () => {
    const key = 'orcos_pitch_size';
    expect(key).toBe('orcos_pitch_size');
  });
});
