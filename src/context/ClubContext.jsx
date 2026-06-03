import React from 'react';
import { useAuth } from './AuthContext.jsx';
import { supabase } from '../supabaseClient.js';
import { wrapCatch } from '../utils/errorHandler';
import { CLUBS, CLUBS_LABELS, SYSTEM_ROLES, SYSTEM_ROLES_LABELS, RPG_ROLES, SUPER_ROLES, DIVISIONES, DIVISIONES_LABELS, EQUIPOS, EQUIPOS_LABELS, MAKGORA_TEAMS, getRpgRole } from './constants';
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
  useInvitations,
  useLoans,
  useDataIO,
} from './hooks';

export {
  CLUBS, CLUBS_LABELS, SYSTEM_ROLES, SYSTEM_ROLES_LABELS,
  RPG_ROLES, SUPER_ROLES, DIVISIONES, DIVISIONES_LABELS,
  EQUIPOS, EQUIPOS_LABELS, MAKGORA_TEAMS, getRpgRole
};

export const ClubContext = React.createContext();

export const ClubProvider = ({ children }) => {
  const { user, profile } = useAuth();

  const { currentUser, userRole, userTier, hasPermission, isSuperRole } = usePermissions(user, profile);
  const { dynamicClubs, getAllClubs, getAllClubsLabels, addClub, deleteClub } = useClubs(isSuperRole);
  const { activeTeam, setActiveTeam } = useActiveTeam();
  const { sendLocalNotification, scheduleReminder } = useNotifications();

  const [fixtures, setFixtures] = React.useState(() => []);
  const [rivals, setRivals] = React.useState(() => []);
  const [futureFixtures, setFutureFixtures] = React.useState(() => []);
  const [matchInvitations, setMatchInvitations] = React.useState(() => []);
  const [loans, setLoans] = React.useState(() => []);

  // View mode: 'general' | 'makgora'
  const [viewMode, setViewMode] = React.useState(() => {
    return localStorage.getItem('orcos_view_mode') || 'general';
  });
  const [makgoraTeamId, setMakgoraTeamId] = React.useState(() => {
    return localStorage.getItem('orcos_makgora_team_id') || null;
  });
  const [makgoraTeams, setMakgoraTeams] = React.useState([]);

  // Division view: 'all' | specific division string (e.g. 'masculina_mayor')
  const [divisionView, setDivisionView] = React.useState(() => {
    return localStorage.getItem('orcos_division_view') || 'all';
  });

  React.useEffect(() => {
    localStorage.setItem('orcos_view_mode', viewMode);
  }, [viewMode]);

  React.useEffect(() => {
    localStorage.setItem('orcos_division_view', divisionView);
  }, [divisionView]);

  React.useEffect(() => {
    if (makgoraTeamId) {
      localStorage.setItem('orcos_makgora_team_id', makgoraTeamId);
    } else {
      localStorage.removeItem('orcos_makgora_team_id');
    }
  }, [makgoraTeamId]);

  // Fetch makgora_teams from Supabase
  React.useEffect(() => {
    supabase
      .from('makgora_teams')
      .select('id, name, rpg_name, emblem_color')
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMakgoraTeams(data);
          if (!makgoraTeamId) {
            setMakgoraTeamId(data[0].id);
          }
        }
      })
      .catch(wrapCatch('ClubContext.fetchMakgoraTeams', { silent: true }));
  }, []);

  const { pushPlayerToSupabase } = useSyncPush(user);
  const playerHooks = usePlayers(activeTeam, sendLocalNotification, pushPlayerToSupabase, null, user);
  const { players, setPlayers, normalizePlayer } = playerHooks;

  const scheduleHooks = useSchedule(activeTeam, sendLocalNotification, scheduleReminder, null, user);
  const { schedule, setSchedule } = scheduleHooks;

  const [championships, setChampionships] = React.useState(() => []);
  const championshipHooks = useChampionships(activeTeam, null);

  const financeHooks = useFinances(activeTeam, null, sendLocalNotification);
  const { finances, setFinances } = financeHooks;

  const inventoryHooks = useInventory(null);
  const { inventory, setInventory } = inventoryHooks;

  const { syncStatus, pushEntityToSupabase } = useSync(
    user, userTier, profile,
    setPlayers, setSchedule, setChampionships, setFinances,
    setInventory, setFixtures, setRivals, setFutureFixtures,
    setMatchInvitations, setLoans
  );

  const fixtureHooks = useFixtures(activeTeam, sendLocalNotification, pushEntityToSupabase, user);
  const rivalHooks = useRivals(pushEntityToSupabase, user);
  const futureFixtureHooks = useFutureFixtures(activeTeam, sendLocalNotification, pushEntityToSupabase, user);

  const invitationHooks = useInvitations(user, userTier, profile);
  const loanHooks = useLoans(user);

  const dataIOHooks = useDataIO(
    players, schedule, championships, finances, inventory, fixtures, rivals, futureFixtures,
    activeTeam, setPlayers, setSchedule, setChampionships, setFinances, setInventory, setFixtures, setActiveTeam,
    sendLocalNotification, normalizePlayer
  );

  const handleMembershipPayment = (playerId, amount) => {
    const { playerName, date } = playerHooks.recordMembershipPayment(playerId, amount);
    financeHooks.addMembershipPayment(playerName, amount, date);
  };

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
      activeTeam, setActiveTeam,
      players, addPlayer: playerHooks.addPlayer, updatePlayer: playerHooks.updatePlayer, deletePlayer: playerHooks.deletePlayer,
      recordAttendance: playerHooks.recordAttendance, recordMatchInfractions: playerHooks.recordMatchInfractions, redeemPenalty: playerHooks.redeemPenalty,
      recordPhysicalTest: playerHooks.recordPhysicalTest, recordInjury: playerHooks.recordInjury, updateInjuryPhase: playerHooks.updateInjuryPhase,
      recordMatchStats: playerHooks.recordMatchStats, recordWellness: playerHooks.recordWellness, runHiaProtocol: playerHooks.runHiaProtocol,
      inventory, addInventoryItem: inventoryHooks.addInventoryItem, updateInventoryItem: inventoryHooks.updateInventoryItem, updateClothingSizes: playerHooks.updateClothingSizes,
      schedule, addScheduleEvent: scheduleHooks.addScheduleEvent, deleteScheduleEvent: scheduleHooks.deleteScheduleEvent, generateWhatsAppMessage: scheduleHooks.generateWhatsAppMessage,
      championships, addChampionship: championshipHooks.addChampionship,
      finances, addFinanceRecord: financeHooks.addFinanceRecord,
      exportData: dataIOHooks.exportData, importData: dataIOHooks.importData,
      fixtures, addFixture: fixtureHooks.addFixture, deleteFixture: fixtureHooks.deleteFixture,
      updateGymStats: playerHooks.updateGymStats, logWorkout: playerHooks.logWorkout,
      currentUser, isSuperRole, syncStatus, hasPermission, userRole, userTier,
      dynamicClubs, getAllClubs, getAllClubsLabels, addClub, deleteClub,
      recordMembershipPayment: handleMembershipPayment,
      rivals, addRival: rivalHooks.addRival, updateRival: rivalHooks.updateRival, deleteRival: rivalHooks.deleteRival,
      futureFixtures, addFutureFixture: futureFixtureHooks.addFutureFixture, deleteFutureFixture: futureFixtureHooks.deleteFutureFixture,
      matchInvitations, createInvitation: invitationHooks.createInvitation, cancelInvitation: invitationHooks.cancelInvitation, deleteInvitation: invitationHooks.deleteInvitation, updateInvitationResponse: invitationHooks.updateInvitationResponse,
      loans, requestLoan: loanHooks.requestLoan, updateLoanStatus: loanHooks.updateLoanStatus,
      createPlayerCredentials: playerHooks.createPlayerCredentials, resetPlayerPassword: playerHooks.resetPlayerPassword, resetStaffPassword, bulkUpdatePosition: playerHooks.bulkUpdatePosition,
      viewMode, setViewMode, divisionView, setDivisionView,
      makgoraTeamId, setMakgoraTeamId, makgoraTeams,
    }}>
      {children}
    </ClubContext.Provider>
  );
};
