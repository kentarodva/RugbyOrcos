import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataIO } from '../../context/hooks/useDataIO';

describe('useDataIO — Respaldo Integral y Restauración del Club', () => {
  it('exporta todos los módulos incluyendo préstamos, tácticas y metadatos v5.0', () => {
    const players = [{ id: 'p1', name: 'Orca Alpha' }];
    const schedule = [{ id: 's1', title: 'Entrenamiento' }];
    const championships = [{ id: 'c1', name: 'Liga' }];
    const finances = [{ id: 'f1', amount: 50000 }];
    const inventory = [{ id: 'i1', name: 'Balones Gilbert' }];
    const fixtures = [{ id: 'fx1', rival: 'Águilas' }];
    const rivals = [{ id: 'r1', name: 'Águilas' }];
    const futureFixtures = [{ id: 'ff1', rival: 'Toros' }];
    const loans = [{ id: 'l1', item_name: 'Camiseta Oficial #10', borrower: 'Juan' }];

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const setAttributeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'setAttribute');

    const { result } = renderHook(() =>
      useDataIO(
        players, schedule, championships, finances, inventory, fixtures, rivals, futureFixtures,
        'orcos_masculina_mayor', vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(),
        vi.fn(), (p) => p,
        { loans, setLoans: vi.fn() }
      )
    );

    act(() => {
      result.current.exportData();
    });

    expect(clickSpy).toHaveBeenCalled();
    const hrefCall = setAttributeSpy.mock.calls.find(call => call[0] === 'href');
    expect(hrefCall).toBeDefined();
    const jsonEncoded = decodeURIComponent(hrefCall[1].replace('data:application/json;charset=utf-8,', ''));
    const parsed = JSON.parse(jsonEncoded);

    expect(parsed.version).toBe('5.0');
    expect(parsed.club).toBe('Rugby Orcos Negros Club');
    expect(parsed.players).toHaveLength(1);
    expect(parsed.loans).toHaveLength(1);
    expect(parsed.loans[0].borrower).toBe('Juan');
    expect(parsed.orcos_active_team).toBe('orcos_masculina_mayor');

    clickSpy.mockRestore();
    setAttributeSpy.mockRestore();
  });

  it('restaura datos integrales incluyendo préstamos y tácticas con notificación', () => {
    const setPlayers = vi.fn();
    const setSchedule = vi.fn();
    const setChampionships = vi.fn();
    const setFinances = vi.fn();
    const setInventory = vi.fn();
    const setFixtures = vi.fn();
    const setActiveTeam = vi.fn();
    const setRivals = vi.fn();
    const setFutureFixtures = vi.fn();
    const setLoans = vi.fn();
    const sendLocalNotification = vi.fn();

    const { result } = renderHook(() =>
      useDataIO(
        [], [], [], [], [], [], [], [],
        'orcos_masculina_mayor', setPlayers, setSchedule, setChampionships, setFinances, setInventory, setFixtures, setActiveTeam,
        sendLocalNotification, (p) => p,
        { setRivals, setFutureFixtures, loans: [], setLoans }
      )
    );

    const testPayload = JSON.stringify({
      version: '5.0',
      club: 'Rugby Orcos Negros Club',
      players: [{ id: 'p99', name: 'Capitán Restaurado' }],
      loans: [{ id: 'loan_1', borrower: 'Pedro' }],
      customTactics: [{ id: 'tac_1', name: 'Scrum 8v8 Redzone' }],
      orcos_active_team: 'orcos_femenina_mayor',
    });

    let success;
    act(() => {
      success = result.current.importData(testPayload);
    });

    expect(success).toBe(true);
    expect(setPlayers).toHaveBeenCalledWith([{ id: 'p99', name: 'Capitán Restaurado' }]);
    expect(setLoans).toHaveBeenCalledWith([{ id: 'loan_1', borrower: 'Pedro' }]);
    expect(setActiveTeam).toHaveBeenCalledWith('orcos_femenina_mayor');
    expect(sendLocalNotification).toHaveBeenCalledWith('Base de Datos Restaurada', expect.any(String));
  });
});
