import { supabase } from '../supabaseClient.js';

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
