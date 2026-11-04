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

export function useTeamPlayers({ includeDeleted = false } = {}) {
  const { players, activeTeam, divisionView, viewMode, makgoraTeamId } = useContext(ClubContext);

  return useMemo(() => {
    if (!players?.length) return [];
    const base = includeDeleted ? players : players.filter(p => !p.deleted_at);

    if (viewMode === 'general' && divisionView === 'all') {
      return base.filter(p => p.teamCategory?.startsWith('orcos'));
    }
    if (viewMode === 'general') {
      return base.filter(p => p.teamCategory === `orcos_${divisionView}`);
    }
    if (viewMode === 'makgora' && makgoraTeamId) {
      let filtered = base.filter(p => p.makgora_team_id === makgoraTeamId);
      if (divisionView !== 'all') {
        filtered = filtered.filter(p => p.teamCategory === `orcos_${divisionView}`);
      }
      return filtered;
    }
    return base.filter(p => p.teamCategory === activeTeam);
  }, [players, viewMode, divisionView, makgoraTeamId, activeTeam, includeDeleted]);
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
