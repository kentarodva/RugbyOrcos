import React from 'react';
import { motion } from 'framer-motion';
import { PlayerPhoto } from '../PlayerPhoto';
import getPlayerBadges from './PlayerBadges';
import { formatTeamCategory } from '../../context/ClubContext';

function PlayerCard({ player, onClick, activeLoans, makgoraTeams, bulkMode, isSelected, onSelect, viewMode }) {
  const isCoach = player.rol === 'Entrenador';
  const badges = getPlayerBadges(player);

  const activeLoan = activeLoans.find(l => l.player_id === player.id);
  const loanTeam = activeLoan ? makgoraTeams.find(t => t.id === activeLoan.to_team_id) : null;
  const makgoraTeam = player.makgora_team_id ? makgoraTeams.find(t => t.id === player.makgora_team_id) : null;

  let borderTop = '1px solid var(--border-glass)';
  if (isCoach) borderTop = '3px solid var(--color-blue)';
  else if (player.rol === 'Capitan') borderTop = '3px solid var(--color-gold)';
  else if (player.estado === 'lesionado') borderTop = '3px solid var(--color-red)';

  return (
    <motion.div
      className="glass-panel"
      onClick={() => bulkMode ? onSelect(player.id) : onClick(player)}
      whileHover={{ y: -4, scale: 1.015, boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 20px rgba(0,230,118,0.08)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        padding: '20px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        borderTop,
        borderLeft: isSelected ? '3px solid var(--color-primary)' : undefined,
        background: isSelected ? 'rgba(0,230,118,0.04)' : undefined,
      }}
    >
      {bulkMode && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => { e.stopPropagation(); onSelect(player.id); }}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
          />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>
            {player.name}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700 }}>
            "{player.apodo}"
          </p>

          {!isCoach && badges.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {badges.map((b, i) => (
                <span key={i} title={b.name} style={{ fontSize: '0.8rem' }}>{b.icon}</span>
              ))}
            </div>
          )}
        </div>

        <PlayerPhoto player={player} size={42} />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <span className="badge badge-active" style={{ background: 'var(--bg-input)', color: 'var(--color-text)' }}>
          {player.posicion}
        </span>

        {player.rol === 'Capitan' && <span className="badge badge-gold">Capitan</span>}
        {player.rol === 'Subcapitan' && <span className="badge badge-gold">Subcapitan</span>}
        {isCoach && <span className="badge badge-active" style={{ color: 'var(--color-blue)', border: '1px solid var(--color-blue)' }}>Staff</span>}

        {player.estado === 'activo' && <span className="badge badge-active">Activo</span>}
        {player.estado === 'lesionado' && <span className="badge badge-injured">Lesionado</span>}
        {player.estado === 'suspendido' && <span className="badge badge-suspended">Suspendido</span>}

        {activeLoan && (
          <span className="badge" style={{ background: 'rgba(0,176,255,0.08)', border: '1px solid var(--color-blue)', color: 'var(--color-blue)', fontWeight: 700 }}>
            Prestamo → {loanTeam ? (loanTeam.rpg_name || loanTeam.name) : 'otro equipo'}
          </span>
        )}

        {makgoraTeam && (
          <span className="badge" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', fontWeight: 700 }}>
            {makgoraTeam.rpg_name || makgoraTeam.name}
          </span>
        )}
        {!isCoach && !makgoraTeam && (
          <span className="badge" style={{ background: 'rgba(100,100,100,0.08)', border: '1px dashed var(--color-text-muted)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Sin equipo Mak'Gora
          </span>
        )}
        {viewMode === 'makgora' && player.teamCategory && (
          <span className="badge" style={{ background: 'rgba(64,196,255,0.08)', border: '1px solid var(--color-blue)', color: 'var(--color-blue)', fontWeight: 600 }}>
            {formatTeamCategory(player.teamCategory)}
          </span>
        )}
      </div>

      {!isCoach && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[
            { key: 'force', color: 'var(--color-red)', label: 'FUE' },
            { key: 'speed', color: 'var(--color-blue)', label: 'VEL' },
            { key: 'stamina', color: 'var(--color-primary)', label: 'RES' },
            { key: 'technique', color: '#ce93d8', label: 'TEC' },
          ].map(stat => (
            <div key={stat.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: stat.color, width: '26px', textAlign: 'right', fontFamily: 'Outfit' }}>{stat.label}</span>
              <div style={{ flex: 1, height: '6px', background: 'var(--bg-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: stat.color, borderRadius: '3px' }}
                  animate={{ width: `${player.attributes?.[stat.key] || 50}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                />
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-text-muted)', width: '24px', fontFamily: 'monospace' }}>{player.attributes?.[stat.key] || 50}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <span title="Promedio RPG (Fuerza + Velocidad + Resistencia + Tecnica) / 4">Overall RPG: {isCoach ? 'Coach' : Math.round(((player.attributes?.force || 50) + (player.attributes?.speed || 50) + (player.attributes?.stamina || 50) + (player.attributes?.technique || 50)) / 4)}</span>
        <span style={{ color: 'var(--color-primary)' }}>Ver Ficha →</span>
      </div>
    </motion.div>
  );
}

export default PlayerCard;
