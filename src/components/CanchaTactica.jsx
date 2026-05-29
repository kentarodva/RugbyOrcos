import React, { useContext, useState, useEffect, useRef } from 'react';
import { ClubContext } from '../context/ClubContext';

const ALIGNMENTS_HORIZONTAL = {
  standard: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 40, y: 30 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 42, y: 45 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 40, y: 60 },
    { id: 4, name: 'Segunda Línea Izq', short: 'sl4', x: 34, y: 35 },
    { id: 5, name: 'Segunda Línea Der', short: 'sl5', x: 34, y: 55 },
    { id: 6, name: 'Flanker Ciego', short: 'fl6', x: 36, y: 20 },
    { id: 7, name: 'Flanker Abierto', short: 'fl7', x: 36, y: 70 },
    { id: 8, name: 'Octavo (N8)', short: 'n8', x: 28, y: 45 },
    { id: 9, name: 'Medio Melé (Half)', short: 'mm9', x: 32, y: 35 },
    { id: 10, name: 'Apertura (Fly)', short: 'ap10', x: 42, y: 22 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 72, y: 15 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 50, y: 20 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 58, y: 18 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 50, y: 80 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 25, y: 50 }
  ],
  sevens: [
    { id: 1, name: 'Pilar Izq (7s)', short: 'p1', x: 45, y: 25 },
    { id: 2, name: 'Talonador (7s)', short: 'p2', x: 45, y: 50 },
    { id: 3, name: 'Pilar Der (7s)', short: 'p3', x: 45, y: 75 },
    { id: 4, name: 'Reserva 1', short: 'r4', x: 15, y: 93 },
    { id: 5, name: 'Reserva 2', short: 'r5', x: 25, y: 93 },
    { id: 6, name: 'Reserva 3', short: 'r6', x: 35, y: 93 },
    { id: 7, name: 'Reserva 4', short: 'r7', x: 45, y: 93 },
    { id: 8, name: 'Reserva 5', short: 'r8', x: 55, y: 93 },
    { id: 9, name: 'Medio Melé (7s)', short: 'mm9', x: 35, y: 50 },
    { id: 10, name: 'Apertura (7s)', short: 'ap10', x: 38, y: 35 },
    { id: 11, name: 'Ala (Wing 7s)', short: 'w11', x: 62, y: 20 },
    { id: 12, name: 'Centro (7s)', short: 'c12', x: 48, y: 35 },
    { id: 13, name: 'Reserva 6', short: 'r13', x: 65, y: 93 },
    { id: 14, name: 'Reserva 7', short: 'r14', x: 75, y: 93 },
    { id: 15, name: 'Reserva 8', short: 'r15', x: 85, y: 93 }
  ],
  scrum_attack: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 32, y: 44 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 34, y: 50 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 32, y: 56 },
    { id: 4, name: 'Segunda Línea Izq', short: 'sl4', x: 26, y: 46 },
    { id: 5, name: 'Segunda Línea Der', short: 'sl5', x: 26, y: 54 },
    { id: 6, name: 'Flanker Ciego', short: 'fl6', x: 24, y: 38 },
    { id: 7, name: 'Flanker Abierto', short: 'fl7', x: 24, y: 62 },
    { id: 8, name: 'Octavo (N8)', short: 'n8', x: 20, y: 50 },
    { id: 9, name: 'Medio Melé (Half)', short: 'mm9', x: 20, y: 42 },
    { id: 10, name: 'Apertura (Fly)', short: 'ap10', x: 28, y: 28 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 18, y: 80 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 38, y: 22 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 48, y: 18 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 60, y: 14 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 35, y: 35 }
  ],
  lineout_defense: [
    { id: 1, name: 'Pilar Izq (Apoyo Frontal)', short: 'p1', x: 49, y: 15 },
    { id: 2, name: 'Talonador (Lanzador)', short: 'p2', x: 50, y: 4 },
    { id: 3, name: 'Pilar Der (Apoyo Central)', short: 'p3', x: 51, y: 25 },
    { id: 4, name: 'Segunda Izq (Saltador 1)', short: 'sl4', x: 50, y: 20 },
    { id: 5, name: 'Segunda Der (Saltador 2)', short: 'sl5', x: 50, y: 30 },
    { id: 6, name: 'Flanker Ciego (Saltador 3)', short: 'fl6', x: 50, y: 36 },
    { id: 7, name: 'Flanker Abierto (Apoyo Post)', short: 'fl7', x: 49, y: 42 },
    { id: 8, name: 'Octavo (Receptor Volante)', short: 'n8', x: 45, y: 30 },
    { id: 9, name: 'Medio Melé (Canal)', short: 'mm9', x: 46, y: 48 },
    { id: 10, name: 'Apertura (Fly)', short: 'ap10', x: 40, y: 55 },
    { id: 11, name: 'Ala Izquierdo (Poste Touch)', short: 'w11', x: 48, y: 12 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 38, y: 65 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 36, y: 75 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 34, y: 85 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 25, y: 50 }
  ],
  defensive_wall: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 45, y: 20 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 45, y: 36 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 45, y: 60 },
    { id: 4, name: 'Segunda Línea Izq', short: 'sl4', x: 45, y: 28 },
    { id: 5, name: 'Segunda Línea Der', short: 'sl5', x: 45, y: 52 },
    { id: 6, name: 'Flanker Ciego', short: 'fl6', x: 45, y: 12 },
    { id: 7, name: 'Flanker Abierto', short: 'fl7', x: 45, y: 68 },
    { id: 8, name: 'Octavo (N8)', short: 'n8', x: 45, y: 44 },
    { id: 9, name: 'Medio Melé (Poste 1)', short: 'mm9', x: 45, y: 76 },
    { id: 10, name: 'Apertura (Poste 2)', short: 'ap10', x: 45, y: 84 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 28, y: 20 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 34, y: 44 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 34, y: 56 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 28, y: 80 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 18, y: 50 }
  ],
  kickoff_receive: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 38, y: 18 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 38, y: 50 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 38, y: 82 },
    { id: 4, name: 'Segunda Línea Izq (Catch)', short: 'sl4', x: 40, y: 30 },
    { id: 5, name: 'Segunda Línea Der (Catch)', short: 'sl5', x: 40, y: 70 },
    { id: 6, name: 'Flanker Ciego', short: 'fl6', x: 34, y: 35 },
    { id: 7, name: 'Flanker Abierto', short: 'fl7', x: 34, y: 65 },
    { id: 8, name: 'Octavo (Receptor)', short: 'n8', x: 30, y: 50 },
    { id: 9, name: 'Medio Melé (Half)', short: 'mm9', x: 25, y: 50 },
    { id: 10, name: 'Apertura (Fly)', short: 'ap10', x: 24, y: 30 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 15, y: 15 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 20, y: 40 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 20, y: 60 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 15, y: 85 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 12, y: 50 }
  ],
  league_13s: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 40, y: 35 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 42, y: 50 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 40, y: 65 },
    { id: 4, name: 'Segunda Línea Izq', short: 'sl4', x: 34, y: 40 },
    { id: 5, name: 'Segunda Línea Der', short: 'sl5', x: 34, y: 60 },
    { id: 6, name: 'Reserva 1 (League)', short: 'r6', x: 40, y: 93 },
    { id: 7, name: 'Reserva 2 (League)', short: 'r7', x: 50, y: 93 },
    { id: 8, name: 'Cerrojo (Lock)', short: 'n8', x: 28, y: 50 },
    { id: 9, name: 'Medio Melé (Half)', short: 'mm9', x: 32, y: 45 },
    { id: 10, name: 'Apertura (Pivot)', short: 'ap10', x: 35, y: 30 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 55, y: 15 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 42, y: 20 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 42, y: 80 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 55, y: 85 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 18, y: 50 }
  ],
  deep_attack: [
    { id: 1, name: 'Pilar Izq (Apoyo)', short: 'p1', x: 38, y: 65 },
    { id: 2, name: 'Talonador (Apoyo)', short: 'p2', x: 38, y: 72 },
    { id: 3, name: 'Pilar Der (Apoyo)', short: 'p3', x: 46, y: 50 },
    { id: 4, name: 'Segunda Izq (Ruck)', short: 'sl4', x: 46, y: 58 },
    { id: 5, name: 'Segunda Der (Ruck)', short: 'sl5', x: 26, y: 50 },
    { id: 6, name: 'Flanker (Cobertura)', short: 'fl6', x: 30, y: 35 },
    { id: 7, name: 'Flanker (Cobertura)', short: 'fl7', x: 34, y: 25 },
    { id: 8, name: 'Octavo (Apoyo Medio)', short: 'n8', x: 28, y: 60 },
    { id: 9, name: 'Medio Melé (Pase)', short: 'mm9', x: 35, y: 55 },
    { id: 10, name: 'Apertura (Threat)', short: 'ap10', x: 42, y: 44 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 48, y: 80 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 50, y: 36 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 58, y: 28 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 66, y: 20 },
    { id: 15, name: 'Zaguero (Support)', short: 'fb15', x: 52, y: 30 }
  ],
  screen_defense: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 42, y: 25 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 42, y: 50 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 42, y: 75 },
    { id: 4, name: 'Segunda Línea Izq', short: 'sl4', x: 42, y: 35 },
    { id: 5, name: 'Segunda Línea Der', short: 'sl5', x: 42, y: 65 },
    { id: 6, name: 'Flanker Ciego', short: 'fl6', x: 42, y: 15 },
    { id: 7, name: 'Flanker Abierto', short: 'fl7', x: 42, y: 85 },
    { id: 8, name: 'Octavo (N8)', short: 'n8', x: 32, y: 50 },
    { id: 9, name: 'Medio Melé (Sweep)', short: 'mm9', x: 32, y: 35 },
    { id: 10, name: 'Apertura (Sweep)', short: 'ap10', x: 32, y: 65 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 18, y: 25 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 30, y: 20 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 30, y: 80 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 18, y: 75 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 12, y: 50 }
  ],
  custom: [
    { id: 1, name: 'Posición 1', short: 'p1', x: 30, y: 30 },
    { id: 2, name: 'Posición 2', short: 'p2', x: 50, y: 30 },
    { id: 3, name: 'Posición 3', short: 'p3', x: 70, y: 30 },
    { id: 4, name: 'Posición 4', short: 'p4', x: 20, y: 50 },
    { id: 5, name: 'Posición 5', short: 'p5', x: 40, y: 50 },
    { id: 6, name: 'Posición 6', short: 'p6', x: 60, y: 50 },
    { id: 7, name: 'Posición 7', short: 'p7', x: 80, y: 50 },
    { id: 8, name: 'Posición 8', short: 'p8', x: 30, y: 70 },
    { id: 9, name: 'Posición 9', short: 'p9', x: 50, y: 70 },
    { id: 10, name: 'Posición 10', short: 'p10', x: 70, y: 70 },
    { id: 11, name: 'Posición 11', short: 'p11', x: 10, y: 70 },
    { id: 12, name: 'Posición 12', short: 'p12', x: 90, y: 70 },
    { id: 13, name: 'Posición 13', short: 'p13', x: 10, y: 30 },
    { id: 14, name: 'Posición 14', short: 'p14', x: 90, y: 30 },
    { id: 15, name: 'Posición 15', short: 'p15', x: 50, y: 15 }
  ]
};

const ALIGNMENTS_VERTICAL = {
  standard: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 20, y: 12 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 50, y: 9 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 80, y: 12 },
    { id: 4, name: 'Segunda Línea Izq', short: 'sl4', x: 35, y: 22 },
    { id: 5, name: 'Segunda Línea Der', short: 'sl5', x: 65, y: 22 },
    { id: 6, name: 'Flanker Ciego', short: 'fl6', x: 18, y: 32 },
    { id: 7, name: 'Flanker Abierto', short: 'fl7', x: 82, y: 32 },
    { id: 8, name: 'Octavo (N8)', short: 'n8', x: 50, y: 34 },
    { id: 9, name: 'Medio Melé (Half)', short: 'mm9', x: 38, y: 46 },
    { id: 10, name: 'Apertura (Fly)', short: 'ap10', x: 58, y: 56 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 15, y: 66 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 42, y: 66 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 68, y: 72 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 85, y: 66 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 50, y: 84 }
  ],
  sevens: [
    { id: 1, name: 'Pilar Izq (7s)', short: 'p1', x: 30, y: 25 },
    { id: 2, name: 'Talonador (7s)', short: 'p2', x: 50, y: 20 },
    { id: 3, name: 'Pilar Der (7s)', short: 'p3', x: 70, y: 25 },
    { id: 4, name: 'Reserva 1', short: 'r4', x: 93, y: 15 },
    { id: 5, name: 'Reserva 2', short: 'r5', x: 93, y: 23 },
    { id: 6, name: 'Reserva 3', short: 'r6', x: 93, y: 31 },
    { id: 7, name: 'Reserva 4', short: 'r7', x: 93, y: 39 },
    { id: 8, name: 'Reserva 5', short: 'r8', x: 93, y: 47 },
    { id: 9, name: 'Medio Melé (7s)', short: 'mm9', x: 40, y: 42 },
    { id: 10, name: 'Apertura (7s)', short: 'ap10', x: 60, y: 42 },
    { id: 11, name: 'Ala (Wing 7s)', short: 'w11', x: 78, y: 65 },
    { id: 12, name: 'Centro (7s)', short: 'c12', x: 50, y: 58 },
    { id: 13, name: 'Reserva 6', short: 'r13', x: 93, y: 55 },
    { id: 14, name: 'Reserva 7', short: 'r14', x: 93, y: 63 },
    { id: 15, name: 'Reserva 8', short: 'r15', x: 93, y: 71 }
  ],
  scrum_attack: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 40, y: 26 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 45, y: 25 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 50, y: 26 },
    { id: 4, name: 'Segunda Línea Izq', short: 'sl4', x: 41, y: 31 },
    { id: 5, name: 'Segunda Línea Der', short: 'sl5', x: 49, y: 31 },
    { id: 6, name: 'Flanker Ciego', short: 'fl6', x: 36, y: 33 },
    { id: 7, name: 'Flanker Abierto', short: 'fl7', x: 54, y: 33 },
    { id: 8, name: 'Octavo (N8)', short: 'n8', x: 45, y: 37 },
    { id: 9, name: 'Medio Melé (Half)', short: 'mm9', x: 36, y: 37 },
    { id: 10, name: 'Apertura (Fly)', short: 'ap10', x: 55, y: 48 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 22, y: 40 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 64, y: 56 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 73, y: 64 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 85, y: 70 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 52, y: 72 }
  ],
  lineout_defense: [
    { id: 1, name: 'Pilar Izq (Apoyo Frontal)', short: 'p1', x: 12, y: 28 },
    { id: 2, name: 'Talonador (Lanzador)', short: 'p2', x: 4, y: 30 },
    { id: 3, name: 'Pilar Der (Apoyo Central)', short: 'p3', x: 30, y: 28 },
    { id: 4, name: 'Segunda Izq (Saltador 1)', short: 'sl4', x: 18, y: 28 },
    { id: 5, name: 'Segunda Der (Saltador 2)', short: 'sl5', x: 24, y: 28 },
    { id: 6, name: 'Flanker Ciego (Saltador 3)', short: 'fl6', x: 36, y: 28 },
    { id: 7, name: 'Flanker Abierto (Apoyo Post)', short: 'fl7', x: 42, y: 28 },
    { id: 8, name: 'Octavo (Receptor Volante)', short: 'n8', x: 48, y: 28 },
    { id: 9, name: 'Medio Melé (Canal)', short: 'mm9', x: 26, y: 38 },
    { id: 10, name: 'Apertura (Fly)', short: 'ap10', x: 35, y: 50 },
    { id: 11, name: 'Ala Izquierdo (Poste Touch)', short: 'w11', x: 10, y: 48 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 46, y: 56 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 57, y: 62 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 74, y: 68 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 48, y: 76 }
  ],
  defensive_wall: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 16, y: 35 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 40, y: 35 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 72, y: 35 },
    { id: 4, name: 'Segunda Línea Izq', short: 'sl4', x: 24, y: 35 },
    { id: 5, name: 'Segunda Línea Der', short: 'sl5', x: 64, y: 35 },
    { id: 6, name: 'Flanker Ciego', short: 'fl6', x: 32, y: 35 },
    { id: 7, name: 'Flanker Abierto', short: 'fl7', x: 56, y: 35 },
    { id: 8, name: 'Octavo (N8)', short: 'n8', x: 48, y: 35 },
    { id: 9, name: 'Medio Melé (Poste 1)', short: 'mm9', x: 36, y: 32 },
    { id: 10, name: 'Apertura (Poste 2)', short: 'ap10', x: 48, y: 42 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 14, y: 60 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 60, y: 42 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 72, y: 42 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 86, y: 60 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 50, y: 75 }
  ],
  kickoff_receive: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 15, y: 45 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 50, y: 44 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 85, y: 45 },
    { id: 4, name: 'Segunda Línea Izq (Catch)', short: 'sl4', x: 25, y: 46 },
    { id: 5, name: 'Segunda Línea Der (Catch)', short: 'sl5', x: 75, y: 46 },
    { id: 6, name: 'Flanker Ciego', short: 'fl6', x: 35, y: 44 },
    { id: 7, name: 'Flanker Abierto', short: 'fl7', x: 65, y: 44 },
    { id: 8, name: 'Octavo (Receptor)', short: 'n8', x: 50, y: 48 },
    { id: 9, name: 'Medio Melé (Half)', short: 'mm9', x: 40, y: 55 },
    { id: 10, name: 'Apertura (Fly)', short: 'ap10', x: 50, y: 60 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 15, y: 70 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 30, y: 65 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 70, y: 65 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 85, y: 70 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 50, y: 82 }
  ],
  league_13s: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 35, y: 28 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 50, y: 24 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 65, y: 28 },
    { id: 4, name: 'Segunda Línea Izq', short: 'sl4', x: 40, y: 36 },
    { id: 5, name: 'Segunda Línea Der', short: 'sl5', x: 60, y: 36 },
    { id: 6, name: 'Reserva 1 (League)', short: 'r6', x: 93, y: 25 },
    { id: 7, name: 'Reserva 2 (League)', short: 'r7', x: 93, y: 35 },
    { id: 8, name: 'Cerrojo (Lock)', short: 'n8', x: 50, y: 42 },
    { id: 9, name: 'Medio Melé (Half)', short: 'mm9', x: 42, y: 50 },
    { id: 10, name: 'Apertura (Pivot)', short: 'ap10', x: 58, y: 50 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 15, y: 70 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 30, y: 62 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 70, y: 62 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 85, y: 70 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 50, y: 80 }
  ],
  deep_attack: [
    { id: 1, name: 'Pilar Izq (Apoyo)', short: 'p1', x: 30, y: 32 },
    { id: 2, name: 'Talonador (Apoyo)', short: 'p2', x: 38, y: 32 },
    { id: 3, name: 'Pilar Der (Apoyo)', short: 'p3', x: 46, y: 32 },
    { id: 4, name: 'Segunda Izq (Ruck)', short: 'sl4', x: 60, y: 36 },
    { id: 5, name: 'Segunda Der (Ruck)', short: 'sl5', x: 68, y: 36 },
    { id: 6, name: 'Flanker (Cobertura)', short: 'fl6', x: 18, y: 36 },
    { id: 7, name: 'Flanker (Cobertura)', short: 'fl7', x: 82, y: 40 },
    { id: 8, name: 'Octavo (Apoyo Medio)', short: 'n8', x: 50, y: 40 },
    { id: 9, name: 'Medio Melé (Pase)', short: 'mm9', x: 22, y: 45 },
    { id: 10, name: 'Apertura (Threat)', short: 'ap10', x: 34, y: 52 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 15, y: 58 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 46, y: 59 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 58, y: 66 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 70, y: 73 },
    { id: 15, name: 'Zaguero (Support)', short: 'fb15', x: 42, y: 72 }
  ],
  screen_defense: [
    { id: 1, name: 'Pilar Izquierdo', short: 'p1', x: 20, y: 35 },
    { id: 2, name: 'Talonador (Hooker)', short: 'p2', x: 50, y: 35 },
    { id: 3, name: 'Pilar Derecho', short: 'p3', x: 80, y: 35 },
    { id: 4, name: 'Segunda Línea Izq', short: 'sl4', x: 35, y: 35 },
    { id: 5, name: 'Segunda Línea Der', short: 'sl5', x: 65, y: 35 },
    { id: 6, name: 'Flanker Ciego', short: 'fl6', x: 10, y: 35 },
    { id: 7, name: 'Flanker Abierto', short: 'fl7', x: 90, y: 35 },
    { id: 8, name: 'Octavo (N8)', short: 'n8', x: 50, y: 40 },
    { id: 9, name: 'Medio Melé (Sweep)', short: 'mm9', x: 30, y: 52 },
    { id: 10, name: 'Apertura (Sweep)', short: 'ap10', x: 70, y: 52 },
    { id: 11, name: 'Ala Izquierdo (Wing)', short: 'w11', x: 15, y: 70 },
    { id: 12, name: 'Primer Centro', short: 'c12', x: 40, y: 55 },
    { id: 13, name: 'Segundo Centro', short: 'c13', x: 60, y: 55 },
    { id: 14, name: 'Ala Derecho (Wing)', short: 'w14', x: 85, y: 70 },
    { id: 15, name: 'Zaguero (Fullback)', short: 'fb15', x: 50, y: 82 }
  ],
  custom: [
    { id: 1, name: 'Posición 1', short: 'p1', x: 30, y: 15 },
    { id: 2, name: 'Posición 2', short: 'p2', x: 50, y: 15 },
    { id: 3, name: 'Posición 3', short: 'p3', x: 70, y: 15 },
    { id: 4, name: 'Posición 4', short: 'p4', x: 20, y: 35 },
    { id: 5, name: 'Posición 5', short: 'p5', x: 40, y: 35 },
    { id: 6, name: 'Posición 6', short: 'p6', x: 60, y: 35 },
    { id: 7, name: 'Posición 7', short: 'p7', x: 80, y: 35 },
    { id: 8, name: 'Posición 8', short: 'p8', x: 20, y: 55 },
    { id: 9, name: 'Posición 9', short: 'p9', x: 40, y: 55 },
    { id: 10, name: 'Posición 10', short: 'p10', x: 60, y: 55 },
    { id: 11, name: 'Posición 11', short: 'p11', x: 80, y: 55 },
    { id: 12, name: 'Posición 12', short: 'p12', x: 10, y: 75 },
    { id: 13, name: 'Posición 13', short: 'p13', x: 30, y: 75 },
    { id: 14, name: 'Posición 14', short: 'p14', x: 70, y: 75 },
    { id: 15, name: 'Posición 15', short: 'p15', x: 90, y: 75 }
  ]
};

const ALIGNMENTS_LABELS = {
  standard: '🏉 Rugby Union XV (Clásica)',
  sevens: '⚡ Rugby Sevens (7s Spread-out)',
  scrum_attack: '💥 Ataque desde Scrum (XV)',
  lineout_defense: '🗼 Defensa de Lineout (XV)',
  defensive_wall: '🧱 Muralla Defensiva / Drift (XV)',
  kickoff_receive: '🎯 Recepción de Kickoff (XV)',
  league_13s: '🛡️ Rugby League (13s)',
  deep_attack: '🚀 Ataque Escalonado (XV)',
  screen_defense: '🕸️ Defensa en Red / Soporte (XV)',
  custom: '🎨 Formación Personalizada (Libre)'
};

const POS_ABREVIATIONS = {
  1: 'PIL', // Pilar Izquierdo
  2: 'TAL', // Talonador
  3: 'PIL', // Pilar Derecho
  4: '2ªL', // Segunda Línea Izq
  5: '2ªL', // Segunda Línea Der
  6: 'FLK', // Flanker Ciego
  7: 'FLK', // Flanker Abierto
  8: 'OCT', // Octavo
  9: 'M.M', // Medio Melé
  10: 'APE', // Apertura
  11: 'WNG', // Wing Izquierdo
  12: 'CTR', // Primer Centro
  13: 'CTR', // Segundo Centro
  14: 'WNG', // Wing Derecho
  15: 'ZAG'  // Zaguero
};

function CanchaTactica() {
  const { players, activeTeam } = useContext(ClubContext);
  const pitchRef = useRef(null);

  // Guardar la alineación del equipo en LocalStorage
  const [lineup, setLineup] = useState(() => {
    const saved = localStorage.getItem(`orcos_lineup_${activeTeam}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [tacticalNotes, setTacticalNotes] = useState(() => {
    return localStorage.getItem(`orcos_notes_${activeTeam}`) || '';
  });

  // Configuración de orientación y tamaño de la pizarra
  const [pitchOrientation, setPitchOrientation] = useState(() => {
    return localStorage.getItem('orcos_pitch_orientation') || 'horizontal';
  });

  const [pitchSize, setPitchSize] = useState(() => {
    return localStorage.getItem('orcos_pitch_size') || 'medium';
  });

  const [activeAlignment, setActiveAlignment] = useState('standard');

  // Guardar las coordenadas de las posiciones (persistencia por orientación y categoría)
  const [fieldPositions, setFieldPositions] = useState(() => {
    const key = `orcos_positions_coords_${pitchOrientation}_${activeTeam}`;
    const saved = localStorage.getItem(key);
    const defaults = pitchOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL.standard : ALIGNMENTS_VERTICAL.standard;
    return saved ? JSON.parse(saved) : defaults;
  });

  // Estados de arrastre
  const [draggingId, setDraggingId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null); // { x, y }
  const [hasDragged, setHasDragged] = useState(false);

  // Modal para seleccionar jugador en una posición
  const [selectedSlot, setSelectedSlot] = useState(null); // { id: 1..23, name: 'Pilar Izquierdo' }
  const [showSelectModal, setShowSelectModal] = useState(false);

  // Modal de confirmación genérico
  const [confirmState, setConfirmState] = useState(null); // { message, onConfirm }

  const requestConfirm = (message, onConfirm) => {
    setConfirmState({ message, onConfirm });
  };

  useEffect(() => {
    localStorage.setItem(`orcos_lineup_${activeTeam}`, JSON.stringify(lineup));
  }, [lineup, activeTeam]);

  useEffect(() => {
    localStorage.setItem(`orcos_notes_${activeTeam}`, tacticalNotes);
  }, [tacticalNotes, activeTeam]);

  // Persistir la orientación elegida
  useEffect(() => {
    localStorage.setItem('orcos_pitch_orientation', pitchOrientation);
  }, [pitchOrientation]);

  // Persistir el tamaño elegido
  useEffect(() => {
    localStorage.setItem('orcos_pitch_size', pitchSize);
  }, [pitchSize]);

  // Sincronizar alineación y coordenadas al cambiar de categoría, de orientación o de formación
  useEffect(() => {
    const savedLineup = localStorage.getItem(`orcos_lineup_${activeTeam}`);
    setLineup(savedLineup ? JSON.parse(savedLineup) : {});
    
    const key = `orcos_positions_coords_${pitchOrientation}_${activeTeam}`;
    const savedPositions = localStorage.getItem(key);
    const defaults = pitchOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[activeAlignment] : ALIGNMENTS_VERTICAL[activeAlignment];
    setFieldPositions(savedPositions ? JSON.parse(savedPositions) : defaults);
    
    setTacticalNotes(localStorage.getItem(`orcos_notes_${activeTeam}`) || '');
  }, [activeTeam, pitchOrientation, activeAlignment]);

  // Lista de posiciones en banca (8 Suplentes)
  const SUPLENTES = [
    { id: 16, name: 'Pilar Suplente' },
    { id: 17, name: 'Talonador Suplente' },
    { id: 18, name: 'Segunda Suplente' },
    { id: 19, name: 'Tercera Suplente' },
    { id: 20, name: 'Medio Melé Suplente' },
    { id: 21, name: 'Back Suplente' },
    { id: 22, name: 'Back Suplente' },
    { id: 23, name: 'Comodín Suplente' }
  ];

  // Filtrar jugadores de este equipo (excluyendo entrenadores)
  const teamPlayers = players.filter(p => p.teamCategory === activeTeam && p.rol !== 'Entrenador');

  // Comprobar si un jugador ya está alineado en otra posición
  const isPlayerAligned = (playerId) => {
    return Object.values(lineup).includes(playerId);
  };

  // Abrir selector
  const handleSlotClick = (slotId, slotName) => {
    setSelectedSlot({ id: slotId, name: slotName });
    setShowSelectModal(true);
  };

  // Asignar jugador
  const assignPlayer = (playerId) => {
    const newLineup = { ...lineup };
    
    // Si elegimos "Vaciar" posición
    if (playerId === null) {
      delete newLineup[selectedSlot.id];
    } else {
      // Si el jugador ya estaba en otra posición, la vaciamos (swapping/move)
      Object.keys(newLineup).forEach(key => {
        if (newLineup[key] === playerId) {
          delete newLineup[key];
        }
      });
      newLineup[selectedSlot.id] = playerId;
    }
    
    setLineup(newLineup);
    setShowSelectModal(false);
  };

  // Limpiar pizarra
  const clearField = () => {
    requestConfirm('¿Deseas vaciar la alineación completa?', () => {
      setLineup({});
    });
  };

  // Cambiar formación táctica
  const handleAlignmentChange = (type) => {
    requestConfirm(`¿Deseas cambiar la formación táctica de la pizarra a "${ALIGNMENTS_LABELS[type]}"?`, () => {
      const selectedCoords = pitchOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[type] : ALIGNMENTS_VERTICAL[type];
      setFieldPositions(selectedCoords);
      localStorage.setItem(`orcos_positions_coords_${pitchOrientation}_${activeTeam}`, JSON.stringify(selectedCoords));
      setActiveAlignment(type);
    });
  };

  // Restablecer posiciones por defecto
  const resetToDefaultPositions = () => {
    requestConfirm('¿Deseas restablecer la formación a la táctica estándar?', () => {
      const defaults = pitchOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[activeAlignment] : ALIGNMENTS_VERTICAL[activeAlignment];
      setFieldPositions(defaults);
      localStorage.setItem(`orcos_positions_coords_${pitchOrientation}_${activeTeam}`, JSON.stringify(defaults));
    });
  };

  // --- CONTROLADOR DE ARRASTRE DE RATÓN Y TÁCTIL ---
  const handleStartDrag = (e, posId) => {
    setDraggingId(posId);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStartPos({ x: clientX, y: clientY });
    setHasDragged(false);
  };

  const handleDragMove = (e) => {
    if (draggingId === null || !dragStartPos) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Calcular distancia recorrida para ver si califica como drag
    const dist = Math.sqrt(Math.pow(clientX - dragStartPos.x, 2) + Math.pow(clientY - dragStartPos.y, 2));
    if (dist > 6) {
      setHasDragged(true);
    }

    if (!pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    
    // Calcular porcentaje de posición
    let xPct = ((clientX - rect.left) / rect.width) * 100;
    let yPct = ((clientY - rect.top) / rect.height) * 100;

    // Límites de seguridad dentro del campo
    xPct = Math.max(5, Math.min(95, xPct));
    yPct = Math.max(3, Math.min(97, yPct));

    setFieldPositions(prev => {
      const updated = prev.map(pos => pos.id === draggingId ? { ...pos, x: xPct, y: yPct } : pos);
      localStorage.setItem(`orcos_positions_coords_${pitchOrientation}_${activeTeam}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleEndDrag = (posId, posName) => {
    if (draggingId === null) return;

    // Si la distancia recorrida fue mínima, lo tratamos como un Click (abrir modal)
    if (!hasDragged) {
      handleSlotClick(posId, posName);
    }

    setDraggingId(null);
    setDragStartPos(null);
    setHasDragged(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="animated-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%' }}>
      
      {/* --- COLUMNA 1: CANCHA TÁCTICA --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Cabecera Cancha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Outfit' }}>📋 Pizarra de Alineaciones (XV Inicial)</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Arrastra los círculos para mover posiciones o tócalos para alinear orcos.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={resetToDefaultPositions} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-gold)', borderColor: 'rgba(255, 179, 0, 0.2)' }}>
              🔄 Reset Táctico
            </button>
            <button onClick={clearField} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-red)', borderColor: 'rgba(255, 61, 0, 0.2)' }}>
              🧹 Limpiar
            </button>
          </div>
        </div>

        {/* Selector de Alineación y Ajustes de Pizarra (Horizontal/Vertical y Tamaños) */}
        <div className="glass-panel" style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '15px',
          background: 'rgba(15, 22, 36, 0.4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)',
          flexWrap: 'wrap',
          marginBottom: '5px'
        }}>
          {/* Selector Táctico */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📋 Táctica:
            </span>
            <select
              value={activeAlignment}
              onChange={(e) => handleAlignmentChange(e.target.value)}
              className="form-select"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--color-primary)',
                color: 'var(--color-primary)',
                fontWeight: '700',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {Object.keys(ALIGNMENTS_LABELS).map(key => (
                <option key={key} value={key}>
                  {ALIGNMENTS_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          {/* Ajustes Visuales */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Control de Orientación */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-gold)', letterSpacing: '0.5px' }}>📐 VISTA:</span>
              <button 
                onClick={() => setPitchOrientation('horizontal')} 
                className="btn-outline"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  borderColor: pitchOrientation === 'horizontal' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                  background: pitchOrientation === 'horizontal' ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
                  color: pitchOrientation === 'horizontal' ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s'
                }}
              >
                ↔️ Horizontal
              </button>
              <button 
                onClick={() => setPitchOrientation('vertical')} 
                className="btn-outline"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  borderColor: pitchOrientation === 'vertical' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                  background: pitchOrientation === 'vertical' ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
                  color: pitchOrientation === 'vertical' ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s'
                }}
              >
                ↕️ Vertical
              </button>
            </div>

            {/* Control de Tamaño */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-gold)', letterSpacing: '0.5px' }}>🔍 TAMAÑO:</span>
              {['small', 'medium', 'large'].map(sz => (
                <button
                  key={sz}
                  onClick={() => setPitchSize(sz)}
                  className="btn-outline"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    borderRadius: 'var(--radius-sm)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderColor: pitchSize === sz ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                    background: pitchSize === sz ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
                    color: pitchSize === sz ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s'
                  }}
                >
                  {sz === 'small' ? 'Chico' : sz === 'medium' ? 'Normal' : 'Grande'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cancha de Rugby de Grass con detectores de arrastre globales a la cancha */}
        <div 
          ref={pitchRef}
          className="rugby-pitch" 
          onMouseMove={handleDragMove}
          onTouchMove={handleDragMove}
          onMouseUp={() => setDraggingId(null)}
          onTouchEnd={() => setDraggingId(null)}
          style={{
            position: 'relative',
            width: pitchSize === 'small' ? '60%' : '100%',
            maxWidth: pitchSize === 'small' ? '480px' : pitchSize === 'medium' ? '800px' : '100%',
            margin: pitchSize === 'large' ? '0' : '0 auto',
            aspectRatio: pitchOrientation === 'horizontal' ? '1.6' : '0.8',
            background: pitchOrientation === 'horizontal'
              ? 'repeating-linear-gradient(90deg, #11361c, #11361c 5%, #0d2b16 5%, #0d2b16 10%)'
              : 'repeating-linear-gradient(180deg, #11361c, #11361c 5%, #0d2b16 5%, #0d2b16 10%)',
            borderRadius: 'var(--radius-lg)',
            border: '3px solid rgba(255,255,255,0.85)',
            overflow: 'hidden',
            boxShadow: '0 0 25px rgba(0, 230, 118, 0.15), inset 0 0 30px rgba(0,0,0,0.6)',
            backgroundSize: '100% 100%',
            userSelect: 'none',
            transition: 'aspect-ratio 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          
          {/* Líneas Reglamentarias de la Cancha (Try zones, 22m, Midfield) */}
          {pitchOrientation === 'horizontal' ? (
            <>
              {/* Try line izquierda */}
              <div style={{ position: 'absolute', left: '8%', top: 0, bottom: 0, width: '2px', background: '#fff', pointerEvents: 'none' }} />
              {/* 22m izquierda */}
              <div style={{ position: 'absolute', left: '26%', top: 0, bottom: 0, width: '1.5px', background: 'rgba(255,255,255,0.65)', borderLeft: '1.5px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
              {/* 10m izquierda */}
              <div style={{ position: 'absolute', left: '42%', top: 0, bottom: 0, width: '1.5px', background: 'rgba(255,255,255,0.4)', borderLeft: '1.5px dashed rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
              {/* Línea de mitad de cancha */}
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '3px', background: '#fff', pointerEvents: 'none' }} />
              {/* 10m derecha */}
              <div style={{ position: 'absolute', left: '58%', top: 0, bottom: 0, width: '1.5px', background: 'rgba(255,255,255,0.4)', borderLeft: '1.5px dashed rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
              {/* 22m derecha */}
              <div style={{ position: 'absolute', left: '74%', top: 0, bottom: 0, width: '1.5px', background: 'rgba(255,255,255,0.65)', borderLeft: '1.5px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
              {/* Try line derecha */}
              <div style={{ position: 'absolute', right: '8%', top: 0, bottom: 0, width: '2px', background: '#fff', pointerEvents: 'none' }} />

              {/* Marcadores de Línea Superiores (Efecto Broadcast) */}
              <div style={{ position: 'absolute', left: '8%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
              <div style={{ position: 'absolute', left: '26%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', left: '42%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', left: '50%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-primary)', pointerEvents: 'none', fontFamily: 'monospace' }}>MITAD</div>
              <div style={{ position: 'absolute', left: '58%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', left: '74%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', right: '8%', top: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>

              {/* Marcadores de Línea Inferiores */}
              <div style={{ position: 'absolute', left: '8%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
              <div style={{ position: 'absolute', left: '26%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', left: '42%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', left: '50%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-primary)', pointerEvents: 'none', fontFamily: 'monospace' }}>MITAD</div>
              <div style={{ position: 'absolute', left: '58%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', left: '74%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', right: '8%', bottom: '6px', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
            </>
          ) : (
            <>
              {/* Try line superior */}
              <div style={{ position: 'absolute', top: '5%', left: 0, right: 0, height: '2px', background: '#fff', pointerEvents: 'none' }} />
              {/* 22m superior */}
              <div style={{ position: 'absolute', top: '22%', left: 0, right: 0, height: '1.5px', background: 'rgba(255,255,255,0.65)', borderTop: '1.5px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
              {/* 10m superior */}
              <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, height: '1.5px', background: 'rgba(255,255,255,0.4)', borderTop: '1.5px dashed rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
              {/* Línea de mitad de cancha */}
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '3px', background: '#fff', pointerEvents: 'none' }} />
              {/* 10m inferior */}
              <div style={{ position: 'absolute', top: '60%', left: 0, right: 0, height: '1.5px', background: 'rgba(255,255,255,0.4)', borderTop: '1.5px dashed rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
              {/* 22m inferior */}
              <div style={{ position: 'absolute', top: '78%', left: 0, right: 0, height: '1.5px', background: 'rgba(255,255,255,0.65)', borderTop: '1.5px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
              {/* Try line inferior */}
              <div style={{ position: 'absolute', bottom: '5%', left: 0, right: 0, height: '2px', background: '#fff', pointerEvents: 'none' }} />

              {/* Marcadores de Línea Laterales (Efecto Broadcast Vertical) */}
              <div style={{ position: 'absolute', top: '5.5%', left: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1px', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
              <div style={{ position: 'absolute', top: '22.5%', left: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', top: '40.5%', left: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', top: '50.5%', left: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-primary)', pointerEvents: 'none', fontFamily: 'monospace' }}>MITAD</div>
              <div style={{ position: 'absolute', top: '60.5%', left: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', top: '78.5%', left: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', bottom: '6.5%', left: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1px', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>

              {/* Marcadores Laterales Derechos para simetría */}
              <div style={{ position: 'absolute', top: '5.5%', right: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1px', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
              <div style={{ position: 'absolute', top: '22.5%', right: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', top: '40.5%', right: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', top: '50.5%', right: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-primary)', pointerEvents: 'none', fontFamily: 'monospace' }}>MITAD</div>
              <div style={{ position: 'absolute', top: '60.5%', right: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'monospace' }}>10 METROS</div>
              <div style={{ position: 'absolute', top: '78.5%', right: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', fontFamily: 'monospace' }}>22 METROS</div>
              <div style={{ position: 'absolute', bottom: '6.5%', right: '8px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1px', pointerEvents: 'none', fontFamily: 'monospace' }}>ENSAYO</div>
            </>
          )}

          {/* Posicionamiento de Jugadores (Nodos Tácticos Arrastrables) */}
          {fieldPositions.map(pos => {
            const assignedPlayerId = lineup[pos.id];
            const player = teamPlayers.find(p => p.id === assignedPlayerId);
            const isDraggingThis = draggingId === pos.id;
            
            // Color de departamento (Forwards = Gold/Amber, Backs = Agile Cyan, Reservas = Silver/Gray)
            const isForward = pos.id <= 8;
            const isReserve = pos.name.includes('Reserva');
            const departmentColor = isReserve 
              ? 'rgba(150, 160, 175, 0.85)' 
              : isForward 
                ? 'var(--color-gold)' 
                : 'var(--color-primary)';
            
            return (
              <div 
                key={pos.id} 
                onMouseDown={(e) => handleStartDrag(e, pos.id)}
                onTouchStart={(e) => handleStartDrag(e, pos.id)}
                onMouseUp={() => handleEndDrag(pos.id, pos.name)}
                onTouchEnd={() => handleEndDrag(pos.id, pos.name)}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: isDraggingThis ? 'grabbing' : 'grab',
                  zIndex: isDraggingThis ? 100 : 10,
                  width: '80px',
                  touchAction: 'none', // Evitar scroll de pantalla en celulares al arrastrar
                  transition: isDraggingThis ? 'none' : 'left 0.12s ease-out, top 0.12s ease-out'
                }}
              >
                {/* Círculo de Posición */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: player ? 'var(--bg-surface-solid)' : 'rgba(10, 20, 15, 0.82)',
                  border: isDraggingThis 
                    ? '3px solid var(--color-gold)'
                    : player 
                      ? player.rol === 'Capitán' 
                        ? '2px solid var(--color-gold)' 
                        : `2px solid ${departmentColor}`
                      : `1.5px dashed ${isReserve ? 'rgba(255,255,255,0.2)' : 'rgba(255, 255, 255, 0.45)'}`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  color: isDraggingThis 
                    ? 'var(--color-gold)'
                    : player 
                      ? player.rol === 'Capitán' 
                        ? 'var(--color-gold)' 
                        : departmentColor
                      : 'rgba(255,255,255,0.7)',
                  boxShadow: isDraggingThis 
                    ? '0 0 15px var(--color-gold)'
                    : player 
                      ? `0 0 12px ${isForward ? 'rgba(255, 179, 0, 0.3)' : 'rgba(0, 230, 118, 0.3)'}` 
                      : 'none',
                  scale: isDraggingThis ? '1.18' : '1',
                  transition: 'border 0.2s, box-shadow 0.2s, scale 0.2s, background 0.2s',
                  position: 'relative'
                }}>
                  {/* Abreviación de la posición en español */}
                  {POS_ABREVIATIONS[pos.id] || 'RES'}

                  {/* Pequeña insignia con el número de camiseta */}
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#0a0d14',
                    border: `1.2px solid ${departmentColor}`,
                    color: player ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.55rem',
                    fontWeight: '900',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.6)'
                  }}>
                    {pos.id}
                  </div>
                </div>
                
                {/* Nombre / Apodo Abreviado */}
                <div style={{
                  marginTop: '6px',
                  background: player ? 'rgba(10, 25, 45, 0.92)' : 'rgba(0, 0, 0, 0.75)',
                  padding: '3px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.62rem',
                  fontWeight: '700',
                  width: '80px',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  border: player
                    ? `1px solid ${isForward ? 'rgba(255,179,0,0.3)' : 'rgba(0,230,118,0.3)'}`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  color: player ? '#fff' : 'var(--color-text-muted)',
                  boxShadow: isDraggingThis ? '0 4px 10px rgba(0,0,0,0.6)' : 'none',
                  transition: 'background 0.2s, border 0.2s, color 0.2s'
                }}>
                  {player ? `🛡️ ${player.apodo}` : pos.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- COLUMNA 2: BANCA & ESTRATEGIA --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Módulo: Suplentes de Partido */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', marginBottom: '15px' }}>👥 Banquillo de Suplentes (Banca)</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {SUPLENTES.map(sup => {
              const assignedPlayerId = lineup[sup.id];
              const player = teamPlayers.find(p => p.id === assignedPlayerId);
              
              return (
                <div 
                  key={sup.id}
                  onClick={() => handleSlotClick(sup.id, sup.name)}
                  style={{
                    background: player ? 'rgba(0, 230, 118, 0.03)' : 'var(--bg-dark)',
                    border: player ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ overflow: 'hidden', marginRight: '5px' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>#{sup.id} </span>
                    <strong style={{ color: player ? '#fff' : 'var(--color-text-muted)' }}>
                      {player ? player.apodo : sup.name}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: player ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    {player ? '➔' : '+'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Módulo: Notas de Estrategia */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>📝 Pizarra de Estrategia</h3>
          
          <textarea 
            className="form-textarea"
            rows="8"
            placeholder="Jot down notes here... E.g. Lanzamiento de line-out al primer saltador, presión rápida en patada del Apertura, etc."
            value={tacticalNotes}
            onChange={(e) => setTacticalNotes(e.target.value)}
            style={{ fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'monospace' }}
          />
          
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            💾 Las alineaciones, coordenadas y notas tácticas se guardan automáticamente en tiempo real.
          </p>
        </div>

      </div>
      </div>

      {/* --- FORMULARIO MODAL: SELECCIONAR ORCO --- */}
      {showSelectModal && selectedSlot && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '450px' }}>
            
            <h3 className="neon-text-primary" style={{ marginBottom: '15px', fontFamily: 'Outfit' }}>
              Alinear en Posición #{selectedSlot.id}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
              Selecciona el jugador para ocupar el rol de <strong>{selectedSlot.name}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
              
              {/* Botón Vaciar Posición */}
              <button 
                onClick={() => assignPlayer(null)} 
                className="btn-outline" 
                style={{ justifyContent: 'center', borderColor: 'var(--color-red)', color: 'var(--color-red)' }}
              >
                🧹 Vaciar / Dejar Libre Posición
              </button>

              {teamPlayers.map(p => {
                // Validación para ver si está lesionado o suspendido
                const isUnavailable = p.estado === 'lesionado' || p.estado === 'suspendido';
                const alreadyAligned = isPlayerAligned(p.id);

                return (
                  <button
                    key={p.id}
                    onClick={() => !isUnavailable && assignPlayer(p.id)}
                    disabled={isUnavailable}
                    className="btn-outline"
                    style={{
                      justifyContent: 'space-between',
                      opacity: isUnavailable ? 0.4 : 1,
                      borderColor: alreadyAligned ? 'var(--color-gold)' : 'var(--border-glass)',
                      cursor: isUnavailable ? 'not-allowed' : 'pointer',
                      background: alreadyAligned ? 'rgba(255, 179, 0, 0.02)' : 'transparent'
                    }}
                  >
                    <span>
                      <strong>{p.name}</strong> <span>("{p.apodo}")</span>
                      {alreadyAligned && <span style={{ color: 'var(--color-gold)', fontSize: '0.7rem', marginLeft: '8px' }}>⚠️ Alíneado</span>}
                    </span>
                    
                    <span style={{ fontSize: '0.75rem', color: isUnavailable ? 'var(--color-red)' : 'var(--color-primary)' }}>
                      {p.estado === 'lesionado' && '🩺 Lesionado'}
                      {p.estado === 'suspendido' && '🟥 Suspendido'}
                      {p.estado === 'activo' && `Fuerza: ${p.attributes.force}`}
                    </span>
                  </button>
                );
              })}

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowSelectModal(false)} className="btn-outline">
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Confirmación Genérico */}
      {confirmState && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>⚙️</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '10px' }}>
              Confirmar Acción
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              {confirmState.message}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmState(null)} className="btn-outline">
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(null);
                }}
                className="btn-neon"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CanchaTactica;
