export const CLUBS = {
  ORCOS: 'orcos'
};

export const CLUBS_LABELS = {
  [CLUBS.ORCOS]: 'Orcos Negros'
};

export const SYSTEM_ROLES = {
  DESARROLLADOR: 'desarrollador',
  PROMOTOR: 'promotor',
  TESORERO: 'tesorero',
  PRESIDENTE: 'presidente',
  ENTRENADOR: 'entrenador',
  ARBITRO: 'arbitro',
  JUGADOR: 'jugador'
};

export const SYSTEM_ROLES_LABELS = {
  [SYSTEM_ROLES.DESARROLLADOR]: 'Desarrollador',
  [SYSTEM_ROLES.PROMOTOR]: 'Promotor',
  [SYSTEM_ROLES.TESORERO]: 'Tesorero',
  [SYSTEM_ROLES.PRESIDENTE]: 'Presidente',
  [SYSTEM_ROLES.ENTRENADOR]: 'Entrenador',
  [SYSTEM_ROLES.ARBITRO]: 'Arbitro',
  [SYSTEM_ROLES.JUGADOR]: 'Jugador'
};

export const SUPER_ROLES = [SYSTEM_ROLES.DESARROLLADOR, SYSTEM_ROLES.PRESIDENTE];

export const RPG_ROLES = {
  [SYSTEM_ROLES.DESARROLLADOR]: { rpg: 'Arquitecto del Reino', original: 'Desarrollador', icon: '🏰', color: '#e040fb', tier: 0 },
  [SYSTEM_ROLES.PRESIDENTE]:    { rpg: 'Señor de la Guerra',   original: 'Presidente',   icon: '⚔️', color: '#E8B931', tier: 1 },
  [SYSTEM_ROLES.PROMOTOR]:      { rpg: 'Comandante de Horda',  original: 'Promotor',     icon: '🛡️', color: '#ff6d00', tier: 2 },
  [SYSTEM_ROLES.ENTRENADOR]:   { rpg: 'Maestro de Armas',     original: 'Entrenador',   icon: '🏋️', color: '#2EE57A', tier: 3 },
  [SYSTEM_ROLES.TESORERO]:     { rpg: 'Guardian del Botin',   original: 'Tesorero',     icon: '💰', color: '#5AA9FF', tier: 3 },
  [SYSTEM_ROLES.ARBITRO]:      { rpg: 'Juez del Coliseo',     original: 'Arbitro',      icon: '⚖️', color: '#E8B931', tier: 3 },
  [SYSTEM_ROLES.JUGADOR]:       { rpg: 'Guerrero',            original: 'Jugador',       icon: '👹', color: '#9e9e9e', tier: 4 },
};

export function getRpgRole(role) {
  return RPG_ROLES[role] || { rpg: role, icon: '', color: '#9e9e9e', tier: 4 };
}

export const DIVISIONES = {
  MASCULINA_MAYOR: 'masculina_mayor',
  FEMENINA_MAYOR: 'femenina_mayor',
  JUVENILES_MASCULINA: 'juveniles_masculina',
  JUVENILES_FEMENINA: 'juveniles_femenina'
};

export const DIVISION_DISPLAY_NAMES = {
  orcos_masculina_mayor: 'Masculina Mayor',
  masculina_mayor: 'Masculina Mayor',
  orcos_juveniles_masculina: 'Juveniles Masculina',
  juveniles_masculina: 'Juveniles Masculina',
  orcos_femenina_mayor: 'Femenina Mayor',
  femenina_mayor: 'Femenina Mayor',
  orcos_juveniles_femenina: 'Juveniles Femenina',
  juveniles_femenina: 'Juveniles Femenina',
  sin_categoria: 'Sin Categoría',
  otros: 'Otros',
};

export const DIVISIONES_LABELS = {
  [DIVISIONES.MASCULINA_MAYOR]: 'Masculina Mayor',
  [DIVISIONES.FEMENINA_MAYOR]: 'Femenina Mayor',
  [DIVISIONES.JUVENILES_MASCULINA]: 'Juveniles Masculina',
  [DIVISIONES.JUVENILES_FEMENINA]: 'Juveniles Femenina',
  orcos_masculina_mayor: 'Masculina Mayor',
  orcos_femenina_mayor: 'Femenina Mayor',
  orcos_juveniles_masculina: 'Juveniles Masculina',
  orcos_juveniles_femenina: 'Juveniles Femenina',
};

export function formatTeamCategory(cat) {
  if (!cat) return 'Sin Categoría';
  if (DIVISION_DISPLAY_NAMES[cat]) return DIVISION_DISPLAY_NAMES[cat];
  const cleaned = String(cat).replace(/^orcos_/, '');
  if (DIVISION_DISPLAY_NAMES[cleaned]) return DIVISION_DISPLAY_NAMES[cleaned];
  return cleaned
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const MAKGORA_TEAMS = [
  { id: 'orcos', name: 'Orcos', label: 'Orcos Negros (Horda Primigenia)' },
  { id: 'cuervos', name: 'Cuervos', label: 'Cuervos de la Tormenta' },
  { id: 'trolls', name: 'Trolls', label: 'Trolls del Norte' },
  { id: 'gargolas', name: 'Gargolas', label: 'Gargolas de Piedra' },
  { id: 'pitbull', name: 'Pitbull', label: 'Pitbulls de Guerra' },
  { id: 'buffalos', name: 'Buffalos', label: 'Buffalos de Hierro' },
];

export const EQUIPOS = {};
export const EQUIPOS_LABELS = {};

Object.keys(CLUBS).forEach(cKey => {
  const cVal = CLUBS[cKey];
  Object.keys(DIVISIONES).forEach(dKey => {
    const dVal = DIVISIONES[dKey];
    const comboKey = `${cVal}_${dVal}`;
    EQUIPOS[`${cKey}_${dKey}`] = comboKey;
    EQUIPOS_LABELS[comboKey] = `${CLUBS_LABELS[cVal]} - ${DIVISIONES_LABELS[dVal]}`;
  });
});
