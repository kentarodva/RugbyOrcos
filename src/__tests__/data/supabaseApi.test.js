import { describe, it, expect } from 'vitest';
import { supabasePlayerToReact } from '../../data/supabaseApi';

describe('supabaseApi — Fix #10: campos sin fallback dual', () => {
  it('supabasePlayerToReact usa team_category sin fallback camelCase', () => {
    const dbPlayer = {
      id: 'p1',
      first_name: 'Freyder',
      last_name: 'Andres',
      team_category: 'orcos_masculina_mayor',
    };

    const result = supabasePlayerToReact(dbPlayer);
    expect(result.teamCategory).toBe('orcos_masculina_mayor');
  });

  it('supabasePlayerToReact usa system_role sin fallback camelCase', () => {
    const dbPlayer = {
      id: 'p1',
      first_name: 'Test',
      last_name: 'Player',
      system_role: 'jugador',
    };

    const result = supabasePlayerToReact(dbPlayer);
    expect(result.systemRole).toBe('jugador');
  });

  it('valores por defecto cuando faltan campos', () => {
    const dbPlayer = {
      id: 'p1',
      first_name: 'Min',
      last_name: 'Player',
    };

    const result = supabasePlayerToReact(dbPlayer);
    expect(result.teamCategory).toBe('');
    expect(result.systemRole).toBe('jugador');
    expect(result.estado).toBe('activo');
    expect(result.attributes.force).toBe(50);
  });
});
