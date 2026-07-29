import { useContext, useMemo, useCallback } from 'react';
import { ClubContext } from '../ClubContext';

/**
 * Filtro canónico de jugadores por equipo/división/makgora.
 * Usa la lógica UNA sola vez — todos los módulos consumen esto.
 *
 * Uso básico (recomendado):
 *   const teamPlayers = useTeamPlayers();
 *
 * Uso avanzado (filtrar arrays custom):
 *   const filter = useViewFilter();
 *   const filtered = filter(myCustomArray);
 */

export function useTeamPlayers() {
  const { players, activeTeam, divisionView, viewMode, makgoraTeamId } = useContext(ClubContext);

  return useMemo(() => {
    if (!players?.length) return [];

    if (viewMode === 'general' && divisionView === 'all') {
      return players.filter(p => p.teamCategory?.startsWith('orcos'));
    }
    if (viewMode === 'general') {
      return players.filter(p => p.teamCategory === `orcos_${divisionView}`);
    }
    if (viewMode === 'makgora' && makgoraTeamId) {
      let filtered = players.filter(p => p.makgora_team_id === makgoraTeamId);
      if (divisionView !== 'all') {
        filtered = filtered.filter(p => p.teamCategory === `orcos_${divisionView}`);
      }
      return filtered;
    }
    return players.filter(p => p.teamCategory === activeTeam);
  }, [players, viewMode, divisionView, makgoraTeamId, activeTeam]);
}

export function useViewFilter() {
  const { activeTeam, divisionView, viewMode, makgoraTeamId } = useContext(ClubContext);

  const teamMatch = (x) => x.teamCategory === activeTeam;
  const divisionMatch = (x, division) => x.teamCategory === `orcos_${division}`;
  const clubMatch = (x) => x.teamCategory?.startsWith('orcos');

  return useCallback((items) => {
    if (!items) return [];

    if (viewMode === 'general' && divisionView === 'all') {
      return items.filter(clubMatch);
    }
    if (viewMode === 'general') {
      return items.filter(x => divisionMatch(x, divisionView));
    }
    if (viewMode === 'makgora' && makgoraTeamId) {
      let filtered = items.filter(x => x.makgora_team_id === makgoraTeamId);
      if (divisionView !== 'all') {
        filtered = filtered.filter(x => divisionMatch(x, divisionView));
      }
      return filtered.filter(clubMatch);
    }
    return items.filter(teamMatch);
  }, [activeTeam, divisionView, viewMode, makgoraTeamId]);
}

export { useViewFilter as useFilterByView };
