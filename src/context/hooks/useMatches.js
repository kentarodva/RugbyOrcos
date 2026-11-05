import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import apisupabase from '../../data/supabaseApi.js';
import { wrapCatch } from '../../utils/errorHandler';
import { generateId, sanitize } from '../../utils/ids.js';

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
      apisupabase.deleteEntity('fixtures', id).catch(wrapCatch('useFixtures.delete', { notifyUser: true }));
    }
  }, [user?.id]);

  const updateFixture = useCallback((fixture) => {
    setFixtures(prev => prev.map(f => {
      if (f.id !== fixture.id) return f;
      const merged = { ...f, ...fixture };
      const safe = {
        ...merged,
        opponent: sanitize(merged.opponent || ''),
        mvp: sanitize(merged.mvp || ''),
      };
      pushEntityToSupabase('fixtures', safe);
      return safe;
    }));
  }, [pushEntityToSupabase]);

  return { fixtures, setFixtures, addFixture, updateFixture, deleteFixture };
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
      apisupabase.deleteEntity('rivals', id).catch(wrapCatch('useRivals.delete', { notifyUser: true }));
    }
  }, [user?.id]);

  return { rivals, setRivals, addRival, updateRival, deleteRival };
}

export function useFutureFixtures(activeTeam, sendLocalNotification, pushEntityToSupabase, user) {
  const [futureFixtures, setFutureFixtures] = useState(() => []);

  const addFutureFixture = useCallback((fixture) => {
    const newFix = {
      ...fixture, opponent: sanitize(fixture.opponent), id: generateId(), teamCategory: fixture.teamCategory || activeTeam,
      rivalId: fixture.rivalId || null, availabilities: fixture.availabilities || {}, squad: fixture.squad || []
    };
    setFutureFixtures(prev => [...prev, newFix]);
    pushEntityToSupabase('futureFixtures', newFix);
    sendLocalNotification('Proximo Partido Agendado', `vs ${newFix.opponent} el ${newFix.date} a las ${newFix.time || ''}.`);
  }, [activeTeam, sendLocalNotification, pushEntityToSupabase]);

  const deleteFutureFixture = useCallback((id) => {
    setFutureFixtures(prev => prev.filter(f => f.id !== id));
    if (user?.id) {
      apisupabase.deleteEntity('futureFixtures', id).catch(wrapCatch('useFutureFixtures.delete', { notifyUser: true }));
    }
  }, [user?.id]);

  const setMatchAvailability = useCallback(async (fixtureId, playerId, status) => {
    if (!fixtureId || !playerId) return;
    setFutureFixtures(prev => prev.map(f => {
      if (f.id !== fixtureId) return f;
      const nextAvail = { ...(f.availabilities || {}), [playerId]: status };
      return { ...f, availabilities: nextAvail };
    }));
    if (user?.id) {
      try {
        await supabase.rpc('set_match_availability', {
          p_fixture_id: fixtureId,
          p_player_id: playerId,
          p_status: status
        });
      } catch (err) {
        wrapCatch('useFutureFixtures.setMatchAvailability', { notifyUser: true })(err);
      }
    }
  }, [user?.id]);

  return { futureFixtures, setFutureFixtures, addFutureFixture, deleteFutureFixture, setMatchAvailability };
}

const SCORING = { try: 5, conversion: 2, penalty: 3, drop_goal: 3 };

function calcScore(events) {
  let orcos = 0, opponent = 0;
  for (const ev of events) {
    const pts = SCORING[ev.event_type] || 0;
    if (ev.team === 'orcos') orcos += pts;
    else if (ev.team === 'opponent') opponent += pts;
  }
  return { orcos, opponent };
}

export function useLiveMatch(user) {
  const [liveMatch, setLiveMatch] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);

  const startLiveMatch = useCallback(async (opts = {}) => {
    const isDelayed = Boolean(opts.delayed || opts.delayReason);
    const match = {
      fixture_id: opts.fixtureId || null,
      opponent_name: sanitize(opts.opponentName || ''),
      team_category: opts.teamCategory || null,
      status: isDelayed ? 'delayed' : 'live',
      delay_reason: opts.delayReason || null,
      designated_scorer_name: opts.designatedScorerName || null,
      designated_scorer_id: opts.designatedScorerId || null,
      scorer_locked: Boolean(opts.designatedScorerName),
      orcos_score: 0,
      opponent_score: 0,
    };
    const { data, error } = await apisupabase.startLiveMatch(match, user?.id);
    if (error) {
      wrapCatch('useLiveMatch.start', { notifyUser: true })(error);
      return null;
    }
    setLiveMatch(data);
    setLiveEvents([]);
    return data;
  }, [user?.id]);

  const addLiveEvent = useCallback(async (event) => {
    if (!liveMatch) return null;
    const ev = {
      live_match_id: liveMatch.id,
      player_id: event.playerId || null,
      event_type: event.eventType,
      minute: event.minute ?? 0,
      team: event.team || 'orcos',
      details: event.details || {},
    };
    const { data, error } = await apisupabase.addLiveEvent(ev);
    if (error) {
      wrapCatch('useLiveMatch.addEvent', { notifyUser: true })(error);
      return null;
    }
    setLiveEvents(prev => [...prev, data]);
    return data;
  }, [liveMatch]);

  const updateLiveMatch = useCallback(async (updates) => {
    if (!liveMatch) return;
    const { data, error } = await apisupabase.updateLiveMatch(liveMatch.id, updates);
    if (error) {
      wrapCatch('useLiveMatch.update', { notifyUser: true })(error);
      return;
    }
    if (data) setLiveMatch(data);
  }, [liveMatch]);

  const pauseLiveMatch = useCallback(async () => {
    if (!liveMatch) return;
    const now = Date.now();
    const start = new Date(liveMatch.started_at).getTime();
    const additionalSeconds = Math.max(0, Math.floor((now - start) / 1000));
    const totalElapsed = (liveMatch.elapsed_seconds || 0) + additionalSeconds;
    await updateLiveMatch({ status: 'paused', elapsed_seconds: totalElapsed });
  }, [updateLiveMatch, liveMatch]);

  const resumeLiveMatch = useCallback(async () => {
    await updateLiveMatch({ status: 'live', started_at: new Date().toISOString(), delay_reason: null });
  }, [updateLiveMatch]);

  const delayLiveMatch = useCallback(async (reason) => {
    if (!liveMatch) return;
    const now = Date.now();
    let totalElapsed = liveMatch.elapsed_seconds || 0;
    if (liveMatch.status === 'live' && liveMatch.started_at) {
      const start = new Date(liveMatch.started_at).getTime();
      totalElapsed += Math.max(0, Math.floor((now - start) / 1000));
    }
    await updateLiveMatch({
      status: 'delayed',
      elapsed_seconds: totalElapsed,
      delay_reason: reason || 'Retraso de transporte o logística'
    });
  }, [updateLiveMatch, liveMatch]);

  const setDesignatedScorer = useCallback(async (scorerName, scorerId = null, locked = true) => {
    if (!liveMatch) return;
    await updateLiveMatch({
      designated_scorer_name: scorerName,
      designated_scorer_id: scorerId,
      scorer_locked: locked
    });
  }, [updateLiveMatch, liveMatch]);

  const endLiveMatch = useCallback(async () => {
    if (!liveMatch) return;
    const now = Date.now();
    const start = new Date(liveMatch.started_at).getTime();
    const additionalSeconds = liveMatch.status === 'live'
      ? Math.max(0, Math.floor((now - start) / 1000)) : 0;
    const totalElapsed = (liveMatch.elapsed_seconds || 0) + additionalSeconds;
    const score = liveEvents.length > 0 ? calcScore(liveEvents) : liveMatch;
    await updateLiveMatch({
      status: 'finished',
      elapsed_seconds: totalElapsed,
      orcos_score: score.orcos,
      opponent_score: score.opponent,
    });
  }, [updateLiveMatch, liveEvents, liveMatch]);

  const deleteLiveMatch = useCallback(async () => {
    if (!liveMatch) return;
    await apisupabase.deleteLiveMatch(liveMatch.id);
    setLiveMatch(null);
    setLiveEvents([]);
  }, [liveMatch]);

  return {
    liveMatch, setLiveMatch,
    liveEvents, setLiveEvents,
    startLiveMatch, addLiveEvent, updateLiveMatch,
    pauseLiveMatch, resumeLiveMatch, delayLiveMatch, setDesignatedScorer, endLiveMatch, deleteLiveMatch,
    calcScore: () => calcScore(liveEvents),
  };
}
