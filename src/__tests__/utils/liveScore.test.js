import { describe, it, expect } from 'vitest';
import { liveScore } from '../../utils/liveScore.js';

describe('liveScore — mismo marcador en pantalla y en la BD (punto 4)', () => {
  it('counts orcos scoring events and rival points entered by hand', () => {
    expect(liveScore([
      { event_type: 'try', team: 'orcos' },
      { event_type: 'conversion', team: 'orcos' },
      { event_type: 'penalty', team: 'orcos' },
      { event_type: 'score_adjust', team: 'opponent', details: { points: 7 } },
      { event_type: 'try', team: 'opponent' },
      { event_type: 'yellow_card', team: 'orcos' },
    ])).toEqual({ orcos: 10, opponent: 12 });
  });

  it('a score_adjust never adds points to the orcos and garbage counts as 0', () => {
    expect(liveScore([{ event_type: 'score_adjust', team: 'orcos', details: { points: 5 } },
      { event_type: 'score_adjust', team: 'opponent', details: { points: 'x' } }])).toEqual({ orcos: 0, opponent: 0 });
  });
});
