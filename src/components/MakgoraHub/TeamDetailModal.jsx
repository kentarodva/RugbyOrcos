import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { getAvatarPath } from '../../data/mythicalAvatars.js';

const TEAM_CRESTS = [
  { keys: ['orcos', 'horda'], avatar: 'dragon-head', gradient: 'linear-gradient(135deg, #0a3d1a, #00e676)' },
  { keys: ['cuervos', 'cuervo'], avatar: 'raven', gradient: 'linear-gradient(135deg, #1a1a1a, #616161)' },
  { keys: ['trolls', 'troll'], avatar: 'horned-helm', gradient: 'linear-gradient(135deg, #0a2a4a, #2196f3)' },
  { keys: ['gargolas', 'gargola'], avatar: 'gargoyle', gradient: 'linear-gradient(135deg, #2a0a3a, #9c27b0)' },
  { keys: ['pitbull'], avatar: 'wolf-head', gradient: 'linear-gradient(135deg, #3d1500, #ff6d00)' },
  { keys: ['buffalos', 'bufalos', 'buffalo'], avatar: 'boar-tusks', gradient: 'linear-gradient(135deg, #2a1a0a, #795548)' },
];

function getCrest(team) {
  const name = ((team.rpg_name || team.name || '') + ' ' + (team.name || '')).toLowerCase();
  return TEAM_CRESTS.find(c => c.keys.some(k => name.includes(k))) || TEAM_CRESTS[0];
}

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

  const crest = getCrest(team);
  const forwards = players.filter(p => ['Pilier', 'Hooker', 'Segunda', 'Ala', 'Octavo'].some(pos => (p.position || '').includes(pos)));
  const backs = players.filter(p => !['Pilier', 'Hooker', 'Segunda', 'Ala', 'Octavo'].some(pos => (p.position || '').includes(pos)));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: crest.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px auto',
            border: '2px solid ' + (team.emblem_color || '#00e676'),
          }}>
            <img src={getAvatarPath(crest.avatar)} alt={team.rpg_name || team.name}
              style={{ width: '44px', height: '44px', filter: 'brightness(0) invert(1)' }} />
          </div>
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
