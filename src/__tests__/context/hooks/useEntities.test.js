import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

function sanitize(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/[<>]/g, '');
}

describe('useEntities — Finanzas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addFinanceRecord agrega un registro con ID y teamCategory', () => {
    const pushMock = vi.fn();
    const { useFinances } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useFinances('orcos_masculina_mayor', pushMock));

    act(() => {
      result.current.addFinanceRecord({ desc: 'Balones', amount: 150000, type: 'egreso' });
    });

    expect(result.current.finances).toHaveLength(1);
    const record = result.current.finances[0];
    expect(record.desc).toBe('Balones');
    expect(record.amount).toBe(150000);
    expect(record.type).toBe('egreso');
    expect(record.teamCategory).toBe('orcos_masculina_mayor');
    expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(record.date).toBeDefined();
  });

  it('addFinanceRecord sanitiza XSS en desc', () => {
    const pushMock = vi.fn();
    const { useFinances } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useFinances('test', pushMock));

    act(() => {
      result.current.addFinanceRecord({ desc: '<script>alert(1)</script>', amount: 100, type: 'ingreso' });
    });

    expect(result.current.finances[0].desc).not.toContain('<');
    expect(result.current.finances[0].desc).not.toContain('>');
  });

  it('addFinanceRecord pushea a Supabase', () => {
    const pushMock = vi.fn();
    const { useFinances } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useFinances('test', pushMock));

    act(() => {
      result.current.addFinanceRecord({ desc: 'Test', amount: 500, type: 'ingreso' });
    });

    expect(pushMock).toHaveBeenCalledWith('finances', expect.objectContaining({ desc: 'Test' }));
  });

  it('addMembershipPayment crea registro de membresia', () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFinances } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useFinances('test', pushMock, notifyMock));

    act(() => {
      result.current.addMembershipPayment('Juan Perez', 10000, '2026-06-01');
    });

    expect(result.current.finances).toHaveLength(1);
    const record = result.current.finances[0];
    expect(record.desc).toContain('Juan Perez');
    expect(record.amount).toBe(10000);
    expect(record.type).toBe('ingreso');
    expect(record.category).toBe('mensualidad');
    expect(notifyMock).toHaveBeenCalled();
  });

  it('addMembershipPayment usa "Jugador" si no hay nombre', () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFinances } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useFinances('test', pushMock, notifyMock));

    act(() => {
      result.current.addMembershipPayment(null, 5000, '2026-06-01');
    });

    expect(result.current.finances[0].desc).toContain('Jugador');
  });
});

describe('useEntities — Inventario', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addInventoryItem agrega item con defaults', () => {
    const pushMock = vi.fn();
    const { useInventory } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(pushMock));

    act(() => {
      result.current.addInventoryItem({ name: 'Balon Gilbert', category: 'equipamiento' });
    });

    expect(result.current.inventory).toHaveLength(1);
    const item = result.current.inventory[0];
    expect(item.name).toBe('Balon Gilbert');
    expect(item.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(item.quantity).toBe(1);
    expect(item.status).toBe('disponible');
    expect(item.assignedTo).toBeNull();
  });

  it('addInventoryItem sanitiza nombre y descripcion', () => {
    const pushMock = vi.fn();
    const { useInventory } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(pushMock));

    act(() => {
      result.current.addInventoryItem({ name: '<img src=x>', description: '<script>alert(1)</script>' });
    });

    expect(result.current.inventory[0].name).not.toContain('<');
    expect(result.current.inventory[0].description).not.toContain('<');
  });

  it('addInventoryItem respeta quantity y status del input', () => {
    const pushMock = vi.fn();
    const { useInventory } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(pushMock));

    act(() => {
      result.current.addInventoryItem({ name: 'Peto', quantity: 5, status: 'Bueno' });
    });

    expect(result.current.inventory[0].quantity).toBe(5);
    expect(result.current.inventory[0].status).toBe('Bueno');
  });

  it('addInventoryItem no pushea si pushEntityToSupabase es null', () => {
    const { useInventory } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(null));

    act(() => {
      result.current.addInventoryItem({ name: 'Conos' });
    });

    expect(result.current.inventory).toHaveLength(1);
  });

  it('updateInventoryItem actualiza campos del item', () => {
    const pushMock = vi.fn();
    const { useInventory } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(pushMock));

    act(() => {
      result.current.addInventoryItem({ name: 'Balon' });
    });

    const id = result.current.inventory[0].id;

    act(() => {
      result.current.updateInventoryItem(id, { quantity: 3, status: 'Excelente' });
    });

    expect(result.current.inventory[0].quantity).toBe(3);
    expect(result.current.inventory[0].status).toBe('Excelente');
    expect(pushMock).toHaveBeenCalled();
  });

  it('updateInventoryItem sanitiza assignedTo', () => {
    const pushMock = vi.fn();
    const { useInventory } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(pushMock));

    act(() => {
      result.current.addInventoryItem({ name: 'Casco' });
    });

    const id = result.current.inventory[0].id;

    act(() => {
      result.current.updateInventoryItem(id, { assignedTo: '<b>Player</b>' });
    });

    expect(result.current.inventory[0].assignedTo).not.toContain('<');
    expect(result.current.inventory[0].assignedTo).not.toContain('>');
  });

  it('updateInventoryItem no pushea para null', () => {
    const { useInventory } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(null));

    act(() => {
      result.current.addInventoryItem({ name: 'Item' });
    });

    act(() => {
      result.current.updateInventoryItem(result.current.inventory[0].id, { quantity: 2 });
    });

    expect(result.current.inventory[0].quantity).toBe(2);
  });
});

describe('useEntities — Campeonatos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addChampionship agrega campeonato con equipo activo', () => {
    const pushMock = vi.fn();
    const { useChampionships } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useChampionships('orcos_masculina_mayor', pushMock));

    act(() => {
      result.current.addChampionship({ name: 'Torneo Apertura', description: 'Primera fase' });
    });

    expect(result.current.championships).toHaveLength(1);
    const champ = result.current.championships[0];
    expect(champ.name).toBe('Torneo Apertura');
    expect(champ.teamCategory).toBe('orcos_masculina_mayor');
    expect(champ.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('addChampionship sanitiza name y description', () => {
    const pushMock = vi.fn();
    const { useChampionships } = require('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useChampionships('test', pushMock));

    act(() => {
      result.current.addChampionship({ name: '<h1>XSS</h1>', description: '<script>alert(1)</script>' });
    });

    expect(result.current.championships[0].name).not.toContain('<');
    expect(result.current.championships[0].description).not.toContain('<');
  });
});

describe('useEntities — sanitize interno', () => {
  it('sanitize elimina tags HTML', () => {
    expect(sanitize('<b>bold</b>')).toBe('bbold/b');
    expect(sanitize('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    expect(sanitize('texto normal')).toBe('texto normal');
  });

  it('sanitize no modifica valores no string', () => {
    expect(sanitize(42)).toBe(42);
    expect(sanitize(null)).toBeNull();
    expect(sanitize(undefined)).toBeUndefined();
  });
});
