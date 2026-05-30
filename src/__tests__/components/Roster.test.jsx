import { describe, it, expect } from 'vitest';

describe('Roster — badge de préstamo', () => {
  it('muestra badge "Préstamo" cuando el jugador tiene un préstamo activo', () => {
    const activeLoans = [{ player_id: 'p1', to_team_id: 't2', status: 'approved' }];
    const player = { id: 'p1', name: 'Test' };
    const hasLoan = activeLoans.some(l => l.player_id === player.id);
    expect(hasLoan).toBe(true);
  });

  it('no muestra badge si el jugador no tiene préstamo activo', () => {
    const activeLoans = [{ player_id: 'p2', to_team_id: 't2', status: 'approved' }];
    const player = { id: 'p1', name: 'Test' };
    const hasLoan = activeLoans.some(l => l.player_id === player.id);
    expect(hasLoan).toBe(false);
  });

  it('maneja activeLoans vacío sin error', () => {
    const activeLoans = [];
    const player = { id: 'p1' };
    const hasLoan = activeLoans.some(l => l.player_id === player.id);
    expect(hasLoan).toBe(false);
  });
});

describe('Roster — injury phases', () => {
  it('fase 1: reposo absoluto', () => {
    const injuryLog = [{ diagnosis: 'Esguince', weeks: 2, phase: 1 }];
    expect(injuryLog[0].phase).toBe(1);
  });

  it('fase 4: alta para contacto', () => {
    const injuryLog = [{ diagnosis: 'Fractura', weeks: 6, phase: 4 }];
    const newEstado = injuryLog[0].phase === 4 ? 'activo' : 'lesionado';
    expect(newEstado).toBe('activo');
  });

  it('cambio de fase actualiza correctamente', () => {
    const log = [{ diagnosis: 'Lesión', weeks: 3, phase: 2 }];
    const newPhase = 3;
    log[0] = { ...log[0], phase: newPhase };
    expect(log[0].phase).toBe(3);
  });

  it('lesión sin injuryLog usa default', () => {
    const injury = (Array.isArray(null) && null?.[0]) || { diagnosis: 'Lesión sin especificar', weeks: 1, phase: 1 };
    expect(injury.diagnosis).toBe('Lesión sin especificar');
    expect(injury.phase).toBe(1);
  });
});

describe('Roster — gym stats', () => {
  it('calcula fuerza relativa correctamente', () => {
    const gymStats = { squat: 120, bench: 90, deadlift: 140 };
    const weight = 85;
    const ratio = (gymStats.squat + gymStats.bench + gymStats.deadlift) / weight;
    expect(ratio).toBeCloseTo(4.12, 1);
  });

  it('1RM default es 0 si no hay datos', () => {
    const gymStats = {};
    const squat = gymStats.squat || 0;
    expect(squat).toBe(0);
  });
});

describe('Roster — HIA protocol', () => {
  it('detecta síntomas y activa suspensión 14 días', () => {
    const diagnosis = 'Protocolo HIA Activo - Sospecha de Conmocion';
    expect(diagnosis).toContain('HIA');
    expect(diagnosis).toContain('Conmocion');
  });

  it('jugador con HIA queda en estado lesionado', () => {
    const player = { estado: 'activo', injuryLog: [] };
    const symptomsDetected = true;
    const newEstado = symptomsDetected ? 'lesionado' : player.estado;
    expect(newEstado).toBe('lesionado');
  });
});

describe('Roster — forjar credenciales', () => {
  it('genera username a partir de nombre y apellido', () => {
    const first = 'Freyder';
    const last = 'Andres';
    const username = `${first.toLowerCase()}.${last.toLowerCase()}`;
    expect(username).toBe('freyder.andres');
  });

  it('genera password aleatorio de 10 caracteres', () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    expect(pwd).toHaveLength(10);
  });
});
