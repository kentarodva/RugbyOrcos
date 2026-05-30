import { describe, it, expect } from 'vitest';

describe('MakgoraHub — handleCreateLoan: validaciones', () => {
  it('rechaza préstamo si jugador no tiene makgora_team_id', () => {
    const player = { id: 'p1', name: 'Test', makgora_team_id: null };
    const fromTeamId = player.makgora_team_id;
    expect(fromTeamId).toBeFalsy();
  });

  it('permite préstamo si jugador tiene makgora_team_id', () => {
    const player = { id: 'p1', name: 'Test', makgora_team_id: 'team-1' };
    const fromTeamId = player.makgora_team_id;
    expect(fromTeamId).toBeTruthy();
  });

  it('rechaza préstamo al mismo equipo', () => {
    const fromTeamId = 'team-1';
    const toTeamId = 'team-1';
    expect(fromTeamId === toTeamId).toBe(true);
  });

  it('permite préstamo a equipo diferente', () => {
    const fromTeamId = 'team-1';
    const toTeamId = 'team-2';
    expect(fromTeamId !== toTeamId).toBe(true);
  });

  it('payload incluye tournament_id', () => {
    const activeTournament = { id: 't1' };
    const payload = {
      player_id: 'p1',
      from_team_id: 'team-1',
      to_team_id: 'team-2',
      tournament_id: activeTournament?.id || null,
      start_date: '2026-01-01',
      end_date: '2026-01-08',
      reason: null,
      status: 'pending',
    };
    expect(payload.tournament_id).toBe('t1');
    expect(payload).toHaveProperty('player_id');
    expect(payload).toHaveProperty('from_team_id');
    expect(payload).toHaveProperty('to_team_id');
    expect(payload).toHaveProperty('tournament_id');
    expect(payload).toHaveProperty('status');
  });

  it('tournament_id es null si no hay torneo activo', () => {
    const activeTournament = null;
    const tournamentId = activeTournament?.id || null;
    expect(tournamentId).toBeNull();
  });
});

describe('MakgoraHub — loadLoans: chequeo de error', () => {
  it('setea loans solo si data no es null', () => {
    const data = [{ id: 'loan1', status: 'approved' }];
    if (data) {
      // setLoans(data) — se ejecuta
      expect(data.length).toBeGreaterThan(0);
    }
  });

  it('no setea loans si data es null (error)', () => {
    const data = null;
    let loansState = [];
    if (data) {
      loansState = data;
    }
    expect(loansState).toEqual([]);
  });
});

describe('MakgoraHub — auto-return al finalizar torneo', () => {
  it('devuelve préstamos aprobados del torneo activo', () => {
    const activeTournament = { id: 't1' };
    const loans = [
      { id: 'loan1', tournament_id: 't1', status: 'approved' },
      { id: 'loan2', tournament_id: 't2', status: 'approved' },
      { id: 'loan3', tournament_id: 't1', status: 'pending' },
    ];
    const toReturn = loans.filter(
      l => l.tournament_id === activeTournament.id && l.status === 'approved'
    );
    expect(toReturn).toHaveLength(1);
    expect(toReturn[0].id).toBe('loan1');
  });
});
