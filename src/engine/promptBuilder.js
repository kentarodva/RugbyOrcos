import { EQUIPOS_LABELS } from '../context/ClubContext';

function buildChatContext(contextData = {}) {
  const {
    activeTeam = '',
    opponentName = '',
    players = [],
    schedule = [],
    championships = [],
    fixtures = []
  } = contextData;

  const teamLabel = EQUIPOS_LABELS[activeTeam] || activeTeam;
  const parts = [];

  if (teamLabel) {
    parts.push(`Equipo activo: ${teamLabel}`);
  }

  if (opponentName) {
    parts.push(`Próximo rival: ${opponentName}`);
  }

  const teamPlayers = players.filter(p => p.teamCategory === activeTeam);
  if (teamPlayers.length > 0) {
    const rosterSummary = teamPlayers
      .filter(p => p.estado === 'activo')
      .map(p => `#${p.camiseta} ${p.name} (${p.posicion})`)
      .join(', ');
    if (rosterSummary) {
      parts.push(`Roster activo: ${rosterSummary}`);
    }

    const injured = teamPlayers.filter(p => p.estado === 'lesionado');
    if (injured.length > 0) {
      const injuredList = injured
        .map(p => {
          const diag = p.injuryLog?.[0]?.diagnosis || 'Lesión';
          const phase = p.injuryLog?.[0]?.phase || 1;
          return `${p.name}: ${diag} (Fase ${phase}/4)`;
        })
        .join('; ');
      parts.push(`Jugadores lesionados: ${injuredList}`);
    }

    const suspended = teamPlayers.filter(p => p.estado === 'suspendido');
    if (suspended.length > 0) {
      parts.push(`Jugadores suspendidos: ${suspended.map(p => p.name).join(', ')}`);
    }
  }

  const teamSchedule = schedule.filter(e => e.teamCategory === activeTeam);
  if (teamSchedule.length > 0) {
    const nextEvents = teamSchedule
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3)
      .map(e => `${e.title} - ${e.date} ${e.time} en ${e.location}`)
      .join(' | ');
    if (nextEvents) {
      parts.push(`Próximos eventos: ${nextEvents}`);
    }
  }

  const teamChamps = championships.filter(c => c.teamCategory === activeTeam);
  if (teamChamps.length > 0) {
    const champsInfo = teamChamps
      .map(c => `${c.name} (fecha límite: ${c.deadlineDate})`)
      .join(' | ');
    if (champsInfo) {
      parts.push(`Campeonatos activos: ${champsInfo}`);
    }
  }

  const teamFixtures = fixtures
    .filter(f => f.teamCategory === activeTeam)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (teamFixtures.length > 0) {
    const recentResults = teamFixtures
      .slice(0, 5)
      .map(f => {
        const result = f.orcosScore > f.opponentScore ? 'Victoria' :
          f.orcosScore < f.opponentScore ? 'Derrota' : 'Empate';
        return `${f.date}: ${teamLabel} ${f.orcosScore}-${f.opponentScore} vs ${f.opponent} (${result}, MVP: ${f.mvp})`;
      })
      .join('\n');
    if (recentResults) {
      parts.push(`Últimos resultados:\n${recentResults}`);
    }
  }

  return parts.length > 0 ? `\n\n--- Contexto del club ---\n${parts.join('\n')}` : '';
}

function buildSystemPrompt(mode = 'general') {
  const base = `Eres un coach y árbitro de rugby de élite con 20 años de experiencia en World Rugby. Responde SIEMPRE en español con tono profesional y cercano. El club se llama "Rugby Orcos".`;

  const modePrompts = {
    general: `${base}

Reglas:
1. Rugby en general: reglamento, táctica, preparación física, historia, gestión de clubes amateur
2. Si preguntan de reglas, cita la ley específica (ej: "Ley 15 - Ruck")
3. Si es táctica, da ejemplos concretos con posiciones
4. Máximo 3-4 párrafos concisos
5. Usa **negritas** para conceptos clave
6. Si no es de rugby: "Solo puedo ayudar con rugby. ¿En qué aspecto del juego necesitas ayuda?"`,

    tactico: `${base}

Modo: ANÁLISIS TÁCTICO AVANZADO

Reglas:
1. Enfócate en estrategia, formaciones, jugadas ensayadas y lectura de juego
2. Nombra posiciones específicas en español (PIL, TAL, 2L, FLK, OCT, M.M, APE, CTR, WNG, ZAG)
3. Da ejemplos concretos de movimientos tácticos (loops, switches, drift, blitz)
4. Considera el contexto del equipo activo y el rival
5. Máximo 4-5 párrafos con detalles tácticos precisos`,

    reglas: `${base}

Modo: ÁRBITRO WORLD RUGBY CERTIFICADO

Reglas:
1. Responde SOLO sobre reglamento oficial de World Rugby
2. Cita SIEMPRE la ley específica (número y nombre, ej: "Ley 14 - El Tackle")
3. Explica la sanción correspondiente (penal, free kick, scrum)
4. Menciona la señal del árbitro cuando aplique
5. Si la regla cambió recientemente, menciona el año de actualización
6. Máximo 4 párrafos precisos y técnicos`
  };

  return modePrompts[mode] || modePrompts.general;
}

function buildTrainingEnrichmentPrompt(plan, player) {
  const faultList = plan.matchFaults.length > 0
    ? plan.matchFaults.join(', ')
    : 'Ningún fallo detectado';

  const currentExercises = [
    ...plan.plan.campo.map(e => `- ${e.name} (Campo)`),
    ...plan.plan.gym.map(e => `- ${e.name} (Gimnasio)`),
    ...plan.plan.recuperacion.map(e => `- ${e.name} (Recuperación)`)
  ].join('\n');

  return `Eres un coach de rugby y preparador físico profesional. Genera ejercicios adicionales para este jugador:

Nombre: ${player.name}
Posición: ${player.posicion} | Rol: ${player.rol} | Estado: ${player.estado}
Atributos: Fuerza ${player.attributes.force}/100, Velocidad ${player.attributes.speed}/100, Resistencia ${player.attributes.stamina}/100, Técnica ${player.attributes.technique}/100
${player.gymStats ? `1RM: Sentadilla ${player.gymStats.squat}kg, Press Banca ${player.gymStats.bench}kg, Peso Muerto ${player.gymStats.deadlift}kg. Peso: ${player.weight}kg` : ''}
Fallos recientes detectados: ${faultList}

Ejercicios ya asignados en el plan:
${currentExercises}

Sugiere 2-3 ejercicios de rugby NUEVOS (que NO estén en la lista actual) para corregir los fallos detectados y mejorar los atributos más débiles. Responde SOLO en JSON válido sin markdown:
{
  "sugerencias": [
    {
      "nombre": "Nombre del ejercicio",
      "categoria": "campo|gym|recuperacion",
      "razon": "Por qué este ejercicio beneficia al jugador (1 frase corta)",
      "drills": ["Paso 1", "Paso 2", "Paso 3"]
    }
  ]
}`;
}

function buildMatchAnalysisPrompt(fixture, players, teamLabel) {
  const playerStats = players
    .filter(p => p.teamCategory === fixture.teamCategory)
    .map(p => {
      const stats = (p.matchStats || []).find(s => s.date === fixture.date);
      if (!stats) return null;
      return `- #${p.camiseta} ${p.name} (${p.posicion}): ${stats.tries || 0} tries, ${stats.conversions || 0} conv, ${stats.tackles || 0} tackles, ${stats.turnovers || 0} turnovers, ${stats.yellowCards ? '1 Amarilla' : ''}${stats.redCards ? '1 Roja' : ''}${stats.mvp ? ' [MVP]' : ''}`;
    })
    .filter(Boolean)
    .join('\n');

  return `Eres un analista de rugby profesional. Analiza este partido:

${teamLabel} ${fixture.orcosScore} - ${fixture.opponentScore} ${fixture.opponent}
Fecha: ${fixture.date}
Tries del equipo: ${fixture.tries || 'N/A'}
MVP: ${fixture.mvp || 'No designado'}

Rendimiento individual:
${playerStats || 'Sin datos individuales disponibles'}

Genera un análisis en español con esta estructura exacta:
1. RESUMEN (1-2 frases del partido)
2. PUNTOS FUERTES (2-3 aspectos positivos)
3. ÁREAS DE MEJORA (2-3 aspectos a trabajar)
4. JUGADOR DESTACADO (quién rindió mejor además del MVP, si lo hay)
5. RECOMENDACIÓN TÁCTICA (1 sugerencia para el próximo partido)

Responde en formato JSON:
{
  "resumen": "...",
  "puntosFuertes": ["...", "...", "..."],
  "areasMejora": ["...", "...", "..."],
  "jugadorDestacado": "...",
  "recomendacionTactica": "..."
}`;
}

export {
  buildChatContext,
  buildSystemPrompt,
  buildTrainingEnrichmentPrompt,
  buildMatchAnalysisPrompt
};
