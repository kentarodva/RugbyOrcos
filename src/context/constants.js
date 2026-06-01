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
  [SYSTEM_ROLES.DESARROLLADOR]: { rpg: 'Arquitecto del Reino', icon: '🏰', color: '#e040fb', tier: 0 },
  [SYSTEM_ROLES.PRESIDENTE]:    { rpg: 'Señor de la Guerra',  icon: '⚔️', color: '#ffb300', tier: 1 },
  [SYSTEM_ROLES.PROMOTOR]:      { rpg: 'Comandante de Horda', icon: '🛡️', color: '#ff6d00', tier: 2 },
  [SYSTEM_ROLES.ENTRENADOR]:   { rpg: 'Maestro de Armas',    icon: '🏋️', color: '#00e676', tier: 3 },
  [SYSTEM_ROLES.TESORERO]:     { rpg: 'Guardian del Botin',  icon: '💰', color: '#00b0ff', tier: 3 },
  [SYSTEM_ROLES.ARBITRO]:      { rpg: 'Juez del Coliseo',     icon: '⚖️', color: '#ffea00', tier: 3 },
  [SYSTEM_ROLES.JUGADOR]:       { rpg: 'Guerrero',            icon: '👹', color: '#9e9e9e', tier: 4 },
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

export const DIVISIONES_LABELS = {
  [DIVISIONES.MASCULINA_MAYOR]: 'Masculina Mayor',
  [DIVISIONES.FEMENINA_MAYOR]: 'Femenina Mayor',
  [DIVISIONES.JUVENILES_MASCULINA]: 'Juveniles Masculino',
  [DIVISIONES.JUVENILES_FEMENINA]: 'Juveniles Femenino'
};

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
