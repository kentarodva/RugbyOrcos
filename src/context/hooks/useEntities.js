import { useState, useEffect, useCallback } from 'react';

const generateId = (prefix = '') => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return prefix + crypto.randomUUID();
  }
  return prefix + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const sanitize = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[<>]/g, '');
};

export function useChampionships(activeTeam, pushEntityToSupabase) {
  const [championships, setChampionships] = useState(() => []);

  useEffect(() => {
    localStorage.setItem('orcos_championships', JSON.stringify(championships));
  }, [championships]);

  const addChampionship = useCallback((champ) => {
    const newChamp = {
      ...champ, name: sanitize(champ.name), description: sanitize(champ.description || ''),
      id: generateId('c_'), teamCategory: activeTeam
    };
    setChampionships(prev => [...prev, newChamp]);
    pushEntityToSupabase('championships', newChamp);
  }, [activeTeam, pushEntityToSupabase]);

  return { championships, setChampionships, addChampionship };
}

export function useFinances(activeTeam, pushEntityToSupabase, sendLocalNotification) {
  const [finances, setFinances] = useState(() => []);

  useEffect(() => {
    localStorage.setItem('orcos_finances', JSON.stringify(finances));
  }, [finances]);

  const addFinanceRecord = useCallback((record) => {
    const newRecord = {
      ...record, desc: sanitize(record.desc), id: generateId('fin_'),
      date: record.date || new Date().toISOString().split('T')[0], teamCategory: activeTeam
    };
    setFinances(prev => [...prev, newRecord]);
    pushEntityToSupabase('finances', newRecord);
  }, [activeTeam, pushEntityToSupabase]);

  const addMembershipPayment = useCallback((playerName, amount, date) => {
    const record = {
      desc: `Abono Membresia - ${playerName || 'Jugador'}`, amount, type: 'ingreso',
      date, id: generateId('fin_'), category: 'mensualidad', teamCategory: activeTeam
    };
    setFinances(prev => [...prev, record]);
    pushEntityToSupabase('finances', record);
    sendLocalNotification('Abono Registrado', `Se registro un abono de $${amount.toLocaleString()} COP.`);
  }, [activeTeam, pushEntityToSupabase, sendLocalNotification]);

  return { finances, setFinances, addFinanceRecord, addMembershipPayment };
}

export function useInventory(pushEntityToSupabase) {
  const [inventory, setInventory] = useState(() => []);

  useEffect(() => {
    localStorage.setItem('orcos_inventory', JSON.stringify(inventory));
  }, [inventory]);

  const updateInventoryItem = useCallback((itemId, updatedData) => {
    const safe = { ...updatedData };
    if (safe.assignedTo) safe.assignedTo = sanitize(safe.assignedTo);
    if (safe.status) safe.status = sanitize(safe.status);
    setInventory(prev => {
      const updated = prev.map(item => item.id === itemId ? { ...item, ...safe } : item);
      const changed = updated.find(item => item.id === itemId);
      if (changed) pushEntityToSupabase('inventory', changed);
      return updated;
    });
  }, [pushEntityToSupabase]);

  return { inventory, setInventory, updateInventoryItem };
}
