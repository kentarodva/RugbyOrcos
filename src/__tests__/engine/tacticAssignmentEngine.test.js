import { describe, it, expect } from 'vitest';
import { autoAssignLineup } from '../../engine/tacticAssignmentEngine';

const makePlayers = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    status: 'activo',
    position_id: 1 + (i % 15),
    attributes: { force: 20 + ((i * 13) % 80), speed: 20 + ((i * 17) % 80), stamina: 50, technique: 60 },
  }));

describe('autoAssignLineup', () => {
  it('fills all 15 union slots with distinct players when there are more players than slots', () => {
    const players = makePlayers(40);
    const lineup = autoAssignLineup(players, {}, 'union', [], { limit: 10 });

    expect(Object.keys(lineup).map(Number).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1),
    );
    expect(new Set(Object.values(lineup)).size).toBe(15);
  }, 2000);

  it('puts each player in their natural position when attributes are equal', () => {
    const players = makePlayers(15).map((p) => ({ ...p, attributes: { force: 50, speed: 50, stamina: 50, technique: 50 } }));
    const lineup = autoAssignLineup(players, {}, 'union', [], {});

    for (const [slot, playerId] of Object.entries(lineup)) {
      expect(players.find((p) => p.id === playerId).position_id).toBe(Number(slot));
    }
  }, 2000);

  it('assigns only the 7 sevens slots', () => {
    const lineup = autoAssignLineup(makePlayers(20), {}, 'sevens', [], {});
    expect(Object.keys(lineup).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 9, 10, 11, 12]);
  }, 2000);
});
