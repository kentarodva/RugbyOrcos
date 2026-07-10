import { describe, it, expect } from 'vitest';
import { supabasePlayerToReact } from '../../data/supabaseApi';

describe('team_id — READ path (supabasePlayerToReact)', () => {
  it('mapea p.team_id → player.teamId cuando existe', () => {
    const dbPlayer = {
      id: 'p1', first_name: 'Test', last_name: 'Player',
      team_id: 'b02dd3b4-baa2-4d0a-9d42-68ce930f7742',
      team_category: 'orcos_masculina_mayor',
    };
    const result = supabasePlayerToReact(dbPlayer);
    expect(result.teamId).toBe('b02dd3b4-baa2-4d0a-9d42-68ce930f7742');
    expect(result.teamCategory).toBe('orcos_masculina_mayor');
  });

  it('teamId es null cuando p.team_id es null', () => {
    const dbPlayer = {
      id: 'p2', first_name: 'Test', last_name: 'Player',
      team_id: null,
    };
    const result = supabasePlayerToReact(dbPlayer);
    expect(result.teamId).toBeNull();
    expect(result.teamCategory).toBe('');
  });

  it('teamId y teamCategory coexisten sin conflictos', () => {
    const dbPlayer = {
      id: 'p3', first_name: 'Test', last_name: 'Player',
      team_id: 'e6278039-88c1-43f9-8903-8fce906b2da5',
      team_category: 'orcos_femenina_mayor',
    };
    const result = supabasePlayerToReact(dbPlayer);
    expect(result.teamId).toBe('e6278039-88c1-43f9-8903-8fce906b2da5');
    expect(result.teamCategory).toBe('orcos_femenina_mayor');
  });
});
