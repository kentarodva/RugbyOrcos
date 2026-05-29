const EXERCISE_LIBRARY = [
  // ============================================================
  // 🏉 CAMPO — TACKLE
  // ============================================================
  {
    id: 'tackle_tecnico',
    name: 'Tackle Técnico Frontal (Hombro-Cadera)',
    category: 'campo',
    subcategory: 'tackle',
    targetPositions: ['TODOS'],
    difficulty: 2,
    durationMin: 20,
    equipment: ['escudo'],
    drills: [
      'Entrada frontal con hombro derecho, cabeza detrás del oponente (10 repeticiones)',
      'Tackle con impulso de cadera y cierre de brazos (10 repeticiones)',
      'Tackle en movimiento de 5 metros con defensor pasivo (8 repeticiones)'
    ]
  },
  {
    id: 'tackle_lateral',
    name: 'Tackle Lateral y Canalización',
    category: 'campo',
    subcategory: 'tackle',
    targetPositions: ['Ala', 'Zaguero', 'Flanker'],
    difficulty: 3,
    durationMin: 20,
    equipment: ['conos', 'escudo'],
    drills: [
      'Canalizar al atacante hacia la banda en espacio de 5m (8 repeticiones)',
      'Tackle lateral con barrido de piernas a velocidad (6 repeticiones)',
      '1 vs 1 en espacio abierto: defensor debe forzar el error (10 repeticiones)'
    ]
  },
  {
    id: 'tackle_doble',
    name: 'Tackle Doble y Limpieza Inmediata',
    category: 'campo',
    subcategory: 'tackle',
    targetPositions: ['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['escudo'],
    drills: [
      'Tackle simultáneo de dos defensores al escudo (5 repeticiones)',
      'Primer tackler sujeta, segundo busca el balón (5 repeticiones)',
      'Simulación 3 vs 2 con tackle doble + clean out (8 repeticiones)'
    ]
  },
  {
    id: 'tackle_persecucion',
    name: 'Tackle en Persecución (Cover Tackle)',
    category: 'campo',
    subcategory: 'tackle',
    targetPositions: ['Zaguero', 'Ala', 'Apertura'],
    difficulty: 4,
    durationMin: 15,
    equipment: ['balon', 'conos'],
    drills: [
      'Sprint 20m en diagonal para tacklear al atacante antes del ensayo (8 repeticiones)',
      'Lectura de línea de carrera: anticipar trayectoria del portador (6 repeticiones)',
      'Tackle deslizante controlado en carrera (5 repeticiones)'
    ]
  },

  // ============================================================
  // 🏉 CAMPO — PASE Y HANDLING
  // ============================================================
  {
    id: 'pase_base',
    name: 'Pase Básico Estático y en Carrera',
    category: 'campo',
    subcategory: 'pase',
    targetPositions: ['TODOS'],
    difficulty: 1,
    durationMin: 15,
    equipment: ['balon'],
    drills: [
      'Pase estático a 5m con ambas manos (20 repeticiones)',
      'Pase en movimiento lateral con recepción (15 repeticiones por lado)',
      'Pase pop (corto) de descarga en contacto (10 repeticiones)'
    ]
  },
  {
    id: 'pase_largo',
    name: 'Pase Largo (Skip Pass) 15-20 Metros',
    category: 'campo',
    subcategory: 'pase',
    targetPositions: ['Apertura', 'Centro', 'Medio Melé'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['balon', 'conos'],
    drills: [
      'Pase en espiral de 15m hacia ambos lados (15 repeticiones)',
      'Pase salteando un jugador intermedio a 20m (10 repeticiones)',
      'Contraataque con pase largo desde zona de 22m (8 repeticiones)'
    ]
  },
  {
    id: 'pase_presion',
    name: 'Pase Bajo Presión Defensiva',
    category: 'campo',
    subcategory: 'pase',
    targetPositions: ['Medio Melé', 'Apertura', 'Centro'],
    difficulty: 4,
    durationMin: 15,
    equipment: ['balon', 'escudo'],
    drills: [
      'Medio melé saca balón con defensor presionando (15 repeticiones)',
      'Apertura recibe y suelta pase plano con línea defensiva encima (12 repeticiones)',
      'Descarga en el tackle: pasar antes de caer (10 repeticiones)'
    ]
  },
  {
    id: 'handling_alto',
    name: 'Manejo de Balón Alto (High Ball)',
    category: 'campo',
    subcategory: 'pase',
    targetPositions: ['Zaguero', 'Ala', 'Centro'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['balon'],
    drills: [
      'Recepción de patada alta (bomba) con salto vertical (12 repeticiones)',
      'Captura en carrera sin detenerse (10 repeticiones)',
      'Recepción bajo presión de un defensor que carga (8 repeticiones)'
    ]
  },

  // ============================================================
  // 🏉 CAMPO — SCRUM, LINEOUT, RUCK, MAUL
  // ============================================================
  {
    id: 'scrum_empuje',
    name: 'Técnica de Empuje en Scrum (Crouch-Bind-Set)',
    category: 'campo',
    subcategory: 'scrum',
    targetPositions: ['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo'],
    difficulty: 3,
    durationMin: 20,
    equipment: ['maquina_scrum'],
    drills: [
      'Empuje controlado con pausas: mantener postura 5s (8 series)',
      'Hit inicial explosivo al "set" con coordinación octal (10 repeticiones)',
      'Simulación de scrum con oposición activa de 8 jugadores (6 series de 10s)'
    ]
  },
  {
    id: 'lineout_salto',
    name: 'Salto y Levantamiento en Lineout',
    category: 'campo',
    subcategory: 'scrum',
    targetPositions: ['Segunda Línea', 'Flanker', 'Octavo', 'Talonador'],
    difficulty: 3,
    durationMin: 20,
    equipment: ['balon', 'conos'],
    drills: [
      'Levantadores: técnica de carga con manos entrelazadas (10 repeticiones)',
      'Saltador: salto vertical con captura en punto más alto (8 repeticiones)',
      'Lineout completo con lanzador a 7m, 10m y 15m (5 repeticiones cada distancia)'
    ]
  },
  {
    id: 'ruck_cleanout',
    name: 'Limpieza de Ruck (Cleanout)',
    category: 'campo',
    subcategory: 'scrum',
    targetPositions: ['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['escudo', 'balon'],
    drills: [
      'Entrada baja al ruck: hombro a la cadera del oponente (12 repeticiones)',
      'Limpiar ruck y asegurar posesión en menos de 3s (10 repeticiones)',
      'Ruck 3 vs 2 con balón disputado (8 series)'
    ]
  },
  {
    id: 'maul_defensivo',
    name: 'Defensa de Maul y Contramaul',
    category: 'campo',
    subcategory: 'scrum',
    targetPositions: ['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['balon'],
    drills: [
      'Formación rápida de maul defensivo en 2 segundos (8 repeticiones)',
      'Contramaul: empuje para detener el avance y robar balón (6 repeticiones)',
      'Salida explosiva del maul con balón hacia el medio melé (5 repeticiones)'
    ]
  },

  // ============================================================
  // 🏉 CAMPO — PATADA
  // ============================================================
  {
    id: 'patada_cajon',
    name: 'Patada de Cajón (Box Kick)',
    category: 'campo',
    subcategory: 'patada',
    targetPositions: ['Medio Melé'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['balon', 'conos'],
    drills: [
      'Box kick desde la base del scrum a 25-30m de altura (15 repeticiones)',
      'Box kick con persecución del ala para presionar recepción (10 repeticiones)',
      'Variación: box kick corto para auto-recuperación (8 repeticiones)'
    ]
  },
  {
    id: 'patada_tactica',
    name: 'Patada Táctica al Espacio (Territorial)',
    category: 'campo',
    subcategory: 'patada',
    targetPositions: ['Apertura', 'Zaguero', 'Centro'],
    difficulty: 4,
    durationMin: 15,
    equipment: ['balon', 'conos'],
    drills: [
      'Patada al touch desde campo propio buscando la banda a 30m (12 repeticiones)',
      'Grubber kick (patada rasa) para superar la línea defensiva (10 repeticiones)',
      'Patada cruzada (cross-field kick) al ala opuesto a 30m (8 repeticiones)'
    ]
  },
  {
    id: 'patada_palos',
    name: 'Conversión a Palos',
    category: 'campo',
    subcategory: 'patada',
    targetPositions: ['Apertura', 'Zaguero', 'Centro'],
    difficulty: 2,
    durationMin: 15,
    equipment: ['balon', 'tee'],
    drills: [
      'Conversiones desde 15m frontal con tee (12 repeticiones)',
      'Penales desde ángulo cerrado (22m, 30°) (10 repeticiones)',
      'Drop goal desde 25m con defensor cargando (8 repeticiones)'
    ]
  },

  // ============================================================
  // 🏉 CAMPO — EVASIÓN Y ATAQUE
  // ============================================================
  {
    id: 'evasion_sidestep',
    name: 'Evasión con Cambio de Dirección (Side-Step)',
    category: 'campo',
    subcategory: 'evasion',
    targetPositions: ['Centro', 'Ala', 'Zaguero', 'Apertura'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['conos', 'balon'],
    drills: [
      'Side-step explosivo con cambio de ritmo en 5m (10 repeticiones)',
      'Evasión 1 vs 2 en espacio reducido (8 repeticiones)',
      'Finta de pase + aceleración al hueco defensivo (6 repeticiones)'
    ]
  },
  {
    id: 'ataque_profundo',
    name: 'Ataque en Profundidad (Línea de Tres Cuartos)',
    category: 'campo',
    subcategory: 'evasion',
    targetPositions: ['Apertura', 'Centro', 'Ala', 'Zaguero'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['balon', 'conos'],
    drills: [
      'Línea de backs corriendo desde profundidad a toda velocidad (10 repeticiones)',
      'Loop (lazo) del apertura alrededor del primer centro (8 repeticiones)',
      'Switch (cruce) entre centros para romper la línea (8 repeticiones)'
    ]
  },
  {
    id: 'contraataque',
    name: 'Contraataque desde Patada Recibida',
    category: 'campo',
    subcategory: 'evasion',
    targetPositions: ['Zaguero', 'Ala'],
    difficulty: 4,
    durationMin: 15,
    equipment: ['balon', 'conos'],
    drills: [
      'Recepción de patada + arranque explosivo hacia espacio libre (10 repeticiones)',
      'Contraataque coordinado con pase de apoyo al ala opuesto (8 repeticiones)',
      'Contraataque roto: identificar hueco en defensa desorganizada (6 repeticiones)'
    ]
  },

  // ============================================================
  // 🏉 CAMPO — DEFENSA
  // ============================================================
  {
    id: 'defensa_linea',
    name: 'Defensa en Línea Organizada (Drift Defense)',
    category: 'campo',
    subcategory: 'defensa',
    targetPositions: ['TODOS'],
    difficulty: 3,
    durationMin: 20,
    equipment: ['conos', 'balon'],
    drills: [
      'Línea defensiva de 15m: subir y bajar al unísono con el medio melé (10 repeticiones)',
      'Drift defense: deslizamiento lateral cubriendo el espacio exterior (8 repeticiones)',
      'Blitz defense: presión rápida sobre el apertura rival (6 repeticiones)'
    ]
  },
  {
    id: 'defensa_tryline',
    name: 'Defensa de Última Línea (Try-Line)',
    category: 'campo',
    subcategory: 'defensa',
    targetPositions: ['TODOS'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['balon', 'escudo'],
    drills: [
      'Defensa a 5m del in-goal: mantener la línea y no ceder metros (8 repeticiones)',
      'Defensa numérica 14 vs 15 tras tarjeta amarilla (6 repeticiones)',
      'Goal-line stand: 5 fases defensivas consecutivas sin conceder ensayo (4 series)'
    ]
  },
  {
    id: 'defensa_pantalla',
    name: 'Pantalla Defensiva sobre el Apertura',
    category: 'campo',
    subcategory: 'defensa',
    targetPositions: ['Flanker', 'Octavo', 'Centro'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['balon', 'conos'],
    drills: [
      'Presión al apertura rival en recepción de pase (12 repeticiones)',
      'Pantalla doble: flanker + centro cierran opciones de pase (8 repeticiones)',
      'Carga al pateador: bloquear patada táctica rival (6 repeticiones)'
    ]
  },

  // ============================================================
  // 🏋️ GIMNASIO — FUERZA INFERIOR
  // ============================================================
  {
    id: 'gym_sentadilla',
    name: 'Sentadilla Trasera con Barra (Back Squat)',
    category: 'gym',
    subcategory: 'fuerza_inferior',
    targetPositions: ['TODOS'],
    difficulty: 3,
    durationMin: 15,
    equipment: ['barra', 'rack'],
    drills: [
      '4 series x 6 repeticiones al 80% 1RM',
      'Control excéntrico: bajar en 3 segundos, subir explosivo',
      'Descanso 2 minutos entre series'
    ]
  },
  {
    id: 'gym_peso_muerto',
    name: 'Peso Muerto Convencional',
    category: 'gym',
    subcategory: 'fuerza_inferior',
    targetPositions: ['TODOS'],
    difficulty: 3,
    durationMin: 12,
    equipment: ['barra'],
    drills: [
      '3 series x 5 repeticiones al 80% 1RM',
      'Mantener espalda neutra, empuje de cadera al bloquear',
      'Descanso 2:30 entre series'
    ]
  },
  {
    id: 'gym_prensa',
    name: 'Prensa de Piernas 45°',
    category: 'gym',
    subcategory: 'fuerza_inferior',
    targetPositions: ['Pilar', 'Talonador', 'Segunda Línea'],
    difficulty: 2,
    durationMin: 10,
    equipment: ['maquina_prensa'],
    drills: [
      '4 series x 10 repeticiones (carga moderada-alta)',
      'Énfasis en profundidad y empuje explosivo',
      'Descanso 90 segundos entre series'
    ]
  },
  {
    id: 'gym_sentadilla_frontal',
    name: 'Sentadilla Frontal (Front Squat)',
    category: 'gym',
    subcategory: 'fuerza_inferior',
    targetPositions: ['Flanker', 'Octavo', 'Pilar'],
    difficulty: 3,
    durationMin: 12,
    equipment: ['barra', 'rack'],
    drills: [
      '3 series x 8 repeticiones al 65% 1RM',
      'Barra en posición de rack frontal, codos altos',
      'Descanso 2 minutos entre series'
    ]
  },

  // ============================================================
  // 🏋️ GIMNASIO — FUERZA SUPERIOR
  // ============================================================
  {
    id: 'gym_press_banca',
    name: 'Press de Banca con Barra',
    category: 'gym',
    subcategory: 'fuerza_superior',
    targetPositions: ['TODOS'],
    difficulty: 2,
    durationMin: 12,
    equipment: ['barra', 'banco'],
    drills: [
      '4 series x 6 repeticiones al 75% 1RM',
      'Retracción escapular, arco lumbar controlado',
      'Descanso 2 minutos entre series'
    ]
  },
  {
    id: 'gym_dominadas',
    name: 'Dominadas (Pull-Ups)',
    category: 'gym',
    subcategory: 'fuerza_superior',
    targetPositions: ['TODOS'],
    difficulty: 3,
    durationMin: 10,
    equipment: ['barra_dominadas'],
    drills: [
      '3 series al fallo (mínimo 8 repeticiones)',
      'Agarre prono, ancho de hombros',
      'Descanso 90 segundos entre series'
    ]
  },
  {
    id: 'gym_remo',
    name: 'Remo con Barra (Barbell Row)',
    category: 'gym',
    subcategory: 'fuerza_superior',
    targetPositions: ['TODOS'],
    difficulty: 2,
    durationMin: 10,
    equipment: ['barra'],
    drills: [
      '4 series x 8 repeticiones',
      'Torso a 45°, tirar de la barra hacia el abdomen inferior',
      'Descanso 90 segundos entre series'
    ]
  },
  {
    id: 'gym_press_militar',
    name: 'Press Militar de Pie (Overhead Press)',
    category: 'gym',
    subcategory: 'fuerza_superior',
    targetPositions: ['TODOS'],
    difficulty: 3,
    durationMin: 10,
    equipment: ['barra', 'rack'],
    drills: [
      '3 series x 5 repeticiones al 70% del peso corporal',
      'Core activado, evitar arquear la espalda',
      'Descanso 2 minutos entre series'
    ]
  },

  // ============================================================
  // 🏋️ GIMNASIO — POTENCIA Y EXPLOSIVIDAD
  // ============================================================
  {
    id: 'gym_power_clean',
    name: 'Power Clean (Cargada de Potencia)',
    category: 'gym',
    subcategory: 'potencia',
    targetPositions: ['Flanker', 'Octavo', 'Centro', 'Ala'],
    difficulty: 4,
    durationMin: 15,
    equipment: ['barra'],
    drills: [
      '4 series x 3 repeticiones al 70% 1RM',
      'Triple extensión: tobillos, rodillas, cadera',
      'Descanso 2:30 entre series'
    ]
  },
  {
    id: 'gym_salto_cajon',
    name: 'Salto al Cajón (Box Jump)',
    category: 'gym',
    subcategory: 'potencia',
    targetPositions: ['TODOS'],
    difficulty: 2,
    durationMin: 10,
    equipment: ['cajon'],
    drills: [
      '4 series x 6 saltos a cajón de 60-75cm',
      'Aterrizaje suave con flexión de rodillas',
      'Descanso 60 segundos entre series'
    ]
  },
  {
    id: 'gym_arranque',
    name: 'Arranque con Mancuerna (DB Snatch)',
    category: 'gym',
    subcategory: 'potencia',
    targetPositions: ['Flanker', 'Octavo', 'Ala'],
    difficulty: 3,
    durationMin: 10,
    equipment: ['mancuerna'],
    drills: [
      '3 series x 6 repeticiones por brazo',
      'Movimiento fluido desde el suelo hasta arriba en un solo gesto',
      'Descanso 90 segundos entre series'
    ]
  },
  {
    id: 'gym_empuje_trineo',
    name: 'Empuje de Trineo Pesado',
    category: 'gym',
    subcategory: 'potencia',
    targetPositions: ['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo'],
    difficulty: 3,
    durationMin: 12,
    equipment: ['trineo'],
    drills: [
      '5 pasadas de 15m con carga pesada (80-120kg)',
      'Posición baja de empuje, pasos cortos y potentes',
      'Descanso 2 minutos entre pasadas'
    ]
  },

  // ============================================================
  // 🏋️ GIMNASIO — CORE Y ESTABILIDAD
  // ============================================================
  {
    id: 'gym_plancha',
    name: 'Plancha Frontal con Peso',
    category: 'gym',
    subcategory: 'core',
    targetPositions: ['TODOS'],
    difficulty: 2,
    durationMin: 8,
    equipment: ['disco'],
    drills: [
      '3 series x 60 segundos con disco de 10-20kg en la espalda',
      'Caderas alineadas, abdomen contraído',
      'Descanso 60 segundos entre series'
    ]
  },
  {
    id: 'gym_rueda',
    name: 'Rueda Abdominal (Ab Wheel Rollout)',
    category: 'gym',
    subcategory: 'core',
    targetPositions: ['TODOS'],
    difficulty: 3,
    durationMin: 8,
    equipment: ['rueda_abdominal'],
    drills: [
      '3 series x 10 repeticiones',
      'Extensión controlada hasta posición horizontal',
      'Descanso 60 segundos entre series'
    ]
  },
  {
    id: 'gym_pallof',
    name: 'Press Pallof Anti-Rotación',
    category: 'gym',
    subcategory: 'core',
    targetPositions: ['TODOS'],
    difficulty: 2,
    durationMin: 8,
    equipment: ['polea', 'banda'],
    drills: [
      '3 series x 12 repeticiones por lado',
      'Resistir la rotación: brazos extendidos, core firme',
      'Descanso 45 segundos entre series'
    ]
  },

  // ============================================================
  // 🏋️ GIMNASIO — VELOCIDAD Y AGILIDAD
  // ============================================================
  {
    id: 'gym_sprint_resistido',
    name: 'Sprint con Trineo Ligero (Aceleración)',
    category: 'gym',
    subcategory: 'velocidad',
    targetPositions: ['Ala', 'Zaguero', 'Centro'],
    difficulty: 3,
    durationMin: 12,
    equipment: ['trineo'],
    drills: [
      '6 pasadas de 10m con carga ligera (20-30kg)',
      'Énfasis en aceleración de los primeros 5 metros',
      'Descanso 90 segundos entre pasadas'
    ]
  },
  {
    id: 'gym_escalera',
    name: 'Escalera de Agilidad y Coordinación',
    category: 'gym',
    subcategory: 'velocidad',
    targetPositions: ['TODOS'],
    difficulty: 2,
    durationMin: 10,
    equipment: ['escalera_agilidad'],
    drills: [
      'Single leg: un pie por cuadro a máxima velocidad (4 pasadas)',
      'Two feet in: dos pies por cuadro (4 pasadas)',
      'Icky shuffle: patrón lateral avanzado (4 pasadas por lado)'
    ]
  },
  {
    id: 'gym_cambio_direccion',
    name: 'Cambios de Dirección con Conos (Pro-Agility)',
    category: 'gym',
    subcategory: 'velocidad',
    targetPositions: ['TODOS'],
    difficulty: 3,
    durationMin: 12,
    equipment: ['conos'],
    drills: [
      '5-10-5 drill: sprint 5m, cambio, 10m, cambio, 5m (6 series)',
      'L-Drill: tres conos en L, tocar cada uno a máxima velocidad (4 series)',
      'Descanso 60 segundos entre series'
    ]
  },

  // ============================================================
  // 🩹 RECUPERACIÓN Y MOVILIDAD
  // ============================================================
  {
    id: 'rec_foam_roller',
    name: 'Liberación Miofascial con Foam Roller',
    category: 'recuperacion',
    subcategory: 'movilidad',
    targetPositions: ['TODOS'],
    difficulty: 1,
    durationMin: 15,
    equipment: ['foam_roller'],
    drills: [
      'Rodillo en cuádriceps: 2 minutos por pierna',
      'Rodillo en isquiotibiales: 2 minutos por pierna',
      'Rodillo en espalda alta (torácica): 3 minutos',
      'Rodillo en glúteos y piriforme: 2 minutos por lado',
      'Rodillo en pantorrillas: 1 minuto por pierna'
    ]
  },
  {
    id: 'rec_estiramiento',
    name: 'Rutina de Estiramientos Post-Partido',
    category: 'recuperacion',
    subcategory: 'movilidad',
    targetPositions: ['TODOS'],
    difficulty: 1,
    durationMin: 15,
    equipment: [],
    drills: [
      'Estiramiento de isquiotibiales sentado: 30s x 2',
      'Estiramiento de cuádriceps de pie: 30s x 2 por pierna',
      'Estiramiento de aductores (mariposa): 30s x 2',
      'Rotación de columna torácica sentado: 10 repeticiones por lado',
      'Estiramiento de hombro cruzado: 30s x 2 por brazo'
    ]
  },
  {
    id: 'rec_hielo',
    name: 'Protocolo de Recuperación con Hielo',
    category: 'recuperacion',
    subcategory: 'movilidad',
    targetPositions: ['TODOS'],
    difficulty: 1,
    durationMin: 15,
    equipment: ['hielo'],
    drills: [
      'Baño de hielo en piernas: 10 minutos a 10-12°C',
      'Compresas frías en hombros y cuello: 15 minutos',
      'Alternar 2 min frío / 2 min tibio en articulaciones cargadas (3 ciclos)'
    ]
  },

  // ============================================================
  // 🛡️ PREVENCIÓN DE LESIONES
  // ============================================================
  {
    id: 'prev_hombros',
    name: 'Fortalecimiento Preventivo de Hombros',
    category: 'prevencion',
    subcategory: 'hombros',
    targetPositions: ['TODOS'],
    difficulty: 2,
    durationMin: 12,
    equipment: ['banda', 'mancuerna_ligera'],
    drills: [
      'Rotación externa con banda elástica: 3 x 15 por brazo',
      'Elevaciones laterales con mancuerna ligera: 3 x 12',
      'Y-T-W-L en el suelo: 3 series de 8 repeticiones cada letra',
      'Face pulls con banda: 3 x 15'
    ]
  },
  {
    id: 'prev_cuello',
    name: 'Fortalecimiento Isométrico de Cuello',
    category: 'prevencion',
    subcategory: 'cuello',
    targetPositions: ['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo'],
    difficulty: 2,
    durationMin: 8,
    equipment: ['toalla'],
    drills: [
      'Isométrico frontal: empujar contra la mano en la frente 10s x 3',
      'Isométrico lateral: empujar contra la mano en el lado 10s x 3 por lado',
      'Isométrico trasero: empujar contra la mano en la nuca 10s x 3',
      'Puente de cuello (wrestler bridge) modificado: 15s x 3'
    ]
  },
  {
    id: 'prev_rodillas',
    name: 'Prevención de Lesiones de Rodilla (LCA)',
    category: 'prevencion',
    subcategory: 'rodillas',
    targetPositions: ['TODOS'],
    difficulty: 2,
    durationMin: 10,
    equipment: ['banda'],
    drills: [
      'Sentadilla a una pierna controlada: 3 x 8 por pierna',
      'Puente de glúteo con banda: 3 x 15',
      'Caída y estabilización unilateral desde cajón bajo: 3 x 6 por pierna',
      'Caminata lateral con banda en rodillas: 3 x 12 pasos por lado'
    ]
  },
  {
    id: 'prev_tobillos',
    name: 'Propiocepción y Fortalecimiento de Tobillos',
    category: 'prevencion',
    subcategory: 'tobillos',
    targetPositions: ['TODOS'],
    difficulty: 1,
    durationMin: 8,
    equipment: ['bosu', 'banda'],
    drills: [
      'Equilibrio monopodal en bosu: 30s x 3 por pierna',
      'Alfabeto con el pie: dibujar letras A-Z en el aire con el tobillo x 2',
      'Dorsiflexión con banda de resistencia: 3 x 15 por tobillo'
    ]
  },

  // ============================================================
  // 🏃 RESISTENCIA Y CONDICIONAMIENTO
  // ============================================================
  {
    id: 'cond_bronco',
    name: 'Test Bronco (Resistencia Intermitente)',
    category: 'campo',
    subcategory: 'resistencia',
    targetPositions: ['TODOS'],
    difficulty: 5,
    durationMin: 20,
    equipment: ['conos'],
    drills: [
      'Ida y vuelta: 20m, 40m, 60m. Repetir 5 veces sin pausa.',
      'Meta forwards: < 5:15 | Meta backs: < 4:45',
      'Descanso completo entre intentos si se repite'
    ]
  },
  {
    id: 'cond_intervalos',
    name: 'Intervalos de Alta Intensidad (HIIT Rugby)',
    category: 'campo',
    subcategory: 'resistencia',
    targetPositions: ['TODOS'],
    difficulty: 4,
    durationMin: 15,
    equipment: ['conos'],
    drills: [
      'Sprint 30m + trote recuperación 30m x 10',
      'Sprint 60m + 10 burpees + trote 60m x 6',
      'Descanso 3 minutos y repetir el bloque completo'
    ]
  },
  {
    id: 'cond_ida_vuelta',
    name: 'Yo-Yo Intermittent Recovery Test Nivel 1',
    category: 'campo',
    subcategory: 'resistencia',
    targetPositions: ['TODOS'],
    difficulty: 4,
    durationMin: 20,
    equipment: ['conos', 'audio'],
    drills: [
      'Carrera ida y vuelta 20m al ritmo de los pitidos',
      '10 segundos de recuperación entre cada ida/vuelta',
      'El test termina cuando el jugador no llega a la línea en 2 pitidos consecutivos'
    ]
  },

  // ============================================================
  // 👑 LIDERAZGO Y TÁCTICA
  // ============================================================
  {
    id: 'liderazgo_comunicacion',
    name: 'Comunicación y Liderazgo en Juego Abierto',
    category: 'campo',
    subcategory: 'liderazgo',
    targetPositions: ['Entrenador', 'Capitán', 'Subcapitán'],
    difficulty: 2,
    durationMin: 20,
    equipment: ['balon'],
    drills: [
      'Llamadas de línea defensiva: comunicar deriva y blitz en tiempo real (10 min)',
      'Organización de la salida de 22m: comunicar opción de patada o carrera (5 min)',
      'Simulación de arenga de medio tiempo: motivar al equipo con instrucciones claras (5 min)'
    ]
  },
  {
    id: 'liderazgo_decisiones',
    name: 'Toma de Decisiones bajo Fatiga',
    category: 'campo',
    subcategory: 'liderazgo',
    targetPositions: ['Capitán', 'Subcapitán', 'Medio Melé', 'Apertura'],
    difficulty: 4,
    durationMin: 15,
    equipment: ['balon', 'conos'],
    drills: [
      'Tras 3 sprints de 40m: decidir entre patada a palos, touch o scrum en <5 segundos (8 series)',
      'Lectura de superioridad numérica: identificar el 3 vs 2 y organizar el ataque (6 series)',
      'Simulación de últimos 2 minutos con resultado ajustado (4 series)'
    ]
  }
];

export default EXERCISE_LIBRARY;
