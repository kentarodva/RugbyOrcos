import React, { useMemo } from 'react';

function ProactiveSuggestions({ fixtures, schedule, futureFixtures, onQuickQuestion }) {
  const suggestions = useMemo(() => {
    const items = [];
    const now = new Date();

    const nextMatch = futureFixtures
      ?.filter(f => new Date(f.date + 'T00:00:00') >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    const lastMatch = fixtures
      ?.filter(f => f.orcosScore !== undefined)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    const upcomingEvent = schedule
      ?.filter(e => new Date(e.date + 'T' + (e.time || '00:00')) >= now)
      .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))[0];

    if (lastMatch) {
      const won = Number(lastMatch.orcosScore) > Number(lastMatch.opponentScore);
      items.push({
        icon: won ? '🏆' : '📉',
        label: won ? 'Analizar última victoria' : 'Analizar última derrota',
        question: `Analiza el último partido vs ${lastMatch.opponent} (${lastMatch.orcosScore || 0}-${lastMatch.opponentScore || 0}). ¿Qué podemos mejorar?`,
      });
    }

    if (nextMatch) {
      items.push({
        icon: '⚔️',
        label: `Estrategia vs ${nextMatch.opponent}`,
        question: `Dame una estrategia táctica para el próximo partido contra ${nextMatch.opponent}.`,
      });
    }

    items.push(
      { icon: '💪', label: 'Rutina de pretemporada', question: 'Crea una rutina de pretemporada de 4 semanas para rugby' },
      { icon: '🥗', label: 'Nutrición deportiva', question: 'Recomendaciones de nutrición para un jugador de rugby' },
      { icon: '🛡️', label: 'Ejercicios de tackle', question: 'Los mejores ejercicios para mejorar técnica de tackle' },
    );

    if (upcomingEvent) {
      items.push({
        icon: '📋',
        label: `Tips para ${upcomingEvent.title}`,
        question: `Preparación para ${upcomingEvent.title} — ¿qué deberíamos practicar?`,
      });
    }

    return items.slice(0, 6);
  }, [fixtures, schedule, futureFixtures]);

  return (
    <div style={{ padding: '0 4px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => onQuickQuestion(s.question)}
            className="btn-outline"
            style={{
              padding: '5px 10px', fontSize: '0.68rem', whiteSpace: 'nowrap',
              borderColor: 'var(--border-glass)', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProactiveSuggestions;
