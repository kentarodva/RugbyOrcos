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
      .map(p => `#${p.camiseta ?? '—'} ${p.name} (${p.posicion || '—'})`)
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

function buildSystemPrompt(mode = 'general', context = {}) {
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
6. Máximo 4 párrafos precisos y técnicos`,

    personal: `${base}

Modo: COACH PERSONAL DEL JUGADOR

Eres el entrenador personal de este jugador de rugby. Tienes acceso a su perfil completo: atributos, historial de lesiones, plan de entrenamiento, datos de gimnasio, rendimiento en partidos, asistencia y bienestar.

Reglas:
1. Responde de forma personalizada usando sus datos concretos (fuerza, velocidad, lesiones)
2. Sugiere ejercicios específicos basados en sus debilidades y tendencias
3. Recuerda su plan activo y no sugieras ejercicios que ya está haciendo
4. Sé motivacional y cercano, como un coach que conoce a su jugador
5. Si preguntan sobre nutrición, usa los datos de peso y recomienda productos de supermercados colombianos
6. Si preguntan sobre progreso, consulta su historial de gym y atributos
7. Máximo 4 párrafos concisos y personalizados`
  };

  let prompt = modePrompts[mode] || modePrompts.general;

  if (context.playerProfile) {
    prompt += `\n\n--- Perfil del jugador ---\n${context.playerProfile}`;
  }
  if (context.activePlan) {
    prompt += `\n\n--- Plan de entreno del jugador ---\n${context.activePlan}`;
  }

  return prompt;
}

function buildTrainingEnrichmentPrompt(plan, player) {
  const ctx = buildAITrainingContext(player, plan);
  const currentExercises = [
    ...plan.plan.campo.map(e => `- ${e.name} (Campo)`),
    ...plan.plan.gym.map(e => `- ${e.name} (Gimnasio)`),
    ...plan.plan.recuperacion.map(e => `- ${e.name} (Recuperación)`)
  ].join('\n');

  return `Eres un coach de rugby y preparador físico profesional. Conoces todo el historial de este jugador:

${ctx}

Ejercicios ya asignados en el plan base:
${currentExercises}

Sugiere 2-3 ejercicios de rugby NUEVOS (que NO estén en la lista actual) para corregir los fallos detectados y mejorar los atributos más débiles. Considera lesiones, fatiga y tendencias. Responde SOLO en JSON válido sin markdown:
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

function buildAITrainingContext(player) {
  const a = player.attributes || {};
  const gym = player.gymStats || {};
  const w = player.weight || 85;
  const stats = player.matchStats || [];
  const logs = player.wellnessLogs || [];
  const history = player.history || [];
  const workoutLog = player.workoutLog || [];
  const injuryLog = player.injuryLog || [];
  const hia = player.hiaAssessments || [];
  const att = player.attendance || {};

  const parts = [];

  parts.push(`PERFIL: ${player.name}, ${player.posicion || '—'}, ${player._meta?.age || '?'} años, ${player._meta?.startYear ? new Date().getFullYear() - player._meta.startYear + ' años en el club' : ''}`);
  parts.push(`ESTADO: ${player.estado}${player.rol === 'Capitan' ? ' (Capitan)' : player.rol === 'Subcapitan' ? ' (Subcapitan)' : ''}`);

  // Atributos + tendencia
  parts.push(`ATRIBUTOS: Fuerza ${a.force || 50}/100, Velocidad ${a.speed || 50}/100, Resistencia ${a.stamina || 50}/100, Técnica ${a.technique || 50}/100`);
  if (history.length >= 2) {
    const first = history[0], last = history[history.length - 1];
    const trend = (v, k) => (last[k] || 0) - (first[k] || 0);
    const trends = [
      `Fuerza ${trend(first, 'force') >= 0 ? '+' : ''}${trend(first, 'force')}`,
      `Velocidad ${trend(first, 'speed') >= 0 ? '+' : ''}${trend(first, 'speed')}`,
      `Resistencia ${trend(first, 'stamina') >= 0 ? '+' : ''}${trend(first, 'stamina')}`,
      `Técnica ${trend(first, 'technique') >= 0 ? '+' : ''}${trend(first, 'technique')}`,
    ];
    parts.push(`TENDENCIA (últimos ${history.length} tests): ${trends.join(', ')}`);
  }

  // Fuerza relativa
  if (gym.squat || gym.bench || gym.deadlift) {
    const squat = gym.squat ? `${gym.squat}kg (${(gym.squat / w).toFixed(1)}xBW)` : 'N/A';
    const bench = gym.bench ? `${gym.bench}kg (${(gym.bench / w).toFixed(1)}xBW)` : 'N/A';
    const dead = gym.deadlift ? `${gym.deadlift}kg (${(gym.deadlift / w).toFixed(1)}xBW)` : 'N/A';
    parts.push(`1RM: Sentadilla ${squat}, Press Banca ${bench}, Peso Muerto ${dead}. Peso: ${w}kg`);
  }

  // Rendimiento en partidos
  if (stats.length > 0) {
    const total = stats.length;
    const tries = stats.reduce((s, m) => s + (m.tries || 0), 0);
    const tackles = stats.reduce((s, m) => s + (m.tackles || 0), 0);
    const avgTackles = (tackles / total).toFixed(1);
    const mvps = stats.filter(m => m.mvp).length;
    const yellows = stats.reduce((s, m) => s + (m.yellowCards || 0), 0);
    const reds = stats.reduce((s, m) => s + (m.redCards || 0), 0);
    parts.push(`PARTIDOS: ${total} jugados, ${tries} tries, ${avgTackles} tackles/partido, ${mvps} MVP, ${yellows} amarillas, ${reds} rojas`);

    if (total >= 3) {
      const recent = stats.slice(-3);
      const recentAvg = (recent.reduce((s, m) => s + (m.tackles || 0), 0) / 3).toFixed(1);
      if (recentAvg < avgTackles) parts.push(`TENDENCIA TACKLES: ↓ bajando (${recentAvg}/partido últimos 3 vs ${avgTackles} promedio)`);
      else if (recentAvg > avgTackles) parts.push(`TENDENCIA TACKLES: ↑ subiendo (${recentAvg}/partido últimos 3)`);
    }
  }

  // Entrenamientos
  if (workoutLog.length > 0) {
    const last30 = workoutLog.filter(w => new Date(w.date) > Date.now() - 30 * 86400000);
    const totalCompleted = last30.length;
    // Estimate completion rate based on total exercises vs expected
    const recentDays = last30.map(w => w.date).sort();
    let streak = 0, maxStreak = 0;
    for (let i = recentDays.length - 1; i >= 0; i--) {
      const d = new Date(recentDays[i]);
      const next = i > 0 ? new Date(recentDays[i - 1]) : null;
      const diff = next ? (d - next) / 86400000 : 999;
      streak++;
      if (diff > 2 || i === 0) { maxStreak = Math.max(maxStreak, streak); streak = 0; }
    }
    parts.push(`ENTRENAMIENTO: ${totalCompleted} sesiones en 30d, racha máxima ${maxStreak} días`);

    const skipCounts = {};
    workoutLog.forEach(w => (w.ejercicios || []).forEach(e => {
      if (e.completed === false) { skipCounts[e.exerciseId] = (skipCounts[e.exerciseId] || 0) + 1; }
    }));
    const mostSkipped = Object.entries(skipCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (mostSkipped.length > 0) parts.push(`EJERCICIOS MÁS SALTADOS: ${mostSkipped.map(([id, n]) => `${id} (${n}x)`).join(', ')}`);
  }

  // Wellness
  if (logs.length > 0) {
    const recent = logs.slice(-7);
    const avg = (k) => (recent.reduce((s, l) => s + (l[k] || 0), 0) / recent.length).toFixed(1);
    parts.push(`WELLNESS (7d): Sueño ${avg('sleep')}/5, Dolor ${avg('soreness')}/5, Estrés ${avg('stress')}/5`);
    if (Number(avg('sleep')) < 3) parts.push('⚠️ FATIGA: Sueño bajo — reducir intensidad esta semana');
    if (Number(avg('soreness')) > 3.5) parts.push('⚠️ DOLOR ALTO: Posible sobreentrenamiento — priorizar recuperación');
  }

  // Lesiones
  if (injuryLog.length > 0) {
    const current = injuryLog[0];
    parts.push(`LESIÓN ACTIVA: ${current.diagnosis || 'N/A'} (Fase ${current.phase || 1}/4, ${current.weeks || '?'} semanas)`);
  }
  const pastInjuries = injuryLog.slice(1).map(i => i.diagnosis).filter(Boolean);
  if (pastInjuries.length > 0) parts.push(`LESIONES PASADAS: ${pastInjuries.join(', ')}`);

  // Fracturas
  if (player.had_fractures) parts.push('FRACTURAS PREVIAS: Sí — precaución en ejercicios de alto impacto');

  // HIA
  if (hia.length > 0) {
    const withSymptoms = hia.filter(h => h.symptomsDetected).length;
    if (withSymptoms > 0) parts.push(`HIA: ${hia.length} evaluaciones, ${withSymptoms} con síntomas — REDUCIR contacto`);
  }

  // Asistencia
  if (att.total > 0) {
    const pct = ((att.present || 0) / att.total * 100).toFixed(0);
    parts.push(`ASISTENCIA: ${pct}% (${att.present || 0}/${att.total}), ${att.late || 0} tarde`);
  }

  // Penalizaciones
  const burpees = player.penalties?.burpees || 0;
  if (burpees > 0) parts.push(`PENALIZACIONES: ${burpees} burpees pendientes — considerar carga adicional`);

  // Feedback de la semana anterior
  const lastFeedback = player.lastPlanFeedback;
  const lastRate = player.lastPlanCompletionRate;
  if (lastFeedback || lastRate != null) {
    const fb = [];
    if (lastRate != null) fb.push(`Tasa de finalización: ${lastRate}%`);
    if (lastFeedback?.rating) fb.push(`Calificación: ${lastFeedback.rating}/5`);
    if (lastFeedback?.comment) fb.push(`Comentario: "${lastFeedback.comment}"`);
    if (fb.length > 0) parts.push(`SEMANA ANTERIOR: ${fb.join(' · ')}`);
  }

  // Modalidad y preferencias del jugador
  if (player.preferences?.goal) {
    parts.push(`OBJETIVO: ${player.preferences.goal}`);
  }
  if (player.preferences?.modality?.length) {
    parts.push(`MODALIDAD PREFERIDA: ${player.preferences.modality.join(', ')}`);
  }
  if (player.preferences?.dislikes?.length) {
    parts.push(`ALIMENTOS QUE NO LE GUSTAN: ${player.preferences.dislikes.join(', ')}`);
  }
  if (player.matchFaults?.length) {
    parts.push(`FALLOS DETECTADOS EN PARTIDOS: ${player.matchFaults.join(', ')}`);
  }

  return parts.join('\n');
}

function buildAITrainingPlanPrompt(player) {
  const ctx = buildAITrainingContext(player);
  const modality = player.preferences?.modality?.join(', ') || 'gym, campo';
  const goal = player.preferences?.goal || 'fuerza';
  const stores = player.preferences?.stores?.length ? player.preferences.stores.join(', ') : 'D1, Ara, Éxito';
  const dislikes = player.preferences?.dislikes?.length ? player.preferences.dislikes.join(', ') : 'ninguno';
  const matchFaults = (player.matchFaults || []).length ? player.matchFaults.join(', ') : 'ninguno detectado';

  return `Eres un coach de rugby personal de élite colombiano. Tienes acceso COMPLETO al historial de este jugador. Basado en esta información, genera un plan de entrenamiento completo y un plan de alimentación con productos disponibles en supermercados colombianos (${stores}).

Datos del jugador:
${ctx}

MODALIDAD DE ENTRENAMIENTO: ${modality}
OBJETIVO PRINCIPAL: ${goal}
FALLOS EN PARTIDOS RECIENTES: ${matchFaults}
ALIMENTOS QUE NO LE GUSTAN: ${dislikes}
TIENDAS DONDE COMPRA: ${stores}

Genera un plan con esta estructura JSON EXACTA:
{
  "analisis": "Un párrafo resumiendo la condición actual del jugador y qué necesita trabajar",
  "riesgos": ["Riesgo 1", "Riesgo 2"],
  "metas": ["Meta realista a 30 días", "Meta realista a 90 días"],
  "plan": {
    "calentamiento": [
      { "nombre": "Ejercicio de calentamiento", "duracion": "5 min", "descripcion": "Cómo hacerlo" }
    ],
    "campo": [
      { "nombre": "Ejercicio campo", "sets": "4x8", "descripcion": "Cómo hacerlo", "razon": "Por qué" }
    ],
    "gimnasio": [
      { "nombre": "Ejercicio gym", "sets": "3x10", "carga": "65% 1RM", "descripcion": "Cómo hacerlo", "razon": "Por qué" }
    ],
    "crossfit": [
      { "nombre": "WOD o ejercicio funcional", "sets": "AMRAP 15", "descripcion": "Cómo hacerlo", "razon": "Por qué" }
    ],
    "casa": [
      { "nombre": "Ejercicio en casa", "sets": "3x15", "descripcion": "Cómo hacerlo", "razon": "Por qué" }
    ],
    "recuperacion": [
      { "nombre": "Recuperación", "duracion": "10 min", "descripcion": "Cómo hacerlo" }
    ]
  },
  "recomendaciones": {
    "sueno": "Recomendación sobre descanso (horas, rutina)",
    "nutricion": {
      "preEntreno": {
        "comida": "Descripción de la comida",
        "ingredientes": [
          { "producto": "Nombre", "cantidad": "150g", "dondeComprar": "D1" }
        ],
        "preparacion": "Instrucciones paso a paso",
        "tiempo": "15 min",
        "macros": { "proteinas": "30g", "carbohidratos": "45g", "grasas": "12g", "calorias": "400kcal" }
      },
      "postEntreno": {
        "comida": "Descripción",
        "ingredientes": [{"producto": "...", "cantidad": "100g", "dondeComprar": "Éxito"}],
        "preparacion": "Instrucciones",
        "tiempo": "10 min",
        "macros": { "proteinas": "25g", "carbohidratos": "35g", "grasas": "8g", "calorias": "310kcal" }
      },
      "snacks": [
        { "comida": "Yogurt griego + banano (D1)", "cuando": "10:00 AM", "macros": { "proteinas": "12g", "carbohidratos": "30g", "grasas": "5g", "calorias": "210kcal" } }
      ],
      "hidratacion": "3-4L de agua/día. Agregar panela con limón post-entreno.",
      "suplementos": "Proteína Whey, Creatina 5g/día"
    },
    "prevencion": "Ejercicio preventivo extra según lesiones previas"
  }
}

IMPORTANTE:
- SOLO incluye las categorías de plan que apliquen (ej: si la modalidad es gym, no incluyas campo)
- Los ingredientes de nutrición DEBEN ser productos disponibles en ${stores}
- Usa nombres locales colombianos para los alimentos (ej: 'arepa', 'posta', 'panela', 'bocadillo')
- Indica en qué tienda comprar cada ingrediente (${stores})
- Incluye gramos exactos y macros en cada comida
- Responde SOLO el JSON, sin markdown, sin explicaciones adicionales.`}


function buildMatchAnalysisPrompt(fixture, players, teamLabel) {
  const playerStats = players
    .filter(p => p.teamCategory === fixture.teamCategory)
    .map(p => {
      const stats = (p.matchStats || []).find(s => s.date === fixture.date);
      if (!stats) return null;
      return `- #${p.camiseta ?? '—'} ${p.name} (${p.posicion || '—'}): ${stats.tries || 0} tries, ${stats.conversions || 0} conv, ${stats.tackles || 0} tackles, ${stats.turnovers || 0} turnovers, ${stats.yellowCards ? '1 Amarilla' : ''}${stats.redCards ? '1 Roja' : ''}${stats.mvp ? ' [MVP]' : ''}`;
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
  buildAITrainingContext,
  buildAITrainingPlanPrompt,
  buildMatchAnalysisPrompt
};
