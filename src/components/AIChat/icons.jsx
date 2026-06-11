import React from 'react';

const ICONS = {
  ai: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z',
      'M6 12a6 6 0 0 1 12 0v2a6 6 0 0 1-12 0v-2z',
      'M12 18v4',
      'M9 22h6',
      'M17.5 7.5l3-3',
      'M6.5 7.5l-3-3',
      'M21.5 11l2-1',
      'M2.5 11l-2-1'
    ]
  },
  user: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
      'M2 22a10 10 0 0 1 20 0'
    ]
  },
  rugby: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z',
      'M8 4.5a18 18 0 0 0 0 15',
      'M16 4.5a18 18 0 0 1 0 15',
      'M5 8h14',
      'M5 16h14'
    ]
  },
  gear: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
      'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
    ]
  },
  warning: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2L2 22h20L12 2z',
      'M12 9v5',
      'M12 17v1'
    ]
  },
  chart: {
    viewBox: '0 0 24 24',
    paths: [
      'M18 20V10',
      'M12 20V4',
      'M6 20v-6'
    ]
  },
  loading: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2a10 10 0 0 1 10 10'
    ],
    className: 'ai-icon-spin'
  },
  send: {
    viewBox: '0 0 24 24',
    paths: [
      'M22 2L11 13',
      'M22 2l-7 20-4-9-9-4 20-7z'
    ]
  },
  bulb: {
    viewBox: '0 0 24 24',
    paths: [
      'M9 18h6',
      'M10 22h4',
      'M15.09 14c.58-.58 1.18-1.24 1.55-2.04A5 5 0 0 0 12 2a5 5 0 0 0-4.64 6.96c.37.8.97 1.46 1.55 2.04A5 5 0 0 1 10 14v2h4v-2a5 5 0 0 1 1.09-2z'
    ]
  },
  typing: {
    viewBox: '0 0 24 24',
    paths: [
      'M6 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'M12 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'M18 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'
    ]
  },
  trash: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 6h18',
      'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
      'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
      'M10 11v6',
      'M14 11v6'
    ]
  },
  close: {
    viewBox: '0 0 24 24',
    paths: [
      'M18 6L6 18',
      'M6 6l12 12'
    ]
  },
  check: {
    viewBox: '0 0 24 24',
    paths: [
      'M22 11.08V12a10 10 0 1 1-5.93-9.14',
      'M22 4L12 14.01l-3-3'
    ]
  }
};

export function Icon({ name, size = 18, className = '', ...props }) {
  const icon = ICONS[name];
  if (!icon) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={icon.viewBox || '0 0 24 24'}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${icon.className || ''} ${className}`.trim()}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      {...props}
    >
      {icon.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
