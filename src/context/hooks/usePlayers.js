import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { handleError } from '../../utils/errorHandler';
import apisupabase from '../../data/supabaseApi.js';
import { SYSTEM_ROLES, EQUIPOS_LABELS } from '../constants';
import { calculateAttributes } from '../../engine/attributeCalculator.js';
import { playerSchema } from '../../schemas/player.js';
import { parseFullName } from '../../utils/nameParser.js';
import { generateId, sanitize } from '../../utils/ids.js';

const normalizePlayer = (p) => ({
  ...p,
  systemRole: p.systemRole || SYSTEM_ROLES.JUGADOR,
  memberships: p.memberships || { paid: 0, due: 0 },
  infractionLog: p.infractionLog || [],
});

export function usePlayers(activeTeam, sendLocalNotification, pushPlayerToSupabase, pushEntityToSupabase, user, mensualidadBase = 10000) {
  const [players, setPlayers] = useState(() => []);

  const saveAttributeHistory = (playerId, date, attrs, source = 'auto') => {
    supabase.from('attribute_history').upsert({
      player_id: playerId,
      recorded_date: date,
      attr_force: attrs.force,
      attr_speed: attrs.speed,
      attr_stamina: attrs.stamina,
      attr_technique: attrs.technique,
      source,
    }).then(() => {}).catch(err => handleError(err, 'usePlayers.saveAttributeHistory', { notifyUser: true }));
  };

  const addPlayer = useCallback(async (player) => {
    const validation = playerSchema.safeParse(player);
    if (!validation.success && import.meta.env.DEV) {
      console.warn('[usePlayers.addPlayer] Schema validation:', validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '));
    }
    const computedAttrs = player.attributes || calculateAttributes(player);
    const today = new Date().toISOString().split('T')[0];

    const parsed = player.name ? parseFullName(player.name) : null;
    const firstName = player.firstName ?? parsed?.firstName ?? '';
    const middleName = player.middleName ?? parsed?.middleName ?? null;
    const lastName = player.lastName ?? parsed?.lastName ?? '';
    const secondLastName = player.secondLastName ?? parsed?.secondLastName ?? null;

    const newPlayer = {
      ...player,
      id: generateId(),
      name: sanitize(player.name || [firstName, middleName, lastName, secondLastName].filter(Boolean).join(' ')),
      firstName: sanitize(firstName) || null,
      middleName: sanitize(middleName) || null,
      lastName: sanitize(lastName) || null,
      secondLastName: sanitize(secondLastName) || null,
      apodo: sanitize(player.apodo),
      estado: player.estado || 'activo',
      attributes: computedAttrs,
      history: player.history || [{ date: today, source: 'auto', ...computedAttrs }],
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
    saveAttributeHistory(newPlayer.id, today, computedAttrs, 'auto');
    sendLocalNotification('Nuevo Orco Reclutado', `${newPlayer.name} ("${newPlayer.apodo}") se ha unido a ${EQUIPOS_LABELS[activeTeam]}.`);
    pushPlayerToSupabase(newPlayer);
  }, [activeTeam, sendLocalNotification, pushPlayerToSupabase]);

  const updatePlayer = useCallback(async (updatedPlayer) => {
    let parsed = null;
    if (updatedPlayer.name && !updatedPlayer.firstName) {
      parsed = parseFullName(updatedPlayer.name);
    }
    const safePlayer = {
      ...updatedPlayer,
      name: sanitize(updatedPlayer.name),
      firstName: sanitize(updatedPlayer.firstName ?? parsed?.firstName) || null,
      middleName: sanitize(updatedPlayer.middleName ?? parsed?.middleName) || null,
      lastName: sanitize(updatedPlayer.lastName ?? parsed?.lastName) || null,
      secondLastName: sanitize(updatedPlayer.secondLastName ?? parsed?.secondLastName) || null,
      apodo: sanitize(updatedPlayer.apodo),
      contacto: {
        phone: sanitize(updatedPlayer.contacto?.phone || ''),
        email: sanitize(updatedPlayer.contacto?.email || '')
      }
    };
    const prevPlayer = players.find(p => p.id === updatedPlayer.id);
    const physicalChanged = prevPlayer && (
      prevPlayer.weight !== updatedPlayer.weight ||
      prevPlayer.height !== updatedPlayer.height ||
      (prevPlayer._meta?.age ?? prevPlayer.age) !== (updatedPlayer._meta?.age ?? updatedPlayer.age) ||
      prevPlayer.posicion !== updatedPlayer.posicion
    );
    if (physicalChanged) {
      const newAttrs = calculateAttributes(safePlayer);
      const today = new Date().toISOString().split('T')[0];
      safePlayer.attributes = newAttrs;
      safePlayer.history = [...(prevPlayer.history || []), { date: today, source: 'auto', ...newAttrs }];
      saveAttributeHistory(safePlayer.id, today, newAttrs, 'auto');
    }
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? safePlayer : p));
    pushPlayerToSupabase(safePlayer);
  }, [players, pushPlayerToSupabase]);

  const deletePlayer = useCallback(async (id) => {
    const playerToDelete = players.find(p => p.id === id);
    setPlayers(prev => prev.filter(p => p.id !== id));
    if (playerToDelete) {
      sendLocalNotification('Orco Licenciado', `${playerToDelete.name} fue dado de baja del roster.`);
    }
    if (user?.id) {
      try { await apisupabase.deletePlayer(id); } catch (err) {
        handleError(err, 'usePlayers.delete', { notifyUser: true });
      }
    }
  }, [players, sendLocalNotification, user?.id]);

  const recordAttendance = useCallback(async (sessionDate, attendanceList, eventId) => {
    const statusMap = { presente: 'present', tarde: 'late', falta_injustificada: 'absent_unjustified', falta_justificada: 'absent_justified' };
    const penaltyByStatus = { present: 0, late: 15, absent_unjustified: 50, absent_justified: 0 };
    const reverseStatusMap = Object.fromEntries(Object.entries(statusMap).map(([k, v]) => [v, k]));

    let existingByPlayer = {};
    if (eventId) {
      const { data: existing } = await supabase
        .from('attendance')
        .select('player_id, status')
        .eq('event_id', eventId);
      if (existing) {
        existing.forEach(r => { existingByPlayer[r.player_id] = r.status; });
      }
    }

    const records = Object.entries(attendanceList).map(([playerId, status]) => ({
      player_id: playerId,
      event_date: sessionDate,
      status: statusMap[status] || status,
      event_id: eventId || null
    }));

    if (records.length > 0) {
      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'player_id,event_id' });
      if (error) {
        handleError(error, 'usePlayers.recordAttendance', { notifyUser: true });
        return false;
      }
    }

    setPlayers(prev => prev.map(player => {
      if (player.teamCategory !== activeTeam) return player;
      const uiStatus = attendanceList[player.id];
      if (!uiStatus) return player;

      const existingDbStatus = existingByPlayer[player.id];
      const existingUiStatus = existingDbStatus ? reverseStatusMap[existingDbStatus] : null;

      const newAttendance = { ...player.attendance };
      if (!existingUiStatus) {
        newAttendance.total += 1;
        if (uiStatus === 'presente') newAttendance.present += 1;
        else if (uiStatus === 'tarde') newAttendance.late += 1;
        else if (uiStatus === 'falta_injustificada') newAttendance.absentUnjustified += 1;
        else if (uiStatus === 'falta_justificada') newAttendance.absentJustified += 1;
      } else {
        if (existingUiStatus === 'presente') newAttendance.present -= 1;
        else if (existingUiStatus === 'tarde') newAttendance.late -= 1;
        else if (existingUiStatus === 'falta_injustificada') newAttendance.absentUnjustified -= 1;
        else if (existingUiStatus === 'falta_justificada') newAttendance.absentJustified -= 1;
        if (uiStatus === 'presente') newAttendance.present += 1;
        else if (uiStatus === 'tarde') newAttendance.late += 1;
        else if (uiStatus === 'falta_injustificada') newAttendance.absentUnjustified += 1;
        else if (uiStatus === 'falta_justificada') newAttendance.absentJustified += 1;
      }

      const newPenalties = { ...player.penalties };
      const oldBurpees = penaltyByStatus[existingDbStatus] || 0;
      const newBurpees = penaltyByStatus[statusMap[uiStatus]] || 0;
      newPenalties.burpees = Math.max(0, newPenalties.burpees - oldBurpees + newBurpees);
      if (uiStatus === 'falta_injustificada') newPenalties.cones = true;

      return { ...player, attendance: newAttendance, penalties: newPenalties };
    }));

    sendLocalNotification('Asistencia Guardada', `Se registró la asistencia del evento del ${sessionDate}.`);
    return true;
  }, [activeTeam, sendLocalNotification]);

  const recordMatchInfractions = useCallback((matchDate, infractionsList) => {
    const penaltyRecords = [];
    const infractionRecords = [];
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
      penaltyRecords.push({ player_id: player.id, burpees: newPenalties.burpees, cones: newPenalties.cones });
      infractionRecords.push({ player_id: player.id, infraction_date: matchDate, penalties: inf.penales || 0, yellow_cards: inf.amarillas || 0, red_cards: inf.rojas || 0, fault_type: inf.faultType || null, context: inf.context || 'partido', notes: inf.notes || '' });
      return { ...player, penalties: newPenalties, estado: newEstado, infractionLog: [...(player.infractionLog || []), infractionLog] };
    }));
    penaltyRecords.forEach(r => supabase.from('penalties').upsert(r).then(() => {}, () => {}));
    infractionRecords.forEach(r => supabase.from('infractions').upsert(r).then(() => {}, () => {}));
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
      supabase.from('penalties').upsert({ player_id: playerId, burpees: newPenalties.burpees, cones: newPenalties.cones }).then(() => {}).catch(err => handleError(err, 'usePlayers', { notifyUser: true }));
      return { ...player, penalties: newPenalties, estado: newEstado };
    }));
  }, []);

  const recordPhysicalTest = useCallback((playerId, testDate, attributes) => {
    setPlayers(prev => prev.map(player => {
      if (player.id !== playerId) return player;
      supabase.from('attribute_history').upsert({ player_id: playerId, recorded_date: testDate, attr_force: attributes.force, attr_speed: attributes.speed, attr_stamina: attributes.stamina, attr_technique: attributes.technique, source: 'test' }).then(() => {}).catch(err => handleError(err, 'usePlayers', { notifyUser: true }));
      const newHistory = [...player.history, { date: testDate, source: 'test', ...attributes }];
      return { ...player, attributes, history: newHistory };
    }));
  }, []);

  const recordInjury = useCallback((playerId, diagnosis, weeks, date = new Date().toISOString().split('T')[0]) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      supabase.from('injury_log').upsert({ player_id: playerId, injury_date: date, diagnosis: sanitize(diagnosis), recovery_weeks: weeks, phase: 1 }).then(() => {}).catch(err => handleError(err, 'usePlayers', { notifyUser: true }));
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
      supabase.from('injury_log').upsert({ player_id: playerId, injury_date: newLog[0].date, diagnosis: newLog[0].diagnosis, recovery_weeks: newLog[0].weeks, phase: Number(phase) }).then(() => {}).catch(err => handleError(err, 'usePlayers', { notifyUser: true }));
      return { ...p, estado: newEstado, injuryLog: newEstado === 'activo' ? [] : newLog };
    }));
  }, []);

  const recordMatchStats = useCallback((playerId, stats) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      let newEstado = p.estado;
      if (Number(stats.redCards) > 0) newEstado = 'suspendido';
      supabase.from('match_stats').upsert({ player_id: playerId, match_date: stats.date, opponent: sanitize(stats.opponent), tries: stats.tries || 0, conversions: stats.conversions || 0, tackles: stats.tackles || 0, turnovers: stats.turnovers || 0, yellow_cards: stats.yellowCards || 0, red_cards: stats.redCards || 0, mvp: stats.mvp || false, context: 'general' }).then(() => {}).catch(err => handleError(err, 'usePlayers', { notifyUser: true }));
      return { ...p, estado: newEstado, matchStats: [...(p.matchStats || []), { id: generateId('st_'), ...stats, opponent: sanitize(stats.opponent) }] };
    }));
  }, []);

  const recordWellness = useCallback((playerId, wellnessData) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      supabase.from('wellness_logs').upsert({ player_id: playerId, log_date: wellnessData.date || new Date().toISOString().split('T')[0], sleep_quality: wellnessData.sleep, muscle_soreness: wellnessData.soreness, stress_level: wellnessData.stress }).then(() => {}).catch(err => handleError(err, 'usePlayers', { notifyUser: true }));
      const logs = p.wellnessLogs || [];
      return { ...p, wellnessLogs: [...logs, { id: generateId('wl_'), ...wellnessData }].slice(-30) };
    }));
  }, []);

  const runHiaProtocol = useCallback((playerId, symptomsDetected) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const currentHia = p.hiaAssessments || [];
      const today = new Date().toISOString().split('T')[0];
      const symptoms = symptomsDetected ? ['Sintomas detectados'] : ['Sin sintomas'];
      supabase.from('hia_assessments').upsert({ player_id: playerId, assessment_date: today, symptoms }).then(() => {}).catch(err => handleError(err, 'usePlayers', { notifyUser: true }));
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

  const logWorkout = useCallback((playerId, workoutData) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const today = new Date().toISOString().split('T')[0];
      supabase.from('workout_logs').upsert({
        player_id: playerId, workout_date: today,
        routine_name: workoutData.routineName || workoutData.routine || null,
        category: workoutData.type || 'general',
        exercises: workoutData.ejercicios || [],
        exercise_logs: workoutData.exerciseLogs || [],
        plan_id: workoutData.planId || null,
        completed: true,
      }).then(() => {}).catch(err => handleError(err, 'usePlayers', { notifyUser: true }));
      const newLog = { id: generateId('wl_'), date: today, ejercicios: workoutData.ejercicios || [], exerciseLogs: workoutData.exerciseLogs || [], routine: workoutData.routineName || workoutData.routine || null, category: workoutData.type || 'general', completed: true };
      return { ...p, workoutLog: [...(p.workoutLog || []), newLog] };
    }));
  }, []);

  const updateClothingSizes = useCallback((playerId, sizes) => {
    const safe = { jersey: sanitize(sizes.jersey), shorts: sanitize(sizes.shorts), socks: sanitize(sizes.socks) };
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const updated = { ...p, clothingSizes: safe };
      pushPlayerToSupabase(updated);
      return updated;
    }));
  }, [pushPlayerToSupabase]);

  const updateGymStats = useCallback((playerId, gymStats) => {
    const today = new Date().toISOString().split('T')[0];
    const squat = Number(gymStats.squat || 0);
    const bench = Number(gymStats.bench || 0);
    const deadlift = Number(gymStats.deadlift || 0);
    const weight = Number(gymStats.weight || 0);
    supabase.from('gym_history').insert({
      player_id: playerId, recorded_date: today,
      squat, bench, deadlift,
      weight: weight > 0 ? weight : null,
    }).then(() => {}).catch(err => handleError(err, 'usePlayers', { notifyUser: true }));
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const updated = {
        ...p,
        gymStats: { squat, bench, deadlift },
        weight: weight > 0 ? weight : p.weight || 85,
      };
      const newAttrs = calculateAttributes(updated);
      updated.attributes = newAttrs;
      updated.history = [...(p.history || []), { date: today, source: 'gym', ...newAttrs }];
      saveAttributeHistory(playerId, today, newAttrs, 'gym');
      pushPlayerToSupabase(updated);
      return updated;
    }));
  }, [pushPlayerToSupabase]);

  const recordMembershipPayment = useCallback(async (playerId, amount) => {
    const today = new Date().toISOString().split('T')[0];
    let playerName = '';
    let updatedPlayer = null;
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      playerName = p.name;
      const current = p.memberships || { paid: 0, due: 0 };
      const newPaid = (current.paid || 0) + amount;
      updatedPlayer = { ...p, memberships: { paid: newPaid, due: current.due || mensualidadBase, lastPayment: today, lastAmount: amount } };
      return updatedPlayer;
    }));
    if (updatedPlayer) pushPlayerToSupabase(updatedPlayer);
    const paymentId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : r & 0x3 | 0x8).toString(16); });
    const { error: insertError } = await supabase.from('player_payments').insert({
      id: paymentId, player_id: playerId, amount,
      payment_date: today, source: 'membership',
      notes: `Abono Membresia - ${playerName}`,
    });
    if (insertError) handleError(insertError, 'usePlayers.recordMembershipPayment', { notifyUser: true });
    return { playerName, date: today, paymentId };
  }, [pushPlayerToSupabase, mensualidadBase]);

  const reverseMembershipPayment = useCallback((playerId, amount) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const current = p.memberships || { paid: 0, due: 0 };
      const newPaid = Math.max(0, (current.paid || 0) - amount);
      const updated = { ...p, memberships: { ...current, paid: newPaid } };
      pushPlayerToSupabase(updated);
      return updated;
    }));
  }, [pushPlayerToSupabase]);

  const createPlayerCredentials = useCallback(async (playerId) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { error: 'Jugador no encontrado' };

    const { data, error } = await supabase.rpc('admin_create_player_credentials', {
      p_player_id: playerId,
      p_password: null,
    });

    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };

    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      return { ...p, username: data.username || '', contacto: { ...(p.contacto || {}), email: data.email || '' } };
    }));

    return { data, username: data.username || '', password: data.password || '' };
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
        handleError(err, 'usePlayers.bulkUpdatePosition', { notifyUser: true });
      });
    }
  }, [user?.id]);

  const applyMonthlyCharge = useCallback(async (playerIds, amount) => {
    let count = 0;
    setPlayers(prev => prev.map(p => {
      if (!playerIds.includes(p.id)) return p;
      count++;
      const current = p.memberships || { paid: 0, due: 0 };
      const updated = { ...p, memberships: { ...current, due: (current.due || 0) + amount } };
      pushPlayerToSupabase(updated);
      return updated;
    }));
    return count;
  }, [pushPlayerToSupabase]);

  return {
    players, setPlayers, normalizePlayer,
    addPlayer, updatePlayer, deletePlayer,
    recordAttendance, recordMatchInfractions, redeemPenalty,
    recordPhysicalTest, recordInjury, updateInjuryPhase,
    recordMatchStats, recordWellness, runHiaProtocol,
    updateClothingSizes, updateGymStats, logWorkout,
    recordMembershipPayment, createPlayerCredentials, resetPlayerPassword, bulkUpdatePosition,
    applyMonthlyCharge, reverseMembershipPayment,
  };
}
