import { useState, useCallback } from 'react';

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

  const addChampionship = useCallback((champ) => {
    const newChamp = {
      ...champ, name: sanitize(champ.name), description: sanitize(champ.description || ''),
      id: generateId(), teamCategory: activeTeam
    };
    setChampionships(prev => [...prev, newChamp]);
    pushEntityToSupabase('championships', newChamp);
  }, [activeTeam, pushEntityToSupabase]);

  return { championships, setChampionships, addChampionship };
}

export function useFinances(activeTeam, pushEntityToSupabase, sendLocalNotification) {
  const [finances, setFinances] = useState(() => []);

  const addFinanceRecord = useCallback((record) => {
    const newRecord = {
      ...record, desc: sanitize(record.desc), id: generateId(),
      date: record.date || new Date().toISOString().split('T')[0], teamCategory: activeTeam
    };
    setFinances(prev => [...prev, newRecord]);
    pushEntityToSupabase('finances', newRecord);
  }, [activeTeam, pushEntityToSupabase]);

  const addMembershipPayment = useCallback((playerName, amount, date) => {
    const record = {
      desc: `Abono Membresia - ${playerName || 'Jugador'}`, amount, type: 'ingreso',
      date, id: generateId(), category: 'mensualidad', teamCategory: activeTeam
    };
    setFinances(prev => [...prev, record]);
    pushEntityToSupabase('finances', record);
    sendLocalNotification('Abono Registrado', `Se registro un abono de $${amount.toLocaleString()} COP.`);
  }, [activeTeam, pushEntityToSupabase, sendLocalNotification]);

  return { finances, setFinances, addFinanceRecord, addMembershipPayment };
}

export function useInventory(pushEntityToSupabase) {
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
    if (pushEntityToSupabase) pushEntityToSupabase('inventory', newItem);
  }, [pushEntityToSupabase]);

  const updateInventoryItem = useCallback((itemId, updatedData) => {
    const safe = { ...updatedData };
    if (safe.assignedTo) safe.assignedTo = sanitize(safe.assignedTo);
    if (safe.status) safe.status = sanitize(safe.status);
    setInventory(prev => {
      const updated = prev.map(item => item.id === itemId ? { ...item, ...safe } : item);
      const changed = updated.find(item => item.id === itemId);
      if (changed && pushEntityToSupabase) pushEntityToSupabase('inventory', changed);
      return updated;
    });
  }, [pushEntityToSupabase]);

  return { inventory, setInventory, addInventoryItem, updateInventoryItem };
}
