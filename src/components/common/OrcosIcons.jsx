import React from 'react';

/**
 * ── ICONOGRAFÍA BÉLICA & RUGBY ORCO NEGROS ──
 * Iconos vectoriales personalizados que fusionan el rigor del rugby
 * con la ferocidad y estética bélica de los Orcos (colmillos, runas, acero forjado y cuero).
 * Creados con geometría limpia, escalables desde 16px hasta 256px.
 */

// 1. Balón de Rugby de Guerra con costuras y púas de acero
export function OrcosRugbyBallIcon({ size = 24, color = '#00e676', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Sferoide Prolato / Balón */}
      <ellipse
        cx="32"
        cy="32"
        rx="26"
        ry="17"
        transform="rotate(-40 32 32)"
        fill="#0b1626"
        stroke={color}
        strokeWidth="3.5"
      />
      {/* Costura longitudinal de combate */}
      <path
        d="M17 19L47 45"
        stroke="#ffd740"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Lazos de cuero reforzado */}
      <path
        d="M24 23L29 20M30 28L35 25M36 33L41 30M42 38L47 35"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Colmillos / Púas en los extremos del balón */}
      <path d="M12 15L8 10L15 13Z" fill="#ffd740" />
      <path d="M52 49L56 54L49 51Z" fill="#ffd740" />
    </svg>
  );
}

// 2. Hachas de Guerra cruzadas con los postes en H de Rugby
export function OrcosBattleAxeHPostsIcon({ size = 24, color = '#ffd740', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Postes de Rugby en H */}
      <path
        d="M20 8V56M44 8V56M20 28H44"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Hacha Izquierda cruzada */}
      <path
        d="M12 52L52 12"
        stroke="#00e676"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M44 10C50 14 52 22 47 27C44 24 43 20 40 17L44 10Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Hacha Derecha cruzada */}
      <path
        d="M52 52L12 12"
        stroke="#00e676"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M20 10C14 14 12 22 17 27C20 24 21 20 24 17L20 10Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

// 3. Escudo de Choque / Tackle con Remaches y Runas
export function OrcosTackleShieldIcon({ size = 24, color = '#00e676', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Escudo pesado */}
      <path
        d="M32 6L54 14V30C54 44 44 54 32 58C20 44 10 30 10 14L32 6Z"
        fill="#081420"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Refuerzo cruzado con remaches */}
      <path
        d="M32 14V50M18 24H46"
        stroke="rgba(255, 215, 64, 0.6)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Remaches de hierro */}
      <circle cx="18" cy="24" r="2" fill="#ffd740" />
      <circle cx="46" cy="24" r="2" fill="#ffd740" />
      <circle cx="32" cy="14" r="2" fill="#ffd740" />
      <circle cx="32" cy="50" r="2" fill="#ffd740" />
    </svg>
  );
}

// 4. Cuerno de Victoria de Tercer Tiempo (en vez de vaso genérico)
export function OrcosThirdTimeHornIcon({ size = 24, color = '#ffd740', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Cuerno de beber orco */}
      <path
        d="M16 14C24 16 42 22 46 38C48 48 40 54 28 50C20 46 16 34 16 14Z"
        fill="#0c1a24"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Boca del cuerno con anillo de bronce */}
      <ellipse
        cx="16"
        cy="14"
        rx="8"
        ry="5"
        fill="#ffd740"
      />
      {/* Espuma de victoria / Brindis */}
      <path
        d="M10 12C9 9 13 8 16 9C19 7 23 9 22 12C20 14 12 14 10 12Z"
        fill="#ffffff"
      />
      {/* Anillos de forja en el cuerno */}
      <path
        d="M24 24C28 27 34 29 38 32M28 35C31 38 36 40 40 42"
        stroke="#00e676"
        strokeWidth="2"
      />
    </svg>
  );
}

// 5. Silbato Arbitral Fox40 con runas de autoridad
export function OrcosWhistleIcon({ size = 24, color = '#38bdf8', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Boquilla del silbato */}
      <path
        d="M10 26H28V36H10V26Z"
        fill="#082f49"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Cámara resonadora circular */}
      <circle
        cx="38"
        cy="36"
        r="14"
        fill="#0c1e30"
        stroke={color}
        strokeWidth="3"
      />
      {/* Salida de aire superior */}
      <path
        d="M26 26V20H34V28"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Argolla de colgar */}
      <circle
        cx="54"
        cy="36"
        r="4"
        stroke="#ffd740"
        strokeWidth="2.5"
      />
      {/* Ondas sónicas trino */}
      <path
        d="M28 14C33 12 37 14 39 17"
        stroke="#00e676"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 6. Reloj de Espera / Retraso de Partido en Cancha (con cadenas)
export function OrcosDelayClockIcon({ size = 24, color = '#ffd740', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="24"
        fill="#0a1420"
        stroke={color}
        strokeWidth="3"
      />
      {/* Agujas en pausa */}
      <path
        d="M32 16V32L44 32"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Cadenas laterales de espera */}
      <path
        d="M10 18L6 14M54 18L58 14M32 8V4"
        stroke="#00e676"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 7. Tarjeta Disciplinaria con filo de advertencia
export function OrcosCardIcon({ size = 24, type = 'yellow', className = '', style = {} }) {
  const isRed = type === 'red';
  const cardColor = isRed ? '#ff1744' : '#ffd740';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Tarjeta rectangular inclinada con borde filoso */}
      <rect
        x="18"
        y="10"
        width="28"
        height="44"
        rx="4"
        transform="rotate(8 32 32)"
        fill={cardColor}
        stroke="#ffffff"
        strokeWidth="2.5"
      />
      {/* Runa orca interior */}
      <path
        d="M30 22L36 32L30 42M34 26H26M34 38H26"
        stroke="#04070a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 8. Estandarte de Guerra / Horda
export function OrcosWarBannerIcon({ size = 24, color = '#00e676', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Asta de guerra con punta de lanza */}
      <path
        d="M14 6V58"
        stroke="#ffd740"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M14 4L19 12H9L14 4Z" fill="#ffd740" />
      {/* Tela de estandarte orco rasgado */}
      <path
        d="M17 12H48L42 24L52 36H17V12Z"
        fill="#0b2214"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Garra / Emblema interior */}
      <path
        d="M26 20L34 28M34 20L26 28"
        stroke="#ffd740"
        strokeWidth="2.5"
      />
    </svg>
  );
}
