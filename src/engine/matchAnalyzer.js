import { buildMatchAnalysisPrompt } from './promptBuilder';
import { chat } from './aiProvider';

export async function analyzeMatch(fixture, players, teamLabel) {
  if (!fixture || !players) {
    return { error: 'Faltan datos del partido o jugadores para el análisis.' };
  }

  const prompt = buildMatchAnalysisPrompt(fixture, players, teamLabel);

  const result = await chat(prompt, { mode: 'general' });

  if (result.error) {
    return { error: result.error };
  }

  try {
    const text = result.text || '';
    const trimmed = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(trimmed);

    return {
      resumen: parsed.resumen || 'Análisis no disponible.',
      puntosFuertes: parsed.puntosFuertes || [],
      areasMejora: parsed.areasMejora || [],
      jugadorDestacado: parsed.jugadorDestacado || '',
      recomendacionTactica: parsed.recomendacionTactica || '',
      provider: result.provider,
      fixture: {
        date: fixture.date,
        opponent: fixture.opponent,
        score: `${fixture.orcosScore}-${fixture.opponentScore}`,
        mvp: fixture.mvp
      }
    };
  } catch {
    return {
      resumen: result.text,
      puntosFuertes: [],
      areasMejora: [],
      jugadorDestacado: '',
      recomendacionTactica: '',
      provider: result.provider,
      fixture: {
        date: fixture.date,
        opponent: fixture.opponent,
        score: `${fixture.orcosScore}-${fixture.opponentScore}`,
        mvp: fixture.mvp
      }
    };
  }
}
