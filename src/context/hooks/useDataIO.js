import { useCallback } from 'react';

export function useDataIO(players, schedule, championships, finances, inventory, fixtures, rivals, futureFixtures, activeTeam, setPlayers, setSchedule, setChampionships, setFinances, setInventory, setFixtures, setActiveTeam, sendLocalNotification, normalizePlayer) {
  const exportData = useCallback(() => {
    const dataStr = JSON.stringify({ players, schedule, championships, finances, inventory, fixtures, rivals, futureFixtures, orcos_active_team: activeTeam }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `rugby_orcos_database_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  }, [players, schedule, championships, finances, inventory, fixtures, rivals, futureFixtures, activeTeam]);

  const importData = useCallback((jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed || typeof parsed !== 'object') return false;
      const requiredKeys = ['players', 'schedule', 'championships', 'finances', 'inventory'];
      const hasAnyKey = requiredKeys.some(k => Array.isArray(parsed[k]));
      if (!hasAnyKey) return false;
      if (parsed.players && Array.isArray(parsed.players)) {
        setPlayers(parsed.players.map(normalizePlayer));
      }
      if (parsed.schedule && Array.isArray(parsed.schedule)) setSchedule(parsed.schedule);
      if (parsed.championships && Array.isArray(parsed.championships)) setChampionships(parsed.championships);
      if (parsed.finances && Array.isArray(parsed.finances)) setFinances(parsed.finances);
      if (parsed.inventory && Array.isArray(parsed.inventory)) setInventory(parsed.inventory);
      if (parsed.fixtures && Array.isArray(parsed.fixtures)) setFixtures(parsed.fixtures);
      if (parsed.orcos_active_team) setActiveTeam(parsed.orcos_active_team);
      sendLocalNotification('Base de Datos Restaurada', 'Los datos del club han sido importados con exito.');
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[IMPORT] ERROR:', err.message);
      return false;
    }
  }, [setPlayers, setSchedule, setChampionships, setFinances, setInventory, setFixtures, setActiveTeam, sendLocalNotification, normalizePlayer]);

  return { exportData, importData };
}
