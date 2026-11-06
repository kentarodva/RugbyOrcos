import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ClubContext } from '../../context/ClubContext';
import { useViewFilter } from '../../context/hooks/useFilterByView';

const wrap = (value) => {
  function Wrapper({ children }) {
    return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
  }
  return Wrapper;
};

const CLAN = 'clan-1';
const items = [
  { id: 'jugador-del-clan', teamCategory: 'orcos_masculina_mayor', makgora_team_id: CLAN },
  { id: 'evento-del-clan', teamCategory: 'orcos_masculina_mayor', scopeType: 'makgora_team', scopeValue: { makgora_team_id: CLAN } },
  { id: 'evento-de-otro-clan', teamCategory: 'orcos_masculina_mayor', scopeType: 'makgora_team', scopeValue: { makgora_team_id: 'clan-2' } },
  { id: 'entreno-division', teamCategory: 'orcos_masculina_mayor', scopeType: 'division', scopeValue: {} },
];

describe('useViewFilter', () => {
  it('modo Club con todas las divisiones: muestra todo lo del club', () => {
    const { result } = renderHook(() => useViewFilter(), {
      wrapper: wrap({ viewMode: 'general', divisionView: 'all', makgoraTeamId: CLAN, activeTeam: null }),
    });
    expect(result.current(items)).toHaveLength(4);
  });

  it('modo Mak\'Gora: muestra los jugadores y los eventos del clan elegido, no los de otros', () => {
    const { result } = renderHook(() => useViewFilter(), {
      wrapper: wrap({ viewMode: 'makgora', divisionView: 'all', makgoraTeamId: CLAN, activeTeam: null }),
    });
    expect(result.current(items).map(x => x.id)).toEqual(['jugador-del-clan', 'evento-del-clan']);
  });
});
