import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

describe('usePermissions — sistema de permisos', () => {
  it('Tier 0 (desarrollador) tiene todos los permisos', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');
    const { result } = renderHook(() =>
      usePermissions({ email: 'dev@test.com', id: 'u1' }, { system_role: 'desarrollador' })
    );

    const actions = [
      'view_all', 'create_users', 'manage_players', 'manage_finances',
      'manage_discipline', 'manage_training', 'manage_schedule',
      'manage_inventory', 'manage_tactics', 'export_import',
      'config_ai', 'admin_panel',
    ];
    actions.forEach(action => {
      expect(result.current.hasPermission(action)).toBe(true);
    });
    expect(result.current.isSuperRole).toBe(true);
    expect(result.current.userTier).toBe(0);
  });

  it('Tier 1 (presidente) tiene admin_panel y create_users', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');
    const { result } = renderHook(() =>
      usePermissions({ email: 'presi@test.com', id: 'u2' }, { system_role: 'presidente' })
    );

    expect(result.current.hasPermission('admin_panel')).toBe(true);
    expect(result.current.hasPermission('create_users')).toBe(true);
    expect(result.current.hasPermission('config_ai')).toBe(true);
    expect(result.current.hasPermission('view_all')).toBe(true);
    expect(result.current.isSuperRole).toBe(true);
    expect(result.current.userTier).toBe(1);
  });

  it('Tier 2 (promotor) NO tiene admin_panel ni config_ai', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');
    const { result } = renderHook(() =>
      usePermissions({ email: 'prom@test.com', id: 'u3' }, { system_role: 'promotor' })
    );

    expect(result.current.hasPermission('admin_panel')).toBe(false);
    expect(result.current.hasPermission('config_ai')).toBe(false);
    expect(result.current.hasPermission('manage_players')).toBe(true);
    expect(result.current.hasPermission('manage_finances')).toBe(true);
    expect(result.current.hasPermission('create_users')).toBe(true);
    expect(result.current.isSuperRole).toBe(false);
  });

  it('Tier 3 (entrenador) tiene manage_players, manage_training, manage_tactics', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');
    const { result } = renderHook(() =>
      usePermissions({ email: 'coach@test.com', id: 'u4' }, { system_role: 'entrenador' })
    );

    expect(result.current.hasPermission('manage_players')).toBe(true);
    expect(result.current.hasPermission('manage_training')).toBe(true);
    expect(result.current.hasPermission('manage_tactics')).toBe(true);
    expect(result.current.hasPermission('manage_schedule')).toBe(true);
    expect(result.current.hasPermission('manage_finances')).toBe(false);
    expect(result.current.hasPermission('admin_panel')).toBe(false);
    expect(result.current.isSuperRole).toBe(false);
  });

  it('Tier 3 (tesorero) tiene manage_finances pero no manage_players', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');
    const { result } = renderHook(() =>
      usePermissions({ email: 'money@test.com', id: 'u5' }, { system_role: 'tesorero' })
    );

    expect(result.current.hasPermission('manage_finances')).toBe(true);
    expect(result.current.hasPermission('manage_inventory')).toBe(true);
    expect(result.current.hasPermission('manage_players')).toBe(false);
  });

  it('Tier 3 (arbitro) tiene manage_discipline', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');
    const { result } = renderHook(() =>
      usePermissions({ email: 'ref@test.com', id: 'u6' }, { system_role: 'arbitro' })
    );

    expect(result.current.hasPermission('manage_discipline')).toBe(true);
    expect(result.current.hasPermission('manage_finances')).toBe(false);
  });

  it('Tier 4 (jugador) no tiene ningun permiso excepto su dashboard', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');
    const { result } = renderHook(() =>
      usePermissions({ email: 'player@test.com', id: 'u7' }, { system_role: 'jugador' })
    );

    expect(result.current.hasPermission('admin_panel')).toBe(false);
    expect(result.current.hasPermission('manage_players')).toBe(false);
    expect(result.current.hasPermission('manage_finances')).toBe(false);
    expect(result.current.isSuperRole).toBe(false);
    expect(result.current.userTier).toBe(4);
  });

  it('Sin perfil usa tier 4 (jugador) por defecto', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');
    const { result } = renderHook(() =>
      usePermissions({ email: 'unknown@test.com', id: 'u8' }, null)
    );

    expect(result.current.userRole).toBe('jugador');
    expect(result.current.userTier).toBe(4);
    expect(result.current.hasPermission('admin_panel')).toBe(false);
    expect(result.current.isSuperRole).toBe(false);
  });

  it('Sin profile ni user maneja null currentUser', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');
    const { result } = renderHook(() =>
      usePermissions(null, null)
    );

    expect(result.current.currentUser).toBeNull();
    expect(result.current.userRole).toBe('jugador');
  });

  it('Accion desconocida retorna false', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');
    const { result } = renderHook(() =>
      usePermissions({ email: 'x@test.com', id: 'u9' }, { system_role: 'entrenador' })
    );

    expect(result.current.hasPermission('accion_inexistente')).toBe(false);
  });

  it('isSuperRole es solo tier 0 y 1', async () => {
    const { usePermissions } = await import('../../../context/hooks/usePermissions');

    const roles = ['desarrollador', 'presidente', 'promotor', 'entrenador', 'jugador'];
    const expected = [true, true, false, false, false];

    roles.forEach((role, i) => {
      const { result } = renderHook(() =>
        usePermissions({ email: `${role}@test.com`, id: `u${i}` }, { system_role: role })
      );
      expect(result.current.isSuperRole).toBe(expected[i]);
    });
  });
});
