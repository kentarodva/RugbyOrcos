import { supabase } from '../supabaseClient.js';
import { handleError } from '../utils/errorHandler';
import { playerSchema } from '../schemas/player.js';
import { calculateAttributes } from '../engine/attributeCalculator.js';

const apisupabase = {
  tableMap: {
    players: 'players',
    schedule: 'schedule_events',
    championships: 'championships',
    finances: 'finances',
    inventory: 'inventory',
    fixtures: 'fixtures',
    rivals: 'rivals',
    futureFixtures: 'future_fixtures',
    matchInvitations: 'match_invitations',
    guestPlayers: 'guest_players',
    liveMatches: 'live_matches',
    liveMatchEvents: 'live_match_events',
  },

  async fetchAll(userId, tier = 4, clubScope = null, teamId = null) {
    if (!userId) return null;

    const tables = ['schedule_events', 'championships', 'finances', 'inventory', 'fixtures', 'rivals', 'future_fixtures'];
    const results = {};

    const SHARED_TABLES = ['schedule_events', 'championships', 'fixtures', 'future_fixtures'];
    const buildFilter = (query, table) => {
      if (tier >= 4) {
        if (SHARED_TABLES.includes(table) && teamId) {
          return query.eq('team_id', teamId);
        }
        if (SHARED_TABLES.includes(table) && clubScope) {
          return query.ilike('team_category', clubScope + '%');
        }
        if (SHARED_TABLES.includes(table)) {
          return query;
        }
        return query.eq('user_id', userId);
      }
      if (tier >= 2) {
        if (table === 'rivals') return query;
        if (SHARED_TABLES.includes(table) && teamId) {
          return query.eq('team_id', teamId);
        }
        if (clubScope) {
          return query.ilike('team_category', clubScope + '%');
        }
        return query.eq('user_id', userId);
      }
      return query;
    };

    await Promise.all(tables.map(async (table) => {
      const query = supabase.from(table).select('*');
      const filtered = buildFilter(query, table);
      const { data, error } = await filtered;

      if (!error && data) {
        const key = table === 'schedule_events' ? 'schedule' :
          table === 'future_fixtures' ? 'futureFixtures' : table;
        results[key] = data;
      }
    }));

    return results;
  },

  async fetchPlayers(userId) {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      handleError(error, 'supabaseApi.fetchPlayers', { silent: true });
      return [];
    }
    return data || [];
  },

  async fetchPlayerDetail(playerId) {
    const tables = [
      'attribute_history',
      'injury_log',
      'player_attendance_summary',
      'penalties',
      'infractions',
      'match_stats',
      'wellness_logs',
      'hia_assessments',
      'workout_logs',
    ];

    const results = {};
    await Promise.all(tables.map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('player_id', playerId);

      if (!error && data) {
        results[table] = data;
      }
    }));

    return results;
  },

  async upsertPlayer(player, userId) {
    if (!player?.id) {
      handleError(new Error('upsertPlayer: missing player.id'), 'supabaseApi.upsertPlayer', { silent: true });
      return { data: null, error: { message: 'Invalid player data: missing id' } };
    }
    if (!userId) {
      handleError(new Error('upsertPlayer: missing userId'), 'supabaseApi.upsertPlayer', { silent: true });
      return { data: null, error: { message: 'Invalid player data: missing userId' } };
    }
    const { data, error } = await supabase
      .from('players')
      .upsert({
        id: player.id,
        user_id: player.user_id || player.userId || userId,
        ...(player.username !== undefined ? { username: player.username } : {}),
        legacy_id: player.legacy_id,
        first_name: player.first_name,
        middle_name: player.middle_name || null,
        last_name: player.last_name,
        second_last_name: player.second_last_name || null,
        nickname: player.nickname || null,
        document_type: player.document_type,
        document_number: player.document_number,
        birth_date: player.birth_date,
        age: player.age,
        phone: player.phone,
      email: player.email,
      initial_category: player.initial_category,
      start_year: player.start_year,
      current_category: player.current_category,
      internal_team: player.internal_team,
      team_category: player.team_category,
        team_id: player.team_id,
        weight_kg: player.weight_kg || player.weight,
        height_m: player.height_m || player.height,
        had_fractures: player.had_fractures,
        fracture_details: player.fracture_details,
        allergies: player.allergies,
        medical_conditions: player.medical_conditions,
        health_insurance: player.health_insurance,
        emergency_contact_name: player.emergency_contact_name,
        emergency_contact_phone: player.emergency_contact_phone,
        commitment_accepted: player.commitment_accepted ?? true,
        jersey_number: player.jersey_number ?? player.camiseta ?? null,
        role: player.role,
        position: player.position || player.posicion,
        position_id: player.position_id || null,
        status: player.status || player.estado,
        attr_force: player.attr_force || (player.attributes?.force ?? 50),
        attr_speed: player.attr_speed || (player.attributes?.speed ?? 50),
        attr_stamina: player.attr_stamina || (player.attributes?.stamina ?? 50),
        attr_technique: player.attr_technique || (player.attributes?.technique ?? 50),
        clothing_jersey: player.clothing_jersey || player.clothingSizes?.jersey,
        clothing_shorts: player.clothing_shorts || player.clothingSizes?.shorts,
        clothing_socks: player.clothing_socks || player.clothingSizes?.socks,
        gym_squat: player.gym_squat || player.gymStats?.squat,
        gym_bench: player.gym_bench || player.gymStats?.bench,
        gym_deadlift: player.gym_deadlift || player.gymStats?.deadlift,
        system_role: player.system_role,
        makgora_team_id: player.makgora_team_id || null,
        avatar_id: player.avatar_id || null,
        photo_url: player.photo_url || null,
        source: player.source || 'manual',
        form_submitted_at: player.form_submitted_at,
        deleted_at: player.deleted_at ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  async batchUpsertPlayers(players, _userId) {
    const records = players.map(p => ({
      id: p.id,
      user_id: p.user_id || null,
      first_name: p.first_name,
      middle_name: p.middle_name || null,
      last_name: p.last_name,
      second_last_name: p.second_last_name || null,
      nickname: p.nickname || null,
      document_type: p.document_type,
      document_number: p.document_number,
      birth_date: p.birth_date,
      age: p.age,
      phone: p.phone,
      team_category: p.team_category,
      team_id: p.team_id || null,
      initial_category: p.initial_category,
      start_year: p.start_year,
      internal_team: p.internal_team,
      makgora_team_id: p.makgora_team_id || null,
      weight_kg: p.weight_kg || p.weight,
      height_m: p.height_m || p.height,
      had_fractures: p.had_fractures || false,
      fracture_details: p.fracture_details,
      allergies: p.allergies,
      medical_conditions: p.medical_conditions,
      health_insurance: p.health_insurance,
      emergency_contact_name: p.emergency_contact_name,
      emergency_contact_phone: p.emergency_contact_phone,
      commitment_accepted: p.commitment_accepted ?? true,
      role: p.role || 'Titular',
      status: p.status || 'activo',
      attr_force: p.attr_force ?? 50,
      attr_speed: p.attr_speed ?? 50,
      attr_stamina: p.attr_stamina ?? 50,
      attr_technique: p.attr_technique ?? 50,
      source: p.source || 'csv_import',
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('players')
      .upsert(records, { onConflict: 'first_name, last_name, birth_date' })
      .select();

    return { data, error };
  },

  async batchUpdatePositions(updates) {
    const now = new Date().toISOString();
    const results = await Promise.all(
      updates.map(({ id, position_id, position }) =>
        supabase
          .from('players')
          .update({
            position_id,
            ...(position !== undefined ? { position } : {}),
            updated_at: now,
          })
          .eq('id', id)
          .select()
          .single()
      )
    );
    const firstError = results.find(r => r.error)?.error || null;
    const data = results.map(r => r.data).filter(Boolean);
    return { data, error: firstError };
  },

  async deleteAllPlayers(userId) {
    const { error } = await supabase
      .from('players')
      .update({ status: 'inactivo', deleted_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deletePlayer(playerId) {
    const { error } = await supabase
      .from('players')
      .update({ status: 'inactivo', deleted_at: new Date().toISOString() })
      .eq('id', playerId);
    return { error };
  },

  async upsertRecord(table, record) {
    const { data, error } = await supabase
      .from(table)
      .upsert(record)
      .select()
      .single();

    return { data, error };
  },

  async deleteRecord(table, id) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    return { error };
  },

  async upsertEntity(entityType, record, userId) {
    const table = this.tableMap[entityType];
    if (!table) return { error: { message: `Unknown entity: ${entityType}` } };

    const payload = { ...record, user_id: userId };
    return this.upsertRecord(table, payload);
  },

  async deleteEntity(entityType, id) {
    const table = this.tableMap[entityType];
    if (!table) return { error: { message: `Unknown entity: ${entityType}` } };
    return this.deleteRecord(table, id);
  },

  async startLiveMatch(record, userId) {
    const { data, error } = await supabase
      .from('live_matches')
      .insert({ ...record, user_id: userId })
      .select()
      .single();
    return { data, error };
  },

  async updateLiveMatch(id, updates) {
    const { data, error } = await supabase
      .from('live_matches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteLiveMatch(id) {
    return this.deleteRecord('live_matches', id);
  },

  async fetchLiveMatches(status = null) {
    let query = supabase.from('live_matches').select('*').order('started_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    return { data: data || [], error };
  },

  async addLiveEvent(event) {
    const { data, error } = await supabase
      .from('live_match_events')
      .insert(event)
      .select()
      .single();
    return { data, error };
  },

  async fetchLiveEvents(matchId) {
    const { data, error } = await supabase
      .from('live_match_events')
      .select('*')
      .eq('live_match_id', matchId)
      .order('created_at', { ascending: true });
    return { data: data || [], error };
  },

  async fetchInvitations(userId, tier = 4, clubScope = null) {
    const { data, error } = await supabase
      .from('match_invitations')
      .select('*, future_fixtures(*), guest_players(*)')
      .order('created_at', { ascending: false });

    if (error) return [];
    if (tier >= 4) return (data || []).filter(inv => inv.user_id === userId);
    if (tier >= 2 && clubScope) {
      return (data || []).filter(inv =>
        inv.user_id === userId ||
        inv.future_fixtures?.team_category === clubScope
      );
    }
    return data || [];
  },

  async createInvitation(record) {
    const { data, error } = await supabase
      .from('match_invitations')
      .insert(record)
      .select()
      .single();
    return { data, error };
  },

  async deleteInvitation(id) {
    const { error } = await supabase
      .from('match_invitations')
      .delete()
      .eq('id', id);
    return { error };
  },

  async updateInvitation(id, updates) {
    const { data, error } = await supabase
      .from('match_invitations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async fetchLoans() {
    const { data, error } = await supabase
      .from('player_loans')
      .select('*, players(first_name, last_name, nickname, makgora_team_id)')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createLoan(record) {
    const { data, error } = await supabase
      .from('player_loans')
      .insert(record)
      .select()
      .single();
    return { data, error };
  },

  async updateLoanStatus(id, status) {
    const { data, error } = await supabase
      .from('player_loans')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async fetchInvitationGuests(invitationId) {
    const { data, error } = await supabase
      .from('guest_players')
      .select('*')
      .eq('invitation_id', invitationId)
      .order('created_at');
    return { data, error };
  },
};

export default apisupabase;

// ─── Custom Tactics CRUD ─────────────────────────────────────────

export async function fetchCustomTactics(teamCategory) {
  const { data, error } = await supabase
    .from('custom_tactics')
    .select('*')
    .or(`scope.eq.all,scope.eq.${teamCategory}`)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    handleError(error, 'supabaseApi.fetchCustomTactics', { silent: true });
    return [];
  }
  return data || [];
}

export async function createCustomTactic(data) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    if (import.meta.env.DEV) console.warn('[Supabase] No authenticated user:', userError?.message);
    return null;
  }

  const { data: result, error } = await supabase
    .from('custom_tactics')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    handleError(error, 'supabaseApi.createTactic', { notifyUser: true });
    return null;
  }
  return result;
}

export async function updateCustomTactic(id, updates) {
  const { data, error } = await supabase
    .from('custom_tactics')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleError(error, 'supabaseApi.updateTactic', { notifyUser: true });
    return null;
  }
  return data;
}

export async function deleteCustomTactic(id) {
  const { error } = await supabase
    .from('custom_tactics')
    .delete()
    .eq('id', id);

  if (error) {
    handleError(error, 'supabaseApi.deleteTactic', { notifyUser: true });
    return false;
  }
  return true;
}

// ─── Rugby Positions ─────────────────────────────────────────────

export async function fetchRugbyPositions() {
  const { data, error } = await supabase
    .from('rugby_positions')
    .select('*')
    .order('id');

  if (error) {
    handleError(error, 'supabaseApi.fetchPositions', { silent: true });
    return [];
  }
  return data || [];
}

// ─── Match Stats with Filters ────────────────────────────────────

export async function fetchMatchStatsByPlayer(playerIds, filters = {}, signal) {
  if (!playerIds || playerIds.length === 0) return {};

  let query = supabase
    .from('match_stats')
    .select('*')
    .in('player_id', playerIds)
    .abortSignal(signal || new AbortController().signal);

  if (filters.dateFrom) {
    query = query.gte('match_date', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('match_date', filters.dateTo);
  }

  const { data, error } = await query.order('match_date', { ascending: false });

  if (error) {
    handleError(error, 'supabaseApi.fetchMatchStats', { silent: true });
    return {};
  }

  // Agrupar por player_id
  const grouped = {};
  (data || []).forEach(stat => {
    if (!grouped[stat.player_id]) grouped[stat.player_id] = [];
    grouped[stat.player_id].push(stat);
  });

  // Aplicar limit si existe
  if (filters.limit && filters.limit > 0) {
    for (const pid of Object.keys(grouped)) {
      grouped[pid] = grouped[pid].slice(0, filters.limit);
    }
  }

  return grouped;
}

// ─── Realtime Channel ────────────────────────────────────────────

export function createCustomTacticsChannel(teamCategory, callback) {
  try {
    const channelId = `tactics_${String(teamCategory || 'all').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'custom_tactics' },
        () => {
          try { callback(); } catch { /* callback seguro */ }
        }
      )
      .subscribe();

    return channel;
  } catch {
    return null;
  }
}

export function removeRealtimeChannel(channel) {
  if (!channel) return;
  try {
    supabase.removeChannel(channel);
  } catch {
    // Silencioso - canal ya removido
  }
}

// ─── Transforms ──────────────────────────────────────────────────

export function supabasePlayerToReact(p) {
  const att = p.player_attendance_summary?.[0] || p.attendance_summary || {};
  const pen = p.penalties?.[0] || p.penalties || {};

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentTest = (p.attribute_history || []).find(h =>
    h.source === 'test' && new Date(h.recorded_date) > ninetyDaysAgo
  );

  const persistedAttrs = (p.attr_force != null && p.attr_speed != null && p.attr_stamina != null && p.attr_technique != null)
    ? { force: p.attr_force, speed: p.attr_speed, stamina: p.attr_stamina, technique: p.attr_technique }
    : null;

  const computedAttrs = recentTest
    ? { force: recentTest.attr_force, speed: recentTest.attr_speed, stamina: recentTest.attr_stamina, technique: recentTest.attr_technique }
    : persistedAttrs || calculateAttributes({
        posicion: p.position,
        weight: p.weight_kg,
        height: p.height_m,
        age: p.age,
        gymStats: { squat: p.gym_squat, bench: p.gym_bench, deadlift: p.gym_deadlift },
      });

  const player = {
    id: p.id,
    userId: p.user_id,
    username: p.username,
    name: [p.first_name, p.middle_name, p.last_name, p.second_last_name]
            .filter(Boolean).join(' '),
    firstName: p.first_name || null,
    middleName: p.middle_name || null,
    lastName: p.last_name || null,
    secondLastName: p.second_last_name || null,
    apodo: p.nickname || '',
    camiseta: p.jersey_number,
    contacto: { phone: p.phone || '', email: p.email || '' },
    rol: p.role || 'Titular',
    posicion: p.position || '',
    position_id: p.position_id || null,
    estado: p.status || 'activo',
    attributes: computedAttrs,
    history: (p.attribute_history || []).map((h) => ({
      date: h.recorded_date,
      source: h.source || 'auto',
      force: h.attr_force,
      speed: h.attr_speed,
      stamina: h.attr_stamina,
      technique: h.attr_technique,
    })),
    injuryLog: (p.injury_log || []).map((i) => ({
      diagnosis: i.diagnosis,
      date: i.injury_date || '',
      weeks: i.recovery_weeks || 0,
      phase: i.phase || 1,
    })),
    attendance: {
      total: att.total || 0,
      present: att.present || 0,
      late: att.late || 0,
      absentUnjustified: att.absent_unjustified || 0,
      absentJustified: att.absent_justified || 0,
    },
    penalties: {
      burpees: pen.burpees || 0,
      cones: pen.cones || false,
    },
    infractionLog: (p.infractions || []).map((i) => ({
      id: i.id,
      date: i.infraction_date,
      penales: i.penalties || 0,
      amarillas: i.yellow_cards || 0,
      rojas: i.red_cards || 0,
      faultType: i.fault_type,
      context: i.context,
      notes: i.notes,
    })),
    clothingSizes: {
      jersey: p.clothing_jersey || 'M',
      shorts: p.clothing_shorts || 'M',
      socks: p.clothing_socks || '40-42',
    },
    matchStats: (p.match_stats || []).map((s) => ({
      id: s.id,
      date: s.match_date,
      opponent: s.opponent,
      tries: s.tries || 0,
      conversions: s.conversions || 0,
      tackles: s.tackles || 0,
      turnovers: s.turnovers || 0,
      yellowCards: s.yellow_cards || 0,
      redCards: s.red_cards || 0,
      mvp: s.mvp || false,
    })),
    wellnessLogs: (p.wellness_logs || []).map((w) => ({
      id: w.id,
      date: w.log_date,
      sleep: w.sleep_quality,
      soreness: w.muscle_soreness,
      stress: w.stress_level,
    })),
    hiaAssessments: p.hia_assessments || [],
    gymStats: {
      squat: parseFloat(p.gym_squat) || 0,
      bench: parseFloat(p.gym_bench) || 0,
      deadlift: parseFloat(p.gym_deadlift) || 0,
    },
    weight: parseFloat(p.weight_kg) || null,
    height: parseFloat(p.height_m) || null,
    health_insurance: p.health_insurance || null,
    allergies: p.allergies || null,
    medical_conditions: p.medical_conditions || null,
    had_fractures: p.had_fractures || false,
    fracture_details: p.fracture_details || null,
    emergency_contact_name: p.emergency_contact_name || null,
    emergency_contact_phone: p.emergency_contact_phone || null,
    birth_date: p.birth_date || null,
    workoutLog: (p.workout_logs || []).map((w) => ({
      id: w.id,
      date: w.workout_date,
      routine: w.routine_name,
      category: w.category,
      exercises: w.exercises || [],
      completed: w.completed || false,
    })),
    teamCategory: p.team_category || '',
    teamId: p.team_id,
    makgora_team_id: p.makgora_team_id,
    systemRole: p.system_role || 'jugador',
    avatar_id: p.avatar_id || null,
    photo_url: p.photo_url || null,
    deleted_at: p.deleted_at || null,
    preferences: p.preferences || {},
    memberships: {
      paid: Number(p.memberships_paid) || 0,
      due: Number(p.memberships_due) || 0,
      lastPayment: p.last_payment_date || null,
      lastAmount: Number(p.last_payment_amount) || null,
    },
    _meta: {
      docType: p.document_type,
      docNum: p.document_number,
      age: p.age ?? (p.birth_date
        ? Math.max(0, Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000))
        : null),
      startYear: p.start_year,
    },
  };

  const result = playerSchema.safeParse(player);
  if (!result.success) {
    handleError(
      new Error('Player schema validation failed: ' + result.error.issues.map(i => i.path.join('.') + ': ' + i.message).join('; ')),
      'supabaseApi.supabasePlayerToReact',
      { silent: true }
    );
  }
  return result.success ? result.data : player;
}
