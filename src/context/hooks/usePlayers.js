import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { handleError } from '../../utils/errorHandler';
import apisupabase from '../../data/supabaseApi.js';
import { SYSTEM_ROLES, EQUIPOS_LABELS } from '../constants';

const generateId = (prefix = '') => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return prefix + crypto.randomUUID();
  }
  return prefix + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const sanitize = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[<>]/g, '');
};

const normalizePlayer = (p) => ({
  ...p,
  systemRole: p.systemRole || SYSTEM_ROLES.JUGADOR,
  memberships: p.memberships || { paid: 0, due: 0 },
  infractionLog: p.infractionLog || [],
});

export function usePlayers(activeTeam, sendLocalNotification, pushPlayerToSupabase, pushEntityToSupabase, user) {
  const [players, setPlayers] = useState(() => []);

  const addPlayer = useCallback(async (player) => {
    const newPlayer = {
      ...player,
      id: generateId(),
      name: sanitize(player.name),
      apodo: sanitize(player.apodo),
      estado: player.estado || 'activo',
      attributes: player.attributes || { force: 50, speed: 50, stamina: 50, technique: 50 },
      history: player.history || [{ date: new Date().toISOString().split('T')[0], ...(player.attributes || { force: 50, speed: 50, stamina: 50, technique: 50 }) }],
      injuryLog: player.injuryLog || [],
      attendance: player.attendance || { total: 0, present: 0, late: 0, absentUnjustified: 0, absentJustified: 0 },
      penalties: player.penalties || { burpees: 0, cones: false },
      infractionLog: player.infractionLog || [],
      clothingSizes: player.clothingSizes || { jersey: 'M', shorts: 'M', socks: '40-42' },
      matchStats: player.matchStats || [],
      wellnessLogs: player.wellnessLogs || [],
      hiaAssessments: player.hiaAssessments || [],
      workoutLog: player.workoutLog || [],
      systemRole: player.systemRole || SYSTEM_ROLES.JUGADOR,
      memberships: player.memberships || { paid: 0, due: 0 },
      teamCategory: activeTeam
    };
    setPlayers(prev => [...prev, newPlayer]);
    sendLocalNotification('Nuevo Orco Reclutado', `${newPlayer.name} ("${newPlayer.apodo}") se ha unido a ${EQUIPOS_LABELS[activeTeam]}.`);
    pushPlayerToSupabase(newPlayer);
  }, [activeTeam, sendLocalNotification, pushPlayerToSupabase]);

  const updatePlayer = useCallback(async (updatedPlayer) => {
    const safePlayer = {
      ...updatedPlayer,
      name: sanitize(updatedPlayer.name),
      apodo: sanitize(updatedPlayer.apodo),
      contacto: {
        phone: sanitize(updatedPlayer.contacto?.phone || ''),
        email: sanitize(updatedPlayer.contacto?.email || '')
      }
    };
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? safePlayer : p));
    pushPlayerToSupabase(safePlayer);
  }, [pushPlayerToSupabase]);

  const deletePlayer = useCallback(async (id) => {
    const playerToDelete = players.find(p => p.id === id);
    setPlayers(prev => prev.filter(p => p.id !== id));
    if (playerToDelete) {
      sendLocalNotification('Orco Licenciado', `${playerToDelete.name} fue dado de baja del roster.`);
    }
    if (user?.id) {
      try { await apisupabase.deletePlayer(id); } catch (err) {
        handleError(err, 'usePlayers.delete', { silent: true });
      }
    }
  }, [players, sendLocalNotification, user?.id]);

  const recordAttendance = useCallback((sessionDate, attendanceList) => {
    setPlayers(prev => prev.map(player => {
      if (player.teamCategory !== activeTeam) return player;
      const status = attendanceList[player.id];
      if (!status) return player;
      const newAttendance = { ...player.attendance };
      newAttendance.total += 1;
      const newPenalties = { ...player.penalties };
      if (status === 'presente') {
        newAttendance.present += 1;
      } else if (status === 'tarde') {
        newAttendance.late += 1;
        newPenalties.burpees += 15;
      } else if (status === 'falta_injustificada') {
        newAttendance.absentUnjustified += 1;
        newPenalties.burpees += 50;
        newPenalties.cones = true;
      } else if (status === 'falta_justificada') {
        newAttendance.absentJustified += 1;
      }
      return { ...player, attendance: newAttendance, penalties: newPenalties };
    }));
    sendLocalNotification('Asistencia Guardada', `Se registro la asistencia del entrenamiento del ${sessionDate}.`);
  }, [activeTeam, sendLocalNotification]);

  const recordMatchInfractions = useCallback((matchDate, infractionsList) => {
    setPlayers(prev => prev.map(player => {
      const inf = infractionsList.find(i => i.playerId === player.id);
      if (!inf) return player;
      const newPenalties = { ...player.penalties };
      let newEstado = player.estado;
      const burpeesAmount = (inf.penales * 10) + (inf.amarillas * 50) + (inf.rojas * 100);
      newPenalties.burpees += burpeesAmount;
      if (inf.rojas > 0) newEstado = 'suspendido';
      const infractionLog = {
        id: generateId('inf_'), date: matchDate,
        penales: inf.penales || 0, amarillas: inf.amarillas || 0,
        rojas: inf.rojas || 0, faultType: inf.faultType || null,
        context: inf.context || 'partido', notes: inf.notes || ''
      };
      return { ...player, penalties: newPenalties, estado: newEstado, infractionLog: [...(player.infractionLog || []), infractionLog] };
    }));
    sendLocalNotification('Sanciones del Tribunal Aplicadas', `Se procesaron las infracciones del partido (${matchDate}).`);
  }, [sendLocalNotification]);

  const redeemPenalty = useCallback((playerId, type) => {
    setPlayers(prev => prev.map(player => {
      if (player.id !== playerId) return player;
      const newPenalties = { ...player.penalties };
      let newEstado = player.estado;
      if (type === 'burpees') newPenalties.burpees = 0;
      else if (type === 'cones') newPenalties.cones = false;
      if (newEstado === 'suspendido' && newPenalties.burpees === 0) newEstado = 'activo';
      return { ...player, penalties: newPenalties, estado: newEstado };
    }));
  }, []);

  const recordPhysicalTest = useCallback((playerId, testDate, attributes) => {
    setPlayers(prev => prev.map(player => {
      if (player.id !== playerId) return player;
      const newHistory = [...player.history, { date: testDate, ...attributes }];
      return { ...player, attributes, history: newHistory };
    }));
  }, []);

  const recordInjury = useCallback((playerId, diagnosis, weeks, date = new Date().toISOString().split('T')[0]) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      return { ...p, estado: 'lesionado', injuryLog: [{ diagnosis: sanitize(diagnosis), date, weeks, phase: 1 }] };
    }));
  }, []);

  const updateInjuryPhase = useCallback((playerId, phase) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      if (p.injuryLog.length === 0) return p;
      const newLog = [...p.injuryLog];
      newLog[0] = { ...newLog[0], phase: Number(phase) };
      let newEstado = p.estado;
      if (Number(phase) === 4) newEstado = 'activo';
      return { ...p, estado: newEstado, injuryLog: newEstado === 'activo' ? [] : newLog };
    }));
  }, []);

  const recordMatchStats = useCallback((playerId, stats) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      let newEstado = p.estado;
      if (Number(stats.redCards) > 0) newEstado = 'suspendido';
      return {
        ...p, estado: newEstado,
        matchStats: [...(p.matchStats || []), { id: generateId('st_'), ...stats, opponent: sanitize(stats.opponent) }]
      };
    }));
  }, []);

  const recordWellness = useCallback((playerId, wellnessData) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const logs = p.wellnessLogs || [];
      return { ...p, wellnessLogs: [...logs, { id: generateId('wl_'), ...wellnessData }].slice(-30) };
    }));
  }, []);

  const runHiaProtocol = useCallback((playerId, symptomsDetected) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const currentHia = p.hiaAssessments || [];
      const today = new Date().toISOString().split('T')[0];
      let newEstado = p.estado;
      let newInjuryLog = [...p.injuryLog];
      if (symptomsDetected) {
        newEstado = 'lesionado';
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
        newInjuryLog = [{ diagnosis: 'Protocolo HIA Activo - Sospecha de Conmocion', date: today, weeks: 2, phase: 1 }];
        sendLocalNotification('Protocolo HIA Activado', `Sospecha de conmocion para ${p.name}. Suspendido preventivamente por 14 dias.`);
      }
      return { ...p, estado: newEstado, injuryLog: newInjuryLog, hiaAssessments: [...currentHia, { id: generateId('hia_'), date: today, symptomsDetected }] };
    }));
  }, [sendLocalNotification]);

  const updateClothingSizes = useCallback((playerId, sizes) => {
    const safe = { jersey: sanitize(sizes.jersey), shorts: sanitize(sizes.shorts), socks: sanitize(sizes.socks) };
    setPlayers(prev => prev.map(p => p.id !== playerId ? p : { ...p, clothingSizes: safe }));
  }, []);

  const updateGymStats = useCallback((playerId, gymStats) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      return {
        ...p,
        gymStats: { squat: Number(gymStats.squat || 0), bench: Number(gymStats.bench || 0), deadlift: Number(gymStats.deadlift || 0) },
        weight: Number(gymStats.weight || 85)
      };
    }));
  }, []);

  const logWorkout = useCallback((playerId, workoutData) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const newLog = { id: generateId('wl_'), date: new Date().toISOString().split('T')[0], ejercicios: workoutData.ejercicios || [], type: workoutData.type || 'general' };
      return { ...p, workoutLog: [...(p.workoutLog || []), newLog] };
    }));
  }, []);

  const recordMembershipPayment = useCallback((playerId, amount) => {
    const today = new Date().toISOString().split('T')[0];
    let playerName = '';
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      playerName = p.name;
      const current = p.memberships || { paid: 0, due: 10000 };
      const due = current.due > 0 ? current.due : 10000;
      const newPaid = Math.min(current.paid + amount, due);
      const newDue = Math.max(0, due - newPaid);
      return { ...p, memberships: { paid: newPaid, due: newDue, lastPayment: today, lastAmount: amount } };
    }));
    return { playerName, date: today };
  }, []);

  const createPlayerCredentials = useCallback(async (playerId, password) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { error: 'Jugador no encontrado' };

    const { data, error } = await supabase.rpc('admin_create_player_credentials', {
      p_player_id: playerId,
      p_password: password || null,
    });

    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };

    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      return { ...p, username: data.username, contacto: { ...p.contacto, email: data.email } };
    }));

    return { data, username: data.username, password: data.password };
  }, [players]);

  const resetPlayerPassword = useCallback(async (playerId, newPassword) => {
    const { data, error } = await supabase.rpc('admin_reset_player_password', {
      p_player_id: playerId,
      p_new_password: newPassword,
    });

    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { data };
  }, []);

  const bulkUpdatePosition = useCallback((playerIds, positionId, positionName) => {
    if (!playerIds || playerIds.size === 0) return;
    const updates = [];
    setPlayers(prev => prev.map(p => {
      if (!playerIds.has(p.id)) return p;
      updates.push({ id: p.id, position_id: positionId });
      return { ...p, position_id: positionId, posicion: positionName || p.posicion };
    }));
    if (updates.length > 0 && user?.id) {
      apisupabase.batchUpdatePositions(updates, user.id).catch(err => {
        handleError(err, 'usePlayers.bulkUpdatePosition', { silent: true });
      });
    }
  }, [user?.id]);

  return {
    players, setPlayers, normalizePlayer,
    addPlayer, updatePlayer, deletePlayer,
    recordAttendance, recordMatchInfractions, redeemPenalty,
    recordPhysicalTest, recordInjury, updateInjuryPhase,
    recordMatchStats, recordWellness, runHiaProtocol,
    updateClothingSizes, updateGymStats, logWorkout,
    recordMembershipPayment, createPlayerCredentials, resetPlayerPassword, bulkUpdatePosition,
  };
}
