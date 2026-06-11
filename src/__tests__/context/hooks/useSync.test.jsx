import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockUpsertPlayer = vi.fn();
const mockUpsertEntity = vi.fn();

vi.mock('../../../data/supabaseApi.js', () => ({
  default: { upsertPlayer: mockUpsertPlayer, upsertEntity: mockUpsertEntity },
}));

vi.mock('../../../utils/errorHandler', () => ({
  handleError: vi.fn(),
}));

const { useSyncPush } = await import('../../../context/hooks/useSync.js');

describe('useSyncPush — pushPlayerToSupabase', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUpsertPlayer.mockReset();
  });

  it('no hace nada si no hay user', async () => {
    const { result } = renderHook(() => useSyncPush(null));

    await act(async () => {
      await result.current.pushPlayerToSupabase({ id: 'p1', name: 'Test' });
    });

    expect(mockUpsertPlayer).not.toHaveBeenCalled();
  });

  it('llama upsertPlayer con datos mapeados', async () => {
    const { result } = renderHook(() => useSyncPush({ id: 'user-1' }));

    const player = {
      id: 'p1', name: 'Juan Pérez', apodo: 'Juancho', camiseta: 10,
      rol: 'Titular', posicion: 'Apertura', estado: 'activo',
      attributes: { force: 60, speed: 70, stamina: 65, technique: 80 },
      teamCategory: 'masculina_mayor', systemRole: 'jugador',
      weight: 85, height: 1.8,
      clothingSizes: { jersey: 'L', shorts: 'L', socks: '42-44' },
      gymStats: { squat: 100, bench: 80, deadlift: 120 },
      _meta: { docType: 'CC', docNum: '12345', age: 25, startYear: 2024 },
      contacto: { phone: '555-1234', email: '' },
    };

    await act(async () => {
      await result.current.pushPlayerToSupabase(player);
    });

    expect(mockUpsertPlayer).toHaveBeenCalledTimes(1);
    expect(mockUpsertPlayer).toHaveBeenCalledWith(
      {
        id: 'p1', first_name: 'Juan', last_name: 'Pérez',
        nickname: 'Juancho', jersey_number: 10,
        phone: '555-1234', email: null,
        role: 'Titular', position: 'Apertura', position_id: null, status: 'activo',
        attr_force: 60, attr_speed: 70, attr_stamina: 65, attr_technique: 80,
        team_category: 'masculina_mayor', system_role: 'jugador',
        makgora_team_id: null,
        weight_kg: 85, height_m: 1.8,
        clothing_jersey: 'L', clothing_shorts: 'L', clothing_socks: '42-44',
        gym_squat: 100, gym_bench: 80, gym_deadlift: 120,
        document_type: 'CC', document_number: '12345', age: 25, start_year: 2024,
        birth_date: null, had_fractures: false, fracture_details: null,
        allergies: null, medical_conditions: null, health_insurance: null,
        emergency_contact_name: null, emergency_contact_phone: null,
        avatar_id: null, photo_url: null,
        source: 'manual',
      },
      'user-1'
    );
  });

  it('mapea contactos vacios como null', async () => {
    const { result } = renderHook(() => useSyncPush({ id: 'user-1' }));

    await act(async () => {
      await result.current.pushPlayerToSupabase({
        id: 'p2', name: 'Sin Contacto', role: 'Titular',
        teamCategory: 'masculina_mayor', systemRole: 'jugador',
      });
    });

    const callArgs = mockUpsertPlayer.mock.calls[0][0];
    expect(callArgs.phone).toBeNull();
    expect(callArgs.email).toBeNull();
    expect(callArgs.nickname).toBeNull();
  });
});

describe('useSyncPush — pushEntityToSupabase', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUpsertEntity.mockReset();
  });

  it('mapea schedule correctamente', async () => {
    const { result } = renderHook(() => useSyncPush({ id: 'user-1' }));

    await act(async () => {
      await result.current.pushEntityToSupabase('schedule', {
        id: 's1', title: 'Entreno', date: '2026-06-01', time: '18:00',
        location: 'Cancha', mapsLink: 'https://maps.example.com',
        type: 'entrenamiento', teamCategory: 'masculina_mayor',
        linkedRoutine: null, recurrenceGroup: null,
      });
    });

    expect(mockUpsertEntity).toHaveBeenCalledWith(
      'schedule',
      expect.objectContaining({
        id: 's1', title: 'Entreno', date: '2026-06-01', time: '18:00',
        location: 'Cancha', maps_link: 'https://maps.example.com',
        type: 'entrenamiento', team_category: 'masculina_mayor',
        linked_routine: null, recurrence_group: null,
      }),
      'user-1'
    );
  });

  it('mapea fixtures con rival_id', async () => {
    const { result } = renderHook(() => useSyncPush({ id: 'user-1' }));

    await act(async () => {
      await result.current.pushEntityToSupabase('fixtures', {
        id: 'f1', date: '2026-06-15', opponent: 'Titanes',
        orcosScore: 24, opponentScore: 12, tries: 4, mvp: 'Juan',
        teamCategory: 'masculina_mayor', rivalId: 'riv-1',
      });
    });

    expect(mockUpsertEntity).toHaveBeenCalledWith(
      'fixtures',
      {
        id: 'f1', date: '2026-06-15', opponent: 'Titanes',
        orcos_score: 24, opponent_score: 12,
        tries: 4, mvp: 'Juan', team_category: 'masculina_mayor',
        rival_id: 'riv-1',
      },
      'user-1'
    );
  });

  it('mapea finances con descripcion', async () => {
    const { result } = renderHook(() => useSyncPush({ id: 'user-1' }));

    await act(async () => {
      await result.current.pushEntityToSupabase('finances', {
        id: 'fin1', type: 'ingreso', desc: 'Cobro mensualidad',
        amount: 50000, date: '2026-06-01', category: 'membresia',
        teamCategory: 'masculina_mayor',
      });
    });

    expect(mockUpsertEntity).toHaveBeenCalledWith(
      'finances',
      {
        id: 'fin1', type: 'ingreso', descripcion: 'Cobro mensualidad',
        amount: 50000, date: '2026-06-01', category: 'membresia',
        team_category: 'masculina_mayor',
      },
      'user-1'
    );
  });

  it('mapea futureFixtures correctamente', async () => {
    const { result } = renderHook(() => useSyncPush({ id: 'user-1' }));

    await act(async () => {
      await result.current.pushEntityToSupabase('futureFixtures', {
        id: 'ff1', opponent: 'Leones', date: '2026-07-01',
        time: '15:00', location: 'Estadio Central',
        teamCategory: 'masculina_mayor', rivalId: null,
      });
    });

    expect(mockUpsertEntity).toHaveBeenCalledWith(
      'futureFixtures',
      {
        id: 'ff1', opponent: 'Leones', date: '2026-07-01',
        time: '15:00', location: 'Estadio Central',
        team_category: 'masculina_mayor', rival_id: null,
      },
      'user-1'
    );
  });

  it('no hace nada si entityType no existe en el map', async () => {
    const { result } = renderHook(() => useSyncPush({ id: 'user-1' }));

    await act(async () => {
      await result.current.pushEntityToSupabase('unknownType', { id: 'x' });
    });

    expect(mockUpsertEntity).not.toHaveBeenCalled();
  });

  it('no hace nada si no hay user', async () => {
    const { result } = renderHook(() => useSyncPush(null));

    await act(async () => {
      await result.current.pushEntityToSupabase('schedule', { id: 's1' });
    });

    expect(mockUpsertEntity).not.toHaveBeenCalled();
  });
});
