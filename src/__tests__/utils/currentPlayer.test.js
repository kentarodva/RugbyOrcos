import { describe, it, expect } from 'vitest';
import { findOwnPlayer } from '../../utils/currentPlayer.js';

const players = [
  { id: 'p1', name: 'Juan Pérez', userId: null, createdBy: 'u-president', contacto: { email: '' } },
  { id: 'p2', name: 'Ana Gómez', userId: 'u-ana', contacto: { email: 'ana@orcos.club' } },
  { id: 'p3', name: 'Luis Díaz', userId: null, email: 'Luis@Orcos.club' },
  { id: 'p4', name: 'Juan Pérez', userId: null },
];

describe('findOwnPlayer — la ficha de quien mira', () => {
  it('Given a player account, Then its own ficha is found by account', () => {
    expect(findOwnPlayer(players, { id: 'u-ana', email: 'otro@x.com' })?.id).toBe('p2');
  });

  it('Given the presidente created many fichas, Then none of them is shown as his own', () => {
    expect(findOwnPlayer(players, { id: 'u-president', email: 'presi@orcos.club' })).toBeNull();
  });

  it('falls back to the exact email, ignoring case and spaces', () => {
    expect(findOwnPlayer(players, { id: 'u-luis', email: ' luis@orcos.CLUB ' })?.id).toBe('p3');
  });

  it('never matches by name (two players can share a name)', () => {
    expect(findOwnPlayer(players, { id: 'u-x', email: 'juan@x.com', display_name: 'Juan Pérez' })).toBeNull();
  });

  it('ignores deleted fichas and empty input', () => {
    expect(findOwnPlayer([{ id: 'd', userId: 'u1', deletedAt: '2026-01-01' }], { id: 'u1' })).toBeNull();
    expect(findOwnPlayer(null, { id: 'u1' })).toBeNull();
    expect(findOwnPlayer(players, null)).toBeNull();
  });
});
