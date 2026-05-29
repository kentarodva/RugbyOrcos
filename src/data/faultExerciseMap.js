const FAULT_EXERCISE_MAP = {
  missedTackles: {
    label: 'Fallos de Tackle',
    corrective: ['tackle_tecnico', 'tackle_lateral', 'tackle_persecucion'],
    priority: 'high',
    severity: 4,
    minMatches: 1
  },
  lowTackleCount: {
    label: 'Bajo Volumen de Tackles',
    corrective: ['tackle_tecnico', 'tackle_doble', 'ruck_cleanout'],
    priority: 'medium',
    severity: 3,
    minMatches: 2
  },
  knockOns: {
    label: 'Knock-Ons / Manejo de Balón',
    corrective: ['pase_base', 'pase_presion', 'handling_alto'],
    priority: 'high',
    severity: 4,
    minMatches: 1
  },
  lowTries: {
    label: 'Baja Producción Ofensiva',
    corrective: ['evasion_sidestep', 'ataque_profundo', 'contraataque'],
    priority: 'medium',
    severity: 3,
    minMatches: 2
  },
  lowTurnovers: {
    label: 'Pocas Recuperaciones de Balón',
    corrective: ['ruck_cleanout', 'maul_defensivo', 'tackle_doble'],
    priority: 'medium',
    severity: 3,
    minMatches: 2
  },
  lowConversions: {
    label: 'Conversiones Falladas',
    corrective: ['patada_palos', 'patada_tactica'],
    priority: 'low',
    severity: 2,
    minMatches: 2
  },
  yellowCards: {
    label: 'Tarjetas Amarillas',
    corrective: ['tackle_tecnico', 'liderazgo_comunicacion', 'tackle_lateral'],
    priority: 'high',
    severity: 4,
    minMatches: 1
  },
  redCards: {
    label: 'Tarjeta Roja (Suspensión)',
    corrective: ['liderazgo_comunicacion', 'liderazgo_decisiones'],
    priority: 'critical',
    severity: 5,
    minMatches: 1
  },
  lowStamina: {
    label: 'Baja Resistencia en Partido',
    corrective: ['cond_bronco', 'cond_intervalos', 'cond_ida_vuelta'],
    priority: 'high',
    severity: 4,
    minMatches: 2
  },
  missedPenalties: {
    label: 'Penales Concedidos',
    corrective: ['ruck_cleanout', 'scrum_empuje', 'liderazgo_comunicacion'],
    priority: 'medium',
    severity: 3,
    minMatches: 2
  },
  poorKicking: {
    label: 'Patada Táctica Deficiente',
    corrective: ['patada_cajon', 'patada_tactica', 'patada_palos'],
    priority: 'medium',
    severity: 3,
    minMatches: 2
  },
  poorLineout: {
    label: 'Lineout Dominado',
    corrective: ['lineout_salto', 'scrum_empuje'],
    priority: 'medium',
    severity: 3,
    minMatches: 2
  },
  poorScrum: {
    label: 'Scrum Dominado',
    corrective: ['scrum_empuje', 'gym_sentadilla', 'gym_peso_muerto'],
    priority: 'high',
    severity: 4,
    minMatches: 2
  }
};

export default FAULT_EXERCISE_MAP;
