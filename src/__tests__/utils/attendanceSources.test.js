import { describe, it, expect } from 'vitest';
import { attendanceOptions, fixtureIdOf, rsvpFromAvailabilities, rsvpGroups } from '../../utils/attendanceSources.js';

describe('attendanceSources — pasar lista con lo que avisaron (auditoría punto 8)', () => {
  it('Given trainings and a scheduled match, Then both can be picked when taking attendance, in date order', () => {
    const opts = attendanceOptions(
      [{ id: 'e1', date: '2026-11-20', time: '19:00', title: 'Entreno', type: 'entrenamiento' }],
      [{ id: 'f1', date: '2026-11-15', time: '10:00', opponent: 'Halcones', availabilities: { p1: 'not_going' } }]
    );
    expect(opts.map(o => o.id)).toEqual(['fixture:f1', 'e1']);
    expect(opts[0]).toMatchObject({ kind: 'fixture', type: 'partido', title: 'Partido vs Halcones' });
    expect(fixtureIdOf(opts[0].id)).toBe('f1');
    expect(fixtureIdOf('e1')).toBeNull();
  });

  it('match availability uses the same states as training confirmations and ignores garbage', () => {
    expect(rsvpFromAvailabilities({ p1: 'going', p2: 'not_going', p3: 'banana' })).toEqual({ p1: 'going', p2: 'not_going' });
    expect(rsvpFromAvailabilities(null)).toEqual({});
  });

  it('groups players by what they said, including who did not answer', () => {
    const players = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
    const g = rsvpGroups(players, { p1: 'not_going', p2: 'maybe' });
    expect(g.not_going.map(p => p.id)).toEqual(['p1']);
    expect(g.maybe.map(p => p.id)).toEqual(['p2']);
    expect(g.silent.map(p => p.id)).toEqual(['p3']);
  });
});
