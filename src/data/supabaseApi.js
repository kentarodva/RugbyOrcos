import { supabase } from '../supabaseClient.js';

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
  },

  async fetchAll(userId, tier = 4, clubScope = null) {
    if (!userId) return null;

    const tables = ['schedule_events', 'championships', 'finances', 'inventory', 'fixtures', 'rivals', 'future_fixtures'];
    const results = {};

    const buildFilter = (query, table) => {
      if (tier >= 4) return query.eq('user_id', userId);
      if (tier >= 2 && clubScope) {
        if (table === 'rivals') return query; // rivals: global, sin filtro
        return query.ilike('team_category', clubScope + '%');
      }
      return query; // tier 0-1: sin filtro
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
      if (import.meta?.env?.DEV) console.warn('[Supabase] Error fetching players:', error.message);
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
    const { data, error } = await supabase
      .from('players')
      .upsert({
        id: player.id,
        user_id: userId,
        legacy_id: player.legacy_id,
        first_name: player.first_name,
        last_name: player.last_name,
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
        jersey_number: player.jersey_number || player.camiseta,
        role: player.role || player.rol,
        position: player.position || player.posicion,
        status: player.status || player.estado,
        attr_force: player.attr_force || (player.attributes?.force ?? 50),
        attr_speed: player.attr_speed || (player.attributes?.speed ?? 50),
        attr_stamina: player.attr_stamina || (player.attributes?.stamina ?? 50),
        attr_technique: player.attr_technique || (player.attributes?.technique ?? 70),
        clothing_jersey: player.clothing_jersey || player.clothingSizes?.jersey,
        clothing_shorts: player.clothing_shorts || player.clothingSizes?.shorts,
        clothing_socks: player.clothing_socks || player.clothingSizes?.socks,
        gym_squat: player.gym_squat || player.gymStats?.squat,
        gym_bench: player.gym_bench || player.gymStats?.bench,
        gym_deadlift: player.gym_deadlift || player.gymStats?.deadlift,
        system_role: player.system_role,
        source: player.source || 'manual',
        form_submitted_at: player.form_submitted_at,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  async deletePlayer(playerId) {
    const { error } = await supabase
      .from('players')
      .delete()
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
};

export default apisupabase;

export function supabasePlayerToReact(p) {
  const att = p.player_attendance_summary?.[0] || p.attendance_summary || {};
  const pen = p.penalties?.[0] || p.penalties || {};

  return {
    id: p.id,
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    apodo: p.nickname || '',
    camiseta: p.jersey_number,
    contacto: { phone: p.phone || '', email: p.email || '' },
    rol: p.role || 'Titular',
    posicion: p.position || '',
    estado: p.status || 'activo',
    attributes: {
      force: p.attr_force || 50,
      speed: p.attr_speed || 50,
      stamina: p.attr_stamina || 50,
      technique: p.attr_technique || 70,
    },
    history: (p.attribute_history || []).map((h) => ({
      date: h.recorded_date,
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
    workoutLog: (p.workout_logs || []).map((w) => ({
      id: w.id,
      date: w.workout_date,
      routine: w.routine_name,
      category: w.category,
      exercises: w.exercises || [],
      completed: w.completed || false,
    })),
    teamCategory: p.team_category || '',
    makgora_team_id: p.makgora_team_id,
    systemRole: p.system_role || 'jugador',
    memberships: { paid: 0, due: 10000 },
    _meta: {
      docType: p.document_type,
      docNum: p.document_number,
      age: p.age,
      startYear: p.start_year,
    },
  };
}
