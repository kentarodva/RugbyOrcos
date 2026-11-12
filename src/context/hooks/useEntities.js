import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { handleError } from '../../utils/errorHandler';
import { generateId, sanitize } from '../../utils/ids.js';
import { localDateKey } from '../../utils/agendaItems.js';

export function useChampionships(activeTeam, pushEntityToSupabase, user) {
  const [championships, setChampionships] = useState(() => []);

  const addChampionship = useCallback((champ) => {
    const newChamp = {
      ...champ, name: sanitize(champ.name), description: sanitize(champ.description || ''),
      id: generateId(), teamCategory: activeTeam
    };
    setChampionships(prev => [...prev, newChamp]);
    supabase.from('championships').upsert({
      id: newChamp.id, name: newChamp.name, deadline_date: newChamp.deadlineDate,
      description: newChamp.description, team_category: newChamp.teamCategory,
      user_id: user?.id,
    }).then(() => {}).catch(err => handleError(err, 'useEntities', { notifyUser: true }));
  }, [activeTeam, user?.id]);

  return { championships, setChampionships, addChampionship };
}

export const mapFinanceRow = (f) => ({
  id: f.id, type: f.type, desc: f.descripcion, amount: f.amount, date: f.date,
  category: f.category, teamCategory: f.team_category, teamId: f.team_id, paymentId: f.payment_id || null,
});

// Supabase resolves with { error } instead of rejecting, so `.then(() => {})` hid
// every failed save. Throw it so the caller (and the user) finds out.
const failOnError = ({ error }) => { if (error) throw error; };

export function useFinances(activeTeam, pushEntityToSupabase, sendLocalNotification, user) {
  const [finances, setFinances] = useState(() => []);

  const addFinanceRecord = useCallback((record) => {
    const newRecord = {
      ...record, desc: sanitize(record.desc), id: generateId(),
      date: record.date || localDateKey(), teamCategory: activeTeam
    };
    setFinances(prev => [...prev, newRecord]);
    return supabase.from('finances').insert({
      id: newRecord.id, type: newRecord.type, descripcion: newRecord.desc,
      amount: newRecord.amount, date: newRecord.date, category: newRecord.category,
      team_category: newRecord.teamCategory, user_id: user?.id,
    }).then(failOnError).catch(err => {
      setFinances(prev => prev.filter(r => r.id !== newRecord.id));
      handleError(err, 'useEntities.addFinanceRecord', { notifyUser: true });
    });
  }, [activeTeam, user?.id]);

  // The database creates the ledger entry of every payment (migration 88).
  // Fetch it so the cash book shows it without reloading.
  const loadPaymentLedger = useCallback(async (paymentId) => {
    if (!paymentId) return;
    const { data, error } = await supabase.from('finances').select('*').eq('payment_id', paymentId);
    if (error) { handleError(error, 'useEntities.loadPaymentLedger'); return; }
    if (!data?.length) return;
    const rows = data.map(mapFinanceRow);
    setFinances(prev => [...prev.filter(r => !rows.some(n => n.id === r.id)), ...rows]);
  }, []);

  const addMembershipPayment = useCallback(async (amount, paymentId) => {
    await loadPaymentLedger(paymentId);
    sendLocalNotification('Abono Registrado', `Se registro un abono de $${amount.toLocaleString()} COP.`);
  }, [loadPaymentLedger, sendLocalNotification]);

  const deleteFinanceRecord = useCallback((recordId) => {
    setFinances(prev => prev.filter(r => r.id !== recordId));
    return supabase.from('finances').delete().eq('id', recordId)
      .then(failOnError)
      .catch(err => handleError(err, 'useEntities.deleteFinanceRecord', { notifyUser: true }));
  }, []);

  return { finances, setFinances, addFinanceRecord, addMembershipPayment, loadPaymentLedger, deleteFinanceRecord };
}

export function useInventory(pushEntityToSupabase, user) {
  const [inventory, setInventory] = useState(() => []);

  const addInventoryItem = useCallback((item) => {
    const newItem = {
      ...item,
      name: sanitize(item.name),
      description: sanitize(item.description || ''),
      id: generateId(),
      quantity: item.quantity || 1,
      status: item.status || 'disponible',
      assignedTo: item.assignedTo || null,
    };
    setInventory(prev => [...prev, newItem]);
    supabase.from('inventory').upsert({
      id: newItem.id, name: newItem.name, total: newItem.quantity,
      assigned_to: newItem.assignedTo, status: newItem.status,
      team_category: newItem.teamCategory, user_id: user?.id,
    }).then(() => {}).catch(err => handleError(err, 'useEntities', { notifyUser: true }));
  }, [user?.id]);

  const updateInventoryItem = useCallback((itemId, updatedData) => {
    const safe = { ...updatedData };
    if (safe.assignedTo) safe.assignedTo = sanitize(safe.assignedTo);
    if (safe.status) safe.status = sanitize(safe.status);
    setInventory(prev => {
      const updated = prev.map(item => item.id === itemId ? { ...item, ...safe } : item);
      const changed = updated.find(item => item.id === itemId);
      if (changed) {
        supabase.from('inventory').upsert({
          id: changed.id, name: changed.name, total: changed.quantity || changed.total,
          assigned_to: changed.assignedTo, status: changed.status,
          team_category: changed.teamCategory, user_id: user?.id,
        }).then(() => {}).catch(err => handleError(err, 'useEntities', { notifyUser: true }));
      }
      return updated;
    });
  }, [user?.id]);

  return { inventory, setInventory, addInventoryItem, updateInventoryItem };
}
