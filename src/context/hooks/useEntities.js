import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { handleError } from '../../utils/errorHandler';
import { generateId, sanitize } from '../../utils/ids.js';

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

export function useFinances(activeTeam, pushEntityToSupabase, sendLocalNotification, user) {
  const [finances, setFinances] = useState(() => []);

  const addFinanceRecord = useCallback((record) => {
    const newRecord = {
      ...record, desc: sanitize(record.desc), id: generateId(),
      date: record.date || new Date().toISOString().split('T')[0], teamCategory: activeTeam
    };
    setFinances(prev => [...prev, newRecord]);
    supabase.from('finances').upsert({
      id: newRecord.id, type: newRecord.type, descripcion: newRecord.desc,
      amount: newRecord.amount, date: newRecord.date, category: newRecord.category,
      team_category: newRecord.teamCategory, user_id: user?.id,
    }).then(() => {}).catch(err => handleError(err, 'useEntities', { notifyUser: true }));
  }, [activeTeam, user?.id]);

  const addMembershipPayment = useCallback((playerName, amount, date, paymentId) => {
    const record = {
      desc: `Abono Membresia - ${playerName || 'Jugador'} [pid:${paymentId}]`, amount, type: 'ingreso',
      date, id: generateId(), category: 'mensualidad', teamCategory: activeTeam
    };
    setFinances(prev => [...prev, record]);
    supabase.from('finances').upsert({
      id: record.id, type: record.type, descripcion: record.desc,
      amount: record.amount, date: record.date, category: record.category,
      team_category: record.teamCategory, user_id: user?.id,
    }).then(() => {}).catch(err => handleError(err, 'useEntities', { notifyUser: true }));
    sendLocalNotification('Abono Registrado', `Se registro un abono de $${amount.toLocaleString()} COP.`);
  }, [activeTeam, sendLocalNotification, user?.id]);

  const deleteFinanceRecord = useCallback((recordId) => {
    setFinances(prev => prev.filter(r => r.id !== recordId));
    supabase.from('finances').delete().eq('id', recordId).then(() => {}).catch(err => handleError(err, 'useEntities.deleteFinanceRecord', { notifyUser: true }));
  }, []);

  return { finances, setFinances, addFinanceRecord, addMembershipPayment, deleteFinanceRecord };
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
