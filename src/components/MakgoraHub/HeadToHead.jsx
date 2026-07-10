import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';

export function HeadToHead({ teams }) {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teamA && teamB) loadHistory();
  }, [teamA, teamB]);

  const loadHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tournament_matches')
      .select('*, home:fk_match_home(name, rpg_name), away:fk_match_away(name, rpg_name)')
      .or(`and(home_team_id.eq.${teamA},away_team_id.eq.${teamB}),and(home_team_id.eq.${teamB},away_team_id.eq.${teamA})`)
      .eq('status', 'jugado')
      .order('round');
    if (data) setMatches(data);
    setLoading(false);
  };

  const teamAName = teams.find(t => t.id === teamA)?.rpg_name || teams.find(t => t.id === teamA)?.name || '';
  const teamBName = teams.find(t => t.id === teamB)?.rpg_name || teams.find(t => t.id === teamB)?.name || '';

  let winsA = 0, winsB = 0, draws = 0, pointsA = 0, pointsB = 0;
  matches.forEach(m => {
    if (m.home_team_id === teamA) {
      if (m.home_score > m.away_score) winsA++;
      else if (m.home_score < m.away_score) winsB++;
      else draws++;
      pointsA += m.home_score;
      pointsB += m.away_score;
    } else {
      if (m.away_score > m.home_score) winsA++;
      else if (m.away_score < m.home_score) winsB++;
      else draws++;
      pointsA += m.away_score;
      pointsB += m.home_score;
    }
  });

  const activeTeams = teams.filter(t => t.is_active);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
      <h4 style={{ color: 'var(--color-gold)', marginBottom: '15px', fontFamily: 'Outfit' }}>Historial de Confrontaciones</h4>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <select value={teamA} onChange={e => setTeamA(e.target.value)} style={{ flex: 1, minWidth: '140px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', padding: '8px', fontSize: '0.8rem' }}>
          <option value="">Equipo A</option>
          {activeTeams.map(t => <option key={t.id} value={t.id} disabled={t.id === teamB}>{t.rpg_name || t.name}</option>)}
        </select>
        <span style={{ alignSelf: 'center', color: 'var(--color-text-muted)' }}>vs</span>
        <select value={teamB} onChange={e => setTeamB(e.target.value)} style={{ flex: 1, minWidth: '140px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', padding: '8px', fontSize: '0.8rem' }}>
          <option value="">Equipo B</option>
          {activeTeams.map(t => <option key={t.id} value={t.id} disabled={t.id === teamA}>{t.rpg_name || t.name}</option>)}
        </select>
      </div>

      {loading && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Cargando...</p>}

      {!loading && matches.length === 0 && teamA && teamB && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>No hay enfrentamientos previos entre estos equipos.</p>
      )}

      {!loading && matches.length > 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', marginBottom: '15px', textAlign: 'center' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>{winsA}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{teamAName}</div>
            </div>
            <div style={{ alignSelf: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold)' }}>{draws} E</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>{matches.length} P</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>{winsB}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{teamBName}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Puntos Promedio</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {(pointsA / matches.length).toFixed(1)} - {(pointsB / matches.length).toFixed(1)}
              </div>
            </div>
          </div>

          {matches.slice(0, 5).map(m => {
            const isHomeA = m.home_team_id === teamA;
            const hScore = isHomeA ? m.home_score : m.away_score;
            const aScore = isHomeA ? m.away_score : m.home_score;
            return (
              <div key={m.id} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {teamAName} {hScore} - {aScore} {teamBName}
                {m.home?.rpg_name && <span style={{ marginLeft: '6px', opacity: 0.6 }}>• {m.home?.rpg_name} local</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
