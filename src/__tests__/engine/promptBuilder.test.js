import { describe, it, expect } from 'vitest';
import {
  buildChatContext, buildSystemPrompt, buildMatchAnalysisPrompt,
} from '../../engine/promptBuilder';

describe('promptBuilder — buildSystemPrompt', () => {
  it('modo general retorna prompt no vacio', () => {
    const prompt = buildSystemPrompt('general');
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain('Rugby Orcos');
    expect(prompt).toContain('español');
  });

  it('modo tactico retorna prompt no vacio con conceptos tacticos', () => {
    const prompt = buildSystemPrompt('tactico');
    expect(prompt).toBeTruthy();
    expect(prompt).toContain('TÁCTICO');
    expect(prompt).toContain('PIL');
    expect(prompt).toContain('loops');
  });

  it('modo reglas retorna prompt no vacio con referencias a World Rugby', () => {
    const prompt = buildSystemPrompt('reglas');
    expect(prompt).toBeTruthy();
    expect(prompt).toContain('ÁRBITRO');
    expect(prompt).toContain('World Rugby');
    expect(prompt).toContain('Ley');
    expect(prompt).toContain('sanción');
  });

  it('modo desconocido usa default general', () => {
    const prompt = buildSystemPrompt('modo_inexistente');
    const promptGeneral = buildSystemPrompt('general');
    expect(prompt).toBe(promptGeneral);
  });
});

describe('promptBuilder — buildChatContext', () => {
  it('retorna string vacio sin datos', () => {
    const ctx = buildChatContext({});
    expect(ctx).toBe('');
  });

  it('incluye equipo activo y rival', () => {
    const ctx = buildChatContext({
      activeTeam: 'orcos_masculina_mayor',
      opponentName: 'Tigres RC',
      players: [],
      schedule: [],
      championships: [],
      fixtures: [],
    });
    expect(ctx).toContain('Equipo activo');
    expect(ctx).toContain('Próximo rival: Tigres RC');
  });

  it('incluye roster activo con jugadores', () => {
    const ctx = buildChatContext({
      activeTeam: 'orcos_masculina_mayor',
      opponentName: '',
      players: [
        { teamCategory: 'orcos_masculina_mayor', name: 'Juan Perez', posicion: 'Pilar', estado: 'activo', camiseta: 1 },
        { teamCategory: 'orcos_femenina', name: 'Ana', posicion: 'Ala', estado: 'activo' },
      ],
      schedule: [],
      championships: [],
      fixtures: [],
    });
    expect(ctx).toContain('Roster activo');
    expect(ctx).toContain('Juan Perez');
    expect(ctx).not.toContain('Ana');
  });

  it('incluye jugadores lesionados', () => {
    const ctx = buildChatContext({
      activeTeam: 'test',
      players: [
        { teamCategory: 'test', name: 'Herido', estado: 'lesionado', injuryLog: [{ diagnosis: 'Esguince tobillo', phase: 2 }] },
      ],
      schedule: [],
      championships: [],
      fixtures: [],
    });
    expect(ctx).toContain('lesionados');
    expect(ctx).toContain('Herido');
    expect(ctx).toContain('Esguince tobillo');
    expect(ctx).toContain('Fase 2/4');
  });

  it('incluye jugadores suspendidos', () => {
    const ctx = buildChatContext({
      activeTeam: 'test',
      players: [
        { teamCategory: 'test', name: 'Suspendido', estado: 'suspendido' },
      ],
      schedule: [],
      championships: [],
      fixtures: [],
    });
    expect(ctx).toContain('suspendidos');
    expect(ctx).toContain('Suspendido');
  });

  it('incluye proximos eventos de agenda', () => {
    const ctx = buildChatContext({
      activeTeam: 'test',
      schedule: [
        { teamCategory: 'test', title: 'Entrenamiento', date: '2026-06-03', time: '08:00', location: 'Cancha' },
      ],
    });
    expect(ctx).toContain('Próximos eventos');
    expect(ctx).toContain('Entrenamiento');
  });

  it('incluye campeonatos activos', () => {
    const ctx = buildChatContext({
      activeTeam: 'test',
      championships: [
        { teamCategory: 'test', name: 'Torneo Apertura', deadlineDate: '2026-07-01' },
      ],
    });
    expect(ctx).toContain('Campeonatos activos');
    expect(ctx).toContain('Torneo Apertura');
  });

  it('incluye ultimos resultados', () => {
    const ctx = buildChatContext({
      activeTeam: 'orcos_masculina_mayor',
      fixtures: [
        { teamCategory: 'orcos_masculina_mayor', opponent: 'Rival', date: '2026-05-01', orcosScore: 28, opponentScore: 14, mvp: '' },
      ],
    });
    expect(ctx).toContain('Últimos resultados');
    expect(ctx).toContain('Victoria');
    expect(ctx).toContain('28-14');
  });
});

describe('promptBuilder — buildMatchAnalysisPrompt', () => {
  it('genera prompt de analisis con datos de partido', () => {
    const prompt = buildMatchAnalysisPrompt(
      { teamCategory: 'test', opponent: 'Tigres', orcosScore: 32, opponentScore: 10, date: '2026-05-20', tries: 4, mvp: 'Juan' },
      [],
      'Orcos'
    );
    expect(prompt).toContain('Orcos 32 - 10 Tigres');
    expect(prompt).toContain('MVP: Juan');
    expect(prompt).toContain('RESUMEN');
    expect(prompt).toContain('PUNTOS FUERTES');
  });

  it('incluye estadisticas de jugadores', () => {
    const prompt = buildMatchAnalysisPrompt(
      { teamCategory: 'test', opponent: 'Rival', orcosScore: 14, opponentScore: 7, date: '2026-06-01', tries: 2, mvp: '' },
      [
        { teamCategory: 'test', name: 'Pedro', posicion: 'Centro', camiseta: 12,
          matchStats: [{ date: '2026-06-01', tries: 1, conversions: 2, tackles: 8, turnovers: 0, mvp: true }] },
      ],
      'Orcos'
    );
    expect(prompt).toContain('Pedro');
    expect(prompt).toContain('1 tries');
    expect(prompt).toContain('[MVP]');
  });
});
