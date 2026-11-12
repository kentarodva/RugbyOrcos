import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { localDateKey } from '../../utils/agendaItems.js';

describe('localDateKey — "hoy" es el día local, no el de UTC (auditoría punto 11)', () => {
  it('Given it is 11:30 p. m. local, Then today is still today', () => {
    expect(localDateKey(new Date(2026, 10, 12, 23, 30))).toBe('2026-11-12');
    expect(localDateKey(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });

  it('no app code builds date keys with toISOString (UTC)', () => {
    const offenders = [];
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== '__tests__') walk(p); return; }
      if (!/\.(js|jsx)$/.test(e.name)) return;
      if (/toISOString\(\)\.(split\('T'\)\[0\]|slice\(0, ?10\))/.test(fs.readFileSync(p, 'utf8'))) offenders.push(p);
    });
    walk('src');
    expect(offenders).toEqual([]);
  });
});
