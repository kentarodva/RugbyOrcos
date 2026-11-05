import { describe, it, expect } from 'vitest';
import { PRESET_TV_PLAYS, DEFAULT_RIVALS_HORIZONTAL, mirrorToVertical } from '../../components/CanchaTactica/presetPlays';
import { PLAYBACK_SPEEDS } from '../../components/CanchaTactica/usePitchState';

describe('Pizarra TV - PRESET_TV_PLAYS Extended Suites', () => {
  it('contiene 5 jugadas tácticas animadas completas', () => {
    expect(PRESET_TV_PLAYS.length).toBe(5);
    const ids = PRESET_TV_PLAYS.map(p => p.id);
    expect(ids).toContain('tv_scrum_strike_15');
    expect(ids).toContain('tv_lineout_maul_peel');
    expect(ids).toContain('tv_drift_defense_turnover');
    expect(ids).toContain('tv_up_and_under_bomb');
    expect(ids).toContain('tv_pick_and_go_redzone');
  });

  it('cada jugada tiene al menos 6 fases tácticas con descripciones y coordenadas válidas', () => {
    PRESET_TV_PLAYS.forEach(play => {
      expect(play.phases.length).toBeGreaterThanOrEqual(6);
      play.phases.forEach((phase) => {
        expect(phase.title).toBeTruthy();
        expect(phase.description).toBeTruthy();
        expect(phase.allies.length).toBe(15);
        expect(phase.rivals.length).toBe(15);
        expect(phase.ball).toBeDefined();
        expect(phase.ball.x).toBeGreaterThanOrEqual(0);
        expect(phase.ball.x).toBeLessThanOrEqual(100);
        expect(phase.ball.y).toBeGreaterThanOrEqual(0);
        expect(phase.ball.y).toBeLessThanOrEqual(100);
      });
    });
  });

  it('mirrorToVertical invierte coordenadas x e y para vista vertical', () => {
    const coords = [{ id: '1', x: 20, y: 80 }];
    const mirrored = mirrorToVertical(coords);
    expect(mirrored[0].x).toBe(80);
    expect(mirrored[0].y).toBe(20);
  });

  it('DEFAULT_RIVALS_HORIZONTAL define los 15 rivales en campo', () => {
    expect(DEFAULT_RIVALS_HORIZONTAL.length).toBe(15);
  });
});

describe('Pizarra TV - Control de Velocidades de Reproducción', () => {
  it('cuenta con configuraciones de velocidad 0.5x, 0.75x, 1x y 1.5x', () => {
    expect(PLAYBACK_SPEEDS['0.5x']).toBeDefined();
    expect(PLAYBACK_SPEEDS['0.75x']).toBeDefined();
    expect(PLAYBACK_SPEEDS['1x']).toBeDefined();
    expect(PLAYBACK_SPEEDS['1.5x']).toBeDefined();

    // 0.5x es más lento que 0.75x y que 1x
    expect(PLAYBACK_SPEEDS['0.5x'].interval).toBeGreaterThan(PLAYBACK_SPEEDS['0.75x'].interval);
    expect(PLAYBACK_SPEEDS['0.75x'].interval).toBeGreaterThan(PLAYBACK_SPEEDS['1x'].interval);
    expect(PLAYBACK_SPEEDS['0.75x'].duration).toBeGreaterThanOrEqual(1.8);
  });
});
