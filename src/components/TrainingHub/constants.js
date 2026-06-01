export const WORKOUTS = {
  forwards: [
    {
      title: 'Empuje de Scrum y Estabilidad del Core',
      focus: 'Pilar, Talonador, Segunda Línea, Flanker, Octavo',
      duration: '45 minutos',
      difficulty: 'Alta',
      description: 'Enfocado en fortalecer el cuello, la espalda baja y la estabilidad abdominal para transferir el 100% de fuerza en el melé.',
      drills: [
        'Planchas frontales con peso (3 series x 1 minuto)',
        'Sentadillas profundas pesadas (4 series x 6 repeticiones)',
        'Empuje de trineo de carga pesada (5 pasadas x 15 metros)',
        'Técnica de empaque: Formar primera línea en cuclillas y aguantar binds (3 series x 30 seg)'
      ]
    },
    {
      title: 'Lanzamiento y Salto en el Line-out',
      focus: 'Talonador, Segunda Línea, Flankers, Octavo',
      duration: '35 minutos',
      difficulty: 'Media',
      description: 'Coordinación milimétrica para robar lines ajenos y asegurar posesión propia. Incluye explosividad de salto y precisión.',
      drills: [
        'Lanzamiento a diana con pelota Gilbert (30 lanzamientos de precisión a 7m, 10m y 15m)',
        'Saltos explosivos en cajón con chaleco lastrado (4 series x 8 saltos)',
        'Levantamiento rápido: Levantadores cargan al saltador explosivamente en el aire (15 repeticiones)',
        'Simulación de juego: 5 Lines seguidos a máxima velocidad con defensor pasivo'
      ]
    },
    {
      title: 'Limpieza de Ruck y Contra-Ruck',
      focus: 'Delanteros (Forwards)',
      duration: '40 minutos',
      difficulty: 'Alta',
      description: 'La ley de la melé abierta: Cómo entrar bajo a la zona de tackle y remover amenazas defensivas usando la espalda recta y el empuje de cadera.',
      drills: [
        'Tackle al escudo de impacto + Limpieza inmediata de oponente parado (10 repeticiones por jugador)',
        'Ejercicio de 3 vs 2 en espacio reducido: Limpiar el ruck en menos de 2 segundos',
        'Técnica del Gate (Entrar por la puerta del tackle): Corrección de ángulos para evitar infracciones'
      ]
    }
  ],
  backs: [
    {
      title: 'Destreza y Handling de Alta Velocidad (Pases)',
      focus: 'Medio Melé, Apertura, Centro, Ala, Zaguero',
      duration: '35 minutos',
      difficulty: 'Media',
      description: 'Garantizar pases perfectos en carrera a máxima intensidad. Reducir el tiempo de retención del balón a menos de 0.5 segundos.',
      drills: [
        'Pases en L: Correr en escuadra y pasar la pelota en espiral perfecta (15 repeticiones por lado)',
        'El reloj de pases: 5 jugadores en círculo, pases rápidos de primera intención sin soltar la carrera',
        'Pase plano bajo presión defensiva: Apertura ataca la línea y suelta pase corto al centro en el último segundo'
      ]
    },
    {
      title: 'Técnica de Patada Táctica y Despeje',
      focus: 'Medio Melé, Apertura, Centros, Zaguero',
      duration: '40 minutos',
      difficulty: 'Alta',
      description: 'Dominio del espacio territorial. Cómo usar la patada para salir de las 22 metros propias u ofender a la espalda contraria.',
      drills: [
        'Patada de cajón (Box Kick): Medio melé saca la pelota de la base y patea alto cubriendo 20-30 metros (15 intentos)',
        'Patada al touch (despeje lateral): Patear angulado buscando que la pelota bote fuera (15 patadas)',
        'Pateo rastrero (Grubber): Pases en carrera con patada sutil al ras del suelo para la superación del wing'
      ]
    },
    {
      title: 'Evasión, Cambios de Ritmo y Tackle Abierto',
      focus: 'Alas (Wings), Centros, Zaguero',
      duration: '35 minutos',
      difficulty: 'Alta',
      description: 'Cómo explotar el espacio exterior. Cambios de pie (Side-step) explosivos y tackles uno contra uno en campo abierto.',
      drills: [
        'Canal de tackle en campo abierto 1 vs 1: Atacante intenta evadir, defensor debe canalizar y tacklear de hombro',
        'Sprints de aceleración con cambio de dirección marcado por conos (5 repeticiones)',
        'Recepción de patada aérea bajo presión + contragolpe coordinado con pases de apoyo'
      ]
    }
  ],
  captain: [
    {
      title: 'Liderazgo del Clan y Toma de Decisiones bajo Fatiga',
      focus: 'Capitanes y Subcapitanes',
      duration: '30 minutos',
      difficulty: 'Media',
      description: 'Enfocado en la toma de decisiones críticas bajo fatiga física extrema, arengas motivacionales y comunicación con el árbitro.',
      drills: [
        'Sprints del 100m + Simulación de penal: elegir patear a palos, touch o scrum en 3 segundos bajo fatiga (10 repeticiones)',
        'Práctica de comunicación asertiva y respetuosa con el árbitro principal bajo presión competitiva',
        'Ajuste táctico: Coordinación del pizarrón y plan de juego de terceras líneas en situaciones adversas',
        'Arenga del Líder: Simulación de charla motivacional de medio tiempo para reactivar el clan'
      ]
    }
  ],
  coach: [
    {
      title: 'Planificación Táctica, Biomecánica y Gestión',
      focus: 'Entrenadores y Staff Técnico',
      duration: '50 minutos',
      difficulty: 'Baja',
      description: 'Análisis profundo de estadísticas de los oponentes, calibración del Roster táctico de juego y monitoreo de kinesiología.',
      drills: [
        'Análisis de video del oponente: mapear patrones del medio melé y zona defensiva rival',
        'Elaboración y ajuste de las plantillas de alineación en la Pizarra Táctica y plan de carga física',
        'Simulacros de sustitución rápida por emergencias médicas (HIA) y deudas disciplinarias de burpees'
      ]
    }
  ],
  general: [
    {
      title: 'Test Bronco (Resistencia Aeróbica)',
      focus: 'Toda la plantilla del Club (Forwards y Backs)',
      duration: '30 minutos',
      difficulty: 'Extrema',
      description: 'El test de resistencia física clásico del Rugby. Mide la recuperación cardiovascular mediante sprints repetitivos intermitentes.',
      drills: [
        'Distancia de carrera ida y vuelta continua: Correr 20m (ida y vuelta), correr 40m (ida y vuelta), correr 60m (ida y vuelta)',
        'Realizar este ciclo 5 veces seguidas sin detener el cronómetro',
        'Meta para Delanteros (Forwards): Menos de 5 minutos y 15 segundos',
        'Meta para Tres Cuartos (Backs): Menos de 4 minutos y 45 segundos'
      ]
    },
    {
      title: 'Prevención de Lesiones (Kinesiología Preventiva)',
      focus: 'Todos los jugadores',
      duration: '20 minutos',
      difficulty: 'Baja',
      description: 'Fortalecimiento de articulaciones clave para el rugby (hombros, cuello, tobillos) para reducir el riesgo de luxaciones y desgarros.',
      drills: [
        'Rotación de hombros con banda elástica (3 series x 15 repeticiones)',
        'Ejercicios isométricos de cuello con resistencia manual (3 series x 10 segundos por lado)',
        'Propiocepción en base inestable (Bosu) para fortalecer tobillos y rodillas (3 series x 1 minuto por pierna)'
      ]
    },
    {
      title: 'Acondicionamiento de Fuerza General',
      focus: 'Toda la plantilla',
      duration: '45 minutos',
      difficulty: 'Media',
      description: 'Circuito de fuerza funcional y acondicionamiento general para mantener la base atlética durante la temporada competitiva.',
      drills: [
        'Circuito de 5 estaciones: Sentadilla Goblet, Remo con Mancuerna, Press de Hombro, Peso Muerto Rumano, Plancha Dinámica',
        '3 rondas completas del circuito con 45 segundos de trabajo por estación y 15 segundos de descanso',
        'Enfriamiento con estiramientos dinámicos de cadena posterior'
      ]
    },
    {
      title: 'Recuperación Activa Post-Partido',
      focus: 'Todos los jugadores (día después del partido)',
      duration: '30 minutos',
      difficulty: 'Baja',
      description: 'Protocolo de recuperación activa para acelerar la regeneración muscular, drenaje linfático y reducir la inflamación post-competencia.',
      drills: [
        'Trote regenerativo suave en césped (10 minutos a ritmo de conversación)',
        'Foam roller en cuádriceps, isquiotibiales, gemelos y espalda baja (2 minutos por grupo muscular)',
        'Estiramientos estáticos asistidos en pareja para cadenas musculares principales',
        'Hidroterapia: Alternar agua fría y caliente en piernas si hay disponibilidad de duchas'
      ]
    }
  ]
};

export const CATEGORY_LABELS = {
  forwards: 'Delanteros (Forwards)',
  backs: 'Tres Cuartos (Backs)',
  captain: 'Liderazgo y Táctica (Capitán)',
  coach: 'Staff Técnico (Coach)',
  general: 'Acondicionamiento General'
};

export const CATEGORY_ICONS = {
  forwards: '🛡️',
  backs: '🏃‍♂️',
  captain: '👑',
  coach: '📋',
  general: '⚡'
};

export const CATEGORY_COLORS = {
  forwards: 'var(--color-primary)',
  backs: '#3b82f6',
  captain: 'var(--color-gold)',
  coach: '#a855f7',
  general: 'var(--color-blue)'
};

export function getPlayerCategory(player) {
  if (player.rol === 'Entrenador') return 'coach';
  if (player.rol === 'Capitán' || player.rol === 'Subcapitán') return 'captain';

  const forwardsPositions = ['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo'];
  if (forwardsPositions.includes(player.posicion)) {
    return 'forwards';
  }
  return 'backs';
}

export function getCategoryLabel(cat) {
  return CATEGORY_LABELS[cat] || 'Entrenamiento General';
}

export function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat] || '⚡';
}

export function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || 'var(--color-primary)';
}
