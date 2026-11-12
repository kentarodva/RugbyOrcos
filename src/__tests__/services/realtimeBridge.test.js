import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../../supabaseClient.js', () => ({ supabase: {} }));

import { startRealtimeBridge, toBusDetail, SHARED_TABLES } from '../../services/realtimeBridge.js';
import { CONTEXT_TABLES } from '../../context/hooks/useSync.js';

function fakeClient() {
  const handlers = {};
  const channel = {
    on: vi.fn((_type, filter, cb) => { handlers[filter.table] = cb; return channel; }),
    subscribe: vi.fn(() => channel),
  };
  return {
    handlers,
    channel,
    client: { channel: vi.fn(() => channel), removeChannel: vi.fn() },
  };
}

describe('realtimeBridge', () => {
  const seen = [];
  const listener = (e) => seen.push(e.detail);
  afterEach(() => {
    window.removeEventListener('data:changed', listener);
    seen.length = 0;
  });

  it('Given an entrenador creates a training, When the change reaches a player, Then the bus receives it as remote', () => {
    const { client, handlers } = fakeClient();
    window.addEventListener('data:changed', listener);
    startRealtimeBridge('player-user', client);

    handlers.schedule_events({ table: 'schedule_events', eventType: 'INSERT', new: { id: 'ev-1', title: 'Entreno' }, old: {} });

    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ table: 'schedule_events', action: 'create', remote: true, payload: { id: 'ev-1' } });
  });

  it('subscribes to every shared table on a single channel and closes it', () => {
    const { client, channel } = fakeClient();
    const stop = startRealtimeBridge('u1', client);
    expect(client.channel).toHaveBeenCalledTimes(1);
    expect(channel.on).toHaveBeenCalledTimes(SHARED_TABLES.length);
    expect(channel.subscribe).toHaveBeenCalled();
    stop();
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
  });

  it('does nothing without a logged-in user', () => {
    const { client } = fakeClient();
    startRealtimeBridge(null, client)();
    expect(client.channel).not.toHaveBeenCalled();
  });

  it('a DELETE carries the old row (player_id included)', () => {
    const d = toBusDetail({ table: 'attendance', eventType: 'DELETE', new: {}, old: { id: 'a1', player_id: 'p1' } });
    expect(d).toMatchObject({ action: 'delete', payload: { id: 'a1', playerId: 'p1' } });
  });

  it('every table kept in ClubContext is published (otherwise it would never refresh)', () => {
    const missing = [...CONTEXT_TABLES].filter(t => !SHARED_TABLES.includes(t));
    expect(missing).toEqual([]);
  });

  it('publishes exactly the tables of migration 89', async () => {
    const fs = await import('node:fs');
    const sql = fs.readFileSync('supabase/migrations/89_realtime_publication.sql', 'utf8');
    const block = sql.slice(sql.indexOf('ARRAY['), sql.indexOf('];'));
    const inMigration = [...block.matchAll(/'([a-z_]+)'/g)].map(m => m[1]).sort();
    expect(inMigration).toEqual([...SHARED_TABLES].sort());
  });
});
