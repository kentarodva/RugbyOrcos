import { describe, it, expect, vi } from 'vitest';

vi.mock('../../supabaseClient.js', () => ({ supabase: { storage: { from: vi.fn() } } }));

import { crestInitials, findRivalForFixture, resolveCrestUrl, validateCrestFile, aggregateClanRecords, CREST_MAX_BYTES } from '../../utils/crests';

const rivals = [
  { id: 'r1', name: 'Guepardos Rugby Club', crestUrl: 'https://x/crests/rivals/r1.png' },
  { id: 'r2', name: 'Caimanes de Montería' },
];

describe('crestInitials', () => {
  it('ignora palabras de relleno', () => {
    expect(crestInitials('Guepardos Rugby Club')).toBe('GU');
    expect(crestInitials('Caimanes de Montería')).toBe('CM');
    expect(crestInitials('')).toBe('?');
  });
});

describe('findRivalForFixture', () => {
  it('prioriza rivalId', () => {
    expect(findRivalForFixture({ rivalId: 'r2', opponent: 'Guepardos Rugby Club' }, rivals).id).toBe('r2');
  });
  it('partidos viejos sin rivalId: nombre exacto sin tildes ni mayúsculas', () => {
    expect(findRivalForFixture({ opponent: 'caimanes de monteria' }, rivals).id).toBe('r2');
  });
  it('no empareja por nombre parcial', () => {
    expect(findRivalForFixture({ opponent: 'Caimanes' }, rivals)).toBeNull();
  });
});

describe('resolveCrestUrl', () => {
  it('usa el escudo guardado', () => {
    expect(resolveCrestUrl(rivals[0])).toBe('https://x/crests/rivals/r1.png');
  });
  it('Guepardos sin escudo subido conserva el escudo incluido en la app', () => {
    expect(resolveCrestUrl({ name: 'Guepardo' })).toBe('/assets/guepardos_logo.png');
  });
  it('un rival sin escudo devuelve null (iniciales), nunca el de Orcos', () => {
    expect(resolveCrestUrl(rivals[1])).toBeNull();
    expect(resolveCrestUrl(null)).toBeNull();
  });
});

describe('validateCrestFile', () => {
  it('acepta PNG pequeño y rechaza formatos o tamaños inválidos', () => {
    expect(validateCrestFile({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validateCrestFile({ type: 'application/pdf', size: 1000 })).toMatch(/Formato/);
    expect(validateCrestFile({ type: 'image/png', size: CREST_MAX_BYTES + 1 })).toMatch(/2 MB/);
    expect(validateCrestFile(null)).toMatch(/archivo/);
  });
});

describe('aggregateClanRecords', () => {
  it('suma el historial de todos los torneos por clan', () => {
    const rec = aggregateClanRecords([
      { team_id: 't1', won: 3, drawn: 1, lost: 1, tries_for: 12, played: 5 },
      { team_id: 't1', won: 2, drawn: 0, lost: 2, tries_for: 7, played: 4 },
      { team_id: 't2', won: 0, drawn: 0, lost: 4, tries_for: 2, played: 4 },
    ]);
    expect(rec.t1).toEqual({ won: 5, drawn: 1, lost: 3, triesFor: 19, played: 9 });
    expect(rec.t2.lost).toBe(4);
  });
});
