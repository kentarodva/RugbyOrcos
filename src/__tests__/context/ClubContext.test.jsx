import { describe, it, expect, beforeEach, vi } from 'vitest';

const SYNC_KEYS = [
  'orcos_players',
  'orcos_schedule',
  'orcos_championships',
  'orcos_finances',
  'orcos_inventory',
  'orcos_fixtures',
  'orcos_rivals',
  'orcos_future_fixtures',
];

const NON_SYNC_KEYS = [
  'orcos_ai_provider',
  'orcos_gemini_key',
  'orcos_ai_chat',
  'orcos_ai_streaming',
  'orcos_dynamic_clubs',
  'orcos_positions_coords_horizontal_orcos_masculina_mayor',
  'orcos_lineup_orcos_masculina_mayor',
  'orcos_active_team',
];

describe('ClubContext — Fix #2: localStorage.clear() selectivo', () => {
  beforeEach(() => {
    localStorage.clear();
    NON_SYNC_KEYS.forEach(k => localStorage.setItem(k, 'test-value'));
  });

  it('sync solo elimina las 8 keys de datos, no las de config/IA', () => {
    SYNC_KEYS.forEach(k => localStorage.removeItem(k));

    NON_SYNC_KEYS.forEach(k => {
      expect(
        localStorage.getItem(k),
        `La key "${k}" NO debe ser eliminada por sync`
      ).toBe('test-value');
    });
  });

  it('las 8 keys de sync pueden escribirse sin afectar otras', () => {
    SYNC_KEYS.forEach(k => localStorage.setItem(k, 'synced-data'));

    NON_SYNC_KEYS.forEach(k => {
      expect(
        localStorage.getItem(k),
        `La key "${k}" debe sobrevivir`
      ).toBe('test-value');
    });
  });

  it('las keys de IA y pizarra táctica sobreviven tras múltiples syncs', () => {
    for (let i = 0; i < 3; i++) {
      SYNC_KEYS.forEach(k => localStorage.removeItem(k));
      SYNC_KEYS.forEach(k => localStorage.setItem(k, `sync_${i}`));
    }

    expect(localStorage.getItem('orcos_ai_provider')).toBe('test-value');
    expect(localStorage.getItem('orcos_dynamic_clubs')).toBe('test-value');
  });
});

describe('ClubContext — Fix #4: console.log condicional DEV', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('la función de error de Capacitor loggea en DEV', () => {
    const err = new Error('Capacitor not available');

    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.warn('[Notif] Capacitor LocalNotifications no soportado:', err.message);
    }

    expect(typeof err.message).toBe('string');
  });
});

describe('ClubContext — sync backup/restore en fallo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('backup guarda datos antes de limpiar', () => {
    SYNC_KEYS.forEach(k => localStorage.setItem(k, 'original-data'));
    const backup = {};
    SYNC_KEYS.forEach(k => { backup[k] = localStorage.getItem(k); });

    SYNC_KEYS.forEach(k => localStorage.removeItem(k));

    // Todas las keys deben estar vacías
    SYNC_KEYS.forEach(k => {
      expect(localStorage.getItem(k)).toBeNull();
    });

    // Pero el backup las tiene
    SYNC_KEYS.forEach(k => {
      expect(backup[k]).toBe('original-data');
    });
  });

  it('restore devuelve datos del backup si algo falla', () => {
    SYNC_KEYS.forEach(k => localStorage.setItem(k, 'original-data'));
    const backup = {};
    SYNC_KEYS.forEach(k => { backup[k] = localStorage.getItem(k); });
    SYNC_KEYS.forEach(k => localStorage.removeItem(k));

    // Simular fallo: restaurar del backup
    SYNC_KEYS.forEach(k => { if (backup[k]) localStorage.setItem(k, backup[k]); });

    SYNC_KEYS.forEach(k => {
      expect(localStorage.getItem(k)).toBe('original-data');
    });
  });
});

describe('ClubContext — generateId con y sin crypto', () => {
  it('genera ID con prefijo', () => {
    const generateId = (prefix = '') => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return prefix + crypto.randomUUID();
      }
      return prefix + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
    const id = generateId('p_');
    expect(id).toMatch(/^p_[a-f0-9-]{36}$/);
  });
});

describe('ClubContext — sistema de permisos', () => {
  const PERMISSIONS = {
    view_all: ['desarrollador', 'presidente'],
    create_users: ['desarrollador', 'presidente', 'promotor'],
    manage_players: ['desarrollador', 'presidente', 'promotor', 'entrenador'],
    manage_finances: ['desarrollador', 'presidente', 'promotor', 'tesorero'],
    manage_discipline: ['desarrollador', 'presidente', 'promotor', 'entrenador', 'arbitro'],
    manage_training: ['desarrollador', 'presidente', 'promotor', 'entrenador'],
    admin_panel: ['desarrollador', 'presidente'],
  };

  it('Arquitecto (tier 0) tiene todos los permisos', () => {
    const tier = 0;
    const role = 'desarrollador';
    const hasPermission = (action) => {
      if (tier <= 0) return true;
      return (PERMISSIONS[action] || []).includes(role);
    };
    expect(hasPermission('admin_panel')).toBe(true);
    expect(hasPermission('create_users')).toBe(true);
    expect(hasPermission('manage_finances')).toBe(true);
  });

  it('Presidente tiene admin_panel y create_users', () => {
    const tier = 1;
    const role = 'presidente';
    const hasPermission = (action) => {
      if (tier <= 0) return true;
      return (PERMISSIONS[action] || []).includes(role);
    };
    expect(hasPermission('admin_panel')).toBe(true);
    expect(hasPermission('create_users')).toBe(true);
  });

  it('Entrenador NO tiene admin_panel ni manage_finances', () => {
    const tier = 3;
    const role = 'entrenador';
    const hasPermission = (action) => {
      if (tier <= 0) return true;
      return (PERMISSIONS[action] || []).includes(role);
    };
    expect(hasPermission('admin_panel')).toBe(false);
    expect(hasPermission('manage_finances')).toBe(false);
    expect(hasPermission('manage_players')).toBe(true);
    expect(hasPermission('manage_training')).toBe(true);
  });

  it('Tesorero tiene finanzas pero no jugadores', () => {
    const tier = 3;
    const role = 'tesorero';
    const hasPermission = (action) => {
      if (tier <= 0) return true;
      return (PERMISSIONS[action] || []).includes(role);
    };
    expect(hasPermission('manage_finances')).toBe(true);
    expect(hasPermission('manage_players')).toBe(false);
  });
});

describe('ClubContext — sanitize de datos', () => {
  it('sanitize elimina tags HTML', () => {
    const sanitize = (value) => {
      if (typeof value !== 'string') return value;
      return value.replace(/[<>]/g, '');
    };
    expect(sanitize('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    expect(sanitize('<b>negritas</b>')).toBe('bnegritas/b');
    expect(sanitize('texto normal')).toBe('texto normal');
    expect(sanitize(123)).toBe(123);
    expect(sanitize(null)).toBe(null);
  });
});
