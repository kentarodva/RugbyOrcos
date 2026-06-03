import { useState, useCallback } from 'react';
import apisupabase from '../../data/supabaseApi.js';
import { wrapCatch } from '../../utils/errorHandler';

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

export function useFixtures(activeTeam, sendLocalNotification, pushEntityToSupabase, user) {
  const [fixtures, setFixtures] = useState(() => []);

  const addFixture = useCallback((fixture) => {
    const newFix = {
      ...fixture, opponent: sanitize(fixture.opponent), mvp: sanitize(fixture.mvp || ''),
      id: generateId(), teamCategory: fixture.teamCategory || activeTeam, rivalId: fixture.rivalId || null
    };
    setFixtures(prev => [...prev, newFix]);
    pushEntityToSupabase('fixtures', newFix);
  }, [activeTeam, pushEntityToSupabase]);

  const deleteFixture = useCallback((id) => {
    setFixtures(prev => prev.filter(f => f.id !== id));
    if (user?.id) {
      apisupabase.deleteEntity('fixtures', id).catch(wrapCatch('useFixtures.delete', { silent: true }));
    }
  }, [user?.id]);

  return { fixtures, setFixtures, addFixture, deleteFixture };
}

export function useRivals(pushEntityToSupabase, user) {
  const [rivals, setRivals] = useState(() => []);

  const addRival = useCallback((rival) => {
    const newRival = {
      ...rival, id: generateId(), name: sanitize(rival.name),
      colors: sanitize(rival.colors || ''), contact: sanitize(rival.contact || ''),
      notes: sanitize(rival.notes || '')
    };
    setRivals(prev => [...prev, newRival]);
    pushEntityToSupabase('rivals', newRival);
  }, [pushEntityToSupabase]);

  const updateRival = useCallback((updatedRival) => {
    const safe = {
      ...updatedRival, name: sanitize(updatedRival.name),
      colors: sanitize(updatedRival.colors || ''), contact: sanitize(updatedRival.contact || ''),
      notes: sanitize(updatedRival.notes || '')
    };
    setRivals(prev => prev.map(r => r.id === updatedRival.id ? safe : r));
    pushEntityToSupabase('rivals', safe);
  }, [pushEntityToSupabase]);

  const deleteRival = useCallback((id) => {
    setRivals(prev => prev.filter(r => r.id !== id));
    if (user?.id) {
      apisupabase.deleteEntity('rivals', id).catch(wrapCatch('useRivals.delete', { silent: true }));
    }
  }, [user?.id]);

  return { rivals, setRivals, addRival, updateRival, deleteRival };
}

export function useFutureFixtures(activeTeam, sendLocalNotification, pushEntityToSupabase, user) {
  const [futureFixtures, setFutureFixtures] = useState(() => []);

  const addFutureFixture = useCallback((fixture) => {
    const newFix = {
      ...fixture, opponent: sanitize(fixture.opponent), id: generateId(), teamCategory: fixture.teamCategory || activeTeam,
      rivalId: fixture.rivalId || null
    };
    setFutureFixtures(prev => [...prev, newFix]);
    pushEntityToSupabase('futureFixtures', newFix);
    sendLocalNotification('Proximo Partido Agendado', `vs ${newFix.opponent} el ${newFix.date} a las ${newFix.time || ''}.`);
  }, [activeTeam, sendLocalNotification, pushEntityToSupabase]);

  const deleteFutureFixture = useCallback((id) => {
    setFutureFixtures(prev => prev.filter(f => f.id !== id));
    if (user?.id) {
      apisupabase.deleteEntity('futureFixtures', id).catch(wrapCatch('useFutureFixtures.delete', { silent: true }));
    }
  }, [user?.id]);

  return { futureFixtures, setFutureFixtures, addFutureFixture, deleteFutureFixture };
}
