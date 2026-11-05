import React from 'react';
import { useAuth } from './AuthContext.jsx';
import { supabase } from '../supabaseClient.js';
import { loadSettings } from '../data/clubSettings';
import { wrapCatch } from '../utils/errorHandler';
import { registerWebPush } from '../utils/pushNotifications';
import { CLUBS, CLUBS_LABELS, SYSTEM_ROLES, SYSTEM_ROLES_LABELS, RPG_ROLES, SUPER_ROLES, DIVISIONES, DIVISIONES_LABELS, EQUIPOS, EQUIPOS_LABELS, MAKGORA_TEAMS, getRpgRole, formatTeamCategory } from './constants';
import {
  usePermissions,
  useClubs,
  useActiveTeam,
  useNotifications,
  useSync, useSyncPush,
  usePlayers,
  useSchedule,
  useChampionships,
  useFinances,
  useInventory,
  useFixtures,
  useRivals,
  useFutureFixtures,
  useLiveMatch,
  useInvitations,
  useLoans,
  useDataIO,
  useFundraising,
} from './hooks';

export {
  CLUBS, CLUBS_LABELS, SYSTEM_ROLES, SYSTEM_ROLES_LABELS,
  RPG_ROLES, SUPER_ROLES, DIVISIONES, DIVISIONES_LABELS,
  EQUIPOS, EQUIPOS_LABELS, MAKGORA_TEAMS, getRpgRole, formatTeamCategory
};

export const ClubContext = React.createContext();

export const ClubProvider = ({ children }) => {
  const { user, profile } = useAuth();

  React.useEffect(() => {
    if (user?.id) loadSettings();
  }, [user?.id]);

  React.useEffect(() => {
    if (user?.id && profile?.system_role === 'jugador') {
      const timer = setTimeout(() => registerWebPush(), 3000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, profile?.system_role]);

  // Limpiar estado cuando el usuario cierra sesión
  React.useEffect(() => {
    if (!user?.id) {
      setPlayers?.([]);
      setSchedule?.([]);
      setChampionships([]);
      setFinances?.([]);
      setInventory?.([]);
      setFixtures([]);
      setRivals([]);
      setFutureFixtures([]);
      setMatchInvitations([]);
      setLoans([]);
      setMakgoraTeams([]);
    }
  }, [user?.id]);

  const { currentUser, userRole, userTier, hasPermission, isSuperRole } = usePermissions(user, profile);
  const { dynamicClubs, getAllClubs, getAllClubsLabels, addClub, deleteClub } = useClubs(isSuperRole, user);
  const { sendLocalNotification, scheduleReminder } = useNotifications();

  const prefs = profile?.preferences || {};

  // View mode: 'general' | 'makgora'
  const [viewMode, setViewMode] = React.useState(() => {
    return prefs.view_mode || 'general';
  });
  const [makgoraTeamId, setMakgoraTeamId] = React.useState(() => {
    return prefs.makgora_team_id ? String(prefs.makgora_team_id) : null;
  });
  const [makgoraTeams, setMakgoraTeams] = React.useState([]);
  const [teams, setTeams] = React.useState([]);

  // Division view: 'all' | specific division string (e.g. 'masculina_mayor')
  const [divisionView, setDivisionView] = React.useState(() => {
    return prefs.division_view || 'all';
  });

  const savePreferences = React.useCallback(async (updates) => {
    if (!user?.id) return;
    const merged = { ...(profile?.preferences || {}), ...updates };
    try {
      await supabase.from('user_profiles').update({ preferences: merged }).eq('user_id', user.id);
    } catch { /* silencioso — preferencia no critica */ }
  }, [user?.id, profile?.preferences]);

  React.useEffect(() => {
    savePreferences({ view_mode: viewMode });
  }, [viewMode]);

  React.useEffect(() => {
    savePreferences({ division_view: divisionView });
  }, [divisionView]);

  React.useEffect(() => {
    savePreferences({ makgora_team_id: makgoraTeamId || null });
  }, [makgoraTeamId]);

  const { activeTeam, setActiveTeam } = useActiveTeam(prefs.active_team || profile?.club_scope || 'orcos_masculina_mayor', savePreferences);

  // Sincronizar activeTeam cuando cambia el usuario o el club_scope del perfil
  React.useEffect(() => {
    if (user?.id) {
      const team = prefs.active_team || profile?.club_scope || 'orcos_masculina_mayor';
      if (team !== activeTeam) {
        setActiveTeam(team);
      }
    }
  }, [user?.id, profile?.club_scope]);

  const activeTeamId = React.useMemo(() => {
    if (!activeTeam || !teams?.length) return null;
    return teams.find(t => t.category === activeTeam)?.id || null;
  }, [activeTeam, teams]);

  const [clubConfig, setClubConfig] = React.useState({ mensualidad_base: 10000 });

  React.useEffect(() => {
    supabase
      .from('club_config')
      .select('key, value')
      .eq(activeTeamId ? 'team_id' : 'team_category', activeTeamId || activeTeam)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const cfg = {};
          data.forEach(row => { cfg[row.key] = row.value; });
          setClubConfig(prev => ({ ...prev, ...cfg }));
        }
      })
      .catch(wrapCatch('ClubContext.loadClubConfig', { silent: true }));
  }, [activeTeam, activeTeamId]);

  const mensualidadBase = Number(clubConfig.mensualidad_base) || 10000;

  const refreshMakgoraTeams = React.useCallback(() => {
    supabase
      .from('makgora_teams')
      .select('id, name, rpg_name, emblem_color, is_external, is_active, sort_order')
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMakgoraTeams(data);
          if (!makgoraTeamId) {
            setMakgoraTeamId(String(data[0].id));
          }
        }
      })
      .catch(wrapCatch('ClubContext.fetchMakgoraTeams', { notifyUser: true }));
  }, [makgoraTeamId]);

  // Fetch makgora_teams from Supabase
  React.useEffect(() => {
    refreshMakgoraTeams();
  }, []);

  // Fetch teams from Supabase
  React.useEffect(() => {
    supabase
      .from('teams')
      .select('*')
      .order('division')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTeams(data);
        }
      })
      .catch(wrapCatch('ClubContext.fetchTeams', { notifyUser: true }));
  }, []);

  const { pushPlayerToSupabase, pushEntityToSupabase } = useSyncPush(user);
  const playerHooks = usePlayers(activeTeam, sendLocalNotification, pushPlayerToSupabase, pushEntityToSupabase, user, mensualidadBase);
  const { players, setPlayers, normalizePlayer } = playerHooks;

  const scheduleHooks = useSchedule(activeTeam, sendLocalNotification, scheduleReminder, pushEntityToSupabase, user);
  const { schedule, setSchedule } = scheduleHooks;

  const championshipHooks = useChampionships(activeTeam, pushEntityToSupabase, user);
  const { championships, setChampionships } = championshipHooks;

  const financeHooks = useFinances(activeTeam, pushEntityToSupabase, sendLocalNotification, user);
  const { finances, setFinances } = financeHooks;

  const inventoryHooks = useInventory(pushEntityToSupabase, user);
  const { inventory, setInventory } = inventoryHooks;

  const fixtureHooks = useFixtures(activeTeam, sendLocalNotification, pushEntityToSupabase, user);
  const { fixtures, setFixtures } = fixtureHooks;

  const rivalHooks = useRivals(pushEntityToSupabase, user);
  const { rivals, setRivals } = rivalHooks;

  const futureFixtureHooks = useFutureFixtures(activeTeam, sendLocalNotification, pushEntityToSupabase, user);
  const { futureFixtures, setFutureFixtures } = futureFixtureHooks;

  const liveMatchHooks = useLiveMatch(user);

  const invitationHooks = useInvitations(user, userTier, profile);
  const { matchInvitations, setMatchInvitations } = invitationHooks;

  const loanHooks = useLoans(user);
  const { loans, setLoans } = loanHooks;

  const { syncStatus } = useSync(
    user, userTier, profile,
    setPlayers, setSchedule, setChampionships, setFinances,
    setInventory, setFixtures, setRivals, setFutureFixtures,
    setMatchInvitations, setLoans,
    mensualidadBase
  );

  const fundraisingHooks = useFundraising(activeTeam, user);

  React.useEffect(() => {
    fundraisingHooks.loadAllPayments();
  }, []);

  const dataIOHooks = useDataIO(
    players, schedule, championships, finances, inventory, fixtures, rivals, futureFixtures,
    activeTeam, setPlayers, setSchedule, setChampionships, setFinances, setInventory, setFixtures, setActiveTeam,
    sendLocalNotification, normalizePlayer,
    { setRivals, setFutureFixtures, pushPlayerToSupabase, pushEntityToSupabase, loans, setLoans }
  );

  const handleMembershipPayment = async (playerId, amount) => {
    const { playerName, date, paymentId } = await playerHooks.recordMembershipPayment(playerId, amount);
    financeHooks.addMembershipPayment(playerName, amount, date, paymentId);
  };

  const handleDeleteFinanceRecord = React.useCallback(async (recordId) => {
    const record = finances.find(f => f.id === recordId);
    if (record?.category === 'mensualidad') {
      const pidMatch = record.desc.match(/\[pid:(.+?)\]/);
      if (pidMatch) {
        const paymentId = pidMatch[1];
        const deletedInfo = await fundraisingHooks.deletePayment(paymentId);
        if (deletedInfo) {
          playerHooks.reverseMembershipPayment(deletedInfo.player_id, deletedInfo.amount);
        }
      }
    }
    financeHooks.deleteFinanceRecord(recordId);
  }, [finances, fundraisingHooks, playerHooks, financeHooks]);

  const handleDeleteMembershipPayment = React.useCallback(async (paymentId) => {
    const deletedInfo = await fundraisingHooks.deletePayment(paymentId);
    if (!deletedInfo) return null;
    playerHooks.reverseMembershipPayment(deletedInfo.player_id, deletedInfo.amount);
    const financeRecord = finances.find(f => f.desc?.includes(`[pid:${paymentId}]`));
    if (financeRecord) {
      financeHooks.deleteFinanceRecord(financeRecord.id);
    }
    return deletedInfo;
  }, [finances, fundraisingHooks, playerHooks, financeHooks]);

  const handleMonthlyCharge = React.useCallback(async (playerIds) => {
    const count = await playerHooks.applyMonthlyCharge(playerIds, mensualidadBase);
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('club_config').upsert({
      team_category: activeTeam, key: 'last_monthly_charge', value: today,
    }, { onConflict: 'team_category, key' });
    setClubConfig(prev => ({ ...prev, last_monthly_charge: today }));
    return count;
  }, [playerHooks, mensualidadBase, activeTeam, setClubConfig]);

  const resetStaffPassword = async (userId, newPassword) => {
    const { supabase } = await import('../supabaseClient.js');
    const { data, error } = await supabase.rpc('admin_reset_staff_password', {
      p_user_id: userId,
      p_new_password: newPassword,
    });

    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { data };
  };

  return (
    <ClubContext.Provider value={{
      activeTeam, setActiveTeam, activeTeamId,
      players, setPlayers, addPlayer: playerHooks.addPlayer, updatePlayer: playerHooks.updatePlayer, deletePlayer: playerHooks.deletePlayer,
      recordAttendance: playerHooks.recordAttendance, recordMatchInfractions: playerHooks.recordMatchInfractions, redeemPenalty: playerHooks.redeemPenalty,
      recordPhysicalTest: playerHooks.recordPhysicalTest, recordInjury: playerHooks.recordInjury, updateInjuryPhase: playerHooks.updateInjuryPhase,
      recordMatchStats: playerHooks.recordMatchStats, recordWellness: playerHooks.recordWellness, runHiaProtocol: playerHooks.runHiaProtocol,
      inventory, addInventoryItem: inventoryHooks.addInventoryItem, updateInventoryItem: inventoryHooks.updateInventoryItem, updateClothingSizes: playerHooks.updateClothingSizes,
      schedule, addScheduleEvent: scheduleHooks.addScheduleEvent, updateScheduleEvent: scheduleHooks.updateScheduleEvent, deleteScheduleEvent: scheduleHooks.deleteScheduleEvent, generateWhatsAppMessage: scheduleHooks.generateWhatsAppMessage,
      championships, addChampionship: championshipHooks.addChampionship,
      finances, addFinanceRecord: financeHooks.addFinanceRecord, deleteFinanceRecord: handleDeleteFinanceRecord,
      exportData: dataIOHooks.exportData, importData: dataIOHooks.importData,
      fixtures, addFixture: fixtureHooks.addFixture, updateFixture: fixtureHooks.updateFixture, deleteFixture: fixtureHooks.deleteFixture,
      updateGymStats: playerHooks.updateGymStats, logWorkout: playerHooks.logWorkout,
      currentUser, isSuperRole, syncStatus, hasPermission, userRole, userTier,
      dynamicClubs, getAllClubs, getAllClubsLabels, addClub, deleteClub,
      recordMembershipPayment: handleMembershipPayment,
      rivals, addRival: rivalHooks.addRival, updateRival: rivalHooks.updateRival, deleteRival: rivalHooks.deleteRival,
      futureFixtures, addFutureFixture: futureFixtureHooks.addFutureFixture, deleteFutureFixture: futureFixtureHooks.deleteFutureFixture, setMatchAvailability: futureFixtureHooks.setMatchAvailability,
      liveMatch: liveMatchHooks.liveMatch, setLiveMatch: liveMatchHooks.setLiveMatch,
      liveEvents: liveMatchHooks.liveEvents, setLiveEvents: liveMatchHooks.setLiveEvents,
      startLiveMatch: liveMatchHooks.startLiveMatch,
      addLiveEvent: liveMatchHooks.addLiveEvent, updateLiveMatch: liveMatchHooks.updateLiveMatch,
      pauseLiveMatch: liveMatchHooks.pauseLiveMatch, resumeLiveMatch: liveMatchHooks.resumeLiveMatch,
      delayLiveMatch: liveMatchHooks.delayLiveMatch, setDesignatedScorer: liveMatchHooks.setDesignatedScorer,
      endLiveMatch: liveMatchHooks.endLiveMatch, deleteLiveMatch: liveMatchHooks.deleteLiveMatch,
      matchInvitations, createInvitation: invitationHooks.createInvitation, cancelInvitation: invitationHooks.cancelInvitation, deleteInvitation: invitationHooks.deleteInvitation, updateInvitationResponse: invitationHooks.updateInvitationResponse,
      loans, requestLoan: loanHooks.requestLoan, updateLoanStatus: loanHooks.updateLoanStatus,
      createPlayerCredentials: playerHooks.createPlayerCredentials, resetPlayerPassword: playerHooks.resetPlayerPassword, resetStaffPassword, bulkUpdatePosition: playerHooks.bulkUpdatePosition,
      viewMode, setViewMode, divisionView, setDivisionView,
      makgoraTeamId, setMakgoraTeamId, makgoraTeams, setMakgoraTeams, refreshMakgoraTeams, teams,
      clubConfig, mensualidadBase,
      campaigns: fundraisingHooks.campaigns,
      allPayments: fundraisingHooks.allPayments,
      loadCampaigns: fundraisingHooks.loadCampaigns,
      loadAllPayments: fundraisingHooks.loadAllPayments,
      addCampaign: fundraisingHooks.addCampaign,
      updateCampaign: fundraisingHooks.updateCampaign,
      deleteCampaign: fundraisingHooks.deleteCampaign,
      getAssignments: fundraisingHooks.getAssignments,
      getRaffleTickets: fundraisingHooks.getRaffleTickets,
      bulkAssignTickets: fundraisingHooks.bulkAssignTickets,
      bulkAssignFood: fundraisingHooks.bulkAssignFood,
      updateAssignment: fundraisingHooks.updateAssignment,
      markTicketSold: fundraisingHooks.markTicketSold,
      registerPayment: fundraisingHooks.registerPayment,
      deletePayment: fundraisingHooks.deletePayment,
      sellTickets: fundraisingHooks.sellTickets,
      deleteMembershipPayment: handleDeleteMembershipPayment,
      reverseMembershipPayment: playerHooks.reverseMembershipPayment,
      handleMonthlyCharge,
      applyMonthlyCharge: playerHooks.applyMonthlyCharge,
    }}>
      {children}
    </ClubContext.Provider>
  );
};
