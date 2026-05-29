import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { supabase } from '../supabaseClient.js';
import apisupabase, { supabasePlayerToReact } from '../data/supabaseApi.js';

let LocalNotifications = null;

export const ClubContext = createContext();

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

export const CLUBS = {
  ORCOS: 'orcos',
  CUERVOS: 'cuervos',
  TROLLS: 'trolls',
  GARGOLAS: 'gargolas',
  PITBULL: 'pitbull',
  BUFFALOS: 'buffalos'
};

export const CLUBS_LABELS = {
  [CLUBS.ORCOS]: 'Orcos Negros',
  [CLUBS.CUERVOS]: 'Cuervos',
  [CLUBS.TROLLS]: 'Trolls',
  [CLUBS.GARGOLAS]: 'Gargolas',
  [CLUBS.PITBULL]: 'Pitbull',
  [CLUBS.BUFFALOS]: 'Buffalos'
};

export const SYSTEM_ROLES = {
  DESARROLLADOR: 'desarrollador',
  PROMOTOR: 'promotor',
  TESORERO: 'tesorero',
  PRESIDENTE: 'presidente',
  ENTRENADOR: 'entrenador',
  ARBITRO: 'arbitro',
  JUGADOR: 'jugador'
};

export const SYSTEM_ROLES_LABELS = {
  [SYSTEM_ROLES.DESARROLLADOR]: 'Desarrollador',
  [SYSTEM_ROLES.PROMOTOR]: 'Promotor',
  [SYSTEM_ROLES.TESORERO]: 'Tesorero',
  [SYSTEM_ROLES.PRESIDENTE]: 'Presidente',
  [SYSTEM_ROLES.ENTRENADOR]: 'Entrenador',
  [SYSTEM_ROLES.ARBITRO]: 'Arbitro',
  [SYSTEM_ROLES.JUGADOR]: 'Jugador'
};

export const SUPER_ROLES = [SYSTEM_ROLES.DESARROLLADOR, SYSTEM_ROLES.PRESIDENTE];

export const RPG_ROLES = {
  [SYSTEM_ROLES.DESARROLLADOR]: { rpg: 'Arquitecto del Reino', icon: '🏰', color: '#e040fb', tier: 0 },
  [SYSTEM_ROLES.PRESIDENTE]:    { rpg: 'Señor de la Guerra',  icon: '⚔️', color: '#ffb300', tier: 1 },
  [SYSTEM_ROLES.PROMOTOR]:      { rpg: 'Comandante de Horda', icon: '🛡️', color: '#ff6d00', tier: 2 },
  [SYSTEM_ROLES.ENTRENADOR]:   { rpg: 'Maestro de Armas',    icon: '🏋️', color: '#00e676', tier: 3 },
  [SYSTEM_ROLES.TESORERO]:     { rpg: 'Guardian del Botin',  icon: '💰', color: '#00b0ff', tier: 3 },
  [SYSTEM_ROLES.ARBITRO]:      { rpg: 'Juez del Coliseo',     icon: '⚖️', color: '#ffea00', tier: 3 },
  [SYSTEM_ROLES.JUGADOR]:       { rpg: 'Guerrero',            icon: '👹', color: '#9e9e9e', tier: 4 },
};

export function getRpgRole(role) {
  return RPG_ROLES[role] || { rpg: role, icon: '', color: '#9e9e9e', tier: 4 };
}

export const DIVISIONES = {
  MASCULINA_MAYOR: 'masculina_mayor',
  FEMENINA_MAYOR: 'femenina_mayor',
  JUVENILES_MASCULINA: 'juveniles_masculina',
  JUVENILES_FEMENINA: 'juveniles_femenina'
};

export const DIVISIONES_LABELS = {
  [DIVISIONES.MASCULINA_MAYOR]: 'Masculina Mayor',
  [DIVISIONES.FEMENINA_MAYOR]: 'Femenina Mayor',
  [DIVISIONES.JUVENILES_MASCULINA]: 'Juveniles Masculino',
  [DIVISIONES.JUVENILES_FEMENINA]: 'Juveniles Femenino'
};

export const EQUIPOS = {};
export const EQUIPOS_LABELS = {};

Object.keys(CLUBS).forEach(cKey => {
  const cVal = CLUBS[cKey];
  Object.keys(DIVISIONES).forEach(dKey => {
    const dVal = DIVISIONES[dKey];
    const comboKey = `${cVal}_${dVal}`;
    EQUIPOS[`${cKey}_${dKey}`] = comboKey;
    EQUIPOS_LABELS[comboKey] = `${CLUBS_LABELS[cVal]} - ${DIVISIONES_LABELS[dVal]}`;
  });
});

export const ClubProvider = ({ children }) => {
  const { user, profile } = useAuth();

  const currentUser = user ? { email: user.email, id: user.id } : null;
  const userRole = profile?.system_role || SYSTEM_ROLES.JUGADOR;
  const userTier = RPG_ROLES[userRole]?.tier ?? 4;

  const hasPermission = (action) => {
    if (userTier <= 0) return true;
    const role = userRole;

    const permissions = {
      view_all:         ['desarrollador','presidente'],
      create_users:     ['desarrollador','presidente','promotor'],
      manage_players:   ['desarrollador','presidente','promotor','entrenador'],
      manage_finances:  ['desarrollador','presidente','promotor','tesorero'],
      manage_discipline:['desarrollador','presidente','promotor','entrenador','arbitro'],
      manage_training:  ['desarrollador','presidente','promotor','entrenador'],
      manage_schedule:  ['desarrollador','presidente','promotor','entrenador'],
      manage_inventory: ['desarrollador','presidente','promotor','entrenador','tesorero'],
      manage_tactics:   ['desarrollador','presidente','promotor','entrenador'],
      export_import:    ['desarrollador','presidente','promotor'],
      config_ai:        ['desarrollador','presidente'],
      admin_panel:      ['desarrollador','presidente'],
    };

    return (permissions[action] || []).includes(role);
  };

  const isSuperRole = () => userTier <= 1;

  const [syncStatus, setSyncStatus] = useState('idle');

  const [dynamicClubs, setDynamicClubs] = useState(() => {
    const saved = localStorage.getItem('orcos_dynamic_clubs');
    return saved ? JSON.parse(saved) : {};
  });

  const getAllClubs = () => ({ ...CLUBS, ...dynamicClubs });

  const getAllClubsLabels = () => {
    const labels = { ...CLUBS_LABELS };
    Object.entries(dynamicClubs).forEach(([, code]) => {
      const label = code.charAt(0).toUpperCase() + code.slice(1);
      labels[code] = label;
    });
    return labels;
  };

  const addClub = (name, clubCode) => {
    if (!isSuperRole()) return false;
    const code = clubCode || name.toLowerCase().replace(/\s+/g, '_');
    if (CLUBS[code.toUpperCase()] || dynamicClubs[code.toUpperCase()]) return false;
    const newClubs = { ...dynamicClubs, [name.toUpperCase().replace(/\s+/g, '_')]: code };
    setDynamicClubs(newClubs);
    localStorage.setItem('orcos_dynamic_clubs', JSON.stringify(newClubs));
    return true;
  };

  const deleteClub = (clubCode) => {
    if (!isSuperRole()) return false;
    const newClubs = { ...dynamicClubs };
    const key = Object.keys(newClubs).find(k => newClubs[k] === clubCode);
    if (key) delete newClubs[key];
    setDynamicClubs(newClubs);
    localStorage.setItem('orcos_dynamic_clubs', JSON.stringify(newClubs));
    return true;
  };

  const [activeTeam, setActiveTeam] = useState(() => {
    return localStorage.getItem('orcos_active_team') || EQUIPOS.ORCOS_MASCULINA_MAYOR;
  });

  const normalizePlayer = (p) => ({
    ...p,
    systemRole: p.systemRole || SYSTEM_ROLES.JUGADOR,
    memberships: p.memberships || { paid: 0, due: 0 },
    infractionLog: p.infractionLog || [],
  });

  const [players, setPlayers] = useState(() => []);
  const [schedule, setSchedule] = useState(() => []);
  const [championships, setChampionships] = useState(() => []);
  const [finances, setFinances] = useState(() => []);
  const [inventory, setInventory] = useState(() => []);
  const [fixtures, setFixtures] = useState(() => []);
  const [rivals, setRivals] = useState(() => []);
  const [futureFixtures, setFutureFixtures] = useState(() => []);

  useEffect(() => {
    localStorage.setItem('orcos_active_team', activeTeam);
  }, [activeTeam]);

  useEffect(() => {
    localStorage.setItem('orcos_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('orcos_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('orcos_championships', JSON.stringify(championships));
  }, [championships]);

  useEffect(() => {
    localStorage.setItem('orcos_finances', JSON.stringify(finances));
  }, [finances]);

  useEffect(() => {
    localStorage.setItem('orcos_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('orcos_fixtures', JSON.stringify(fixtures));
  }, [fixtures]);

  useEffect(() => {
    localStorage.setItem('orcos_rivals', JSON.stringify(rivals));
  }, [rivals]);

  useEffect(() => {
    localStorage.setItem('orcos_future_fixtures', JSON.stringify(futureFixtures));
  }, [futureFixtures]);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const mod = await import('@capacitor/local-notifications');
        LocalNotifications = mod.LocalNotifications;
        await LocalNotifications.requestPermissions();
      } catch (err) {
        // Notificaciones nativas no soportadas en este navegador
      }
    };
    initNotifications();
  }, []);

  const sendLocalNotification = async (title, body) => {
    try {
      if (LocalNotifications) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now() + Math.floor(Math.random() * 1000),
              schedule: { at: new Date(Date.now() + 1000) },
              sound: null,
              attachments: null,
              actionTypeId: '',
              extra: null
            }
          ]
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/assets/orcos_logo.png' });
      }
    } catch (err) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/assets/orcos_logo.png' });
      }
    }
  };

  // ── SINCRONIZACION CON SUPABASE ──
  useEffect(() => {
    if (!user?.id) return;

    const syncFromSupabase = async () => {
      setSyncStatus('syncing');
      console.log('[Sync] Iniciando sync para user:', user.id);

      localStorage.clear();
      console.log('[Sync] localStorage limpiado, cargando desde Supabase...');

      try {
        console.log('[Sync] Iniciando sync para user:', user.id);
        const result = await supabase.from('players').select('*').eq('user_id', user.id);
        console.log('[Sync] Resultado players:', { count: result.data?.length, error: result.error?.message });

        if (result.error) throw result.error;

        const dbPlayers = result.data;
        if (dbPlayers && dbPlayers.length > 0) {
          const normalized = dbPlayers.map(supabasePlayerToReact);
          console.log('[Sync] Normalizados', normalized.length, 'jugadores. Ejemplo:', normalized[0]?.name);
          setPlayers(normalized);
          localStorage.setItem('orcos_players', JSON.stringify(normalized));
          console.log('[Supabase] Sincronizados', normalized.length, 'jugadores');
        } else {
          console.log('[Sync] No se encontraron jugadores en Supabase. user_id:', user.id);
        }

        const appData = await apisupabase.fetchAll(user.id);
        if (appData) {
          if (appData.schedule?.length > 0) {
            const schedMapped = appData.schedule.map(e => ({
              id: e.id, title: e.title, date: e.date, time: e.time,
              location: e.location, mapsLink: e.maps_link, type: e.type,
              teamCategory: e.team_category, linkedRoutine: e.linked_routine,
              recurrenceGroup: e.recurrence_group
            }));
            setSchedule(schedMapped);
            localStorage.setItem('orcos_schedule', JSON.stringify(schedMapped));
          }
          if (appData.championships?.length > 0) {
            const chMapped = appData.championships.map(c => ({
              id: c.id, name: c.name, deadlineDate: c.deadline_date,
              description: c.description, teamCategory: c.team_category
            }));
            setChampionships(chMapped);
            localStorage.setItem('orcos_championships', JSON.stringify(chMapped));
          }
          if (appData.finances?.length > 0) {
            const finMapped = appData.finances.map(f => ({
              id: f.id, type: f.type, desc: f.descripcion, amount: f.amount,
              date: f.date, category: f.category, teamCategory: f.team_category
            }));
            setFinances(finMapped);
            localStorage.setItem('orcos_finances', JSON.stringify(finMapped));
          }
          if (appData.inventory?.length > 0) {
            const invMapped = appData.inventory.map(i => ({
              id: i.id, name: i.name, total: i.total,
              assignedTo: i.assigned_to, status: i.status, teamCategory: i.team_category
            }));
            setInventory(invMapped);
            localStorage.setItem('orcos_inventory', JSON.stringify(invMapped));
          }
          if (appData.fixtures?.length > 0) {
            const fixMapped = appData.fixtures.map(f => ({
              id: f.id, date: f.date, opponent: f.opponent,
              orcosScore: f.orcos_score, opponentScore: f.opponent_score,
              tries: f.tries, mvp: f.mvp, teamCategory: f.team_category
            }));
            setFixtures(fixMapped);
            localStorage.setItem('orcos_fixtures', JSON.stringify(fixMapped));
          }
          if (appData.rivals?.length > 0) {
            const rivMapped = appData.rivals.map(r => ({
              id: r.id, name: r.name, colors: r.colors,
              contact: r.contact, notes: r.notes
            }));
            setRivals(rivMapped);
            localStorage.setItem('orcos_rivals', JSON.stringify(rivMapped));
          }
          if (appData.futureFixtures?.length > 0) {
            const ffMapped = appData.futureFixtures.map(f => ({
              id: f.id, opponent: f.opponent, date: f.date,
              time: f.time, location: f.location, teamCategory: f.team_category
            }));
            setFutureFixtures(ffMapped);
            localStorage.setItem('orcos_future_fixtures', JSON.stringify(ffMapped));
          }
        }
        setSyncStatus('online');
      } catch (err) {
        console.warn('[Supabase] Error de sincronizacion:', err.message);
        setSyncStatus('offline');
      }
    };

    syncFromSupabase();
  }, [user?.id]);

  const convertPlayerToSupabase = (player) => {
    const nameParts = (player.name || '').split(' ');
    return {
      id: player.id,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      nickname: player.apodo || null,
      jersey_number: player.camiseta,
      phone: player.contacto?.phone || null,
      email: player.contacto?.email || null,
      role: player.rol || 'Titular',
      position: player.posicion || '',
      status: player.estado || 'activo',
      attr_force: player.attributes?.force ?? 50,
      attr_speed: player.attributes?.speed ?? 50,
      attr_stamina: player.attributes?.stamina ?? 50,
      attr_technique: player.attributes?.technique ?? 70,
      team_category: player.teamCategory || activeTeam,
      system_role: player.systemRole || 'jugador',
      weight_kg: player.weight || null,
      height_m: player.height || null,
      clothing_jersey: player.clothingSizes?.jersey || 'M',
      clothing_shorts: player.clothingSizes?.shorts || 'M',
      clothing_socks: player.clothingSizes?.socks || '40-42',
      gym_squat: player.gymStats?.squat || 0,
      gym_bench: player.gymStats?.bench || 0,
      gym_deadlift: player.gymStats?.deadlift || 0,
      document_type: player._meta?.docType || null,
      document_number: player._meta?.docNum || null,
      age: player._meta?.age || null,
      start_year: player._meta?.startYear || null,
      source: 'manual',
    };
  };

  const pushPlayerToSupabase = async (player) => {
    if (!user?.id) return;
    try {
      const supabasePlayer = convertPlayerToSupabase(player);
      await apisupabase.upsertPlayer(supabasePlayer, user.id);
    } catch (err) {
      console.warn('[Supabase] Error al sincronizar jugador:', err.message);
    }
  };

  const pushEntityToSupabase = async (entityType, record) => {
    if (!user?.id) return;
    try {
      const map = {
        schedule: (r) => ({
          id: r.id, title: r.title, date: r.date, time: r.time, location: r.location,
          maps_link: r.mapsLink, type: r.type || 'entrenamiento', team_category: r.teamCategory,
          linked_routine: r.linkedRoutine, recurrence_group: r.recurrenceGroup
        }),
        championships: (r) => ({
          id: r.id, name: r.name, deadline_date: r.deadlineDate,
          description: r.description, team_category: r.teamCategory
        }),
        finances: (r) => ({
          id: r.id, type: r.type, descripcion: r.desc, amount: r.amount,
          date: r.date, category: r.category, team_category: r.teamCategory
        }),
        inventory: (r) => ({
          id: r.id, name: r.name, total: r.total,
          assigned_to: r.assignedTo, status: r.status, team_category: r.teamCategory
        }),
        fixtures: (r) => ({
          id: r.id, date: r.date, opponent: r.opponent,
          orcos_score: r.orcosScore, opponent_score: r.opponentScore,
          tries: r.tries, mvp: r.mvp, team_category: r.teamCategory
        }),
        rivals: (r) => ({
          id: r.id, name: r.name, colors: r.colors, contact: r.contact, notes: r.notes
        }),
        futureFixtures: (r) => ({
          id: r.id, opponent: r.opponent, date: r.date,
          time: r.time, location: r.location, team_category: r.teamCategory
        }),
      };
      const mapper = map[entityType];
      if (!mapper) return;
      await apisupabase.upsertEntity(entityType, mapper(record), user.id);
    } catch (err) {
      console.warn(`[Supabase] Error al sincronizar ${entityType}:`, err.message);
    }
  };

  const addPlayer = async (player) => {
    const newPlayer = {
      ...player,
      id: generateId('p_'),
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
  };

  const updatePlayer = async (updatedPlayer) => {
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
  };

  const deletePlayer = async (id) => {
    const playerToDelete = players.find(p => p.id === id);
    setPlayers(prev => prev.filter(p => p.id !== id));
    if (playerToDelete) {
      sendLocalNotification('Orco Licenciado', `${playerToDelete.name} fue dado de baja del roster.`);
    }
    if (user?.id) {
      try { await apisupabase.deletePlayer(id); } catch (err) {
        console.warn('[Supabase] Error al eliminar jugador:', err.message);
      }
    }
  };

  const recordAttendance = (sessionDate, attendanceList) => {
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
  };

  const recordMatchInfractions = (matchDate, infractionsList) => {
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
  };

  const redeemPenalty = (playerId, type) => {
    setPlayers(prev => prev.map(player => {
      if (player.id !== playerId) return player;
      const newPenalties = { ...player.penalties };
      let newEstado = player.estado;
      if (type === 'burpees') newPenalties.burpees = 0;
      else if (type === 'cones') newPenalties.cones = false;
      if (newEstado === 'suspendido' && newPenalties.burpees === 0) newEstado = 'activo';
      return { ...player, penalties: newPenalties, estado: newEstado };
    }));
  };

  const recordPhysicalTest = (playerId, testDate, attributes) => {
    setPlayers(prev => prev.map(player => {
      if (player.id !== playerId) return player;
      const newHistory = [...player.history, { date: testDate, ...attributes }];
      return { ...player, attributes, history: newHistory };
    }));
  };

  const recordInjury = (playerId, diagnosis, weeks, date = new Date().toISOString().split('T')[0]) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      return { ...p, estado: 'lesionado', injuryLog: [{ diagnosis: sanitize(diagnosis), date, weeks, phase: 1 }] };
    }));
  };

  const updateInjuryPhase = (playerId, phase) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      if (p.injuryLog.length === 0) return p;
      const newLog = [...p.injuryLog];
      newLog[0] = { ...newLog[0], phase: Number(phase) };
      let newEstado = p.estado;
      if (Number(phase) === 4) newEstado = 'activo';
      return { ...p, estado: newEstado, injuryLog: newEstado === 'activo' ? [] : newLog };
    }));
  };

  const recordMatchStats = (playerId, stats) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      let newEstado = p.estado;
      if (Number(stats.redCards) > 0) newEstado = 'suspendido';
      return {
        ...p, estado: newEstado,
        matchStats: [...(p.matchStats || []), { id: generateId('st_'), ...stats, opponent: sanitize(stats.opponent) }]
      };
    }));
  };

  const recordWellness = (playerId, wellnessData) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const logs = p.wellnessLogs || [];
      return { ...p, wellnessLogs: [...logs, { id: generateId('wl_'), ...wellnessData }].slice(-30) };
    }));
  };

  const runHiaProtocol = (playerId, symptomsDetected) => {
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
  };

  const updateInventoryItem = (itemId, updatedData) => {
    const safe = { ...updatedData };
    if (safe.assignedTo) safe.assignedTo = sanitize(safe.assignedTo);
    if (safe.status) safe.status = sanitize(safe.status);
    setInventory(prev => {
      const updated = prev.map(item => item.id === itemId ? { ...item, ...safe } : item);
      const changed = updated.find(item => item.id === itemId);
      if (changed) pushEntityToSupabase('inventory', changed);
      return updated;
    });
  };

  const updateClothingSizes = (playerId, sizes) => {
    const safe = { jersey: sanitize(sizes.jersey), shorts: sanitize(sizes.shorts), socks: sanitize(sizes.socks) };
    setPlayers(prev => prev.map(p => p.id !== playerId ? p : { ...p, clothingSizes: safe }));
  };

  const addScheduleEvent = (event) => {
    const events = [];
    const baseEvent = {
      title: sanitize(event.title), location: sanitize(event.location),
      time: event.time, mapsLink: sanitize(event.mapsLink || ''),
      type: event.type || 'entrenamiento', teamCategory: activeTeam
    };
    const recurrence = event.recurrence || 'none';
    const weeks = recurrence === 'semanal' ? 4 : recurrence === 'quincenal' ? 2 : 1;
    for (let i = 0; i < weeks; i++) {
      const eventDate = new Date(event.date + 'T00:00:00');
      const daysToAdd = recurrence === 'quincenal' ? i * 14 : i * 7;
      eventDate.setDate(eventDate.getDate() + daysToAdd);
      const newEvent = {
        ...baseEvent, id: generateId('s_'), date: eventDate.toISOString().split('T')[0],
        linkedRoutine: event.linkedRoutine || null,
        recurrenceGroup: recurrence !== 'none' ? event.recurrenceGroup || generateId('rg_') : null
      };
      events.push(newEvent);
    }
    setSchedule(prev => [...prev, ...events]);
    events.forEach(e => pushEntityToSupabase('schedule', e));
    sendLocalNotification('Evento Programado', `${events.length} evento(s): ${baseEvent.title} desde ${events[0].date}.`);
  };

  const deleteScheduleEvent = (id) => {
    setSchedule(prev => prev.filter(e => e.id !== id));
    if (user?.id) {
      apisupabase.deleteEntity('schedule', id).catch(() => {});
    }
  };

  const generateWhatsAppMessage = (event) => {
    const dateFormatted = new Date(event.date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    return '*CONVOCATORIA RUGBY ORCOS*\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      `*Fecha:* ${dateFormatted}\n` +
      `*Hora:* ${event.time} PM\n` +
      `*Lugar:* ${event.location}\n` +
      `*Categoria convocada:* ${EQUIPOS_LABELS[activeTeam]}\n` +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      `*Google Maps:* ${event.mapsLink}\n\n` +
      'Puntualidad de Orco, lleven hidratacion y protector bucal!  #RugbyOrcos';
  };

  const addFinanceRecord = (record) => {
    const newRecord = {
      ...record, desc: sanitize(record.desc), id: generateId('fin_'),
      date: record.date || new Date().toISOString().split('T')[0], teamCategory: activeTeam
    };
    setFinances(prev => [...prev, newRecord]);
    pushEntityToSupabase('finances', newRecord);
  };

  const addChampionship = (champ) => {
    const newChamp = {
      ...champ, name: sanitize(champ.name), description: sanitize(champ.description || ''),
      id: generateId('c_'), teamCategory: activeTeam
    };
    setChampionships(prev => [...prev, newChamp]);
    pushEntityToSupabase('championships', newChamp);
  };

  const recordMembershipPayment = (playerId, amount) => {
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
    const record = {
      desc: `Abono Membresia - ${playerName || 'Jugador'}`, amount, type: 'ingreso',
      date: today, id: generateId('fin_'), category: 'mensualidad', teamCategory: activeTeam
    };
    setFinances(prev => [...prev, record]);
    pushEntityToSupabase('finances', record);
    sendLocalNotification('Abono Registrado', `Se registro un abono de $${amount.toLocaleString()} COP.`);
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ players, schedule, championships, finances, inventory, fixtures, rivals, futureFixtures, orcos_active_team: activeTeam }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `rugby_orcos_database_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  const importData = (jsonData) => {
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
      console.error('[IMPORT] ERROR:', err.message);
      return false;
    }
  };

  const logWorkout = (playerId, workoutData) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const newLog = { id: generateId('wl_'), date: new Date().toISOString().split('T')[0], ejercicios: workoutData.ejercicios || [], type: workoutData.type || 'general' };
      return { ...p, workoutLog: [...(p.workoutLog || []), newLog] };
    }));
  };

  const updateGymStats = (playerId, gymStats) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      return {
        ...p,
        gymStats: { squat: Number(gymStats.squat || 0), bench: Number(gymStats.bench || 0), deadlift: Number(gymStats.deadlift || 0) },
        weight: Number(gymStats.weight || 85)
      };
    }));
  };

  const addFixture = (fixture) => {
    const newFix = {
      ...fixture, opponent: sanitize(fixture.opponent), mvp: sanitize(fixture.mvp || ''),
      id: generateId('fix_'), teamCategory: activeTeam
    };
    setFixtures(prev => [...prev, newFix]);
    pushEntityToSupabase('fixtures', newFix);
  };

  const deleteFixture = (id) => {
    setFixtures(prev => prev.filter(f => f.id !== id));
    if (user?.id) {
      apisupabase.deleteEntity('fixtures', id).catch(() => {});
    }
  };

  const addRival = (rival) => {
    const newRival = {
      ...rival, id: generateId('riv_'), name: sanitize(rival.name),
      colors: sanitize(rival.colors || ''), contact: sanitize(rival.contact || ''),
      notes: sanitize(rival.notes || '')
    };
    setRivals(prev => [...prev, newRival]);
    pushEntityToSupabase('rivals', newRival);
  };

  const updateRival = (updatedRival) => {
    const safe = {
      ...updatedRival, name: sanitize(updatedRival.name),
      colors: sanitize(updatedRival.colors || ''), contact: sanitize(updatedRival.contact || ''),
      notes: sanitize(updatedRival.notes || '')
    };
    setRivals(prev => prev.map(r => r.id === updatedRival.id ? safe : r));
    pushEntityToSupabase('rivals', safe);
  };

  const deleteRival = (id) => {
    setRivals(prev => prev.filter(r => r.id !== id));
    if (user?.id) {
      apisupabase.deleteEntity('rivals', id).catch(() => {});
    }
  };

  const addFutureFixture = (fixture) => {
    const newFix = {
      ...fixture, opponent: sanitize(fixture.opponent), id: generateId('ffix_'), teamCategory: activeTeam
    };
    setFutureFixtures(prev => [...prev, newFix]);
    pushEntityToSupabase('futureFixtures', newFix);
    sendLocalNotification('Proximo Partido Agendado', `vs ${newFix.opponent} el ${newFix.date} a las ${newFix.time || ''}.`);
  };

  const deleteFutureFixture = (id) => {
    setFutureFixtures(prev => prev.filter(f => f.id !== id));
    if (user?.id) {
      apisupabase.deleteEntity('futureFixtures', id).catch(() => {});
    }
  };

  const createPlayerCredentials = async (playerId, password) => {
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
  };

  const resetPlayerPassword = async (playerId, newPassword) => {
    const { data, error } = await supabase.rpc('admin_reset_player_password', {
      p_player_id: playerId,
      p_new_password: newPassword,
    });

    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { data };
  };

  const resetStaffPassword = async (userId, newPassword) => {
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
      players, addPlayer, updatePlayer, deletePlayer,
      recordAttendance, recordMatchInfractions, redeemPenalty,
      recordPhysicalTest, recordInjury, updateInjuryPhase,
      recordMatchStats, recordWellness, runHiaProtocol,
      inventory, updateInventoryItem, updateClothingSizes,
      schedule, addScheduleEvent, deleteScheduleEvent, generateWhatsAppMessage,
      championships, addChampionship,
      finances, addFinanceRecord,
      exportData, importData,
      fixtures, addFixture, deleteFixture,
      updateGymStats, logWorkout,
      currentUser, isSuperRole, syncStatus, hasPermission, userRole, userTier,
      dynamicClubs, getAllClubs, getAllClubsLabels, addClub, deleteClub,
      recordMembershipPayment,
      rivals, addRival, updateRival, deleteRival,
      futureFixtures, addFutureFixture, deleteFutureFixture,
      createPlayerCredentials, resetPlayerPassword, resetStaffPassword
    }}>
      {children}
    </ClubContext.Provider>
  );
};
