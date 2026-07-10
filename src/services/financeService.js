import { supabase } from '../supabaseClient.js';

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
