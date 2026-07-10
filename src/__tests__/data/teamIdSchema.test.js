import { describe, it, expect } from 'vitest';
import { playerSchema, scheduleEventSchema, financeRecordSchema, fixtureSchema, futureFixtureSchema, championshipSchema, inventoryItemSchema } from '../../schemas/player.js';

describe('team_id — schema validation', () => {
  const validTeamId = 'b02dd3b4-baa2-4d0a-9d42-68ce930f7742';

  it('playerSchema acepta teamId opcional', () => {
    const parsed = playerSchema.safeParse({
      id: 'p1', name: 'Test', teamCategory: 'orcos_masculina_mayor',
      teamId: validTeamId, systemRole: 'jugador', rol: 'Titular', estado: 'activo',
      attributes: { force: 50, speed: 50, stamina: 50, technique: 50 },
      contacto: { phone: '', email: '' },
      attendance: { total: 0, present: 0, late: 0, absentUnjustified: 0, absentJustified: 0 },
      memberships: { paid: 0, due: 0 },
      history: [], injuryLog: [], infractionLog: [], matchStats: [],
      wellnessLogs: [], hiaAssessments: [], workoutLog: [],
      clothingSizes: { jersey: 'M', shorts: 'M', socks: 'M' },
      gymStats: { squat: 0, bench: 0, deadlift: 0 },
      penalties: { burpees: 0, cones: false },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.teamId).toBe(validTeamId);
  });

  it('playerSchema acepta sin teamId', () => {
    const parsed = playerSchema.safeParse({
      id: 'p1', name: 'Test', teamCategory: 'orcos_masculina_mayor',
      systemRole: 'jugador', rol: 'Titular', estado: 'activo',
      attributes: { force: 50, speed: 50, stamina: 50, technique: 50 },
      contacto: { phone: '', email: '' },
      attendance: { total: 0, present: 0, late: 0, absentUnjustified: 0, absentJustified: 0 },
      memberships: { paid: 0, due: 0 },
      history: [], injuryLog: [], infractionLog: [], matchStats: [],
      wellnessLogs: [], hiaAssessments: [], workoutLog: [],
      clothingSizes: { jersey: 'M', shorts: 'M', socks: 'M' },
      gymStats: { squat: 0, bench: 0, deadlift: 0 },
      penalties: { burpees: 0, cones: false },
    });
    expect(parsed.success).toBe(true);
  });

  it('scheduleEventSchema acepta teamId', () => {
    const parsed = scheduleEventSchema.safeParse({
      id: 's1', title: 'Entreno', date: '2026-01-01', type: 'entrenamiento',
      teamId: validTeamId, teamCategory: 'orcos_masculina_mayor',
    });
    expect(parsed.success).toBe(true);
  });

  it('financeRecordSchema acepta teamId', () => {
    const parsed = financeRecordSchema.safeParse({
      id: 'f1', type: 'ingreso', desc: 'Test', amount: 100, date: '2026-01-01',
      category: 'mensualidad', teamId: validTeamId, teamCategory: 'orcos_masculina_mayor',
    });
    expect(parsed.success).toBe(true);
  });

  it('fixtureSchema acepta teamId', () => {
    const parsed = fixtureSchema.safeParse({
      id: 'f1', date: '2026-01-01', opponent: 'Rival', orcosScore: 20, opponentScore: 10,
      tries: 4, mvp: 'Player1', teamId: validTeamId, teamCategory: 'orcos_masculina_mayor',
    });
    expect(parsed.success).toBe(true);
  });

  it('futureFixtureSchema acepta teamId', () => {
    const parsed = futureFixtureSchema.safeParse({
      id: 'f1', opponent: 'Rival', date: '2026-01-01', time: '14:00', location: 'Campo',
      teamId: validTeamId, teamCategory: 'orcos_masculina_mayor',
    });
    expect(parsed.success).toBe(true);
  });

  it('championshipSchema acepta teamId', () => {
    const parsed = championshipSchema.safeParse({
      id: 'c1', name: 'Torneo', deadlineDate: '2026-06-01',
      teamId: validTeamId, teamCategory: 'orcos_masculina_mayor',
    });
    expect(parsed.success).toBe(true);
  });

  it('inventoryItemSchema acepta teamId', () => {
    const parsed = inventoryItemSchema.safeParse({
      id: 'i1', name: 'Balón', total: 10, status: 'Excelente',
      teamId: validTeamId, teamCategory: 'orcos_masculina_mayor',
    });
    expect(parsed.success).toBe(true);
  });
});
