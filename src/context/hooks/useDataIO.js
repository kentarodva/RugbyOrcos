import { useCallback } from 'react';

export function useDataIO(
  players, schedule, championships, finances, inventory, fixtures, rivals, futureFixtures, activeTeam,
  setPlayers, setSchedule, setChampionships, setFinances, setInventory, setFixtures, setActiveTeam,
  sendLocalNotification, normalizePlayer,
  { setRivals, setFutureFixtures, pushPlayerToSupabase, pushEntityToSupabase, loans = [], setLoans } = {}
) {
  const exportData = useCallback(() => {
    let customTactics = [];
    try {
      const stored = localStorage.getItem('orcos_custom_tactics');
      if (stored) customTactics = JSON.parse(stored);
    } catch {
      customTactics = [];
    }

    const payload = {
      version: '5.0',
      club: 'Rugby Orcos Negros Club',
      exportedAt: new Date().toISOString(),
      orcos_active_team: activeTeam,
      players: players || [],
      schedule: schedule || [],
      championships: championships || [],
      finances: finances || [],
      inventory: inventory || [],
      fixtures: fixtures || [],
      rivals: rivals || [],
      futureFixtures: futureFixtures || [],
      loans: loans || [],
      customTactics: customTactics || [],
    };

    const dataStr = JSON.stringify(payload, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `rugby_orcos_database_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  }, [players, schedule, championships, finances, inventory, fixtures, rivals, futureFixtures, activeTeam, loans]);

  const importData = useCallback((jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed || typeof parsed !== 'object') return false;
      const supportedKeys = ['players', 'schedule', 'championships', 'finances', 'inventory', 'fixtures', 'rivals', 'futureFixtures', 'loans', 'customTactics'];
      const hasAnyKey = supportedKeys.some(k => Array.isArray(parsed[k])) || Boolean(parsed.version);
      if (!hasAnyKey) return false;

      if (parsed.players && Array.isArray(parsed.players)) {
        const normalized = parsed.players.map(normalizePlayer);
        setPlayers(normalized);
        if (pushPlayerToSupabase) {
          normalized.forEach(p => pushPlayerToSupabase(p));
        }
      }
      if (parsed.schedule && Array.isArray(parsed.schedule)) {
        setSchedule(parsed.schedule);
        if (pushEntityToSupabase) parsed.schedule.forEach(r => pushEntityToSupabase('schedule', r));
      }
      if (parsed.championships && Array.isArray(parsed.championships)) {
        setChampionships(parsed.championships);
        if (pushEntityToSupabase) parsed.championships.forEach(r => pushEntityToSupabase('championships', r));
      }
      if (parsed.finances && Array.isArray(parsed.finances)) {
        setFinances(parsed.finances);
        if (pushEntityToSupabase) parsed.finances.forEach(r => pushEntityToSupabase('finances', r));
      }
      if (parsed.inventory && Array.isArray(parsed.inventory)) {
        setInventory(parsed.inventory);
        if (pushEntityToSupabase) parsed.inventory.forEach(r => pushEntityToSupabase('inventory', r));
      }
      if (parsed.fixtures && Array.isArray(parsed.fixtures)) {
        setFixtures(parsed.fixtures);
        if (pushEntityToSupabase) parsed.fixtures.forEach(r => pushEntityToSupabase('fixtures', r));
      }
      if (parsed.rivals && Array.isArray(parsed.rivals)) {
        if (setRivals) setRivals(parsed.rivals);
        if (pushEntityToSupabase) parsed.rivals.forEach(r => pushEntityToSupabase('rivals', r));
      }
      if (parsed.futureFixtures && Array.isArray(parsed.futureFixtures)) {
        if (setFutureFixtures) setFutureFixtures(parsed.futureFixtures);
        if (pushEntityToSupabase) parsed.futureFixtures.forEach(r => pushEntityToSupabase('futureFixtures', r));
      }
      if (parsed.loans && Array.isArray(parsed.loans)) {
        if (setLoans) setLoans(parsed.loans);
        if (pushEntityToSupabase) parsed.loans.forEach(r => pushEntityToSupabase('loans', r));
      }
      if (parsed.customTactics && Array.isArray(parsed.customTactics)) {
        try {
          localStorage.setItem('orcos_custom_tactics', JSON.stringify(parsed.customTactics));
        } catch { /* ignorar si falla localStorage */ }
        if (pushEntityToSupabase) parsed.customTactics.forEach(r => pushEntityToSupabase('custom_tactics', r));
      }
      if (parsed.orcos_active_team) setActiveTeam(parsed.orcos_active_team);

      sendLocalNotification('Base de Datos Restaurada', 'Los datos integrales del club han sido importados con éxito.');
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[IMPORT] ERROR:', err.message);
      return false;
    }
  }, [setPlayers, setSchedule, setChampionships, setFinances, setInventory, setFixtures, setActiveTeam, sendLocalNotification, normalizePlayer, setRivals, setFutureFixtures, pushPlayerToSupabase, pushEntityToSupabase, setLoans]);

  return { exportData, importData };
}
