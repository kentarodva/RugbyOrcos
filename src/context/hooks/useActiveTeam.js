import { useState, useEffect } from 'react';
import { EQUIPOS } from '../constants';

export function useActiveTeam() {
  const [activeTeam, setActiveTeam] = useState(() => {
    return localStorage.getItem('orcos_active_team') || EQUIPOS.ORCOS_MASCULINA_MAYOR;
  });

  useEffect(() => {
    localStorage.setItem('orcos_active_team', activeTeam);
  }, [activeTeam]);

  return { activeTeam, setActiveTeam };
}
