import React from 'react';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { PlayerPhoto } from '../PlayerPhoto';
import getPlayerBadges from './PlayerBadges';
import { formatTeamCategory } from '../../context/ClubContext';

const STATUS = {
  lesionado: { label: 'Lesionado', cls: 'badge-injured' },
  suspendido: { label: 'Suspendido', cls: 'badge-suspended' },
  inactivo: { label: 'Inactivo', cls: 'badge-inactive' },
};

export function overall(player) {
  const a = player.attributes || {};
  return Math.round(((a.force || 50) + (a.speed || 50) + (a.stamina || 50) + (a.technique || 50)) / 4);
}

/** One roster row: photo, name, position/nickname, status, OVR. */
function PlayerCard({ player, onClick, activeLoans, makgoraTeams, bulkMode, isSelected, onSelect, viewMode, onRestore }) {
  const isCoach = player.rol === 'Entrenador';
  const badges = getPlayerBadges(player);
  const activeLoan = activeLoans.find((l) => l.player_id === player.id);
  const loanTeam = activeLoan ? makgoraTeams.find((t) => t.id === activeLoan.to_team_id) : null;
  const makgoraTeam = player.makgora_team_id ? makgoraTeams.find((t) => t.id === player.makgora_team_id) : null;
  const status = STATUS[player.estado];

  const meta = [
    isCoach ? 'Staff' : player.posicion,
    player.apodo ? `«${player.apodo}»` : null,
    player.rol === 'Capitan' ? 'Capitán' : player.rol === 'Subcapitan' ? 'Subcapitán' : null,
  ].filter(Boolean);

  const sub = [
    viewMode === 'makgora' ? (makgoraTeam ? makgoraTeam.rpg_name || makgoraTeam.name : 'Sin clan') : null,
    viewMode === 'makgora' && player.teamCategory ? formatTeamCategory(player.teamCategory) : null,
    activeLoan ? `Préstamo → ${loanTeam ? loanTeam.rpg_name || loanTeam.name : 'otro equipo'}` : null,
  ].filter(Boolean);

  const handle = () => (bulkMode ? onSelect(player.id) : onClick(player));

  return (
    <div className={`player-row${isSelected ? ' is-selected' : ''}${player.deleted_at ? ' is-deleted' : ''}`}>
      {bulkMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(player.id)}
          aria-label={`Seleccionar a ${player.name}`}
          style={{ width: 20, height: 20, accentColor: 'var(--color-primary)', flexShrink: 0, marginLeft: 8 }}
        />
      )}
      <button type="button" className="player-row-main" onClick={handle}>
        <PlayerPhoto player={player} size={44} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="player-row-name">
            {player.camiseta != null && <span className="player-row-num">#{player.camiseta}</span>}
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</span>
            {badges.map((b) => (
              <span key={b.name} title={b.name} aria-label={b.name} style={{ fontSize: '0.8rem' }}>{b.icon}</span>
            ))}
          </span>
          <span className="player-row-meta">{meta.join(' · ')}</span>
          {(status || sub.length > 0 || player.deleted_at) && (
            <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {player.deleted_at && <span className="badge badge-inactive">En papelera</span>}
              {status && <span className={`badge ${status.cls}`}>{status.label}</span>}
              {sub.map((s) => <span key={s} className="badge">{s}</span>)}
            </span>
          )}
        </span>
        {!isCoach && (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
            <span className="stat-number" style={{ fontSize: '1.375rem' }}>{overall(player)}</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--color-text-subtle)' }}>OVR</span>
          </span>
        )}
        {!bulkMode && <ChevronRight size={18} color="var(--color-text-subtle)" aria-hidden="true" style={{ flexShrink: 0 }} />}
      </button>
      {player.deleted_at && onRestore && (
        <button type="button" className="btn-outline btn-sm" style={{ marginRight: 8 }} onClick={() => onRestore(player)}>
          <RotateCcw size={14} /> Recuperar
        </button>
      )}
    </div>
  );
}

export default PlayerCard;
