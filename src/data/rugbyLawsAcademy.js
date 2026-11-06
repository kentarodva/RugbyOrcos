// ── Catálogo de Leyes del Juego, Faltas y Certificaciones World Rugby / FCR ──
// Basado en el Libro Oficial de Leyes de World Rugby y las directrices de la Federación Colombiana de Rugby (FCR).

export const RUGBY_LAWS_LESSONS = [
  {
    id: 'tackle_alto',
    lawNumber: 'Ley 9.13',
    title: 'Tackle Alto y Contacto Peligroso (Head Contact Process)',
    severity: 'Grave (Tarjeta Roja / Amarilla)',
    color: '#FF5C4D',
    badge: 'Seguridad Crítica',
    infractionDesc:
      'Un jugador no debe taclear a un oponente en forma peligrosa. El contacto directo con la cabeza, cuello o garganta mediante el hombro o brazo rígido pone en riesgo inminente la integridad del deportista.',
    sanction: 'Penal + Tarjeta Roja directa (o Amarilla con factores de mitigación claros).',
    correctTechniqueTitle: 'Técnica Correcta Rugby Ready:',
    correctTechnique:
      'Apunta siempre a la zona comprendida entre la cintura y los muslos. Posiciona tu cabeza detrás de la cadera o glúteos del oponente ("mejilla con mejilla"). Rodea firmemente con ambos brazos y rueda hacia el suelo de forma controlada.',
    fcrNote: 'En el rugby caribeño y torneos juveniles de Sucre, los árbitros aplican tolerancia cero al tackle alto para erradicar conmociones cerebrales.',
    animationType: 'tackle'
  },
  {
    id: 'offside_ruck',
    lawNumber: 'Ley 14 & 15',
    title: 'Fuera de Juego (Offside) en el Ruck & Entrada por la Puerta',
    severity: 'Infracción Táctica (Penal)',
    color: '#E8B931',
    badge: 'Disciplina Táctica',
    infractionDesc:
      'Cuando se forma un ruck (al menos un jugador de cada equipo en contacto sobre el balón en el suelo), la línea de fuera de juego se traza en el último pie del último jugador de cada equipo. Entrar por los lados o despegarse antes de que el balón salga es penal.',
    sanction: 'Penal en contra (opción de patada a palos por 3 puntos o patada al touch con lanzamiento).',
    correctTechniqueTitle: 'Entrada Reglamentaria "Por la Puerta" (Through the Gate):',
    correctTechnique:
      'Llega siempre desde tu propio campo, alineado con el eje del ruck. Ingresa por detrás del último pie del compañero, mantén los hombros por encima de las caderas y busca limpiar (cleanout) el ruck de pie, sin tirarte sobre los jugadores derribados.',
    fcrNote: 'Es la falta más castigada en partidos regionales. Mantener la disciplina en el ruck evita penales regalados frente a los postes.',
    animationType: 'ruck'
  },
  {
    id: 'knock_on',
    lawNumber: 'Ley 11',
    title: 'Pase Adelantado (Forward Pass) y Knock-on',
    severity: 'Infracción Técnica (Scrum)',
    color: '#38bdf8',
    badge: 'Manejo de Balón',
    infractionDesc:
      'Un knock-on ocurre cuando el balón pierde contacto con la mano o brazo de un jugador, viaja hacia adelante (hacia la línea de pelota muerta del rival) y toca el suelo o a otro jugador antes de ser recuperado.',
    sanction: 'Scrum / Melé con introducción del balón para el equipo no infractor.',
    correctTechniqueTitle: 'Mecánica de Pase Seguro:',
    correctTechnique:
      'El pase en el rugby siempre debe tener trayectoria hacia atrás de las manos. Para recepciones en velocidad con manos sudorosas por el clima de Corozal, forma una "W" o triángulo con los pulgares e índices y atrapa contra el pecho.',
    fcrNote: 'El calor y la humedad del Caribe aumentan el riesgo de knock-on. El uso de resina aprobada o secado de manos constante es clave.',
    animationType: 'pass'
  },
  {
    id: 'scrum_colapso',
    lawNumber: 'Ley 19.37',
    title: 'Derrumbe o Colapso Ilícito de Scrum (Melé)',
    severity: 'Falta Grave contra la Seguridad (Penal)',
    color: '#ff9100',
    badge: 'Seguridad en Formaciones Fijas',
    infractionDesc:
      'Un jugador de primera línea no debe derribar, colapsar intencionalmente ni tirar hacia abajo a un oponente en el scrum. Asimismo, empujar en ángulo cruzado (abrir la cuña) es ilegal.',
    sanction: 'Penal en contra. En caso de reiteración, tarjeta amarilla de 10 minutos (Sin-Bin).',
    correctTechniqueTitle: 'Posición de Fuerza Estable (Crouch - Bind - Set):',
    correctTechnique:
      'Espalda completamente recta paralela al piso, columna alineada, mirada al frente ("ojos arriba"), flexión de rodillas a 90°-120° y agarre (bind) firme en el cuerpo del pilar rival, nunca en el brazo o el pantalón.',
    fcrNote: 'La primera línea de Orcos Negros debe priorizar la estabilidad sobre el impacto desmedido para prevenir lesiones cervicales.',
    animationType: 'scrum'
  },
  {
    id: 'not_releasing',
    lawNumber: 'Ley 14.7',
    title: 'No Liberar el Balón en el Suelo (Tackled Player Not Releasing)',
    severity: 'Infracción en el Punto de Contacto (Penal)',
    color: '#2EE57A',
    badge: 'Disputa de Posesión',
    infractionDesc:
      'El jugador derribado (tackled) debe de inmediato liberar o empujar el balón lejos de su cuerpo para que pueda ser disputado legalmente por los jugadores de pie.',
    sanction: 'Penal en contra concedido al defensor que realiza la pesca legal (Jackal).',
    correctTechniqueTitle: 'Presentación Dinámica de Balón:',
    correctTechnique:
      'Al caer derribado, extiende los brazos hacia tu propio campo colocando el balón lo más lejos posible del defensor antes de que se arme el ruck ("presentación larga").',
    fcrNote: 'Un buen placador que se pone de pie antes de jugar el balón tiene prioridad de pesca si el atacante retiene.',
    animationType: 'jackal'
  },
  {
    id: 'crossing_pantalla',
    lawNumber: 'Ley 9.1',
    title: 'Obstrucción / Pantalla / Crossing',
    severity: 'Juego Desleal (Penal)',
    color: '#a855f7',
    badge: 'Espíritu de Juego Limpio',
    infractionDesc:
      'Un jugador que corre delante de su compañero portador del balón impidiendo deliberadamente que un defensor realice el tackle comete obstrucción (crossing).',
    sanction: 'Penal en el lugar de la infracción.',
    correctTechniqueTitle: 'Alineación de Ataque en Profundidad:',
    correctTechnique:
      'Mantén siempre líneas escalonadas y diagonales. Quien no tiene el balón debe entrar desde atrás o en señuelo sin cortar la trayectoria del defensor.',
    fcrNote: 'Común en jugadas ensayadas mal sincronizadas. La clave es el timming de la carrera.',
    animationType: 'crossing'
  }
];

export const WORLD_RUGBY_CERTIFICATIONS = [
  {
    id: 'rugby_ready',
    name: 'Rugby Ready (World Rugby)',
    category: 'Seguridad & Prevención',
    url: 'https://passport.world.rugby/injury-prevention-and-risk-management/rugby-ready/',
    description: 'Programa oficial de preparación física, técnica de contacto seguro y prevención de lesiones.',
    badge: 'Obligatorio FCR'
  },
  {
    id: 'laws_exam',
    name: 'Examen de las Leyes del Juego',
    category: 'Reglamento Oficial',
    url: 'https://passport.world.rugby/laws-of-the-game/laws-by-flavour/',
    description: 'Evaluación oficial de las 21 leyes de World Rugby para jugadores, capitanes y árbitros.',
    badge: 'Requisito Torneo'
  },
  {
    id: 'concussion_mgmt',
    name: 'Gestión de Conmociones Cerebrales (HIA)',
    category: 'Salud y Primeros Auxilios',
    url: 'https://passport.world.rugby/player-welfare-and-medical/concussion-management/',
    description: 'Protocolo de Reconocer y Retirar para salvaguardar la vida y salud del jugador.',
    badge: 'Protocolo Médico'
  },
  {
    id: 'fair_first_aid',
    name: 'Primeros Auxilios en el Rugby (FAIR)',
    category: 'Asistencia en Cancha',
    url: 'https://passport.world.rugby/player-welfare-and-medical/first-aid-in-rugby/',
    description: 'Atención inmediata de traumatismos, vendajes y cuidados de emergencia en campo.',
    badge: 'Staff Técnico'
  }
];

export const ACADEMY_QUIZ_QUESTIONS = [
  {
    question: 'En un partido en Corozal, un defensor de Orcos taclea al apertura rival envolviendo su cuello con el brazo rígido. ¿Qué sanción corresponde según la Ley 9.13?',
    options: [
      'Scrum con lanzamiento para el rival',
      'Penal y Tarjeta Roja directa (salvo factores de mitigación claros)',
      'Solo amonestación verbal del árbitro',
      'Free kick a 10 metros'
    ],
    correctIndex: 1,
    explanation: 'El contacto peligroso directo a la cabeza/cuello (Head Contact Process) se sanciona con Penal y Tarjeta Roja de acuerdo con las directivas de seguridad de World Rugby y la FCR.'
  },
  {
    question: '¿Por dónde debe ingresar un jugador a disputar un ruck que se acaba de formar en el suelo?',
    options: [
      'Por cualquier lateral siempre que no empuje al árbitro',
      'Directamente "por la puerta" detrás del último pie del compañero',
      'Lanzándose en plancha sobre los jugadores caídos',
      'Desde el campo rival retrocediendo'
    ],
    correctIndex: 1,
    explanation: 'La Ley 15 exige ingresar por detrás de la línea del último pie (a través de la puerta). Entrar por el costado es fuera de juego y se castiga con penal.'
  },
  {
    question: 'Si un jugador de Orcos comete un knock-on involuntario en ataque, ¿cuál es la reanudación reglamentaria?',
    options: [
      'Penal en contra a los postes',
      'Scrum con introducción para el equipo rival',
      'Lineout rápido en la línea de 22',
      'Drop de salida desde el in-goal'
    ],
    correctIndex: 1,
    explanation: 'El knock-on o pase hacia adelante accidental se reanuda con Scrum a favor del equipo no infractor (Ley 11).'
  },
  {
    question: '¿Qué debe hacer de inmediato un jugador derribado que tiene el balón en el suelo?',
    options: [
      'Aferrarse al balón con las dos piernas hasta que lleguen sus compañeros',
      'Soltar o pasar el balón inmediatamente para permitir la disputa legal',
      'Ponerse de pie con el balón sin soltarlo nunca',
      'Pedir tiempo al árbitro central'
    ],
    correctIndex: 1,
    explanation: 'El portador derribado debe hacer el balón disponible de inmediato. Retenerlo es penal por "No liberar" (Ley 14.7).'
  },
  {
    question: '¿Cuál es el protocolo de seguridad obligatorio ante una sospecha de conmoción cerebral en el rugby colombiano?',
    options: [
      'Darle agua con azúcar y dejarlo seguir jugando 10 minutos',
      'Reconocer y Retirar de inmediato al jugador del partido (Protocolo HIA)',
      'Esperar al entretiempo para revisar si recuerda el marcador',
      'Aplicarle hielo y cambiarlo solo si sangra'
    ],
    correctIndex: 1,
    explanation: 'World Rugby y la FCR exigen "Reconocer y Retirar" de manera irrevocable ante cualquier indicio de conmoción. La salud está por encima de cualquier resultado deportivo.'
  }
];
