import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../data/supabaseApi', () => ({
  fetchTacticalPlays: vi.fn(),
  createTacticalPlay: vi.fn(),
  deleteTacticalPlay: vi.fn(),
}));

import { fetchTacticalPlays, createTacticalPlay, deleteTacticalPlay } from '../../data/supabaseApi';
import { ALL_TV_PLAYS, EXTRA_TV_PLAYS, PLAY_GROUPS, buildPlay, groupedPlays, playGroup, playTitle } from '../../components/CanchaTactica/playLibrary';
import { usePlayLibrary } from '../../components/CanchaTactica/usePlayLibrary';

describe('Pizarra example plays', () => {
  it('has the 5 original plays plus the new ones, with unique ids', () => {
    expect(ALL_TV_PLAYS.length).toBe(5 + EXTRA_TV_PLAYS.length);
    expect(EXTRA_TV_PLAYS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(ALL_TV_PLAYS.map(p => p.id)).size).toBe(ALL_TV_PLAYS.length);
  });

  it('every play belongs to a known group and every group has plays', () => {
    ALL_TV_PLAYS.forEach(p => expect(PLAY_GROUPS).toContain(playGroup(p)));
    expect(groupedPlays().map(g => g.group)).toEqual(PLAY_GROUPS);
  });

  it('new plays have full, on-pitch phases', () => {
    EXTRA_TV_PLAYS.forEach(play => {
      expect(play.phases.length).toBeGreaterThanOrEqual(3);
      play.phases.forEach(ph => {
        expect(ph.title).toBeTruthy();
        expect(ph.description).toBeTruthy();
        expect(ph.allies).toHaveLength(15);
        expect(ph.rivals).toHaveLength(15);
        [...ph.allies, ...ph.rivals, ph.ball].forEach(pt => {
          expect(pt.x).toBeGreaterThanOrEqual(0);
          expect(pt.x).toBeLessThanOrEqual(100);
          expect(pt.y).toBeGreaterThanOrEqual(0);
          expect(pt.y).toBeLessThanOrEqual(100);
        });
      });
    });
  });

  it('buildPlay carries unmentioned players forward', () => {
    const [a, b] = buildPlay([
      { title: '1', description: 'd', allies: { 10: [40, 30] } },
      { title: '2', description: 'd', allies: { 9: [20, 20] } },
    ]);
    expect(a.allies.find(p => p.id === 10)).toMatchObject({ x: 40, y: 30 });
    expect(b.allies.find(p => p.id === 10)).toMatchObject({ x: 40, y: 30 });
    expect(b.allies.find(p => p.id === 9)).toMatchObject({ x: 20, y: 20 });
  });

  it('strips the old "📺 Jugada N:" prefix from titles', () => {
    expect(playTitle({ name: '📺 Jugada 3: Defensa en Sombra' })).toBe('Defensa en Sombra');
    expect(playTitle({ name: 'Loop del 10' })).toBe('Loop del 10');
  });
});

describe('usePlayLibrary', () => {
  const phases = [{ title: 'Fase 1', allies: [], rivals: [], ball: { x: 1, y: 1 } }];

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('keeps plays on the device while the club table does not exist', async () => {
    fetchTacticalPlays.mockResolvedValue({ plays: [], available: false });
    const { result } = renderHook(() => usePlayLibrary('orcos_m', true));
    await waitFor(() => expect(result.current.where).toBe('device'));

    await act(async () => { await result.current.save('  Mi jugada  ', phases); });
    expect(createTacticalPlay).not.toHaveBeenCalled();
    expect(result.current.plays[0]).toMatchObject({ name: 'Mi jugada', local: true });
    expect(JSON.parse(window.localStorage.getItem('pizarra_plays_orcos_m'))).toHaveLength(1);

    await act(async () => { await result.current.remove(result.current.plays[0].id); });
    expect(result.current.plays).toHaveLength(0);
    expect(window.localStorage.getItem('pizarra_plays_orcos_m')).toBeNull();
  });

  it('uploads device plays once the table exists and clears them locally', async () => {
    window.localStorage.setItem('pizarra_plays_orcos_m', JSON.stringify([{ id: 'local_1', name: 'Vieja', phases, local: true }]));
    fetchTacticalPlays.mockResolvedValue({ plays: [{ id: 'r1', name: 'Club', phases }], available: true });
    createTacticalPlay.mockResolvedValue({ id: 'r2', name: 'Vieja', phases });
    const { result } = renderHook(() => usePlayLibrary('orcos_m', true));
    await waitFor(() => expect(result.current.where).toBe('club'));
    expect(createTacticalPlay).toHaveBeenCalledWith({ name: 'Vieja', scope: 'orcos_m', phases });
    expect(result.current.plays.map(p => p.id)).toEqual(['r2', 'r1']);
    expect(window.localStorage.getItem('pizarra_plays_orcos_m')).toBeNull();
  });

  it('does not try to upload for users without permission', async () => {
    window.localStorage.setItem('pizarra_plays_orcos_m', JSON.stringify([{ id: 'local_1', name: 'Vieja', phases, local: true }]));
    fetchTacticalPlays.mockResolvedValue({ plays: [], available: true });
    const { result } = renderHook(() => usePlayLibrary('orcos_m', false));
    await waitFor(() => expect(result.current.where).toBe('club'));
    expect(createTacticalPlay).not.toHaveBeenCalled();
  });

  it('saves to the club and deletes there when the table exists', async () => {
    fetchTacticalPlays.mockResolvedValue({ plays: [], available: true });
    createTacticalPlay.mockResolvedValue({ id: 'r9', name: 'Nueva', phases });
    deleteTacticalPlay.mockResolvedValue(true);
    const { result } = renderHook(() => usePlayLibrary('orcos_m', true));
    await waitFor(() => expect(result.current.where).toBe('club'));
    await act(async () => { await result.current.save('Nueva', phases); });
    expect(result.current.plays.map(p => p.id)).toEqual(['r9']);
    await act(async () => { await result.current.remove('r9'); });
    expect(deleteTacticalPlay).toHaveBeenCalledWith('r9');
    expect(result.current.plays).toHaveLength(0);
  });
});
