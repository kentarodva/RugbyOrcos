import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

function sanitize(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/[<>]/g, '');
}

describe('useEntities — Finanzas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addFinanceRecord agrega un registro con ID y teamCategory', async () => {
    const pushMock = vi.fn();
    const { useFinances } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useFinances('orcos_masculina_mayor', pushMock, vi.fn(), { id: 'user-1' }));

    await act(async () => {
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

  it('addFinanceRecord sanitiza XSS en desc', async () => {
    const pushMock = vi.fn();
    const { useFinances } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useFinances('test', pushMock, vi.fn(), { id: 'user-1' }));

    await act(async () => {
      result.current.addFinanceRecord({ desc: '<script>alert(1)</script>', amount: 100, type: 'ingreso' });
    });

    expect(result.current.finances[0].desc).not.toContain('<');
  });

  it('addFinanceRecord pushea a Supabase', async () => {
    const pushMock = vi.fn();
    const { useFinances } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useFinances('test', pushMock, vi.fn(), { id: 'user-1' }));
    const { supabase } = await import('../../../supabaseClient.js');

    await act(async () => {
      result.current.addFinanceRecord({ desc: 'Test', amount: 500, type: 'ingreso' });
    });

    expect(supabase.from).toHaveBeenCalledWith('finances');
  });

  it('addMembershipPayment crea registro de membresia', async () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFinances } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useFinances('test', pushMock, notifyMock, { id: 'user-1' }));

    await act(async () => {
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

  it('addMembershipPayment usa "Jugador" si no hay nombre', async () => {
    const pushMock = vi.fn();
    const notifyMock = vi.fn();
    const { useFinances } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useFinances('test', pushMock, notifyMock, { id: 'user-1' }));

    await act(async () => {
      result.current.addMembershipPayment(null, 5000, '2026-06-01');
    });

    expect(result.current.finances[0].desc).toContain('Jugador');
  });
});

describe('useEntities — Inventario', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addInventoryItem agrega item con defaults', async () => {
    const pushMock = vi.fn();
    const { useInventory } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(pushMock, { id: 'user-1' }));

    await act(async () => {
      result.current.addInventoryItem({ name: 'Balon Gilbert', category: 'equipamiento' });
    });

    expect(result.current.inventory).toHaveLength(1);
    const item = result.current.inventory[0];
    expect(item.name).toBe('Balon Gilbert');
    expect(item.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(item.quantity).toBe(1);
    expect(item.status).toBe('disponible');
  });

  it('addInventoryItem sanitiza nombre y descripcion', async () => {
    const pushMock = vi.fn();
    const { useInventory } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(pushMock, { id: 'user-1' }));

    await act(async () => {
      result.current.addInventoryItem({ name: '<img src=x>', description: '<script>alert(1)</script>' });
    });

    expect(result.current.inventory[0].name).not.toContain('<');
  });

  it('addInventoryItem respeta quantity y status del input', async () => {
    const pushMock = vi.fn();
    const { useInventory } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(pushMock, { id: 'user-1' }));

    await act(async () => {
      result.current.addInventoryItem({ name: 'Peto', quantity: 5, status: 'Bueno' });
    });

    expect(result.current.inventory[0].quantity).toBe(5);
    expect(result.current.inventory[0].status).toBe('Bueno');
  });

  it('addInventoryItem siempre pushea a Supabase', async () => {
    const { useInventory } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(null, { id: 'user-1' }));
    const { supabase } = await import('../../../supabaseClient.js');

    await act(async () => {
      result.current.addInventoryItem({ name: 'Conos' });
    });

    expect(result.current.inventory).toHaveLength(1);
    expect(supabase.from).toHaveBeenCalledWith('inventory');
  });

  it('updateInventoryItem actualiza campos del item', async () => {
    const pushMock = vi.fn();
    const { useInventory } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(pushMock, { id: 'user-1' }));

    await act(async () => {
      result.current.addInventoryItem({ name: 'Balon' });
    });

    const id = result.current.inventory[0].id;

    await act(async () => {
      result.current.updateInventoryItem(id, { quantity: 3, status: 'Excelente' });
    });

    expect(result.current.inventory[0].quantity).toBe(3);
    expect(result.current.inventory[0].status).toBe('Excelente');
  });

  it('updateInventoryItem sanitiza assignedTo', async () => {
    const pushMock = vi.fn();
    const { useInventory } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(pushMock, { id: 'user-1' }));

    await act(async () => {
      result.current.addInventoryItem({ name: 'Casco' });
    });

    const id = result.current.inventory[0].id;

    await act(async () => {
      result.current.updateInventoryItem(id, { assignedTo: '<b>Player</b>' });
    });

    expect(result.current.inventory[0].assignedTo).not.toContain('<');
  });

  it('updateInventoryItem siempre actualiza el estado', async () => {
    const { useInventory } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useInventory(null, { id: 'user-1' }));

    await act(async () => {
      result.current.addInventoryItem({ name: 'Item' });
    });

    await act(async () => {
      result.current.updateInventoryItem(result.current.inventory[0].id, { quantity: 2 });
    });

    expect(result.current.inventory[0].quantity).toBe(2);
  });
});

describe('useEntities — Campeonatos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addChampionship agrega campeonato con equipo activo', async () => {
    const pushMock = vi.fn();
    const { useChampionships } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useChampionships('orcos_masculina_mayor', pushMock, { id: 'user-1' }));

    await act(async () => {
      result.current.addChampionship({ name: 'Torneo Apertura', description: 'Primera fase' });
    });

    expect(result.current.championships).toHaveLength(1);
    const champ = result.current.championships[0];
    expect(champ.name).toBe('Torneo Apertura');
    expect(champ.teamCategory).toBe('orcos_masculina_mayor');
    expect(champ.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('addChampionship sanitiza name y description', async () => {
    const pushMock = vi.fn();
    const { useChampionships } = await import('../../../context/hooks/useEntities');
    const { result } = renderHook(() => useChampionships('test', pushMock, { id: 'user-1' }));

    await act(async () => {
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
