import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import apisupabase, { supabasePlayerToReact } from '../../data/supabaseApi.js';
import { handleError } from '../../utils/errorHandler';
import { playerSchema } from '../../schemas/player.js';
import { parseFullName } from '../../utils/nameParser.js';
import { mapFinanceRow } from './useEntities.js';
import { startRealtimeBridge } from '../../services/realtimeBridge.js';

const RESYNC_DEBOUNCE_MS = 1200;

// Tablas cuyo estado vive en ClubContext (las demás las recarga cada pantalla
// con useDataListener: mensajes, campañas, torneos...).
export const CONTEXT_TABLES = new Set([
  'players', 'injury_log', 'hia_assessments', 'wellness_logs', 'workout_logs',
  'attribute_history', 'match_stats', 'infractions', 'player_attendance_summary',
  'penalties', 'player_payments', 'schedule_events', 'championships', 'finances',
  'inventory', 'fixtures', 'rivals', 'future_fixtures', 'match_invitations',
  'guest_players', 'player_loans',
]);

export function useSyncPush(user) {
  const convertPlayerToSupabase = useCallback((player) => {
    const parsed = (player.firstName || player.middleName || player.lastName || player.secondLastName)
      ? {
          firstName: player.firstName,
          middleName: player.middleName,
          lastName: player.lastName,
          secondLastName: player.secondLastName
        }
      : parseFullName(player.name || '');
    return {
      id: player.id,
      first_name: parsed.firstName || '',
      middle_name: parsed.middleName || null,
      last_name: parsed.lastName || '',
      second_last_name: parsed.secondLastName || null,
      nickname: player.apodo || null,
      jersey_number: player.camiseta ?? null,
      phone: player.contacto?.phone || null,
      email: player.contacto?.email || null,
      role: player.rol || 'Titular',
      position: player.posicion || '',
      position_id: player.position_id || null,
      status: player.estado || 'activo',
      attr_force: player.attributes?.force ?? 50,
      attr_speed: player.attributes?.speed ?? 50,
      attr_stamina: player.attributes?.stamina ?? 50,
      attr_technique: player.attributes?.technique ?? 50,
      team_category: player.teamCategory,
      team_id: player.teamId ?? undefined,
      system_role: player.systemRole || 'jugador',
      makgora_team_id: player.makgora_team_id || null,
      weight_kg: player.weight || null,
      height_m: player.height || null,
      clothing_jersey: player.clothingSizes?.jersey || 'M',
      clothing_shorts: player.clothingSizes?.shorts || 'M',
      clothing_socks: player.clothingSizes?.socks || '40-42',
      gym_squat: player.gymStats?.squat || 0,
      gym_bench: player.gymStats?.bench || 0,
      gym_deadlift: player.gymStats?.deadlift || 0,
      document_type: player._meta?.docType || player.document_type || null,
      document_number: player._meta?.docNum || player.document_number || null,
      age: player._meta?.age ?? player.age ?? null,
      start_year: player._meta?.startYear ?? player.start_year ?? null,
      birth_date: player.birth_date || null,
      had_fractures: player.had_fractures || false,
      fracture_details: player.fracture_details || null,
      allergies: player.allergies || null,
      medical_conditions: player.medical_conditions || null,
      health_insurance: player.health_insurance || null,
      emergency_contact_name: player.emergency_contact_name || null,
      emergency_contact_phone: player.emergency_contact_phone || null,
      avatar_id: player.avatar_id || null,
      photo_url: player.photo_url || null,
      memberships_paid: player.memberships?.paid ?? 0,
      memberships_due: player.memberships?.due ?? 0,
      last_payment_date: player.memberships?.lastPayment || null,
      last_payment_amount: player.memberships?.lastAmount || null,
      ...(player.userId !== undefined ? { user_id: player.userId } : {}),
      ...(player.username !== undefined ? { username: player.username } : {}),
      ...(player.deleted_at !== undefined ? { deleted_at: player.deleted_at } : {}),
      ...(player.preferences !== undefined ? { preferences: player.preferences } : {}),
      source: 'manual',
    };
  }, []);

  const pushPlayerToSupabase = useCallback(async (player) => {
    if (!user?.id) return;
    try {
      const parsed = playerSchema.safeParse(player);
      if (!parsed.success) {
        handleError(
          new Error('Player schema validation failed on write: ' + parsed.error.issues.map(i => i.path.join('.') + ': ' + i.message).join('; ')),
          'useSync.pushPlayer',
          { silent: true }
        );
      }
      const supabasePlayer = convertPlayerToSupabase(parsed.success ? parsed.data : player);
      await apisupabase.upsertPlayer(supabasePlayer, user.id);
    } catch (err) {
      handleError(err, 'useSync.pushPlayer', { notifyUser: true });
    }
  }, [user?.id, convertPlayerToSupabase]);

  const pushEntityToSupabase = useCallback(async (entityType, record) => {
    if (!user?.id) return;
    try {
      const map = {
        schedule: (r) => ({
          id: r.id, title: r.title, date: r.date, time: r.time, location: r.location,
          maps_link: r.mapsLink, type: r.type || 'entrenamiento', team_category: r.teamCategory,
          team_id: r.teamId, linked_routine: r.linkedRoutine, recurrence_group: r.recurrenceGroup,
          notes: r.notes || null, end_date: r.endDate || null,
          scope_type: r.scopeType || 'division', scope_value: r.scopeValue || {}
        }),
        championships: (r) => ({
          id: r.id, name: r.name, deadline_date: r.deadlineDate,
          description: r.description, team_category: r.teamCategory, team_id: r.teamId
        }),
        finances: (r) => ({
          id: r.id, type: r.type, descripcion: r.desc, amount: r.amount,
          date: r.date, category: r.category, team_category: r.teamCategory, team_id: r.teamId
        }),
        inventory: (r) => ({
          id: r.id, name: r.name, total: r.total,
          assigned_to: r.assignedTo, status: r.status, team_category: r.teamCategory, team_id: r.teamId
        }),
        fixtures: (r) => ({
          id: r.id, date: r.date, opponent: r.opponent,
          orcos_score: r.orcosScore, opponent_score: r.opponentScore,
          tries: r.tries, mvp: r.mvp, team_category: r.teamCategory, team_id: r.teamId,
          rival_id: r.rivalId || null,
          ...(r.squad !== undefined ? { squad: r.squad } : {})
        }),
        rivals: (r) => ({
          id: r.id, name: r.name, colors: r.colors, contact: r.contact, notes: r.notes,
          // Only sent once a crest exists, so saves keep working before migration 73 is applied.
          ...(r.crestUrl ? { crest_url: r.crestUrl } : {})
        }),
        futureFixtures: (r) => ({
          id: r.id, opponent: r.opponent, date: r.date,
          time: r.time, location: r.location, team_category: r.teamCategory, team_id: r.teamId,
          rival_id: r.rivalId || null,
          ...(r.availabilities !== undefined ? { availabilities: r.availabilities } : {}),
          ...(r.squad !== undefined ? { squad: r.squad } : {})
        }),
      };
      const mapper = map[entityType];
      if (!mapper) return;
      await apisupabase.upsertEntity(entityType, mapper(record), user.id);
    } catch (err) {
      handleError(err, 'useSync.pushEntity', { notifyUser: true });
    }
  }, [user?.id]);

  return { pushPlayerToSupabase, pushEntityToSupabase };
}

export function useSync(user, userTier, profile,
  setPlayers, setSchedule, setChampionships, setFinances,
  setInventory, setFixtures, setRivals, setFutureFixtures,
  setMatchInvitations, setLoans,
  mensualidadBase = 10000
) {
  const { pushPlayerToSupabase, pushEntityToSupabase } = useSyncPush(user);
  const { syncStatus } = useSyncPull(user, userTier, profile,
    setPlayers, setSchedule, setChampionships, setFinances,
    setInventory, setFixtures, setRivals, setFutureFixtures,
    setMatchInvitations, setLoans,
    mensualidadBase
  );
  return { syncStatus, pushPlayerToSupabase, pushEntityToSupabase };
}

export function useSyncPull(
  user, userTier, profile,
  setPlayers, setSchedule, setChampionships, setFinances,
  setInventory, setFixtures, setRivals, setFutureFixtures,
  setMatchInvitations, setLoans,
  mensualidadBase = 10000
) {
  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
    if (!user?.id) return;

    const syncFromSupabase = async ({ silent = false } = {}) => {
      if (!silent) setSyncStatus('syncing');
      if (import.meta.env.DEV) console.log('[Sync] Iniciando sync para user:', user.id);

      try {
        const playerQuery = supabase.from('players').select('*');
        if (userTier >= 4) {
          playerQuery.eq('user_id', user.id);
        } else if (userTier >= 2) {
          if (profile?.team_id) {
            playerQuery.eq('team_id', profile.team_id);
          } else if (profile?.club_scope) {
            playerQuery.ilike('team_category', profile.club_scope + '%');
          }
          // No team or scope: staff loads every player in the club.
        }
        const { data: dbPlayers, error: playerError } = await playerQuery;
        if (import.meta.env.DEV) console.log('[Sync] Resultado players:', { count: dbPlayers?.length, error: playerError?.message });

        if (!playerError && dbPlayers?.length > 0) {
          const normalized = dbPlayers.map(supabasePlayerToReact);

          const { data: payments, error: paymentsError } = await supabase
            .from('player_payments')
            .select('player_id, amount')
            .eq('source', 'membership');

          if (paymentsError) {
            console.error('[Sync] Error al cargar pagos:', paymentsError);
          } else if (payments?.length > 0) {
            if (import.meta.env.DEV) console.log('[Sync] Pagos de membresia cargados:', payments.length);
            const paymentTotals = {};
            payments.forEach(p => {
              paymentTotals[p.player_id] = (paymentTotals[p.player_id] || 0) + Number(p.amount);
            });
            normalized.forEach(player => {
              const paid = paymentTotals[player.id] || 0;
              if (paid > 0) player.memberships.paid = paid;
              if (!player.memberships.due || player.memberships.due <= 0) {
                player.memberships.due = mensualidadBase;
              }
            });
          }

          const { data: attendanceSummaries } = await supabase
            .from('player_attendance_summary')
            .select('*');
          if (attendanceSummaries?.length > 0) {
            if (import.meta.env.DEV) console.log('[Sync] Attendance summaries cargados:', attendanceSummaries.length);
            const summaryMap = {};
            attendanceSummaries.forEach(s => { summaryMap[s.player_id] = s; });
            normalized.forEach(player => {
              const s = summaryMap[player.id];
              if (s) {
                player.attendance = {
                  total: s.total || 0, present: s.present || 0,
                  late: s.late || 0, absentUnjustified: s.absent_unjustified || 0,
                  absentJustified: s.absent_justified || 0,
                };
              }
            });
          }

          const { data: penaltyRecords } = await supabase
            .from('penalties')
            .select('*');
          if (penaltyRecords?.length > 0) {
            if (import.meta.env.DEV) console.log('[Sync] Penalties cargados:', penaltyRecords.length);
            const penaltyMap = {};
            penaltyRecords.forEach(p => { penaltyMap[p.player_id] = p; });
            normalized.forEach(player => {
              const p = penaltyMap[player.id];
              if (p) {
                player.penalties = { burpees: p.burpees || 0, cones: p.cones || false };
              }
            });
          }

          const [
            { data: matchStatsRows },
            { data: injuryRows },
            { data: wellnessRows },
            { data: workoutRows },
            { data: infractionRows },
            { data: historyRows },
            { data: hiaRows },
          ] = await Promise.all([
            supabase.from('match_stats').select('*'),
            supabase.from('injury_log').select('*'),
            supabase.from('wellness_logs').select('*'),
            supabase.from('workout_logs').select('*'),
            supabase.from('infractions').select('*'),
            supabase.from('attribute_history').select('*'),
            supabase.from('hia_assessments').select('*'),
          ]);

          const groupByPlayer = (rows) => {
            const map = {};
            (rows || []).forEach(r => {
              if (!map[r.player_id]) map[r.player_id] = [];
              map[r.player_id].push(r);
            });
            return map;
          };

          const matchStatsMap = groupByPlayer(matchStatsRows);
          const injuryMap = groupByPlayer(injuryRows);
          const wellnessMap = groupByPlayer(wellnessRows);
          const workoutMap = groupByPlayer(workoutRows);
          const infractionMap = groupByPlayer(infractionRows);
          const historyMap = groupByPlayer(historyRows);
          const hiaMap = groupByPlayer(hiaRows);

          normalized.forEach(player => {
            if (matchStatsMap[player.id]?.length) {
              player.matchStats = matchStatsMap[player.id].map(s => ({
                id: s.id, date: s.match_date, opponent: s.opponent,
                tries: s.tries || 0, conversions: s.conversions || 0,
                tackles: s.tackles || 0, turnovers: s.turnovers || 0,
                yellowCards: s.yellow_cards || 0, redCards: s.red_cards || 0,
                mvp: s.mvp || false,
              }));
            }
            if (injuryMap[player.id]?.length) {
              player.injuryLog = injuryMap[player.id]
                .filter(i => Number(i.phase || 1) < 4)
                .map(i => ({
                  diagnosis: i.diagnosis, date: i.injury_date || '',
                  weeks: i.recovery_weeks || 0, phase: i.phase || 1,
                }));
            }
            if (wellnessMap[player.id]?.length) {
              player.wellnessLogs = wellnessMap[player.id].map(w => ({
                id: w.id, date: w.log_date, sleep: w.sleep_quality,
                soreness: w.muscle_soreness, stress: w.stress_level,
              }));
            }
            if (workoutMap[player.id]?.length) {
              player.workoutLog = workoutMap[player.id].map(w => ({
                id: w.id, date: w.workout_date, routine: w.routine_name,
                category: w.category, exercises: w.exercises || [],
                ejercicios: w.exercises || [], exerciseLogs: w.exercise_logs || [],
                completed: w.completed || false,
              }));
            }
            if (infractionMap[player.id]?.length) {
              player.infractionLog = infractionMap[player.id].map(i => ({
                id: i.id, date: i.infraction_date,
                penales: i.penalties || 0, amarillas: i.yellow_cards || 0,
                rojas: i.red_cards || 0, faultType: i.fault_type,
                context: i.context, notes: i.notes,
              }));
            }
            if (historyMap[player.id]?.length) {
              player.history = historyMap[player.id].map(h => ({
                date: h.recorded_date, source: h.source || 'auto',
                force: h.attr_force, speed: h.attr_speed,
                stamina: h.attr_stamina, technique: h.attr_technique,
              }));
            }
            if (hiaMap[player.id]?.length) {
              player.hiaAssessments = hiaMap[player.id];
            }
          });

          setPlayers(normalized);
        } else if (!playerError) {
          setPlayers([]);
        }

        const appData = await apisupabase.fetchAll(user.id, userTier, profile?.club_scope, profile?.team_id);
        if (!appData) throw new Error('No se pudieron cargar los datos');

        if (appData.schedule) {
          const mapped = appData.schedule.map(e => ({
            id: e.id, title: e.title, date: e.date, time: e.time,
            location: e.location, mapsLink: e.maps_link, type: e.type,
            teamCategory: e.team_category, teamId: e.team_id, linkedRoutine: e.linked_routine,
            recurrenceGroup: e.recurrence_group,
            notes: e.notes || null, endDate: e.end_date || null,
            scopeType: e.scope_type || 'division', scopeValue: e.scope_value || {},
          }));
          setSchedule(mapped);
        } else { setSchedule([]); }

        if (appData.championships) {
          const mapped = appData.championships.map(c => ({
            id: c.id, name: c.name, deadlineDate: c.deadline_date,
            description: c.description, teamCategory: c.team_category, teamId: c.team_id
          }));
          setChampionships(mapped);
        } else { setChampionships([]); }

        if (appData.finances) {
          const mapped = appData.finances.map(mapFinanceRow);
          setFinances(mapped);
        } else { setFinances([]); }

        if (appData.inventory) {
          const mapped = appData.inventory.map(i => ({
            id: i.id, name: i.name, total: i.total,
            assignedTo: i.assigned_to, status: i.status, teamCategory: i.team_category, teamId: i.team_id
          }));
          setInventory(mapped);
        } else { setInventory([]); }

        if (appData.fixtures) {
          const mapped = appData.fixtures.map(f => ({
            id: f.id, date: f.date, opponent: f.opponent,
            orcosScore: f.orcos_score, opponentScore: f.opponent_score,
            tries: f.tries, mvp: f.mvp, teamCategory: f.team_category, teamId: f.team_id,
            rivalId: f.rival_id, squad: f.squad || []
          }));
          setFixtures(mapped);
        } else { setFixtures([]); }

        if (appData.rivals) {
          const mapped = appData.rivals.map(r => ({
            id: r.id, name: r.name, colors: r.colors,
            contact: r.contact, notes: r.notes, crestUrl: r.crest_url || null
          }));
          setRivals(mapped);
        } else { setRivals([]); }

        if (appData.futureFixtures) {
          const mapped = appData.futureFixtures.map(f => ({
            id: f.id, opponent: f.opponent, date: f.date,
            time: f.time, location: f.location, teamCategory: f.team_category, teamId: f.team_id,
            rivalId: f.rival_id,
            availabilities: f.availabilities || {},
            squad: f.squad || [],
          }));
          setFutureFixtures(mapped);
        } else { setFutureFixtures([]); }

        const invitationsData = await apisupabase.fetchInvitations(user.id, userTier, profile?.club_scope);
        if (invitationsData?.length > 0) {
          const mapped = invitationsData.map(inv => ({
            id: inv.id, futureFixtureId: inv.future_fixture_id,
            token: inv.token, rivalName: inv.rival_name, rivalId: inv.rival_id,
            status: inv.status, expiresAt: inv.expires_at,
            guestCount: inv.guest_count || 0, response: inv.response || 'pending',
            responseNotes: inv.response_notes, respondedAt: inv.responded_at,
            createdAt: inv.created_at,
            futureFixture: inv.future_fixtures ? {
              id: inv.future_fixtures.id, opponent: inv.future_fixtures.opponent,
              date: inv.future_fixtures.date, time: inv.future_fixtures.time,
              location: inv.future_fixtures.location, rivalId: inv.future_fixtures.rival_id,
            } : null,
            guests: (inv.guest_players || []).map(g => ({
              id: g.id, name: g.name, number: g.number,
              position: g.position, notes: g.notes,
            })),
          }));
          setMatchInvitations(mapped);
        } else { setMatchInvitations([]); }

        const { data: loansData } = await apisupabase.fetchLoans();
        if (loansData?.length > 0) {
          setLoans(loansData);
        } else { setLoans([]); }

        setSyncStatus('online');
        if (import.meta.env.DEV) console.log('[Supabase] Sincronizados', dbPlayers?.length || 0, 'jugadores');
      } catch (err) {
        handleError(err, 'useSync.pullFromSupabase', { notifyUser: true });
        setSyncStatus('offline');
      }
    };

    syncFromSupabase();

    // Lo que cambia otro usuario llega por Realtime (realtimeBridge) y se recarga en
    // silencio. Varias filas seguidas (p. ej. una asistencia de 30 jugadores) se
    // agrupan en una sola recarga.
    const stopBridge = startRealtimeBridge(user.id);
    let timer = null;
    const scheduleResync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => syncFromSupabase({ silent: true }), RESYNC_DEBOUNCE_MS);
    };
    const onRemoteChange = (e) => {
      if (e.detail?.remote && CONTEXT_TABLES.has(e.detail.table)) scheduleResync();
    };
    // Al volver a la app (el teléfono suspende el socket en segundo plano).
    const onVisible = () => { if (document.visibilityState === 'visible') scheduleResync(); };
    window.addEventListener('data:changed', onRemoteChange);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(timer);
      stopBridge();
      window.removeEventListener('data:changed', onRemoteChange);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id, userTier, profile?.system_role, profile?.club_scope, profile?.team_id, mensualidadBase]);

  return { syncStatus };
}
