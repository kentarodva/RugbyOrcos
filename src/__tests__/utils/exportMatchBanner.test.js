import { describe, it, expect } from 'vitest';
import { buildMatchWhatsAppText } from '../../utils/exportMatchBanner';

describe('exportMatchBanner — Generación de WhatsApp y Placas en Vivo', () => {
  it('genera texto para WhatsApp con formato correcto de emojis y marcador', () => {
    const liveMatch = {
      opponent_name: 'Minotauros RFC',
      tournament: 'Liga Antioqueña de Rugby',
      division: 'Masculina Mayor',
    };
    const liveEvents = [
      { event_type: 'try', team: 'orcos', player_name: 'Esteban Zuluaga', minute: 14 },
      { event_type: 'conversion', team: 'orcos', player_name: 'Mateo Arango', minute: 15 },
      { event_type: 'penalty', team: 'opponent', player_name: 'Rival N10', minute: 28 },
    ];
    const score = { orcos: 17, opponent: 6 };

    const text = buildMatchWhatsAppText({
      liveMatch,
      liveEvents,
      score,
      status: 'live',
      currentMinute: 32,
    });

    expect(text).toContain('RUGBY ORCOS NEGROS CLUB');
    expect(text).toContain('LIGA ANTIOQUEÑA DE RUGBY');
    expect(text).toContain('EN VIVO — Minuto 32');
    expect(text).toContain('*ORCOS NEGROS:* 17');
    expect(text).toContain('*MINOTAUROS RFC:* 6');
    expect(text).toContain('Esteban Zuluaga');
    expect(text).toContain('Fuerza, Honor y Tercer Tiempo');
  });

  it('maneja marcador pausado o finalizado sin eventos', () => {
    const textPaused = buildMatchWhatsAppText({
      liveMatch: { opponent_name: 'Barbarians' },
      liveEvents: [],
      score: { orcos: 0, opponent: 0 },
      status: 'paused',
      currentMinute: 40,
    });
    expect(textPaused).toContain('PAUSADO / ENTRETIEMPO (40\')');
    expect(textPaused).toContain('*BARBARIANS:* 0');

    const textFinal = buildMatchWhatsAppText({
      liveMatch: { opponent_name: 'Águilas' },
      liveEvents: [],
      score: { orcos: 24, opponent: 19 },
      status: 'finished',
      currentMinute: 80,
    });
    expect(textFinal).toContain('FINALIZADO');
    expect(textFinal).toContain('*ORCOS NEGROS:* 24');
  });
});
