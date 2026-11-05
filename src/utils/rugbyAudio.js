// ── Sintetizador de Audio de Rugby (Web Audio API) ──
// Genera silbatos de árbitro hiperrealistas (estilo Fox40 Classic) y bocinas de partido
// 100% nativo, sin dependencias externas ni archivos de audio pesados, funciona offline.

import { vibrateWhistle, vibrateTry } from './haptics';

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const isSoundEnabled = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('orcos_audio_enabled') !== 'false';
};

export const setSoundEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('orcos_audio_enabled', enabled ? 'true' : 'false');
};

/**
 * Genera un sonido de silbato Fox 40 de dos frecuencias resonantes con modulación trill
 */
function playWhistleTone(ctx, startTime, duration = 0.4, gainLevel = 0.3) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  // Frecuencias clásicas del silbato de rugby Fox40 (bitonal)
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(2850, startTime);
  osc1.frequency.exponentialRampToValueAtTime(3100, startTime + duration);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(3250, startTime);
  osc2.frequency.exponentialRampToValueAtTime(3400, startTime + duration);

  // Modulación tipo trill (vibrato de aire)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(28, startTime); // 28 Hz trill
  lfoGain.gain.setValueAtTime(120, startTime);
  lfo.connect(osc1.frequency);
  lfo.connect(osc2.frequency);

  // Envolvente ADSR
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.04);
  gain.gain.setValueAtTime(gainLevel * 0.9, startTime + duration - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  lfo.start(startTime);
  osc1.start(startTime);
  osc2.start(startTime);

  lfo.stop(startTime + duration);
  osc1.stop(startTime + duration);
  osc2.stop(startTime + duration);
}

/**
 * Tipos de pitazos de rugby:
 * - 'kickoff': Pitazo largo de inicio de partido / reinicio
 * - 'pause': Dos pitazos cortos (pausa / tiempo fuera / infracción)
 * - 'try': Pitazo largo con tono ascendente festivo
 * - 'fulltime': Tres pitazos oficiales (corto, corto, largo final)
 */
export function playRugbyWhistle(type = 'kickoff') {
  if (type === 'try') {
    vibrateTry();
  } else {
    vibrateWhistle();
  }
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'kickoff') {
    // Un pitazo contundente de 0.8s
    playWhistleTone(ctx, now, 0.75, 0.35);
  } else if (type === 'pause' || type === 'foul') {
    // Dos pitazos secos
    playWhistleTone(ctx, now, 0.22, 0.32);
    playWhistleTone(ctx, now + 0.3, 0.35, 0.35);
  } else if (type === 'try') {
    // Pitazo largo enérgico
    playWhistleTone(ctx, now, 0.9, 0.4);
  } else if (type === 'fulltime') {
    // Tres pitazos: pi-pi-piiiiii
    playWhistleTone(ctx, now, 0.22, 0.3);
    playWhistleTone(ctx, now + 0.32, 0.22, 0.3);
    playWhistleTone(ctx, now + 0.65, 1.2, 0.4);
  }
}
