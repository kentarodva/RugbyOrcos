export const FAULT_TYPES = [
  { id: 'tackle_alto', label: 'Tackle Alto / Peligroso', desc: 'Contacto por encima de los hombros' },
  { id: 'offside', label: 'Offside / Fuera de Juego', desc: 'Posicion adelantada' },
  { id: 'knock_on', label: 'Knock-On / Avant', desc: 'Balón hacia adelante con la mano' },
  { id: 'pase_forward', label: 'Pase Forward', desc: 'Pase hacia adelante' },
  { id: 'obstruccion', label: 'Obstruccion', desc: 'Bloquear sin balón' },
  { id: 'juego_sucio', label: 'Juego Sucio', desc: 'Conducta antideportiva' },
  { id: 'placaje_sin_balon', label: 'Placaje sin Balón', desc: 'Tackle a jugador sin posesion' },
  { id: 'no_rodar', label: 'No Rodar / Retencion', desc: 'No liberar en el tackle' },
  { id: 'entrada_lateral', label: 'Entrada Lateral', desc: 'Ingresar al ruck por el costado' },
  { id: 'derribo_peligroso', label: 'Derribo Peligroso / Spear', desc: 'Levantar y soltar de cabeza' },
  { id: 'golpe_ilegal', label: 'Golpe / Agresion', desc: 'Puñetazo, codazo o cabezazo' },
  { id: 'insulto_arbitro', label: 'Insulto al Arbitro', desc: 'Falta de respeto al referi' },
  { id: 'indisciplina', label: 'Indisciplina General', desc: 'Protestas, peleas, conducta' },
  { id: 'otro', label: 'Otro / No especificado', desc: 'Cualquier otra infraccion' }
];

export const ATTENDANCE_STATUS = {
  presente: { label: 'Presente', color: 'var(--color-primary)', bg: 'rgba(46, 229, 122, 0.12)', penalty: '' },
  tarde: { label: 'Tarde', color: 'var(--color-yellow)', bg: 'rgba(255, 234, 0, 0.12)', penalty: '+15 Burpees' },
  falta_injustificada: { label: 'Falta', color: 'var(--color-red)', bg: 'rgba(255, 92, 77, 0.12)', penalty: '+50 Burpees, recoge conos' },
  falta_justificada: { label: 'Falta Just.', color: 'var(--color-text-muted)', bg: 'rgba(255,255,255,0.05)', penalty: '' }
};
