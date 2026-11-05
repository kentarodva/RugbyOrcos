import { describe, it, expect, beforeEach } from 'vitest';
import { playRugbyWhistle, isSoundEnabled, setSoundEnabled } from '../../utils/rugbyAudio';

describe('rugbyAudio — Sintetizador Web Audio API de Silbatos de Rugby', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('gestiona preferencia de sonido en localStorage', () => {
    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });

  it('no arroja error si el contexto de audio no está disponible o está silenciado', () => {
    setSoundEnabled(false);
    expect(() => playRugbyWhistle('kickoff')).not.toThrow();
    expect(() => playRugbyWhistle('pause')).not.toThrow();
    expect(() => playRugbyWhistle('try')).not.toThrow();
    expect(() => playRugbyWhistle('fulltime')).not.toThrow();
  });
});
