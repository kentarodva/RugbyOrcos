import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { generateId } from '../../utils/ids.js';
import { localDateKey } from '../../utils/agendaItems';

const emit = (table, action, payload = {}) => {
  window.dispatchEvent(new CustomEvent('data:changed', {
    detail: { table, action, payload, timestamp: Date.now() }
  }));
};

export function useFundraising(activeTeam, _user) {
  const [campaigns, setCampaigns] = useState(() => []);
  const [allPayments, setAllPayments] = useState(() => []);

  const loadCampaigns = useCallback(async () => {
    const { data } = await supabase
      .from('fundraising_campaigns')
      .select('*')
      .eq('team_category', activeTeam)
      .order('created_at', { ascending: false });
    if (data) setCampaigns(data);
  }, [activeTeam]);

  const loadAllPayments = useCallback(async (options = {}) => {
    const { offset = 0, limit = 100, append = false } = options;
    const { data } = await supabase
      .from('player_payments')
      .select('*')
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);
    if (data) {
      if (append) {
        setAllPayments(prev => [...prev, ...data]);
      } else {
        setAllPayments(data);
      }
    }
  }, []);

  const addCampaign = useCallback(async (campaign) => {
    const newCampaign = {
      ...campaign,
      id: generateId(),
      team_category: activeTeam,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCampaigns(prev => [newCampaign, ...prev]);
    const { error } = await supabase.from('fundraising_campaigns').upsert(newCampaign);
    if (error) throw error;
    emit('fundraising_campaigns', 'create', { campaignId: newCampaign.id });
    return newCampaign;
  }, [activeTeam]);

  const updateCampaign = useCallback(async (campaignId, updates) => {
    const isClosing = updates.status === 'closed' || updates.status === 'cancelled';
    if (isClosing) {
      await supabase
        .from('raffle_tickets')
        .update({ is_sold: false, sold_to_name: '', assigned_to: null })
        .eq('campaign_id', campaignId)
        .eq('is_sold', false)
        .select();
    }
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
    const { error } = await supabase.from('fundraising_campaigns').update(updates).eq('id', campaignId);
    if (error) throw error;
  }, []);

  const deleteCampaign = useCallback(async (campaignId) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    await supabase.from('fundraising_campaigns').delete().eq('id', campaignId);
  }, []);

  const getAssignments = useCallback(async (campaignId) => {
    const { data } = await supabase
      .from('fundraising_assignments')
      .select('*')
      .eq('campaign_id', campaignId);
    return data || [];
  }, []);

  const getRaffleTickets = useCallback(async (campaignId) => {
    const { data } = await supabase
      .from('raffle_tickets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('ticket_number', { ascending: true });
    return data || [];
  }, []);

  const bulkAssignTickets = useCallback(async (campaignId, assignments) => {
    const tickets = [];
    const assignmentRecords = [];

    for (const a of assignments) {
      const assignmentId = generateId();
      const count = (a.ticketEnd - a.ticketStart + 1);
      for (let n = a.ticketStart; n <= a.ticketEnd; n++) {
        tickets.push({
          campaign_id: campaignId,
          ticket_number: n,
          assigned_to: a.playerId,
          is_sold: false,
          sold_to_name: '',
        });
      }
      assignmentRecords.push({
        id: assignmentId,
        campaign_id: campaignId,
        player_id: a.playerId,
        amount_due: count * a.price,
        amount_paid: 0,
        ticket_start: a.ticketStart,
        ticket_end: a.ticketEnd,
        notes: '',
      });
    }

    if (tickets.length > 0) {
      await supabase.from('raffle_tickets').insert(tickets);
    }
    if (assignmentRecords.length > 0) {
      await supabase.from('fundraising_assignments').insert(assignmentRecords);
    }
  }, []);

  const bulkAssignFood = useCallback(async (campaignId, playerIds, amountDue, extra = null) => {
    const records = playerIds.map(playerId => ({
      id: generateId(),
      campaign_id: campaignId,
      player_id: playerId,
      amount_due: amountDue,
      amount_paid: 0,
      notes: '',
      ...(extra && typeof extra === 'object' ? extra : {}),
    }));
    await supabase.from('fundraising_assignments').insert(records);
  }, []);

  const updateAssignment = useCallback(async (assignmentId, updates) => {
    const { error } = await supabase
      .from('fundraising_assignments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', assignmentId);
    if (error) throw error;
    emit('fundraising_campaigns', 'update', { assignmentId });
  }, []);

  const markTicketSold = useCallback(async (ticketId, soldToName) => {
    await supabase.from('raffle_tickets').update({
      is_sold: true,
      sold_to_name: soldToName,
      sold_at: localDateKey(),
    }).eq('id', ticketId);
  }, []);

  const deletePayment = useCallback(async (paymentId) => {
    let payment = allPayments.find(p => p.id === paymentId);
    if (!payment) {
      const { data } = await supabase.from('player_payments').select('player_id, amount, source').eq('id', paymentId).single();
      if (data) payment = data;
      else return null;
    }
    await supabase.from('player_payments').delete().eq('id', paymentId);
    setAllPayments(prev => prev.filter(p => p.id !== paymentId));
    return { player_id: payment.player_id, amount: Number(payment.amount), source: payment.source || 'membership' };
  }, [allPayments]);

  const registerPayment = useCallback(async ({ playerId, amount, source, assignmentId, campaignId, notes }) => {
    const today = localDateKey();
    const payment = {
      id: generateId(),
      player_id: playerId,
      amount,
      payment_date: today,
      source,
      assignment_id: assignmentId || null,
      campaign_id: campaignId || null,
      notes: notes || '',
    };
    const { error: insertError } = await supabase.from('player_payments').insert(payment);
    if (insertError) throw insertError;
    setAllPayments(prev => [payment, ...prev]);
    // amount_paid y el movimiento de caja los actualiza la BD (migración 88).
    return payment.id;
  }, []);

  const sellTickets = useCallback(async ({ campaign, assignment, unsoldTickets, quantity, amount, soldToName }) => {
    const today = localDateKey();
    const ticketsToSell = unsoldTickets.slice(0, quantity);
    const soldTicketIds = ticketsToSell.map(t => t.id);

    if (soldTicketIds.length > 0) {
      const { error: ticketError } = await supabase
        .from('raffle_tickets')
        .update({ is_sold: true, sold_to_name: soldToName || '', sold_at: today })
        .in('id', soldTicketIds);
      if (ticketError) throw ticketError;
    }

    const paymentId = generateId();
    const payment = {
      id: paymentId,
      player_id: assignment.player_id,
      amount,
      payment_date: today,
      source: 'fundraising',
      assignment_id: assignment.id,
      campaign_id: campaign.id,
      notes: quantity > 0
        ? `Venta ${quantity} boletas${soldToName ? ` a ${soldToName}` : ''}`
        : `Abono ${assignment.player_id}`,
    };
    const { error: payError } = await supabase.from('player_payments').insert(payment);
    if (payError) throw payError;
    setAllPayments(prev => [payment, ...prev]);
    // amount_paid y el movimiento de caja los actualiza la BD (migración 88).

    return { soldCount: ticketsToSell.length, amount, paymentId };
  }, []);

  return {
    campaigns, setCampaigns,
    allPayments, setAllPayments,
    loadCampaigns,
    loadAllPayments,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    getAssignments,
    getRaffleTickets,
    bulkAssignTickets,
    bulkAssignFood,
    updateAssignment,
    markTicketSold,
    registerPayment,
    deletePayment,
    sellTickets,
  };
}
