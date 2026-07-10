import { describe, it, expect } from 'vitest';

// matchesPlayerScope logic extracted for pure testing
function matchesPlayerScope(player, event) {
  if (!player) return false;
  if (event.teamCategory === player.teamCategory) return true;
  if (event.teamId && player.teamId && event.teamId === player.teamId) return true;
  if (event.scopeType === 'all') return true;
  if (event.scopeType === 'makgora_team' && event.scopeValue?.makgora_team_id) {
    return player.makgora_team_id === event.scopeValue.makgora_team_id;
  }
  return false;
}

const TEAM_A_UUID = 'b02dd3b4-baa2-4d0a-9d42-68ce930f7742';
const TEAM_B_UUID = 'e6278039-88c1-43f9-8903-8fce906b2da5';
const MAKGORA_TEAM_1 = '11111111-1111-4111-1111-111111111111';
const MAKGORA_TEAM_2 = '22222222-2222-4222-2222-222222222222';

const player = {
  id: 'p1',
  name: 'Test Player',
  teamCategory: 'orcos_masculina_mayor',
  teamId: TEAM_A_UUID,
  makgora_team_id: MAKGORA_TEAM_1,
};

describe('matchesPlayerScope — teamCategory (backward compat)', () => {
  it('retorna true cuando teamCategory coincide', () => {
    const event = { teamCategory: 'orcos_masculina_mayor', scopeType: 'division' };
    expect(matchesPlayerScope(player, event)).toBe(true);
  });

  it('retorna false cuando teamCategory NO coincide', () => {
    const event = { teamCategory: 'orcos_femenina_mayor', scopeType: 'division' };
    expect(matchesPlayerScope(player, event)).toBe(false);
  });
});

describe('matchesPlayerScope — teamId UUID', () => {
  it('retorna true cuando teamId UUID coincide', () => {
    const event = {
      teamCategory: 'orcos_masculina_mayor',
      teamId: TEAM_A_UUID,
      scopeType: 'division',
    };
    expect(matchesPlayerScope(player, event)).toBe(true);
  });

  it('retorna false cuando teamId UUID NO coincide y teamCategory tampoco', () => {
    const event = {
      teamCategory: 'orcos_femenina_mayor',
      teamId: TEAM_B_UUID,
      scopeType: 'division',
    };
    expect(matchesPlayerScope(player, event)).toBe(false);
  });

  it('retorna true por teamCategory aunque teamId sea diferente', () => {
    const event = {
      teamCategory: 'orcos_masculina_mayor',
      teamId: TEAM_B_UUID,
      scopeType: 'division',
    };
    expect(matchesPlayerScope(player, event)).toBe(true);
  });
});

describe('matchesPlayerScope — scopeType all', () => {
  it('retorna true cuando scopeType es "all" sin importar team', () => {
    const event = { teamCategory: 'orcos_femenina_mayor', scopeType: 'all' };
    expect(matchesPlayerScope(player, event)).toBe(true);
  });
});

describe('matchesPlayerScope — makgora_team (BUG FIX)', () => {
  it('retorna true cuando makgora_team_id coincide', () => {
    const event = {
      teamCategory: 'orcos_femenina_mayor',
      scopeType: 'makgora_team',
      scopeValue: { makgora_team_id: MAKGORA_TEAM_1 },
    };
    expect(matchesPlayerScope(player, event)).toBe(true);
  });

  it('retorna false cuando makgora_team_id NO coincide', () => {
    const event = {
      teamCategory: 'orcos_femenina_mayor',
      scopeType: 'makgora_team',
      scopeValue: { makgora_team_id: MAKGORA_TEAM_2 },
    };
    expect(matchesPlayerScope(player, event)).toBe(false);
  });

  it('retorna false cuando scopeValue no tiene makgora_team_id', () => {
    const event = {
      teamCategory: 'orcos_femenina_mayor',
      scopeType: 'makgora_team',
      scopeValue: {},
    };
    expect(matchesPlayerScope(player, event)).toBe(false);
  });
});

describe('matchesPlayerScope — edge cases', () => {
  it('retorna false cuando player es null', () => {
    expect(matchesPlayerScope(null, { scopeType: 'all' })).toBe(false);
  });

  it('retorna false cuando player es undefined', () => {
    expect(matchesPlayerScope(undefined, { scopeType: 'all' })).toBe(false);
  });

  it('retorna true por teamCategory cuando teamId es undefined en event', () => {
    const event = { teamCategory: 'orcos_masculina_mayor', scopeType: 'division' };
    expect(matchesPlayerScope(player, event)).toBe(true);
  });

  it('no falla cuando player no tiene makgora_team_id', () => {
    const playerNoMakgora = { ...player, makgora_team_id: undefined };
    const event = {
      teamCategory: 'orcos_femenina_mayor',
      scopeType: 'makgora_team',
      scopeValue: { makgora_team_id: MAKGORA_TEAM_1 },
    };
    expect(matchesPlayerScope(playerNoMakgora, event)).toBe(false);
  });
});
