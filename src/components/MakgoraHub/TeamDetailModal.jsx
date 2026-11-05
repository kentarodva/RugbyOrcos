import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import TeamCrest from '../common/TeamCrest';
import { clanCrestUrl } from './TeamsGrid';

export function TeamDetailModal({ team, onClose }) {
  const [players, setPlayers] = useState([]);
  const [tournamentHistory, setTournamentHistory] = useState([]);
  const isExternal = team?.is_external;

  useEffect(() => {
    if (!team) return;
    if (!isExternal) loadPlayers();
    loadHistory();
  }, [team]);

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('id, first_name, last_name, nickname, position, role, jersey_number')
      .eq('makgora_team_id', team.id)
      .order('role');
    if (data) setPlayers(data);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('tournaments')
      .select('name, status, winner_team_id, start_date')
      .order('start_date', { ascending: false })
      .limit(5);
    if (data) setTournamentHistory(data.filter(t => t.winner_team_id === team.id || t.status === 'en_curso'));
  };

  const forwards = players.filter(p => ['Pilier', 'Hooker', 'Segunda', 'Ala', 'Octavo'].some(pos => (p.position || '').includes(pos)));
  const backs = players.filter(p => !['Pilier', 'Hooker', 'Segunda', 'Ala', 'Octavo'].some(pos => (p.position || '').includes(pos)));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <TeamCrest url={clanCrestUrl(team)} name={team.rpg_name || team.name} color={team.emblem_color || '#00e676'} size={96} rounded="18%" glow />
          </div>
          {team.motto && <p style={{ color: team.emblem_color || '#00e676', fontStyle: 'italic', fontSize: '0.8rem', margin: '0 0 6px' }}>«{team.motto}»</p>}
          <h3 style={{ color: 'var(--color-gold)', fontFamily: 'Outfit', margin: 0 }}>
            {team.rpg_name || team.name}
            {isExternal && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,179,0,0.1)', color: '#ffb300', marginLeft: '8px', verticalAlign: 'middle' }}>Invitado</span>}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{team.name}</p>
          <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {tournamentHistory.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h5 style={{ color: 'var(--color-text)', fontSize: '0.8rem', marginBottom: '8px' }}>🏆 Historial</h5>
            {tournamentHistory.map((t, i) => (
              <div key={i} style={{ fontSize: '0.75rem', color: t.winner_team_id === team.id ? 'var(--color-gold)' : 'var(--color-text-muted)', padding: '3px 0' }}>
                {t.name} {t.winner_team_id === team.id && '🏆 Campeón'}
              </div>
            ))}
          </div>
        )}

        {!isExternal ? (
          <div>
            <h5 style={{ color: 'var(--color-text)', fontSize: '0.8rem', marginBottom: '8px' }}>Jugadores ({players.length})</h5>
            {forwards.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>DELANTEROS</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {forwards.map(p => (
                    <span key={p.id} style={{ fontSize: '0.75rem', color: 'var(--color-text)', background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: '4px' }}>
                      {p.first_name} {p.last_name}
                      {p.jersey_number && <span style={{ color: 'var(--color-gold)', marginLeft: '4px' }}>#{p.jersey_number}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {backs.length > 0 && (
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>TRES CUARTOS</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {backs.map(p => (
                    <span key={p.id} style={{ fontSize: '0.75rem', color: 'var(--color-text)', background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: '4px' }}>
                      {p.first_name} {p.last_name}
                      {p.jersey_number && <span style={{ color: 'var(--color-gold)', marginLeft: '4px' }}>#{p.jersey_number}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {players.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sin jugadores asignados</p>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '15px' }}>
            Equipo invitado — sin roster interno
          </p>
        )}
      </div>
    </div>
  );
}
