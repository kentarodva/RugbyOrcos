import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { STYLE } from './constants';

export function PlayerStatsModal({ match, teams, onClose }) {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadPlayers();
    loadStats();
  }, []);

  const loadPlayers = async () => {
    const teamIds = [match.home_team_id, match.away_team_id];
    const { data } = await supabase
      .from('players')
      .select('id, first_name, last_name, nickname, makgora_team_id')
      .in('makgora_team_id', teamIds)
      .not('makgora_team_id', 'is', null);
    if (data) setPlayers(data);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from('tournament_player_stats')
      .select('*')
      .eq('match_id', match.id);
    if (data) {
      const map = {};
      data.forEach(s => { map[s.player_id] = s; });
      setStats(map);
    }
  };

  const upsertStat = async (playerId, field, value) => {
    const current = stats[playerId] || {};
    const payload = {
      tournament_id: match.tournament_id,
      match_id: match.id,
      player_id: playerId,
      team_id: players.find(p => p.id === playerId)?.makgora_team_id,
      tries: current.tries || 0,
      conversions: current.conversions || 0,
      tackles: current.tackles || 0,
      yellow_cards: current.yellow_cards || 0,
      red_cards: current.red_cards || 0,
      mvp: current.mvp || false,
      [field]: value,
    };

    const { data, error } = await supabase
      .from('tournament_player_stats')
      .upsert(payload, { onConflict: 'match_id, player_id' })
      .select()
      .single();

    if (!error && data) {
      setStats(prev => ({ ...prev, [playerId]: data }));
    }
  };

  const homeTeam = teams.find(t => t.id === match.home_team_id);
  const awayTeam = teams.find(t => t.id === match.away_team_id);
  const homePlayers = players.filter(p => p.makgora_team_id === match.home_team_id);
  const awayPlayers = players.filter(p => p.makgora_team_id === match.away_team_id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}>
            Estadísticas • {homeTeam?.rpg_name || homeTeam?.name} vs {awayTeam?.rpg_name || awayTeam?.name}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
          {[{ label: homeTeam?.rpg_name || homeTeam?.name, players: homePlayers },
            { label: awayTeam?.rpg_name || awayTeam?.name, players: awayPlayers }].map(section => (
            <div key={section.label}>
              <h4 style={{ color: 'var(--color-text)', fontSize: '0.85rem', marginBottom: '10px' }}>{section.label}</h4>
              {section.players.map(player => {
                const s = stats[player.id] || {};
                return (
                  <div key={player.id} className="glass-panel" style={{ padding: '10px', marginBottom: '8px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: '6px' }}>
                      {player.first_name} {player.last_name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>Tries</label>
                        <input type="number" min="0" value={s.tries || 0} onChange={e => upsertStat(player.id, 'tries', parseInt(e.target.value) || 0)}
                          style={{ ...STYLE.inp, padding: '4px', fontSize: '0.75rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>Conv</label>
                        <input type="number" min="0" value={s.conversions || 0} onChange={e => upsertStat(player.id, 'conversions', parseInt(e.target.value) || 0)}
                          style={{ ...STYLE.inp, padding: '4px', fontSize: '0.75rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>Tackles</label>
                        <input type="number" min="0" value={s.tackles || 0} onChange={e => upsertStat(player.id, 'tackles', parseInt(e.target.value) || 0)}
                          style={{ ...STYLE.inp, padding: '4px', fontSize: '0.75rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>TA</label>
                        <input type="number" min="0" value={s.yellow_cards || 0} onChange={e => upsertStat(player.id, 'yellow_cards', parseInt(e.target.value) || 0)}
                          style={{ ...STYLE.inp, padding: '4px', fontSize: '0.75rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>TR</label>
                        <input type="number" min="0" value={s.red_cards || 0} onChange={e => upsertStat(player.id, 'red_cards', parseInt(e.target.value) || 0)}
                          style={{ ...STYLE.inp, padding: '4px', fontSize: '0.75rem' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={s.mvp || false} onChange={e => upsertStat(player.id, 'mvp', e.target.checked)} />
                          MVP
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
              {section.players.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sin jugadores en este equipo</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
