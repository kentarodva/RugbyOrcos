import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../data/supabaseApi.js', () => ({
  default: { deletePlayer: vi.fn() },
}));

vi.mock('../../../supabaseClient.js', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock('../../../utils/errorHandler', () => ({
  handleError: vi.fn(),
}));

vi.mock('../../../context/constants', () => ({
  SYSTEM_ROLES: { JUGADOR: 'jugador' },
  EQUIPOS_LABELS: { masculina_mayor: 'Masculina Mayor' },
}));

const { usePlayers } = await import('../../../context/hooks/usePlayers.js');

function setup() {
  const sendLocalNotification = vi.fn();
  const pushPlayerToSupabase = vi.fn();
  const pushEntityToSupabase = vi.fn();
  const user = { id: 'user-1' };

  const { result, rerender } = renderHook(() =>
    usePlayers('masculina_mayor', sendLocalNotification, pushPlayerToSupabase, pushEntityToSupabase, user)
  );

  return { result, rerender, sendLocalNotification, pushPlayerToSupabase, user };
}

describe('usePlayers — CRUD', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('addPlayer', () => {
    it('agrega jugador al estado con defaults', async () => {
      const { result, pushPlayerToSupabase } = setup();

      await act(async () => {
        await result.current.addPlayer({ name: 'Juan Pérez', apodo: 'Juancho' });
      });

      expect(result.current.players).toHaveLength(1);
      expect(result.current.players[0].name).toBe('Juan Pérez');
      expect(result.current.players[0].id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.current.players[0].estado).toBe('activo');
      expect(result.current.players[0].attributes.force).toBeGreaterThanOrEqual(10);
      expect(result.current.players[0].attributes.force).toBeLessThanOrEqual(100);
      expect(result.current.players[0].attributes.speed).toBeGreaterThanOrEqual(10);
      expect(result.current.players[0].attributes.stamina).toBeGreaterThanOrEqual(10);
      expect(result.current.players[0].attributes.technique).toBeGreaterThanOrEqual(10);
      expect(result.current.players[0].teamCategory).toBe('masculina_mayor');
      expect(result.current.players[0].systemRole).toBe('jugador');
      expect(pushPlayerToSupabase).toHaveBeenCalledWith(result.current.players[0]);
    });

    it('asigna defaults para miembros y sanciones', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.addPlayer({ name: 'Sin datos' });
      });

      const p = result.current.players[0];
      expect(p.memberships).toEqual({ paid: 0, due: 0 });
      expect(p.infractionLog).toEqual([]);
      expect(p.clothingSizes).toEqual({ jersey: 'M', shorts: 'M', socks: '40-42' });
    });

    it('sanitiza name y apodo', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.addPlayer({ name: '<b>Juan</b>', apodo: '<script>alert(1)</script>' });
      });

      expect(result.current.players[0].name).toBe('bJuan/b');
      expect(result.current.players[0].apodo).toBe('scriptalert(1)/script');
    });
  });

  describe('updatePlayer', () => {
    it('actualiza campos del jugador', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.addPlayer({ name: 'Original' });
      });

      const playerId = result.current.players[0].id;

      await act(async () => {
        await result.current.updatePlayer({ id: playerId, name: 'Actualizado', apodo: 'NuevoApodo', contacto: { phone: '123', email: '' } });
      });

      expect(result.current.players[0].name).toBe('Actualizado');
      expect(result.current.players[0].apodo).toBe('NuevoApodo');
    });

    it('llama a pushPlayerToSupabase con datos seguros', async () => {
      const { result, pushPlayerToSupabase } = setup();

      await act(async () => {
        await result.current.addPlayer({ name: 'Test' });
      });

      const playerId = result.current.players[0].id;

      await act(async () => {
        await result.current.updatePlayer({ id: playerId, name: '<x>Mal</x>', apodo: '', contacto: { phone: '<script>', email: '' } });
      });

      expect(pushPlayerToSupabase).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'xMal/x', apodo: '' })
      );
    });
  });

  describe('deletePlayer', () => {
    it('remueve jugador del estado', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.addPlayer({ name: 'Eliminar' });
      });

      const id = result.current.players[0].id;

      await act(async () => {
        await result.current.deletePlayer(id);
      });

      expect(result.current.players).toHaveLength(0);
    });
  });
});

describe('usePlayers — Attendance', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('registra presente sin penalizacion', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addPlayer({ name: 'Puntual' });
    });

    const playerId = result.current.players[0].id;

    await act(async () => {
      result.current.recordAttendance('2026-05-31', { [playerId]: 'presente' });
    });

    const p = result.current.players[0];
    expect(p.attendance.total).toBe(1);
    expect(p.attendance.present).toBe(1);
    expect(p.attendance.late).toBe(0);
    expect(p.penalties.burpees).toBe(0);
  });

  it('registra tarde con 15 burpees de penalizacion', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addPlayer({ name: 'Tardón' });
    });

    const playerId = result.current.players[0].id;

    await act(async () => {
      result.current.recordAttendance('2026-05-31', { [playerId]: 'tarde' });
    });

    const p = result.current.players[0];
    expect(p.attendance.late).toBe(1);
    expect(p.penalties.burpees).toBe(15);
  });

  it('registra falta injustificada con 50 burpees + cones', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addPlayer({ name: 'Faltón' });
    });

    const playerId = result.current.players[0].id;

    await act(async () => {
      result.current.recordAttendance('2026-05-31', { [playerId]: 'falta_injustificada' });
    });

    const p = result.current.players[0];
    expect(p.attendance.absentUnjustified).toBe(1);
    expect(p.penalties.burpees).toBe(50);
    expect(p.penalties.cones).toBe(true);
  });

  it('no afecta jugadores de otro equipo', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addPlayer({ name: 'Otro equipo' });
    });

    const playerId = result.current.players[0].id;

    await act(async () => {
      result.current.players[0].teamCategory = 'femenina_mayor';
      result.current.recordAttendance('2026-05-31', { [playerId]: 'falta_injustificada' });
    });

    expect(result.current.players[0].attendance.total).toBe(0);
  });
});

describe('usePlayers — Infracciones', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('aplica burpees por penal e inicia suspension si hay rojas', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addPlayer({ name: 'Infractor' });
    });

    const playerId = result.current.players[0].id;

    await act(async () => {
      result.current.recordMatchInfractions('2026-05-31', [{
        playerId, penales: 2, amarillas: 1, rojas: 1, faultType: 'conducta antideportiva'
      }]);
    });

    const p = result.current.players[0];
    expect(p.penalties.burpees).toBe(2 * 10 + 1 * 50 + 1 * 100);
    expect(p.estado).toBe('suspendido');
    expect(p.infractionLog).toHaveLength(1);
  });
});

describe('usePlayers — Lesiones', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('marca lesionado y agrega injuryLog', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addPlayer({ name: 'Lesionado' });
    });

    const playerId = result.current.players[0].id;

    await act(async () => {
      result.current.recordInjury(playerId, 'Fractura de tibia', 6, '2026-05-01');
    });

    const p = result.current.players[0];
    expect(p.estado).toBe('lesionado');
    expect(p.injuryLog[0].diagnosis).toBe('Fractura de tibia');
    expect(p.injuryLog[0].weeks).toBe(6);
    expect(p.injuryLog[0].phase).toBe(1);
  });

  it('fase 4 reactiva al jugador y limpia injuryLog', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addPlayer({ name: 'Recuperado' });
    });

    const playerId = result.current.players[0].id;

    await act(async () => {
      result.current.recordInjury(playerId, 'Esguince', 4, '2026-05-01');
    });

    await act(async () => {
      result.current.updateInjuryPhase(playerId, 4);
    });

    expect(result.current.players[0].estado).toBe('activo');
    expect(result.current.players[0].injuryLog).toHaveLength(0);
  });
});

describe('usePlayers — Membresia', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('recordMembershipPayment actualiza paid y due', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.addPlayer({ name: 'Pagador' });
    });

    const playerId = result.current.players[0].id;

    await act(async () => {
      result.current.recordMembershipPayment(playerId, 5000);
    });

    const p = result.current.players[0];
    expect(p.memberships.paid).toBe(5000);
    expect(p.memberships.due).toBe(10000);
    expect(p.memberships.lastAmount).toBe(5000);
  });
});
