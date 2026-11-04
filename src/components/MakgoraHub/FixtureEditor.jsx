import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { STYLE } from './constants';
import { useToast } from '../../context/ToastContext.jsx';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRoundRobin(teamIds, randomize) {
  const ids = randomize ? shuffle(teamIds) : [...teamIds];
  const n = ids.length;
  const isOdd = n % 2 !== 0;
  const pool = isOdd ? [...ids, null] : [...ids];
  const rounds = pool.length - 1;
  const perRound = Math.floor(pool.length / 2);
  const matches = [];

  for (let r = 0; r < rounds; r++) {
    for (let m = 0; m < perRound; m++) {
      const home = pool[m];
      const away = pool[pool.length - 1 - m];
      if (home !== null && away !== null) {
        const isHomeFirst = (r + m) % 2 === 0;
        matches.push({
          round: r + 1,
          home_team_id: isHomeFirst ? home : away,
          away_team_id: isHomeFirst ? away : home,
          status: 'pendiente',
        });
      }
    }
    const last = pool.pop();
    pool.splice(1, 0, last);
  }
  return matches;
}

export function FixtureEditor({ matches, tournament, teams, onSaved, onClose }) {
  const { showToast } = useToast();
  const [rounds, setRounds] = useState([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const grouped = {};
    (matches || []).forEach(m => {
      if (!grouped[m.round]) grouped[m.round] = [];
      grouped[m.round].push({ ...m });
    });
    const arr = Object.entries(grouped).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([round, ms]) => ({
      round: parseInt(round),
      matches: ms,
    }));
    setRounds(arr);
  }, [matches]);

  const save = async () => {
    const all = rounds.flatMap(r => r.matches);
    const { error: delError } = await supabase.from('tournament_matches')
      .delete().eq('tournament_id', tournament.id);
    if (delError) { showToast(delError.message, 'error'); return; }

    const inserts = all.map(m => ({
      tournament_id: tournament.id,
      round: m.round,
      phase: m.phase || 'regular',
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      home_score: m.home_score || null,
      away_score: m.away_score || null,
      status: m.status || 'pendiente',
    }));
    const { error } = await supabase.from('tournament_matches').insert(inserts);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Fixture guardado', 'success');
    setDirty(false);
    onSaved();
    onClose();
  };

  const addRound = () => {
    const maxRound = rounds.length > 0 ? Math.max(...rounds.map(r => r.round)) : 0;
    setRounds([...rounds, { round: maxRound + 1, matches: [] }]);
    setDirty(true);
  };

  const deleteRound = (roundNum) => {
    setRounds(rounds.filter(r => r.round !== roundNum));
    setDirty(true);
  };

  const addMatch = (roundNum) => {
    const teamIds = teams.filter(t => t.is_active).map(t => t.id);
    if (teamIds.length < 2) { showToast('No hay suficientes equipos', 'warning'); return; }
    setRounds(rounds.map(r => {
      if (r.round !== roundNum) return r;
      const used = r.matches.flatMap(m => [m.home_team_id, m.away_team_id]);
      const avail = teamIds.filter(id => !used.includes(id));
      if (avail.length < 2) { showToast('No hay suficientes equipos disponibles para esta ronda', 'warning'); return r; }
      return { ...r, matches: [...r.matches, { home_team_id: avail[0], away_team_id: avail[1], status: 'pendiente', phase: 'regular', round: roundNum }] };
    }));
    setDirty(true);
  };

  const deleteMatch = (roundNum, matchIdx) => {
    setRounds(rounds.map(r => {
      if (r.round !== roundNum) return r;
      return { ...r, matches: r.matches.filter((_, i) => i !== matchIdx) };
    }));
    setDirty(true);
  };

  const swapHomeAway = (roundNum, matchIdx) => {
    setRounds(rounds.map(r => {
      if (r.round !== roundNum) return r;
      const updated = [...r.matches];
      const m = { ...updated[matchIdx] };
      [m.home_team_id, m.away_team_id] = [m.away_team_id, m.home_team_id];
      updated[matchIdx] = m;
      return { ...r, matches: updated };
    }));
    setDirty(true);
  };

  const changeTeam = (roundNum, matchIdx, side, newTeamId) => {
    setRounds(rounds.map(r => {
      if (r.round !== roundNum) return r;
      const updated = [...r.matches];
      const m = { ...updated[matchIdx] };
      m[side] = newTeamId;
      updated[matchIdx] = m;
      return { ...r, matches: updated };
    }));
    setDirty(true);
  };

  const reshuffle = () => {
    const teamIds = [...new Set(matches.flatMap(m => [m.home_team_id, m.away_team_id]))];
    if (teamIds.length < 2) { showToast('No hay suficientes equipos', 'warning'); return; }
    const newMatches = generateRoundRobin(teamIds, true);
    const grouped = {};
    newMatches.forEach(m => {
      if (!grouped[m.round]) grouped[m.round] = [];
      grouped[m.round].push({ ...m, phase: 'regular', tournament_id: tournament.id });
    });
    const arr = Object.entries(grouped).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([round, ms]) => ({
      round: parseInt(round),
      matches: ms,
    }));
    setRounds(arr);
    setDirty(true);
    showToast('Fixture rebarajado! Revisa los emparejamientos', 'info');
  };

  const allTeams = teams.filter(t => t.is_active);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontFamily: 'Outfit' }}>Editor de Fixture</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <button onClick={reshuffle} className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>Rebarajar</button>
          <button onClick={addRound} className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>+ Añadir Ronda</button>
          <button onClick={save} className="btn-neon" style={{ padding: '6px 14px', fontSize: '0.75rem', opacity: dirty ? 1 : 0.5, marginLeft: 'auto' }} disabled={!dirty}>
            {dirty ? 'Guardar Cambios' : 'Sin cambios'}
          </button>
        </div>

        {rounds.map(r => (
          <div key={r.round} style={{ marginBottom: '15px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h5 style={{ color: 'var(--color-text)', fontSize: '0.85rem', margin: 0 }}>Ronda {r.round}</h5>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => addMatch(r.round)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.65rem' }}>+ Partido</button>
                <button onClick={() => deleteRound(r.round)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.65rem', borderColor: '#ff3d00', color: '#ff3d00' }}>× Ronda</button>
              </div>
            </div>
            {r.matches.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '10px' }}>Ronda vacía — añade partidos</p>
            )}
            {r.matches.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', fontSize: '0.8rem' }}>
                <select value={m.home_team_id} onChange={e => changeTeam(r.round, idx, 'home_team_id', e.target.value)} style={{ ...STYLE.inp, flex: 1, padding: '4px', fontSize: '0.75rem' }}>
                  {allTeams.map(t => <option key={t.id} value={t.id}>{t.rpg_name || t.name}</option>)}
                </select>
                <span style={{ color: 'var(--color-text-muted)' }}>vs</span>
                <select value={m.away_team_id} onChange={e => changeTeam(r.round, idx, 'away_team_id', e.target.value)} style={{ ...STYLE.inp, flex: 1, padding: '4px', fontSize: '0.75rem' }}>
                  {allTeams.map(t => <option key={t.id} value={t.id}>{t.rpg_name || t.name}</option>)}
                </select>
                <button onClick={() => swapHomeAway(r.round, idx)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>↔</button>
                <button onClick={() => deleteMatch(r.round, idx)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.65rem', borderColor: '#ff3d00', color: '#ff3d00' }}>×</button>
              </div>
            ))}
          </div>
        ))}

        {rounds.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '30px' }}>
            No hay rondas. Genera un fixture primero o añade rondas manualmente.
          </p>
        )}
      </div>
    </div>
  );
}
