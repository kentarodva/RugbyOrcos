import React, { useState } from 'react';
import { usePlayerAvatar } from '../../../hooks/usePlayerAvatar';
import { PlayerPhoto } from '../../PlayerPhoto';
import { AvatarPicker } from '../../AvatarPicker';
import PlayerAttributes from './PlayerAttributes';
import InjurySection from './InjurySection';
import GymStatsSection from './GymStatsSection';
import ClothingSection from './ClothingSection';
import HiaSection from './HiaSection';
import BattleHistory from './BattleHistory';

function PlayerDetail({
  player,
  onClose,
  onEdit,
  onDelete,
  onTestSubmit,
  onInjurySubmit,
  onPhaseChange,
  onGymSubmit,
  onClothingSubmit,
  onHiaSubmit,
  onCredential,
  onReset,
  onUpdatePlayer,
  hasPermission
}) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const { setAvatar, setPhoto, clearPhoto } = usePlayerAvatar(player, onUpdatePlayer);

  if (!player) return null;

  const isCoach = player.rol === 'Entrenador';
  const lastWellness = player.wellnessLogs && player.wellnessLogs.length > 0 ? player.wellnessLogs[player.wellnessLogs.length - 1] : null;

  let wellnessBadge = null;
  if (!isCoach && lastWellness) {
    const wellnessScore = Math.round(((lastWellness.sleep + lastWellness.soreness + lastWellness.stress) / 15) * 100);
    let badgeColor = 'var(--color-primary)';
    let label = 'Excelente Recuperacion';
    if (wellnessScore < 50) { badgeColor = 'var(--color-red)'; label = 'Sobrecarga / Alerta de Lesion'; }
    else if (wellnessScore < 80) { badgeColor = 'var(--color-gold)'; label = 'Fatiga Moderada'; }
    wellnessBadge = { score: wellnessScore, color: badgeColor, label };
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '650px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ marginBottom: '8px' }}>
              {player.posicion}
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit' }}>{player.name}</h2>
            <p style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Apodo: "{player.apodo}"</p>

            {wellnessBadge && (
              <span
                className="badge"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1.5px solid ${wellnessBadge.color}`,
                  color: wellnessBadge.color,
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  fontWeight: 700
                }}
              >
                Descanso: {wellnessBadge.score}% -- {wellnessBadge.label}
              </span>
            )}

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              {player.contacto?.phone || 'Sin numero'} | {player.contacto?.email || 'Sin correo'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <PlayerPhoto player={player} size={80} editable onClick={() => setShowAvatarPicker(true)} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => onEdit(player)} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                Editar
              </button>
              <button onClick={() => onDelete(player.id)} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--color-red)', borderColor: 'rgba(255, 61, 0, 0.2)' }}>
                Dar Baja
              </button>
            </div>
            {hasPermission('create_users') && (
              <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                {player.username ? (
                  <button onClick={() => onReset(player)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#ffb300', borderColor: 'rgba(255,179,0,0.3)' }}>
                    Restablecer Pass
                  </button>
                ) : (
                  <button onClick={() => onCredential(player)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#00e676', borderColor: 'rgba(0,230,118,0.3)' }}>
                    Forjar Credenciales
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isCoach && (
            <PlayerAttributes player={player} onTestSubmit={onTestSubmit} />
          )}

          <InjurySection
            player={player}
            onInjurySubmit={onInjurySubmit}
            onPhaseChange={onPhaseChange}
          />

          {!isCoach && (
            <GymStatsSection player={player} onGymSubmit={onGymSubmit} />
          )}

          {!isCoach && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px' }}>
              <ClothingSection player={player} onClothingSubmit={onClothingSubmit} />
              <HiaSection player={player} onHiaSubmit={onHiaSubmit} />
            </div>
          )}

          {!isCoach && <BattleHistory player={player} />}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
          <button onClick={onClose} className="btn-outline">
            Cerrar Ficha
          </button>
        </div>
      </div>

      {showAvatarPicker && (
        <AvatarPicker
          currentAvatarId={player?.avatar_id}
          onSelect={(id) => { setAvatar(id); setShowAvatarPicker(false); }}
          onPhoto={(file) => { setPhoto(file); setShowAvatarPicker(false); }}
          onClear={() => { clearPhoto(); setShowAvatarPicker(false); }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
}

export default PlayerDetail;
