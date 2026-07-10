import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';

export function TournamentStats({ tournament, teams }) {
  const [stats, setStats] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!tournament) return;
    loadStats();
    loadPlayers();
  }, [tournament]);

  const loadStats = async () => {
    const { data } = await supabase
      .from('tournament_player_stats')
      .select('*')
      .eq('tournament_id', tournament.id);
    if (data) setStats(data);
  };

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('id, first_name, last_name, nickname, makgora_team_id');
    if (data) setPlayers(data);
  };

  const topTries = [...stats]
    .sort((a, b) => (b.tries || 0) - (a.tries || 0))
    .slice(0, 5);

  const topTackles = [...stats]
    .sort((a, b) => (b.tackles || 0) - (a.tackles || 0))
    .slice(0, 5);

  const topConversions = [...stats]
    .sort((a, b) => (b.conversions || 0) - (a.conversions || 0))
    .slice(0, 5);

  const mvpCount = {};
  stats.forEach(s => {
    if (s.mvp) {
      mvpCount[s.player_id] = (mvpCount[s.player_id] || 0) + 1;
    }
  });
  const topMvp = Object.entries(mvpCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const playerName = (id) => {
    const p = players.find(p => p.id === id);
    if (!p) return '—';
    return `${p.first_name} ${p.last_name}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
      <h4 style={{ color: 'var(--color-gold)', marginBottom: '15px', fontFamily: 'Outfit' }}>Estadísticas del Torneo</h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div>
          <h5 style={{ color: 'var(--color-text)', fontSize: '0.8rem', marginBottom: '8px' }}>Top Tries</h5>
          {topTries.map((s, i) => (
            <div key={s.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--color-text)' }}>{i + 1}. {playerName(s.player_id)}</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{s.tries || 0}</span>
            </div>
          ))}
          {topTries.length === 0 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Sin datos aún</p>}
        </div>

        <div>
          <h5 style={{ color: 'var(--color-text)', fontSize: '0.8rem', marginBottom: '8px' }}>Top Tackles</h5>
          {topTackles.map((s, i) => (
            <div key={s.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--color-text)' }}>{i + 1}. {playerName(s.player_id)}</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{s.tackles || 0}</span>
            </div>
          ))}
          {topTackles.length === 0 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Sin datos aún</p>}
        </div>

        <div>
          <h5 style={{ color: 'var(--color-text)', fontSize: '0.8rem', marginBottom: '8px' }}>Top Conversiones</h5>
          {topConversions.map((s, i) => (
            <div key={s.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--color-text)' }}>{i + 1}. {playerName(s.player_id)}</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{s.conversions || 0}</span>
            </div>
          ))}
          {topConversions.length === 0 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Sin datos aún</p>}
        </div>

        <div>
          <h5 style={{ color: 'var(--color-text)', fontSize: '0.8rem', marginBottom: '8px' }}>MVP del Torneo</h5>
          {topMvp.map(([playerId, count], i) => (
            <div key={playerId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--color-text)' }}>{i + 1}. {playerName(playerId)}</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{count}x MVP</span>
            </div>
          ))}
          {topMvp.length === 0 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Sin datos aún</p>}
        </div>
      </div>
    </div>
  );
}
