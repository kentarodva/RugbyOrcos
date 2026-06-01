import React from 'react';
import { motion } from 'framer-motion';
import getPlayerBadges from './PlayerBadges';

function PlayerCard({ player, onClick, activeLoans, makgoraTeams, bulkMode, isSelected, onSelect }) {
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

        {!isCoach && (
          <div style={{
            background: 'var(--bg-input)',
            width: '35px',
            height: '35px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '0.9rem',
            fontWeight: 800,
            color: player.rol === 'Capitan' ? 'var(--color-gold)' : 'var(--color-text)',
            border: player.rol === 'Capitan' ? '1.5px solid var(--color-gold)' : '1px solid var(--border-glass)'
          }}>
            #{player.camiseta ?? '—'}
          </div>
        )}
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
      </div>

      {!isCoach && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="rpg-stat">
            <div className="rpg-stat-bar-container">
              <motion.div className="rpg-stat-bar force"
                animate={{ width: `${player.attributes?.force || 50}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              />
            </div>
          </div>
          <div className="rpg-stat">
            <div className="rpg-stat-bar-container">
              <motion.div className="rpg-stat-bar speed"
                animate={{ width: `${player.attributes?.speed || 50}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <span>Nivel: {isCoach ? 'Coach' : Math.round(((player.attributes?.force || 50) + (player.attributes?.speed || 50) + (player.attributes?.stamina || 50) + (player.attributes?.technique || 50)) / 4)}</span>
        <span style={{ color: 'var(--color-primary)' }}>Ver Ficha →</span>
      </div>
    </motion.div>
  );
}

export default PlayerCard;
