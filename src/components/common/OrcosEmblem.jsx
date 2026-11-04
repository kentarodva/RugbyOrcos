import React from 'react';

/**
 * Geometric SVG Brand & Clan Emblems (built on a 256x256 grid, zero <text>, crisp from 16px to 512px)
 */
export function OrcosShieldSVG({ size = 44, className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="orcosShieldGrad" x1="32" y1="16" x2="224" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#142238" />
          <stop offset="55%" stopColor="#0b1322" />
          <stop offset="100%" stopColor="#060b14" />
        </linearGradient>
        <linearGradient id="orcosEmeraldGrad" x1="64" y1="32" x2="192" y2="224" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00e676" />
          <stop offset="100%" stopColor="#00994d" />
        </linearGradient>
        <linearGradient id="orcosGoldGrad" x1="48" y1="24" x2="208" y2="216" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffd54f" />
          <stop offset="100%" stopColor="#ff8f00" />
        </linearGradient>
      </defs>

      {/* Outer Heavy Shield */}
      <path
        d="M128 14L226 50V126C226 184 184 224 128 244C72 224 30 184 30 126V50L128 14Z"
        fill="url(#orcosShieldGrad)"
        stroke="url(#orcosEmeraldGrad)"
        strokeWidth="10"
        strokeLinejoin="round"
      />

      {/* Inner Tactical Bevel */}
      <path
        d="M128 32L208 62V124C208 172 173 206 128 224C83 206 48 172 48 124V62L128 32Z"
        stroke="rgba(255, 179, 0, 0.45)"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Rugby Goalposts / Crown Spikes */}
      <path
        d="M96 58V106M160 58V106M96 86H160"
        stroke="url(#orcosGoldGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Central Rugby Ball (Prolate Spheroid) */}
      <ellipse
        cx="128"
        cy="134"
        rx="32"
        ry="48"
        transform="rotate(-24 128 134)"
        fill="#0b1626"
        stroke="url(#orcosEmeraldGrad)"
        strokeWidth="9"
      />
      {/* Rugby Ball Seam & Laces */}
      <path
        d="M109 92L147 176"
        stroke="url(#orcosGoldGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M114 118L128 112M119 131L133 125M125 144L139 138"
        stroke="#f8fafc"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Iconic Orc Tusks Framing the Base */}
      <path
        d="M64 166C60 132 76 112 90 104C84 128 88 152 106 174L64 166Z"
        fill="url(#orcosGoldGrad)"
      />
      <path
        d="M192 166C196 132 180 112 166 104C172 128 168 152 150 174L192 166Z"
        fill="url(#orcosGoldGrad)"
      />
    </svg>
  );
}

export function ClanEmblemSVG({ name = '', color = '#ffb300', size = 28 }) {
  const n = (name || '').toLowerCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <polygon
        points="32,4 56,16 56,42 32,60 8,42 8,16"
        fill="rgba(15, 22, 36, 0.9)"
        stroke={color}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {n.includes('lobo') || n.includes('frost') ? (
        /* Wolf Fang Crest */
        <path
          d="M20 22L26 14L32 24L38 14L44 22L40 42L32 48L24 42L20 22Z"
          stroke={color}
          strokeWidth="3"
          fill={`${color}25`}
          strokeLinejoin="round"
        />
      ) : n.includes('roca') || n.includes('blackrock') ? (
        /* Mountain Anvil Crest */
        <path
          d="M16 44L26 20L34 32L40 22L48 44H16Z"
          stroke={color}
          strokeWidth="3"
          fill={`${color}25`}
          strokeLinejoin="round"
        />
      ) : n.includes('grito') || n.includes('warsong') ? (
        /* Battle Axe Crest */
        <path
          d="M32 14V50M20 20C26 24 26 32 20 36L32 30L44 36C38 32 38 24 44 20L32 26L20 20Z"
          stroke={color}
          strokeWidth="3"
          fill={`${color}25`}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : n.includes('dragon') || n.includes('fauces') ? (
        /* Dragon Wing / Flame Crest */
        <path
          d="M32 14C40 22 44 30 38 44C34 38 30 38 26 44C20 30 24 22 32 14Z"
          stroke={color}
          strokeWidth="3"
          fill={`${color}25`}
          strokeLinejoin="round"
        />
      ) : (
        /* Default Crossed Blades / Rugby Shield */
        <path
          d="M22 20L42 44M42 20L22 44M32 15L39 24H25L32 15Z"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
