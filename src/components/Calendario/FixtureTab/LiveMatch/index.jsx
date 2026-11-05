import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../../supabaseClient';
import apisupabase from '../../../../data/supabaseApi';
import MatchHeader from './MatchHeader';
import LiveScorer from './LiveScorer';
import EventTimeline from './EventTimeline';
import LivePlayerStats from './LivePlayerStats';
import { playRugbyWhistle } from '../../../../utils/rugbyAudio';

function LiveMatch({
  liveMatch: initialMatch,
  players,
  onStart,
  onAddEvent,
  onPause,
  onResume,
  onEnd,
  onDelete,
  onClose,
  addFixture,
  showToast,
}) {
  const [liveMatch, setLiveMatch] = useState(initialMatch);
  const [liveEvents, setLiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consolidating, setConsolidating] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const channelsRef = useRef([]);

  const fetchEvents = useCallback(async (matchId) => {
    const { data } = await apisupabase.fetchLiveEvents(matchId);
    if (data) setLiveEvents(data);
  }, []);

  useEffect(() => {
    if (!initialMatch) {
      setLoading(false);
      return;
    }

    setLiveMatch(initialMatch);
    fetchEvents(initialMatch.id).finally(() => setLoading(false));

    const matchChannel = supabase
      .channel('live_match_' + initialMatch.id)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'live_matches', filter: `id=eq.${initialMatch.id}` },
        (payload) => {
          if (payload.new) setLiveMatch(payload.new);
        }
      )
      .subscribe();

    const eventsChannel = supabase
      .channel('live_events_' + initialMatch.id)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_match_events', filter: `live_match_id=eq.${initialMatch.id}` },
        (payload) => {
          if (payload.new) setLiveEvents(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    channelsRef.current = [matchChannel, eventsChannel];

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [initialMatch?.id, fetchEvents]);

  const getElapsed = useCallback(() => {
    if (!liveMatch) return 0;
    const acc = liveMatch.elapsed_seconds || 0;
    if (liveMatch.status === 'paused' || liveMatch.status === 'finished') return acc;
    const start = new Date(liveMatch.started_at).getTime();
    return acc + Math.max(0, Math.floor((Date.now() - start) / 1000));
  }, [liveMatch]);

  const handleAddEvent = useCallback(async (event) => {
    if (event?.event_type === 'try') {
      playRugbyWhistle('try');
    }
    const ev = await onAddEvent(event);
    if (!ev) {
      showToast?.('Error al registrar evento.', 'error');
    }
  }, [onAddEvent, showToast]);

  const handleEnd = useCallback(async () => {
    setConsolidating(true);
    await onEnd();

    if (liveMatch?.fixture_id && addFixture) {
      const score = (() => {
        let orcos = 0;
        for (const ev of liveEvents) {
          const pts = ({ try: 5, conversion: 2, penalty: 3, drop_goal: 3 })[ev.event_type] || 0;
          if (ev.team === 'orcos') orcos += pts;
        }
        return { orcos, opponent: liveMatch?.opponent_score || 0 };
      })();

      addFixture({
        opponent: liveMatch.opponent_name || 'Rival',
        orcosScore: score.orcos,
        opponentScore: score.opponent,
        date: new Date(liveMatch.started_at).toISOString().split('T')[0],
        tries: liveEvents.filter(e => e.event_type === 'try').length,
        mvp: '',
      });
      showToast?.('Partido finalizado y guardado en historial.', 'success');
    }

    setConsolidating(false);
  }, [onEnd, liveMatch, liveEvents, addFixture, showToast]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Cargando partido en vivo...
      </div>
    );
  }

  if (!liveMatch) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>
          No hay partido en vivo activo.
        </p>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Nombre del rival"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            className="form-input"
            style={{ maxWidth: '300px', width: '100%', textAlign: 'center' }}
          />
          <button
            className="btn-neon"
            onClick={() => {
              if (!opponentName.trim()) {
                showToast?.('Ingresa el nombre del rival.', 'warning');
                return;
              }
              playRugbyWhistle('kickoff');
              onStart?.({ opponent: opponentName.trim() });
            }}
            disabled={!opponentName.trim()}
            style={{ maxWidth: '300px', width: '100%' }}
          >
            Iniciar Partido en Vivo
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '15px' }}>
          O selecciona un fixture existente desde{' '}
          <button
            onClick={onClose}
            style={{ color: 'var(--color-primary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Campaña y Fixture
          </button>
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <MatchHeader
        liveMatch={liveMatch}
        liveEvents={liveEvents}
        onPause={onPause}
        onResume={onResume}
        onEnd={handleEnd}
        onClose={onClose}
        onDelete={onDelete}
      />

      {(liveMatch?.status === 'live' || liveMatch?.status === 'paused') && (
        <LiveScorer
          players={players}
          liveMatch={liveMatch}
          liveEvents={liveEvents}
          onAddEvent={handleAddEvent}
          getElapsed={getElapsed}
        />
      )}

      <LivePlayerStats
        events={liveEvents}
        players={players}
      />

      <EventTimeline events={liveEvents} />

      {consolidating && (
        <div className="glass-panel" style={{
          padding: '20px', textAlign: 'center', color: 'var(--color-gold)',
          fontWeight: 700,
        }}>
          ⏳ Guardando resultado en el historial...
        </div>
      )}
    </div>
  );
}

export default LiveMatch;
