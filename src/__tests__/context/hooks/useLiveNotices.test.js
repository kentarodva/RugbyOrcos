import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { noticeFor, useLiveNotices } from '../../../context/hooks/useLiveNotices.js';

const player = { userId: 'u-player', playerId: 'p-1', teamCategory: 'orcos_masculina_mayor', isPlayer: true };
const coach = { userId: 'u-coach', playerId: null, teamCategory: null, isPlayer: false };
const remote = (table, action, row) => ({ table, action, remote: true, payload: { row } });

describe('noticeFor — qué aviso le llega a quién', () => {
  it('Given the entrenador publishes an announcement, When it reaches a jugador, Then he is told about it', () => {
    const n = noticeFor(remote('messages', 'create', { channel: 'announcement', sender_id: 'u-coach', text: 'Entreno suspendido' }), player);
    expect(n).toMatchObject({ kind: 'announcement', body: 'Entreno suspendido' });
  });

  it('the author of the announcement is not notified of his own message', () => {
    expect(noticeFor(remote('messages', 'create', { channel: 'announcement', sender_id: 'u-coach' }), coach)).toBeNull();
  });

  it('a direct message only notifies its receiver', () => {
    const row = { channel: 'direct', sender_id: 'u-coach', receiver_id: 'u-player', text: 'Hola' };
    expect(noticeFor(remote('messages', 'create', row), player)).toMatchObject({ kind: 'message' });
    expect(noticeFor(remote('messages', 'create', row), { ...player, userId: 'u-other' })).toBeNull();
  });

  it('a new training of my team notifies the jugador; another team does not', () => {
    const row = { user_id: 'u-coach', title: 'Entreno', type: 'entrenamiento', date: '2026-11-13', time: '19:30:00', team_category: 'orcos_masculina_mayor' };
    expect(noticeFor(remote('schedule_events', 'create', row), player)).toMatchObject({ kind: 'event', body: '13/11 19:30' });
    expect(noticeFor(remote('schedule_events', 'create', { ...row, team_category: 'orcos_femenina_mayor' }), player)).toBeNull();
  });

  it('a new match and a new play reach the jugador', () => {
    expect(noticeFor(remote('future_fixtures', 'create', { user_id: 'u-coach', opponent: 'Halcones', date: '2026-11-27' }), player))
      .toMatchObject({ kind: 'fixture', title: '🏉 Nuevo partido vs Halcones' });
    expect(noticeFor(remote('tactical_plays', 'create', { user_id: 'u-coach', name: 'Line-out 4' }), player))
      .toMatchObject({ kind: 'play', body: 'Line-out 4' });
  });

  it('being added to the squad notifies the convocated jugador only', () => {
    const row = { id: 'ff-1', user_id: 'u-coach', opponent: 'Halcones', squad: { startingXV: ['p-1'], substitutes: [] } };
    expect(noticeFor(remote('future_fixtures', 'update', row), player)).toMatchObject({ kind: 'squad', key: 'squad:ff-1' });
    expect(noticeFor(remote('future_fixtures', 'update', { ...row, squad: { startingXV: ['p-9'] } }), player)).toBeNull();
  });

  it('a pro-fondos assignment notifies only the assigned jugador', () => {
    expect(noticeFor(remote('fundraising_assignments', 'create', { player_id: 'p-1', amount_due: 20000 }), player))
      .toMatchObject({ kind: 'assignment' });
    expect(noticeFor(remote('fundraising_assignments', 'create', { player_id: 'p-2' }), player)).toBeNull();
  });

  it('staff are not spammed with trainings they see on screen, and local changes are ignored', () => {
    expect(noticeFor(remote('schedule_events', 'create', { user_id: 'u-x', title: 'E' }), coach)).toBeNull();
    expect(noticeFor({ table: 'messages', action: 'create', payload: { row: { channel: 'announcement' } } }, player)).toBeNull();
  });
});

describe('useLiveNotices', () => {
  it('notifies once per convocatoria even if the match is edited again', () => {
    const notify = vi.fn();
    const onNotice = vi.fn();
    renderHook(() => useLiveNotices(player, { notify, onNotice }));
    const detail = remote('future_fixtures', 'update', { id: 'ff-1', user_id: 'u-coach', squad: { startingXV: ['p-1'] } });
    window.dispatchEvent(new CustomEvent('data:changed', { detail }));
    window.dispatchEvent(new CustomEvent('data:changed', { detail }));
    expect(notify).toHaveBeenCalledTimes(1);
    expect(onNotice).toHaveBeenCalledWith(expect.objectContaining({ kind: 'squad' }));
  });
});
