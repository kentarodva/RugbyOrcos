// Example plays for the board, grouped by style.
// Coordinates are canonical horizontal percentages: Orcos attack left → right (try line ≈ x 92).
// New plays are written as "what moves in each step"; buildPlay carries everyone else forward,
// so a player that isn't mentioned stays where they were instead of snapping back.

import { PRESET_TV_PLAYS, DEFAULT_RIVALS_HORIZONTAL } from './presetPlays';
import { ALIGNMENTS_HORIZONTAL } from './constants';

export const PLAY_GROUPS = ['Balón parado', 'Ataque de forwards', 'Juego abierto', 'Defensa', 'Juego con el pie'];

const LEGACY_GROUP = {
  'Ataque Backs': 'Juego abierto',
  'Ataque Forwards': 'Balón parado',
  'Defensa Táctica': 'Defensa',
  'Juego con el Pie': 'Juego con el pie',
  'Juego Corto': 'Ataque de forwards',
};

/** Display name without the old "📺 Jugada N:" prefix. */
export const playTitle = (play) => String(play?.name || '').replace(/^📺\s*Jugada\s*\d+:\s*/u, '').trim();
export const playGroup = (play) => LEGACY_GROUP[play.category] || play.category || 'Juego abierto';

const xy = ([x, y]) => ({ x, y });

/**
 * Build full phases from incremental steps.
 * step: { title, description, allies?: {id: [x,y]}, rivals?: {num: [x,y]}, ball?: [x,y],
 *         passFrom?: [x,y], gainLineX?, zone?: [x, y, r, label] }
 */
export function buildPlay(steps) {
  let allies = Object.fromEntries(ALIGNMENTS_HORIZONTAL.standard.map(p => [p.id, [p.x, p.y]]));
  let rivals = Object.fromEntries(DEFAULT_RIVALS_HORIZONTAL.map(r => [r.num, [r.x, r.y]]));
  let ball = [34, 44];
  return steps.map(step => {
    allies = { ...allies, ...(step.allies || {}) };
    rivals = { ...rivals, ...(step.rivals || {}) };
    if (step.ball) ball = step.ball;
    return {
      title: step.title,
      description: step.description,
      ball: xy(ball),
      ...(step.passFrom ? { passFrom: xy(step.passFrom) } : {}),
      gainLineX: step.gainLineX ?? null,
      highlightZone: step.zone ? { x: step.zone[0], y: step.zone[1], r: step.zone[2], label: step.zone[3] } : null,
      allies: Object.entries(allies).map(([id, p]) => ({ id: Number(id), ...xy(p) })),
      rivals: Object.entries(rivals).map(([num, p]) => ({ id: `R${num}`, num: Number(num), ...xy(p) })),
    };
  });
}

// A ruck in midfield, used as the starting picture of several attacking plays.
const RUCK_MIDFIELD = {
  allies: {
    1: [40, 42], 2: [41, 45], 3: [40, 48], 4: [38, 44], 5: [38, 47], 6: [42, 40], 7: [42, 50], 8: [37, 46],
    9: [38, 45], 10: [34, 35], 12: [33, 28], 13: [32, 21], 11: [30, 11], 14: [28, 80], 15: [24, 55],
  },
  rivals: {
    1: [44, 41], 2: [44, 45], 3: [44, 49], 4: [46, 38], 5: [46, 52], 6: [47, 34], 7: [47, 56], 8: [46, 60],
    9: [45, 45], 10: [48, 33], 12: [49, 27], 13: [50, 20], 11: [52, 11], 14: [52, 80], 15: [70, 50],
  },
  ball: [39, 45],
  gainLineX: 42,
};

export const EXTRA_TV_PLAYS = [
  {
    id: 'lib_lineout_short_10',
    name: 'Line-out corto al 4 y corte del apertura',
    category: 'Balón parado',
    summary: 'Lanzamiento rápido al primer saltador para ganar la pelota limpia; el 9 la saca de inmediato y el 10 ataca el hueco entre el apertura y el centro rival.',
    phases: buildPlay([
      {
        title: 'Formación del line-out',
        description: 'Los forwards forman la fila junto al touch y el talonador lanza. Los backs se escalonan profundos para tomar velocidad.',
        allies: {
          2: [40, 3], 1: [40, 10], 4: [40, 14], 6: [40, 18], 3: [40, 22], 5: [40, 26], 7: [40, 30], 8: [40, 34],
          9: [36, 20], 10: [30, 30], 12: [26, 38], 13: [24, 46], 11: [20, 60], 14: [22, 80], 15: [14, 50],
        },
        rivals: {
          1: [44, 10], 2: [44, 3], 4: [44, 14], 6: [44, 18], 3: [44, 22], 5: [44, 26], 7: [44, 30], 8: [44, 34],
          9: [46, 18], 10: [56, 32], 12: [57, 40], 13: [58, 48], 11: [60, 62], 14: [60, 82], 15: [72, 50],
        },
        ball: [40, 3],
        gainLineX: 42,
      },
      {
        title: 'Lanzamiento al primer saltador',
        description: 'Lanzamiento corto y plano al 4: menos tiempo en el aire, menos chance de que el rival lo robe.',
        allies: { 4: [40, 14], 9: [38, 17] },
        ball: [40, 14],
        passFrom: [40, 3],
        gainLineX: 42,
      },
      {
        title: 'El 9 saca rápido',
        description: 'El 9 pasa al 10, que ya viene corriendo hacia la línea en vez de esperarla parado.',
        allies: { 10: [38, 30], 12: [34, 38], 13: [31, 46] },
        ball: [38, 30],
        passFrom: [38, 17],
        gainLineX: 42,
      },
      {
        title: 'Corte del apertura',
        description: 'El 10 ataca el hueco interior del apertura rival; el 12 y el 13 acompañan por fuera como opciones de pase.',
        allies: { 10: [52, 33], 12: [47, 40], 13: [43, 48], 15: [36, 44] },
        rivals: { 10: [55, 38], 12: [56, 42] },
        ball: [52, 33],
        gainLineX: 42,
        zone: [52, 33, 7, 'HUECO'],
      },
    ]),
  },
  {
    id: 'lib_pods_131',
    name: 'Estructura 1-3-3-1 de forwards',
    category: 'Ataque de forwards',
    summary: 'Dos grupos de tres forwards se turnan para cargar y ganar metros; un forward queda en cada orilla para estirar la defensa.',
    phases: buildPlay([
      {
        title: 'Formación 1-3-3-1',
        description: 'Pod A (1-2-3) del lado izquierdo, pod B (4-5-8) del derecho, el 6 y el 7 abiertos en las orillas. Los backs detrás, listos para la siguiente fase.',
        allies: {
          1: [42, 26], 2: [43, 30], 3: [42, 34], 4: [42, 56], 5: [43, 60], 8: [42, 64], 6: [44, 10], 7: [44, 84],
          9: [39, 45], 10: [34, 42], 12: [30, 30], 13: [30, 20], 11: [28, 8], 14: [28, 90], 15: [22, 50],
        },
        rivals: {
          1: [48, 28], 2: [48, 34], 3: [48, 40], 4: [48, 50], 5: [48, 56], 6: [48, 22], 7: [48, 62], 8: [48, 68],
          9: [47, 45], 10: [50, 16], 12: [50, 76], 13: [51, 84], 11: [52, 8], 14: [52, 92], 15: [70, 50],
        },
        ball: [39, 45],
        gainLineX: 44,
      },
      {
        title: 'Carga del pod A',
        description: 'El 9 pasa al talonador, que carga flanqueado por los dos pilares. Objetivo: cruzar la línea de ventaja.',
        allies: { 2: [47, 30], 1: [45, 27], 3: [45, 33] },
        ball: [47, 30],
        passFrom: [39, 45],
        gainLineX: 44,
        zone: [48, 30, 6, 'CARGA'],
      },
      {
        title: 'Reciclar rápido',
        description: 'Ruck en el punto de contacto; el 9 llega y el pod B ya está alineado para la siguiente carga.',
        allies: { 2: [48, 30], 1: [47, 28], 3: [47, 32], 9: [46, 31], 4: [45, 54], 5: [46, 58], 8: [45, 62] },
        rivals: { 2: [50, 30], 1: [50, 26], 3: [50, 34] },
        ball: [47, 30],
        gainLineX: 47,
      },
      {
        title: 'Carga del pod B',
        description: 'El 9 cambia de lado y el 8 carga entre el 4 y el 5. La defensa se tuvo que mover dos veces: aparecen los huecos.',
        allies: { 8: [52, 58], 4: [50, 55], 5: [50, 61] },
        ball: [52, 58],
        passFrom: [46, 31],
        gainLineX: 47,
        zone: [52, 58, 6, 'CARGA'],
      },
    ]),
  },
  {
    id: 'lib_switch_10_13',
    name: 'Cruce (switch) del 10 con el 13',
    category: 'Juego abierto',
    summary: 'El 10 corre en diagonal hacia afuera arrastrando a la defensa y el 13 vuelve hacia adentro a recibir en el canal que quedó libre.',
    phases: buildPlay([
      { title: 'Ruck en el medio', description: 'Pelota disponible en el ruck. Backs escalonados con profundidad.', ...RUCK_MIDFIELD },
      {
        title: 'El 10 corre hacia afuera',
        description: 'El 9 pasa al 10, que corre en diagonal hacia el touch para arrastrar a los centros rivales.',
        allies: { 10: [41, 30], 13: [37, 25], 12: [38, 22] },
        ball: [41, 30],
        passFrom: [38, 45],
        gainLineX: 42,
      },
      {
        title: 'El cruce',
        description: 'El 13 corta hacia adentro por detrás del 10 y recibe en sentido contrario a la defensa.',
        allies: { 10: [45, 24], 13: [46, 30] },
        rivals: { 12: [50, 24], 13: [51, 19], 10: [49, 28] },
        ball: [46, 30],
        passFrom: [45, 24],
        gainLineX: 42,
        zone: [52, 34, 7, 'CANAL INTERIOR'],
      },
      {
        title: 'Quiebre',
        description: 'El 13 rompe la línea; el 15 y el 10 acompañan para el pase siguiente.',
        allies: { 13: [60, 36], 10: [53, 30], 15: [51, 46] },
        rivals: { 15: [65, 42] },
        ball: [60, 36],
        gainLineX: 42,
      },
    ]),
  },
  {
    id: 'lib_loop_10',
    name: 'Loop del 10 alrededor del 12',
    category: 'Juego abierto',
    summary: 'El 10 pasa al 12 y corre por detrás para volver a recibir por fuera: un jugador más en la orilla.',
    phases: buildPlay([
      { title: 'Ruck en el medio', description: 'Pelota disponible en el ruck. Backs escalonados con profundidad.', ...RUCK_MIDFIELD },
      {
        title: 'Pase al 10',
        description: 'El 10 recibe corriendo hacia la línea.',
        allies: { 10: [40, 34] },
        ball: [40, 34],
        passFrom: [38, 45],
        gainLineX: 42,
      },
      {
        title: 'Pase al 12 y vuelta',
        description: 'El 10 pasa al 12 y corre por detrás de él hacia afuera.',
        allies: { 12: [43, 28], 10: [40, 30] },
        ball: [43, 28],
        passFrom: [40, 34],
        gainLineX: 42,
      },
      {
        title: 'El 10 recibe por fuera',
        description: 'El 12 devuelve el pase al 10, que aparece por fuera: ahora hay superioridad numérica en la orilla.',
        allies: { 10: [47, 20], 12: [45, 27], 13: [45, 15], 11: [45, 9] },
        ball: [47, 20],
        passFrom: [45, 27],
        gainLineX: 42,
        zone: [54, 15, 7, 'SUPERIORIDAD'],
      },
      {
        title: 'Al wing',
        description: 'El 10 fija a su defensor y pasa al wing, que corre libre por la orilla.',
        allies: { 11: [62, 8], 10: [50, 18] },
        rivals: { 11: [56, 13] },
        ball: [62, 8],
        passFrom: [50, 18],
        gainLineX: 42,
      },
    ]),
  },
  {
    id: 'lib_blindside',
    name: 'Ataque al lado ciego (9 → ala → wing)',
    category: 'Juego abierto',
    summary: 'Con el ruck cerca del touch, el lado corto suele quedar con pocos defensores: el 9 lo ataca con el ala y el wing.',
    phases: buildPlay([
      {
        title: 'Ruck cerca del touch',
        description: 'El ruck queda a ~25 m del touch izquierdo. Del lado corto solo hay un defensor y su wing.',
        allies: {
          1: [40, 28], 2: [41, 31], 3: [40, 34], 4: [38, 30], 5: [38, 33], 7: [42, 36], 8: [37, 32],
          9: [38, 31], 6: [38, 22], 11: [32, 10], 10: [34, 42], 12: [33, 50], 13: [32, 58], 14: [30, 80], 15: [24, 50],
        },
        rivals: {
          1: [44, 28], 2: [44, 31], 3: [44, 34], 9: [45, 31], 6: [45, 24], 11: [52, 10],
          4: [46, 38], 5: [46, 44], 7: [47, 50], 8: [47, 56], 10: [48, 46], 12: [49, 54], 13: [50, 62], 14: [52, 80], 15: [70, 55],
        },
        ball: [39, 31],
        gainLineX: 42,
      },
      {
        title: 'El 9 sale por el lado corto',
        description: 'El 9 toma la pelota y corre hacia el touch, fijando al defensor del borde.',
        allies: { 9: [44, 24], 6: [42, 19] },
        rivals: { 6: [46, 23] },
        ball: [44, 24],
        gainLineX: 42,
      },
      {
        title: 'Pase al ala',
        description: 'Con el defensor fijado, el 9 pasa al ala que entra lanzado.',
        allies: { 6: [49, 18], 11: [42, 11] },
        ball: [49, 18],
        passFrom: [44, 24],
        gainLineX: 42,
      },
      {
        title: 'El wing finaliza',
        description: 'El ala atrae al wing rival y descarga al 11, que corre libre pegado al touch.',
        allies: { 11: [62, 9], 6: [54, 16] },
        rivals: { 11: [55, 14] },
        ball: [62, 9],
        passFrom: [54, 16],
        gainLineX: 42,
        zone: [60, 10, 7, 'LADO CIEGO'],
      },
    ]),
  },
  {
    id: 'lib_blitz_defense',
    name: 'Defensa en blitz (presión rápida)',
    category: 'Defensa',
    summary: 'Toda la línea sube rápido y junta para quitarle tiempo y espacio al ataque rival y forzar el error o el robo.',
    phases: buildPlay([
      {
        title: 'Línea defensiva armada',
        description: 'El rival tiene la pelota en el ruck. Orcos se alinea hombre a hombre, con el 15 cubriendo atrás.',
        allies: {
          1: [56, 42], 2: [56, 46], 3: [56, 50], 4: [55, 38], 5: [55, 54], 6: [55, 34], 7: [55, 58], 8: [54, 62],
          9: [56, 28], 10: [54, 34], 12: [54, 24], 13: [54, 16], 11: [54, 8], 14: [52, 80], 15: [36, 50],
        },
        rivals: {
          1: [60, 43], 2: [60, 46], 3: [60, 49], 4: [62, 40], 5: [62, 52], 6: [61, 56], 7: [61, 60], 8: [62, 64],
          9: [61, 45], 10: [64, 34], 12: [65, 26], 13: [66, 18], 11: [68, 9], 14: [66, 82], 15: [80, 50],
        },
        ball: [61, 45],
        gainLineX: 58,
      },
      {
        title: 'Subida en bloque',
        description: 'Apenas la pelota sale del ruck, toda la línea sube junta. Nadie se adelanta solo: así no quedan huecos.',
        allies: { 10: [60, 33], 12: [60, 25], 13: [60, 17], 11: [60, 9], 9: [59, 30], 6: [59, 37] },
        ball: [64, 34],
        passFrom: [61, 45],
        gainLineX: 58,
        zone: [63, 30, 7, 'PRESIÓN'],
      },
      {
        title: 'Tackle y corte del pase',
        description: 'El 12 tacklea al portador mientras el 13 se cierra sobre el siguiente receptor; el 7 llega para el doble tackle.',
        allies: { 12: [63, 26], 13: [63, 21], 7: [62, 29] },
        rivals: { 10: [63, 31], 12: [64, 26] },
        ball: [64, 26],
        passFrom: [63, 31],
        gainLineX: 58,
      },
      {
        title: 'Robo del 7',
        description: 'El portador cae y el 7 se para sobre la pelota para robarla (jackal) antes de que lleguen sus apoyos.',
        allies: { 7: [64, 27] },
        ball: [64, 27],
        gainLineX: 58,
        zone: [64, 27, 6, 'ROBO'],
      },
    ]),
  },
  {
    id: 'lib_counter_attack',
    name: 'Contraataque tras patada rival',
    category: 'Juego con el pie',
    summary: 'El 15 recibe la patada larga, corre hacia el espacio libre y lanza al wing antes de que la defensa se reorganice.',
    phases: buildPlay([
      {
        title: 'Recepción de la patada',
        description: 'El rival patea largo. El 15 recibe; los wings se abren y los forwards todavía vienen volviendo.',
        allies: {
          15: [18, 40], 11: [22, 15], 14: [22, 78], 10: [30, 50], 12: [30, 32], 13: [28, 62], 9: [34, 46],
          1: [42, 42], 2: [43, 46], 3: [42, 50], 4: [40, 38], 5: [40, 54], 6: [41, 30], 7: [41, 60], 8: [38, 46],
        },
        rivals: {
          10: [42, 38], 12: [44, 30], 13: [44, 50], 11: [46, 14], 14: [46, 72], 15: [60, 50],
          1: [56, 40], 2: [56, 46], 3: [56, 52], 4: [58, 36], 5: [58, 56], 6: [52, 34], 7: [52, 58], 8: [54, 46], 9: [50, 44],
        },
        ball: [18, 40],
        gainLineX: null,
      },
      {
        title: 'Correr al espacio',
        description: 'El 15 no patea de vuelta: corre hacia la zona donde hay menos perseguidores.',
        allies: { 15: [26, 58], 14: [28, 74], 13: [30, 66] },
        rivals: { 10: [36, 46], 13: [38, 56] },
        ball: [26, 58],
      },
      {
        title: 'Pase al wing',
        description: 'Cuando el perseguidor se le acerca, el 15 suelta al 14 que viene lanzado por la orilla.',
        allies: { 14: [40, 82], 15: [32, 62] },
        rivals: { 14: [44, 76] },
        ball: [40, 82],
        passFrom: [32, 62],
        zone: [46, 84, 8, 'ESPACIO'],
      },
      {
        title: 'Romper y apoyar',
        description: 'El 14 gana metros por la orilla y el 13 llega como apoyo interior para el siguiente pase.',
        allies: { 14: [62, 84], 13: [54, 72], 15: [44, 66] },
        rivals: { 14: [58, 80], 15: [70, 70] },
        ball: [62, 84],
      },
    ]),
  },
  {
    id: 'lib_crosskick',
    name: 'Patada cruzada al wing',
    category: 'Juego con el pie',
    summary: 'Cerca del ingoal, con la defensa subida y el wing rival cerrado, el 10 patea cruzado al espacio para su wing.',
    phases: buildPlay([
      {
        title: 'Ataque dentro de las 22',
        description: 'Ruck a 20 m del ingoal. La defensa rival está subida y su wing se cerró hacia adentro.',
        allies: {
          1: [70, 38], 2: [71, 41], 3: [70, 44], 4: [68, 40], 5: [68, 43], 6: [72, 36], 7: [72, 46], 8: [67, 42],
          9: [69, 41], 10: [66, 32], 12: [65, 26], 13: [64, 20], 11: [63, 10], 14: [70, 86], 15: [60, 56],
        },
        rivals: {
          1: [74, 38], 2: [74, 41], 3: [74, 44], 9: [75, 41], 4: [76, 34], 5: [76, 48], 6: [76, 30], 7: [76, 52],
          8: [77, 56], 10: [77, 26], 12: [78, 20], 13: [78, 62], 11: [78, 12], 14: [80, 74], 15: [86, 46],
        },
        ball: [70, 41],
        gainLineX: 72,
      },
      {
        title: 'Pase al 10',
        description: 'El 9 pasa al 10, que mira la orilla contraria: el wing rival quedó lejos del touch.',
        allies: { 10: [67, 33] },
        ball: [67, 33],
        passFrom: [69, 41],
        gainLineX: 72,
      },
      {
        title: 'La patada cruzada',
        description: 'El 10 patea alto y cruzado a la zona de caída; el 14 corre a buscarla en el aire.',
        allies: { 14: [82, 86] },
        rivals: { 14: [82, 78] },
        ball: [87, 84],
        passFrom: [67, 33],
        gainLineX: 72,
        zone: [87, 84, 7, 'ZONA DE CAÍDA'],
      },
      {
        title: 'Try',
        description: 'El 14 gana el salto y apoya en el ingoal.',
        allies: { 14: [93, 83] },
        ball: [93, 83],
        gainLineX: 72,
      },
    ]),
  },
];

export const ALL_TV_PLAYS = [
  ...PRESET_TV_PLAYS.map(p => ({ ...p, category: playGroup(p) })),
  ...EXTRA_TV_PLAYS,
];

/** Example plays grouped for the picker, in PLAY_GROUPS order. */
export function groupedPlays(plays = ALL_TV_PLAYS) {
  return PLAY_GROUPS
    .map(group => ({ group, plays: plays.filter(p => playGroup(p) === group) }))
    .filter(g => g.plays.length > 0);
}
