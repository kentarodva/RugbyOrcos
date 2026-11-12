import { describe, it, expect } from 'vitest';
import { membershipStatus } from '../../utils/membership.js';

const withTotals = (due, paid) => ({ memberships: { due, paid } });

describe('membershipStatus — una sola regla de cuotas (auditoría punto 10)', () => {
  it('Given no monthly charges yet, Then the player owes nothing', () => {
    expect(membershipStatus({}, 10000)).toMatchObject({ key: 'aldia', owed: 0, monthsOwed: 0 });
  });

  it('Given he paid one month long ago and two charges exist, Then he is moroso for one month', () => {
    expect(membershipStatus(withTotals(20000, 10000), 10000)).toMatchObject({ key: 'moroso', owed: 10000, monthsOwed: 1 });
  });

  it('paying more than charged leaves credit and stays al día', () => {
    expect(membershipStatus(withTotals(10000, 15000), 10000)).toMatchObject({ key: 'aldia', credit: 5000, progress: 100 });
  });

  it('small remainders are "casi", bigger ones "parcial"', () => {
    expect(membershipStatus(withTotals(10000, 8500), 10000).key).toBe('casi');
    expect(membershipStatus(withTotals(10000, 4000), 10000).key).toBe('parcial');
  });

  it('counts months owed with the configured fee', () => {
    expect(membershipStatus(withTotals(60000, 0), 20000).monthsOwed).toBe(3);
  });
});
