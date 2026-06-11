import { describe, it, expect, vi } from 'vitest';
import { analyzeMatch } from '../../engine/matchAnalyzer';

vi.mock('../../engine/aiProvider', () => ({
  chat: vi.fn(),
}));

vi.mock('../../engine/promptBuilder', () => ({
  buildMatchAnalysisPrompt: vi.fn(() => 'match analysis prompt'),
}));

describe('analyzeMatch', () => {
  const fixture = {
    date: '2026-05-15',
    opponent: 'Tigres',
    orcosScore: 24,
    opponentScore: 17,
    mvp: 1,
  };
  const players = [{ id: 1, nombre: 'Juan', posicion: 'Pilar' }];

  it('retorna error si faltan datos', async () => {
    const r1 = await analyzeMatch(null, players, 'Orcos');
    expect(r1.error).toBeDefined();
    const r2 = await analyzeMatch(fixture, null, 'Orcos');
    expect(r2.error).toBeDefined();
  });

  it('retorna error si chat falla', async () => {
    const { chat } = await import('../../engine/aiProvider');
    chat.mockResolvedValueOnce({ error: 'Provider no disponible' });
    const result = await analyzeMatch(fixture, players, 'Orcos');
    expect(result.error).toBeDefined();
  });

  it('parsea JSON exitoso', async () => {
    const { chat } = await import('../../engine/aiProvider');
    chat.mockResolvedValueOnce({
      text: JSON.stringify({
        resumen: 'Buen partido',
        puntosFuertes: ['tackle'],
        areasMejora: ['scrum'],
        jugadorDestacado: 'Juan',
        recomendacionTactica: 'Mejorar scrum',
      }),
      provider: 'openrouter',
    });
    const result = await analyzeMatch(fixture, players, 'Orcos');
    expect(result.resumen).toBe('Buen partido');
    expect(result.puntosFuertes).toContain('tackle');
    expect(result.jugadorDestacado).toBe('Juan');
    expect(result.fixture.opponent).toBe('Tigres');
  });

  it('retorna texto plano si JSON inválido', async () => {
    const { chat } = await import('../../engine/aiProvider');
    chat.mockResolvedValueOnce({ text: 'Respuesta no JSON', provider: 'openrouter' });
    const result = await analyzeMatch(fixture, players, 'Orcos');
    expect(result.resumen).toBe('Respuesta no JSON');
    expect(result.puntosFuertes).toEqual([]);
  });
});
