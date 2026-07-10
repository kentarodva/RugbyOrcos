import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockUpsertPlayer = vi.fn();

vi.mock('../../data/supabaseApi.js', () => ({
  default: { upsertPlayer: mockUpsertPlayer },
}));

vi.mock('../../utils/errorHandler', () => ({
  handleError: vi.fn(),
}));

const { useSyncPush } = await import('../../context/hooks/useSync.js');

describe('team_id — WRITE path (convertPlayerToSupabase)', () => {
  beforeEach(() => {
    mockUpsertPlayer.mockReset();
  });

  it('incluye team_id cuando player tiene teamId', async () => {
    const { result } = renderHook(() => useSyncPush({ id: 'user-1' }));
    const player = {
      id: 'p1', name: 'Juan Pérez',
      teamCategory: 'masculina_mayor',
      teamId: 'b02dd3b4-baa2-4d0a-9d42-68ce930f7742',
      attributes: { force: 60, speed: 70, stamina: 65, technique: 80 },
      systemRole: 'jugador',
    };

    await act(async () => {
      await result.current.pushPlayerToSupabase(player);
    });

    expect(mockUpsertPlayer).toHaveBeenCalledTimes(1);
    const payload = mockUpsertPlayer.mock.calls[0][0];
    expect(payload.team_id).toBe('b02dd3b4-baa2-4d0a-9d42-68ce930f7742');
    expect(payload.team_category).toBe('masculina_mayor');
  });

  it('team_id es undefined cuando player no tiene teamId', async () => {
    const { result } = renderHook(() => useSyncPush({ id: 'user-1' }));
    const player = {
      id: 'p1', name: 'Juan Pérez',
      teamCategory: 'masculina_mayor',
      attributes: { force: 60, speed: 70, stamina: 65, technique: 80 },
      systemRole: 'jugador',
    };

    await act(async () => {
      await result.current.pushPlayerToSupabase(player);
    });

    const payload = mockUpsertPlayer.mock.calls[0][0];
    expect(payload.team_id).toBeUndefined();
    expect(payload.team_category).toBe('masculina_mayor');
  });
});
