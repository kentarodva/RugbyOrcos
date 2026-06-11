import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import apisupabase, { supabasePlayerToReact } from '../../data/supabaseApi.js';
import { handleError } from '../../utils/errorHandler';
import { playerSchema } from '../../schemas/player.js';

export function useSyncPush(user) {
  const convertPlayerToSupabase = useCallback((player) => {
    const nameParts = (player.name || '').split(' ');
    return {
      id: player.id,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
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
      document_type: player._meta?.docType || null,
      document_number: player._meta?.docNum || null,
      age: player._meta?.age || null,
      start_year: player._meta?.startYear || null,
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
          linked_routine: r.linkedRoutine, recurrence_group: r.recurrenceGroup,
          notes: r.notes || null, end_date: r.endDate || null,
          scope_type: r.scopeType || 'division', scope_value: r.scopeValue || {}
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
          tries: r.tries, mvp: r.mvp, team_category: r.teamCategory,
          rival_id: r.rivalId || null
        }),
        rivals: (r) => ({
          id: r.id, name: r.name, colors: r.colors, contact: r.contact, notes: r.notes
        }),
        futureFixtures: (r) => ({
          id: r.id, opponent: r.opponent, date: r.date,
          time: r.time, location: r.location, team_category: r.teamCategory,
          rival_id: r.rivalId || null
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

    const syncFromSupabase = async () => {
      setSyncStatus('syncing');
      if (import.meta.env.DEV) console.log('[Sync] Iniciando sync para user:', user.id);

      try {
        const playerQuery = supabase.from('players').select('*');
        if (userTier >= 4) {
          playerQuery.eq('user_id', user.id);
        } else if (userTier >= 2 && profile?.club_scope) {
          playerQuery.ilike('team_category', profile.club_scope + '%');
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
              player.memberships = { paid, due: mensualidadBase };
            });
          }

          setPlayers(normalized);
        } else if (!playerError) {
          setPlayers([]);
        }

        const appData = await apisupabase.fetchAll(user.id, userTier, profile?.club_scope);
        if (!appData) throw new Error('No se pudieron cargar los datos');

        if (appData.schedule) {
          const mapped = appData.schedule.map(e => ({
            id: e.id, title: e.title, date: e.date, time: e.time,
            location: e.location, mapsLink: e.maps_link, type: e.type,
            teamCategory: e.team_category, linkedRoutine: e.linked_routine,
            recurrenceGroup: e.recurrence_group,
            notes: e.notes || null, endDate: e.end_date || null,
            scopeType: e.scope_type || 'division', scopeValue: e.scope_value || {},
          }));
          setSchedule(mapped);
        } else { setSchedule([]); }

        if (appData.championships) {
          const mapped = appData.championships.map(c => ({
            id: c.id, name: c.name, deadlineDate: c.deadline_date,
            description: c.description, teamCategory: c.team_category
          }));
          setChampionships(mapped);
        } else { setChampionships([]); }

        if (appData.finances) {
          const mapped = appData.finances.map(f => ({
            id: f.id, type: f.type, desc: f.descripcion, amount: f.amount,
            date: f.date, category: f.category, teamCategory: f.team_category
          }));
          setFinances(mapped);
        } else { setFinances([]); }

        if (appData.inventory) {
          const mapped = appData.inventory.map(i => ({
            id: i.id, name: i.name, total: i.total,
            assignedTo: i.assigned_to, status: i.status, teamCategory: i.team_category
          }));
          setInventory(mapped);
        } else { setInventory([]); }

        if (appData.fixtures) {
          const mapped = appData.fixtures.map(f => ({
            id: f.id, date: f.date, opponent: f.opponent,
            orcosScore: f.orcos_score, opponentScore: f.opponent_score,
            tries: f.tries, mvp: f.mvp, teamCategory: f.team_category,
            rivalId: f.rival_id
          }));
          setFixtures(mapped);
        } else { setFixtures([]); }

        if (appData.rivals) {
          const mapped = appData.rivals.map(r => ({
            id: r.id, name: r.name, colors: r.colors,
            contact: r.contact, notes: r.notes
          }));
          setRivals(mapped);
        } else { setRivals([]); }

        if (appData.futureFixtures) {
          const mapped = appData.futureFixtures.map(f => ({
            id: f.id, opponent: f.opponent, date: f.date,
            time: f.time, location: f.location, teamCategory: f.team_category,
            rivalId: f.rival_id
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
        handleError(err, 'useSync.pullFromSupabase', { silent: true });
        setSyncStatus('offline');
      }
    };

    syncFromSupabase();
  }, [user?.id, profile?.system_role, mensualidadBase]);

  return { syncStatus };
}
