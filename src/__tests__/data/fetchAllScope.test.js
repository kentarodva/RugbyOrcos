import { describe, it, expect, vi, beforeEach } from 'vitest';

// Records which filters each table query received.
const calls = {};
vi.mock('../../supabaseClient.js', () => {
  const makeQuery = (table) => {
    calls[table] = [];
    const q = {
      eq: (col, val) => { calls[table].push(['eq', col, val]); return q; },
      ilike: (col, val) => { calls[table].push(['ilike', col, val]); return q; },
      then: (resolve) => resolve({ data: [], error: null }),
    };
    return q;
  };
  return { supabase: { from: (table) => ({ select: () => makeQuery(table) }) } };
});

const { default: apisupabase } = await import('../../data/supabaseApi.js');

const TABLES = ['schedule_events', 'championships', 'finances', 'inventory', 'fixtures', 'rivals', 'future_fixtures'];

describe('fetchAll — what each role loads', () => {
  beforeEach(() => { for (const k of Object.keys(calls)) delete calls[k]; });

  it.each([2, 3])('staff tier %i with no team or scope loads the whole club, not only what they created', async (tier) => {
    await apisupabase.fetchAll('coach-1', tier, null, null);
    for (const t of TABLES) expect(calls[t], t).toEqual([]);
  });

  it('staff with a club_scope stays limited to that division', async () => {
    await apisupabase.fetchAll('coach-1', 3, 'orcos_femenina_mayor', null);
    expect(calls.schedule_events).toEqual([['ilike', 'team_category', 'orcos_femenina_mayor%']]);
    expect(calls.rivals).toEqual([]);
  });

  it('a player only gets their own finances', async () => {
    await apisupabase.fetchAll('player-1', 4, null, null);
    expect(calls.finances).toEqual([['eq', 'user_id', 'player-1']]);
    expect(calls.schedule_events).toEqual([]);
  });
});
