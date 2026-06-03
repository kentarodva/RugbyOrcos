import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../data/supabaseApi.js', () => ({
  default: { deleteEntity: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../../utils/errorHandler', () => ({
  wrapCatch: vi.fn(() => () => {}),
}));

describe('useMatches — Fixtures', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addFixture agrega fixture con ID y teamCategory', async () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFixtures } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() =>
      useFixtures('orcos_masculina_mayor', notifyMock, pushMock, { id: 'user-1' })
    );

    act(() => {
      result.current.addFixture({ opponent: 'Rival FC', date: '2026-05-20', orcosScore: 32, opponentScore: 10 });
    });

    expect(result.current.fixtures).toHaveLength(1);
    const fix = result.current.fixtures[0];
    expect(fix.opponent).toBe('Rival FC');
    expect(fix.teamCategory).toBe('orcos_masculina_mayor');
    expect(fix.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(fix.rivalId).toBeNull();
  });

  it('addFixture sanitiza opponent y mvp', async () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFixtures } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() =>
      useFixtures('test', notifyMock, pushMock, { id: 'user-1' })
    );

    act(() => {
      result.current.addFixture({ opponent: '<b>XSS</b>', date: '2026-01-01', mvp: '<script>alert(1)</script>' });
    });

    const fix = result.current.fixtures[0];
    expect(fix.opponent).toBe('bXSS/b');
    expect(fix.mvp).toBe('scriptalert(1)/script');
  });

  it('addFixture pushea a Supabase', async () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFixtures } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() =>
      useFixtures('test', notifyMock, pushMock, { id: 'user-1' })
    );

    act(() => {
      result.current.addFixture({ opponent: 'Rival' });
    });

    expect(pushMock).toHaveBeenCalledWith('fixtures', expect.objectContaining({ opponent: 'Rival' }));
  });

  it('deleteFixture remueve del estado y llama deleteEntity con user', async () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFixtures } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() =>
      useFixtures('test', notifyMock, pushMock, { id: 'user-1' })
    );

    act(() => { result.current.addFixture({ opponent: 'ToDelete' }); });
    const id = result.current.fixtures[0].id;

    act(() => { result.current.deleteFixture(id); });

    expect(result.current.fixtures).toHaveLength(0);
  });

  it('deleteFixture no llama deleteEntity sin user', async () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFixtures } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() =>
      useFixtures('test', notifyMock, pushMock, null)
    );

    act(() => { result.current.addFixture({ opponent: 'Test' }); });
    const id = result.current.fixtures[0].id;
    act(() => { result.current.deleteFixture(id); });

    expect(result.current.fixtures).toHaveLength(0);
  });
});

describe('useMatches — Rivals', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addRival agrega rival con ID', async () => {
    const pushMock = vi.fn();
    const { useRivals } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() => useRivals(pushMock, { id: 'user-1' }));

    act(() => {
      result.current.addRival({ name: 'Tigres RC', colors: 'Amarillo' });
    });

    expect(result.current.rivals).toHaveLength(1);
    const rival = result.current.rivals[0];
    expect(rival.name).toBe('Tigres RC');
    expect(rival.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('addRival sanitiza todos los campos', async () => {
    const pushMock = vi.fn();
    const { useRivals } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() => useRivals(pushMock, { id: 'user-1' }));

    act(() => {
      result.current.addRival({
        name: '<b>Tigres</b>',
        colors: '<script>alert(1)</script>',
        contact: '<img src=x>',
        notes: '<iframe>'
      });
    });

    const rival = result.current.rivals[0];
    expect(rival.name).not.toContain('<');
    expect(rival.colors).not.toContain('<');
    expect(rival.contact).not.toContain('<');
    expect(rival.notes).not.toContain('<');
  });

  it('updateRival actualiza campos', async () => {
    const pushMock = vi.fn();
    const { useRivals } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() => useRivals(pushMock, { id: 'user-1' }));

    act(() => { result.current.addRival({ name: 'Original' }); });
    const id = result.current.rivals[0].id;

    act(() => { result.current.updateRival({ id, name: 'Modificado', colors: 'Rojo' }); });

    expect(result.current.rivals[0].name).toBe('Modificado');
    expect(result.current.rivals[0].colors).toBe('Rojo');
    expect(pushMock).toHaveBeenCalledTimes(2);
  });

  it('deleteRival remueve del estado', async () => {
    const pushMock = vi.fn();
    const { useRivals } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() => useRivals(pushMock, { id: 'user-1' }));

    act(() => { result.current.addRival({ name: 'ToDelete' }); });
    const id = result.current.rivals[0].id;
    act(() => { result.current.deleteRival(id); });

    expect(result.current.rivals).toHaveLength(0);
  });
});

describe('useMatches — Future Fixtures', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addFutureFixture agrega fixture futuro con ID', async () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFutureFixtures } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() =>
      useFutureFixtures('orcos_test', notifyMock, pushMock, { id: 'user-1' })
    );

    act(() => {
      result.current.addFutureFixture({ opponent: 'Rival Futuro', date: '2026-12-25', time: '15:00' });
    });

    expect(result.current.futureFixtures).toHaveLength(1);
    const fix = result.current.futureFixtures[0];
    expect(fix.opponent).toBe('Rival Futuro');
    expect(fix.teamCategory).toBe('orcos_test');
    expect(fix.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(fix.rivalId).toBeNull();
  });

  it('addFutureFixture sanitiza opponent y envia notificacion', async () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFutureFixtures } = await import('../../../context/hooks/useMatches');
    const { result } = renderHook(() =>
      useFutureFixtures('test', notifyMock, pushMock, { id: 'user-1' })
    );

    act(() => {
      result.current.addFutureFixture({ opponent: '<b>XSS</b>', date: '2026-06-01', time: '10:00' });
    });

    expect(result.current.futureFixtures[0].opponent).toBe('bXSS/b');
    expect(notifyMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('futureFixtures', expect.objectContaining({ opponent: 'bXSS/b' }));
  });
});
