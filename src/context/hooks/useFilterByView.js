import { useCallback, useContext } from 'react';
import { ClubContext } from '../ClubContext';

export function useFilterByView() {
  const { activeTeam, activeTeamId, divisionView, viewMode, makgoraTeamId } = useContext(ClubContext);

  return useCallback((items) => {
    if (!items) return [];

    const teamIdMatch = (x) => {
      if (activeTeamId && x.teamId && x.teamId === activeTeamId) return true;
      if (activeTeam && x.teamCategory === activeTeam) return true;
      return false;
    };

    const divisionMatch = (x, division) => {
      return x.teamCategory === `orcos_${division}`;
    };

    const clubMatch = (x) => {
      return x.teamCategory?.startsWith('orcos');
    };

    if (viewMode === 'general' && divisionView === 'all') {
      return items.filter(clubMatch);
    }
    if (viewMode === 'general') {
      return items.filter(x => divisionMatch(x, divisionView));
    }
    if (viewMode === 'makgora' && makgoraTeamId) {
      const team = items.filter(x => x.makgora_team_id === makgoraTeamId);
      if (divisionView !== 'all') {
        return team.filter(x => divisionMatch(x, divisionView));
      }
      return team.filter(clubMatch);
    }
    return items.filter(teamIdMatch);
  }, [activeTeam, activeTeamId, divisionView, viewMode, makgoraTeamId]);
}
