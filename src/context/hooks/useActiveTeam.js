import { useState } from 'react';
import { EQUIPOS } from '../constants';

export function useActiveTeam(initialValue, savePreferences) {
  const [activeTeam, setActiveTeamRaw] = useState(() => {
    return initialValue || EQUIPOS.ORCOS_MASCULINA_MAYOR;
  });

  const setActiveTeam = (team) => {
    setActiveTeamRaw(team);
    savePreferences?.({ active_team: team });
  };

  return { activeTeam, setActiveTeam };
}
