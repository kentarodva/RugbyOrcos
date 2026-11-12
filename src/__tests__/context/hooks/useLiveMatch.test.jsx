import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const rpc = vi.fn();
const startLiveMatchApi = vi.fn();
vi.mock('../../../supabaseClient.js', () => ({ supabase: { rpc: (...a) => rpc(...a) } }));
vi.mock('../../../data/supabaseApi.js', () => ({ default: { startLiveMatch: (...a) => startLiveMatchApi(...a) } }));
vi.mock('../../../utils/errorHandler', () => ({ wrapCatch: () => () => {} }));

const { useLiveMatch } = await import('../../../context/hooks/useMatches.js');

describe('useLiveMatch — partido programado → en vivo → resultado (auditoría punto 4)', () => {
  beforeEach(() => { rpc.mockReset(); startLiveMatchApi.mockReset(); });

  it('Given a scheduled match, When the coach starts it live, Then the live match is linked to it', async () => {
    startLiveMatchApi.mockResolvedValue({ data: { id: 'lm-1', status: 'live' }, error: null });
    const { result } = renderHook(() => useLiveMatch({ id: 'u-coach' }));
    await act(async () => { await result.current.startLiveMatch({ futureFixtureId: 'ff-1', opponentName: 'Halcones' }); });
    expect(startLiveMatchApi).toHaveBeenCalledWith(
      expect.objectContaining({ future_fixture_id: 'ff-1', fixture_id: null, opponent_name: 'Halcones' }), 'u-coach');
  });

  it('When the match ends, Then the database closes it (result + stats) and the screen shows the final score', async () => {
    startLiveMatchApi.mockResolvedValue({ data: { id: 'lm-1', status: 'live', orcos_score: 0, opponent_score: 0 }, error: null });
    rpc.mockResolvedValue({ data: { fixture_id: 'fx-1', orcos_score: 12, opponent_score: 7, player_stats: 3 }, error: null });
    const { result } = renderHook(() => useLiveMatch({ id: 'u-coach' }));
    await act(async () => { await result.current.startLiveMatch({ futureFixtureId: 'ff-1' }); });
    let closed;
    await act(async () => { closed = await result.current.endLiveMatch(); });
    expect(rpc).toHaveBeenCalledWith('finish_live_match', { p_match_id: 'lm-1' });
    expect(closed).toMatchObject({ orcos_score: 12, player_stats: 3 });
    expect(result.current.liveMatch).toMatchObject({ status: 'finished', fixture_id: 'fx-1', orcos_score: 12, opponent_score: 7 });
  });

  it('if the database refuses (e.g. a jugador), nothing is marked as finished', async () => {
    startLiveMatchApi.mockResolvedValue({ data: { id: 'lm-1', status: 'live' }, error: null });
    rpc.mockResolvedValue({ data: null, error: { message: 'No puedes cerrar este partido' } });
    const { result } = renderHook(() => useLiveMatch({ id: 'u-x' }));
    await act(async () => { await result.current.startLiveMatch({}); });
    let closed;
    await act(async () => { closed = await result.current.endLiveMatch(); });
    expect(closed).toBeNull();
    expect(result.current.liveMatch.status).toBe('live');
  });
});
