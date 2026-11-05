import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isHapticsSupported,
  triggerVibration,
  vibrateTry,
  vibrateWhistle,
  vibrateCard,
  vibrateSuccess,
  vibrateTap
} from '../../utils/haptics';

describe('haptics', () => {
  beforeEach(() => {
    navigator.vibrate = vi.fn().mockReturnValue(true);
  });

  it('detecta soporte háptico', () => {
    expect(isHapticsSupported()).toBe(true);
  });

  it('ejecuta vibración con patrón dado', () => {
    triggerVibration([100, 50, 100]);
    expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100]);
  });

  it('vibrateTry ejecuta patrón de try', () => {
    vibrateTry();
    expect(navigator.vibrate).toHaveBeenCalledWith([120, 60, 120, 60, 250]);
  });

  it('vibrateWhistle ejecuta patrón de silbato', () => {
    vibrateWhistle();
    expect(navigator.vibrate).toHaveBeenCalledWith([80, 40, 80]);
  });

  it('vibrateCard, vibrateSuccess y vibrateTap ejecutan vibraciones correctas', () => {
    vibrateCard();
    expect(navigator.vibrate).toHaveBeenCalledWith([300]);
    vibrateSuccess();
    expect(navigator.vibrate).toHaveBeenCalledWith([40, 40, 40]);
    vibrateTap();
    expect(navigator.vibrate).toHaveBeenCalledWith([25]);
  });
});
