// The 15 XV positions; ids match players.position_id and makgora_update_player() (migration 75).
export const RUGBY_POSITIONS = [
  { id: 1, name: 'Pilar Izquierdo' }, { id: 2, name: 'Talonador (Hooker)' }, { id: 3, name: 'Pilar Derecho' },
  { id: 4, name: 'Segunda Línea Izq' }, { id: 5, name: 'Segunda Línea Der' }, { id: 6, name: 'Flanker Ciego' },
  { id: 7, name: 'Flanker Abierto' }, { id: 8, name: 'Octavo (N8)' }, { id: 9, name: 'Medio Melé (Half)' },
  { id: 10, name: 'Apertura (Fly)' }, { id: 11, name: 'Ala Izquierdo (Wing)' }, { id: 12, name: 'Primer Centro' },
  { id: 13, name: 'Segundo Centro' }, { id: 14, name: 'Ala Derecho (Wing)' }, { id: 15, name: 'Zaguero (Fullback)' },
];

export const positionName = (id) => RUGBY_POSITIONS.find(p => p.id === Number(id))?.name || null;
