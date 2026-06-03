import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../data/supabaseApi.js', () => ({
  default: { deleteEntity: vi.fn() },
}));

vi.mock('../../../supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock('../../../utils/errorHandler', () => ({
  handleError: vi.fn(), wrapCatch: vi.fn((_ctx, _opts) => () => {}),
}));

vi.mock('../../../utils/dates.js', () => ({
  formatLocalDate: vi.fn((_date, _opts) => 'sábado, 31 de mayo de 2026'),
}));

vi.mock('../../../context/constants', () => ({
  SYSTEM_ROLES: { JUGADOR: 'jugador' },
  EQUIPOS_LABELS: { masculina_mayor: 'Masculina Mayor' },
}));

const apisupabaseModule = await import('../../../data/supabaseApi.js');
const mockDeleteEntity = apisupabaseModule.default.deleteEntity;
mockDeleteEntity.mockResolvedValue();

const { useSchedule } = await import('../../../context/hooks/useSchedule.js');

describe('useSchedule — addScheduleEvent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function setup() {
    const sendLocalNotification = vi.fn();
    const scheduleReminder = vi.fn();
    const pushEntityToSupabase = vi.fn();
    const user = { id: 'user-1' };

    const { result } = renderHook(() =>
      useSchedule('masculina_mayor', sendLocalNotification, scheduleReminder, pushEntityToSupabase, user)
    );

    return { result, sendLocalNotification, scheduleReminder, pushEntityToSupabase, user };
  }

  it('agrega evento sin recurrencia', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addScheduleEvent({
        title: 'Entreno', date: '2026-06-01', time: '18:00',
        location: 'Cancha', type: 'entrenamiento', recurrence: 'none',
      });
    });

    expect(result.current.schedule).toHaveLength(1);
    expect(result.current.schedule[0].title).toBe('Entreno');
     expect(result.current.schedule[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.current.schedule[0].date).toBe('2026-06-01');
    expect(result.current.schedule[0].recurrenceGroup).toBeNull();
  });

  it('agrega 4 eventos semanales con mismo recurrenceGroup', async () => {
    const { result } = setup();
    const rg = 'rg_fijo-test-123';

    await act(async () => {
      await result.current.addScheduleEvent({
        title: 'Semanal', date: '2026-06-01', time: '18:00',
        location: 'Cancha', type: 'entrenamiento', recurrence: 'semanal',
        recurrenceGroup: rg,
      });
    });

    expect(result.current.schedule).toHaveLength(4);
    expect(result.current.schedule[0].date).toBe('2026-06-01');
    expect(result.current.schedule[1].date).toBe('2026-06-08');
    expect(result.current.schedule[2].date).toBe('2026-06-15');
    expect(result.current.schedule[3].date).toBe('2026-06-22');
    result.current.schedule.forEach(e => {
      expect(e.recurrenceGroup).toBe(rg);
    });
  });

  it('agrega 2 eventos quincenales', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addScheduleEvent({
        title: 'Quincenal', date: '2026-06-01', time: '18:00',
        location: 'Cancha', type: 'entrenamiento', recurrence: 'quincenal',
      });
    });

    expect(result.current.schedule).toHaveLength(2);
    expect(result.current.schedule[0].date).toBe('2026-06-01');
    expect(result.current.schedule[1].date).toBe('2026-06-15');
  });

  it('llama supabase.upsert por cada evento', async () => {
    const { result } = setup();
    const { supabase } = await import('../../../supabaseClient.js');

    await act(async () => {
      await result.current.addScheduleEvent({
        title: 'Sync Test', date: '2026-06-01', time: '18:00',
        location: 'X', type: 'entrenamiento', recurrence: 'semanal',
      });
    });

    expect(supabase.from).toHaveBeenCalledWith('schedule_events');
  });

  it('sanitiza title y location', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addScheduleEvent({
        title: '<b>Entreno</b>', date: '2026-06-01', time: '18:00',
        location: '<script>hack</script>', type: 'entrenamiento', recurrence: 'none',
      });
    });

    expect(result.current.schedule[0].title).toBe('bEntreno/b');
    expect(result.current.schedule[0].location).toBe('scripthack/script');
  });

  it('usa defaults para location y mapsLink', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addScheduleEvent({
        title: 'Minimo', date: '2026-06-01', time: '18:00',
        recurrence: 'none',
      });
    });

    expect(result.current.schedule[0].location).toBeUndefined();
    expect(result.current.schedule[0].mapsLink).toBe('');
    expect(result.current.schedule[0].type).toBe('entrenamiento');
  });
});

describe('useSchedule — deleteScheduleEvent', () => {
  beforeEach(() => {
    localStorage.clear();
    mockDeleteEntity.mockReset();
    mockDeleteEntity.mockResolvedValue();
  });

  function setup() {
    const sendLocalNotification = vi.fn();
    const scheduleReminder = vi.fn();
    const pushEntityToSupabase = vi.fn();
    const user = { id: 'user-1' };

    const { result } = renderHook(() =>
      useSchedule('masculina_mayor', sendLocalNotification, scheduleReminder, pushEntityToSupabase, user)
    );

    return { result, user };
  }

  it('elimina evento del estado', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addScheduleEvent({
        title: 'Borrar', date: '2026-06-01', time: '18:00',
        location: 'X', type: 'entrenamiento', recurrence: 'none',
      });
    });

    const eventId = result.current.schedule[0].id;

    await act(async () => {
      result.current.deleteScheduleEvent(eventId);
    });

    expect(result.current.schedule).toHaveLength(0);
  });

  it('no llama deleteEntity si no hay user', async () => {
    const { result } = renderHook(() =>
      useSchedule('masculina_mayor', vi.fn(), vi.fn(), vi.fn(), null)
    );

    await act(async () => {
      await result.current.addScheduleEvent({
        title: 'No user', date: '2026-06-01', time: '18:00',
        location: 'X', type: 'entrenamiento', recurrence: 'none',
      });
    });

    const eventId = result.current.schedule[0].id;

    await act(async () => {
      result.current.deleteScheduleEvent(eventId);
    });

    expect(mockDeleteEntity).not.toHaveBeenCalled();
  });
});

describe('useSchedule — generateWhatsAppMessage', () => {
  function setup() {
    const { result } = renderHook(() =>
      useSchedule('masculina_mayor', vi.fn(), vi.fn(), vi.fn(), { id: 'u1' })
    );

    return { result };
  }

  it('genera mensaje de convocatoria con formato esperado', () => {
    const { result } = setup();

    const msg = result.current.generateWhatsAppMessage({
      title: 'Entreno', date: '2026-05-31', time: '18:00',
      location: 'Cancha de Rugby', mapsLink: 'https://goo.gl/maps/abc',
    });

    expect(msg).toContain('CONVOCATORIA');
    expect(msg).toContain('sábado, 31 de mayo de 2026');
    expect(msg).toContain('Cancha de Rugby');
    expect(msg).toContain('18:00');
    expect(msg).toContain('Masculina Mayor');
    expect(msg).toContain('#RugbyOrcos');
  });
});
