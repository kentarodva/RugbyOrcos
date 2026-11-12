/**
 * dataService.js — Single Source of Truth para todas las operaciones de datos.
 *
 * Reemplaza los 100+ supabase.from() dispersos en componentes.
 * Cada operación emite un evento window 'data:changed' para que
 * otros módulos puedan reaccionar sin conocer la fuente del cambio.
 *
 * Convención de eventos: 'data:changed' con detail { table, action, payload }
 */

import { supabase } from '../supabaseClient.js';
import { localDateKey } from '../utils/agendaItems';

const emit = (table, action, payload) => {
  window.dispatchEvent(new CustomEvent('data:changed', {
    detail: { table, action, payload, timestamp: Date.now() }
  }));
};

// ===================================================================
// PLAYERS — centralizado (ya estaba en Context, aquí solo consultas)
// ===================================================================

export async function fetchPlayersWithRelations() {
  const { data, error } = await supabase.from('players').select('*').order('first_name');
  if (error) throw error;
  return data || [];
}

export async function getPlayerTrainingSummary(playerId) {
  const { data } = await supabase.from('training_plans')
    .select('*').eq('player_id', playerId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getPlayerActivePlan(playerId) {
  const { data } = await supabase.from('training_plans')
    .select('*').eq('player_id', playerId)
    .order('created_at', { ascending: false }).limit(1).single();
  return data;
}

// ===================================================================
// TRAINING PLANS
// ===================================================================

export async function fetchTrainingPlans(playerId) {
  const { data, error } = await supabase.from('training_plans')
    .select('*').eq('player_id', playerId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function persistTrainingPlan(playerId, plan, source = 'custom') {
  const { data, error } = await supabase.from('training_plans').upsert({
    player_id: playerId,
    plan: plan.plan || plan,
    source,
    ai_analysis: plan.aiAnalysis || plan.enrichedByAI ? plan.aiAnalysis : null,
    ai_risks: plan.aiRisks || null,
    ai_goals: plan.aiGoals || null,
    ai_recommendations: plan.aiRecommendations || null,
    week_start: localDateKey(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'player_id, week_start' }).select().single();

  if (error) throw error;
  emit('training_plans', 'upsert', { playerId, data });
  return data;
}

export async function completeTrainingPlan(planId, completedData) {
  const { data, error } = await supabase.from('training_plans')
    .update({ completed: true, completed_at: new Date().toISOString(), ...completedData })
    .eq('id', planId).select().single();
  if (error) throw error;
  emit('training_plans', 'update', { planId, data });
  return data;
}

// ===================================================================
// EVENT RSVP — antes invisible entre módulos, ahora centralizado
// ===================================================================

export async function fetchEventRsvps(eventId) {
  const { data, error } = await supabase.from('event_rsvp')
    .select('*').eq('event_id', eventId);
  if (error) throw error;
  return data || [];
}

export async function fetchPlayerRsvps(playerId) {
  const { data, error } = await supabase.from('event_rsvp')
    .select('player_id,event_id,status').eq('player_id', playerId);
  if (error) throw error;
  return data || [];
}

export async function fetchAllRsvps(playerIds) {
  if (!playerIds || playerIds.length === 0) return [];
  const { data, error } = await supabase.from('event_rsvp')
    .select('player_id,event_id,status').in('player_id', playerIds);
  if (error) throw error;
  return data || [];
}

export async function upsertRsvp(playerId, eventId, status) {
  const { data, error } = await supabase.from('event_rsvp')
    .upsert({ player_id: playerId, event_id: eventId, status, updated_at: new Date().toISOString() })
    .select().single();
  if (error) throw error;
  emit('event_rsvp', 'upsert', { playerId, eventId, status });
  return data;
}

export async function deleteRsvp(playerId, eventId) {
  const { error } = await supabase.from('event_rsvp')
    .delete().eq('player_id', playerId).eq('event_id', eventId);
  if (error) throw error;
  emit('event_rsvp', 'delete', { playerId, eventId });
}

// ===================================================================
// ATTENDANCE
// ===================================================================

export async function recordAttendance(attendanceData) {
  const { data, error } = await supabase.from('attendance')
    .upsert(attendanceData, { onConflict: 'player_id,event_id' }).select().single();
  if (error) throw error;
  emit('attendance', 'upsert', attendanceData);
  return data;
}

export async function fetchEventAttendance(eventId) {
  const { data, error } = await supabase.from('attendance')
    .select('*').eq('event_id', eventId);
  if (error) throw error;
  return data || [];
}

// ===================================================================
// MEMBERSHIP / PAYMENTS — eliminamos el frágil [pid:UUID] en texto
// ===================================================================

export async function recordMembershipPayment(playerId, amount, method = 'efectivo') {
  const { data: payment, error } = await supabase.from('player_payments')
    .insert({
      player_id: playerId,
      amount,
      method,
      source: 'membership',
      payment_date: localDateKey(),
    }).select().single();
  if (error) throw error;

  await supabase.from('finances').insert({
    player_id: playerId,
    amount,
    category: 'mensualidad',
    description: `Pago membresía — ${method}`,
    payment_id: payment.id,
    date: localDateKey(),
  });

  const { data: currentPlayer } = await supabase
    .from('players')
    .select('memberships_paid')
    .eq('id', playerId)
    .maybeSingle();

  await supabase.from('players').update({
    memberships_paid: (Number(currentPlayer?.memberships_paid) || 0) + Number(amount),
    last_payment_date: localDateKey(),
    last_payment_amount: amount,
  }).eq('id', playerId);

  emit('player_payments', 'insert', { playerId, payment });
  return payment;
}

export async function reverseMembershipPayment(playerId, paymentId, amount) {
  const { error } = await supabase.from('player_payments').delete().eq('id', paymentId);
  if (error) throw error;

  await supabase.from('finances').delete().eq('payment_id', paymentId);

  const { data: currentPlayer } = await supabase
    .from('players')
    .select('memberships_paid')
    .eq('id', playerId)
    .maybeSingle();

  await supabase.from('players').update({
    memberships_paid: Math.max(0, (Number(currentPlayer?.memberships_paid) || 0) - Number(amount)),
  }).eq('id', playerId);

  emit('player_payments', 'delete', { playerId, paymentId });
}

export async function fetchPlayerPayments(playerId) {
  const { data, error } = await supabase.from('player_payments')
    .select('*').eq('player_id', playerId).order('payment_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ===================================================================
// TOURNAMENT / MAKGORA — centralizado
// ===================================================================

export async function fetchTournamentStats(playerId) {
  const { data, error } = await supabase.from('tournament_player_stats')
    .select('*, tournaments(name)').eq('player_id', playerId);
  if (error) throw error;
  return data || [];
}

export async function fetchMakgoraTeams() {
  const { data, error } = await supabase.from('makgora_teams').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchTournaments(teamId) {
  let query = supabase.from('tournaments').select('*').order('created_at', { ascending: false });
  if (teamId) query = query.eq('team_id', teamId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ===================================================================
// PLAYER LOANS — centralizado
// ===================================================================

export async function fetchPlayerLoans(playerId) {
  let query = supabase.from('player_loans').select('*').order('created_at', { ascending: false });
  if (playerId) query = query.eq('player_id', playerId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createPlayerLoan(loanData) {
  const { data, error } = await supabase.from('player_loans').insert(loanData).select().single();
  if (error) throw error;
  emit('player_loans', 'insert', { playerId: loanData.player_id, data });
  return data;
}

export async function updateLoanStatus(loanId, status) {
  const { data, error } = await supabase.from('player_loans')
    .update({ status, updated_at: new Date().toISOString() }).eq('id', loanId).select().single();
  if (error) throw error;
  emit('player_loans', 'update', { loanId, data });
  return data;
}

// ===================================================================
// EVENT BUS — para módulos que necesitan reaccionar a cambios
// ===================================================================

/**
 * Suscribirse a cambios en una tabla específica.
 * Uso: const unsub = onDataChange('event_rsvp', (payload) => { ... });
 *       // cleanup: unsub();
 */
export function onDataChange(table, callback) {
  const handler = (e) => {
    if (e.detail.table === table) callback(e.detail);
  };
  window.addEventListener('data:changed', handler);
  return () => window.removeEventListener('data:changed', handler);
}

/**
 * Suscribirse a cambios de un jugador específico (cualquier tabla).
 * Uso: const unsub = onPlayerDataChange(playerId, (detail) => { ... });
 */
export function onPlayerDataChange(playerId, callback) {
  const handler = (e) => {
    const { payload } = e.detail;
    if (payload?.playerId === playerId) callback(e.detail);
  };
  window.addEventListener('data:changed', handler);
  return () => window.removeEventListener('data:changed', handler);
}

// ===================================================================
// MISC — merged from playerService.js + financeService.js
// ===================================================================

export async function fetchPlayers(filters = {}) {
  let query = supabase.from('players').select('*');
  if (filters.teamCategory) query = query.eq('team_category', filters.teamCategory);
  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.ids) query = query.in('id', filters.ids);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCampaigns(teamCategory) {
  let query = supabase.from('fundraising_campaigns').select('*');
  if (teamCategory) query = query.eq('team_category', teamCategory);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTreasurerDeliveries(teamCategory) {
  let query = supabase.from('treasurer_deliveries').select('*');
  if (teamCategory) query = query.eq('team_category', teamCategory);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
