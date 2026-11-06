import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { usePlayerAvatar } from '../../../hooks/usePlayerAvatar';
import { PlayerPhoto } from '../../PlayerPhoto';
import { AvatarPicker } from '../../AvatarPicker';
import PlayerAttributes from './PlayerAttributes';
import InjurySection from './InjurySection';
import GymStatsSection from './GymStatsSection';
import ClothingSection from './ClothingSection';
import HiaSection from './HiaSection';
import BattleHistory from './BattleHistory';
import { formatHeightM, formatWeightKg } from '../../../utils/inputFormatters';

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
  const [playerCampaigns, setPlayerCampaigns] = useState([]);
  const { setAvatar, setPhoto, clearPhoto } = usePlayerAvatar(player, onUpdatePlayer);

  useEffect(() => {
    if (!player?.id || !supabase?.from) return;
    let active = true;
    try {
      const q = supabase
        .from('fundraising_assignments')
        .select('id, amount_due, amount_paid, units_assigned, units_sold, delivery_status, campaign:campaign_id(name, type, subtype, status)')
        .eq('player_id', player.id);
      if (q && typeof q.then === 'function') {
        q.then(({ data }) => {
          if (active && Array.isArray(data)) setPlayerCampaigns(data);
        }).catch(() => {});
      }
    } catch {
      // ignore in mocked test environments
    }
    return () => { active = false; };
  }, [player?.id]);

  if (!player) return null;

  const isCoach = player.rol === 'Entrenador';
  const lastWellness = player.wellnessLogs && player.wellnessLogs.length > 0 ? player.wellnessLogs[player.wellnessLogs.length - 1] : null;

  let wellnessBadge = null;
  if (!isCoach && lastWellness) {
    const wellnessScore = Math.round(((lastWellness.sleep + lastWellness.soreness + lastWellness.stress) / 15) * 100);
    let badgeColor = 'var(--color-primary)';
    let label = 'Excelente Recuperación';
    if (wellnessScore < 50) { badgeColor = 'var(--color-red)'; label = 'Sobrecarga / Alerta de Lesión'; }
    else if (wellnessScore < 80) { badgeColor = 'var(--color-gold)'; label = 'Fatiga Moderada'; }
    wellnessBadge = { score: wellnessScore, color: badgeColor, label };
  }

  const m = player.memberships || { paid: 0, due: 10000 };
  const memDebt = Math.max(0, (m.due || 0) - (m.paid || 0));

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '680px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ marginBottom: '8px' }}>
              {player.posicion}
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{player.name}</h2>
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
            {(player.weight || player.height) && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {player.weight && <span className="pro-chip tabular-nums">{formatWeightKg(player.weight)}</span>}
                {player.height && <span className="pro-chip tabular-nums">{formatHeightM(player.height)}</span>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <PlayerPhoto player={player} size={80} editable onClick={() => setShowAvatarPicker(true)} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => onEdit(player)} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                Editar
              </button>
              <button onClick={() => onDelete(player.id)} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--color-red)', borderColor: 'rgba(255, 92, 77, 0.2)' }}>
                Dar Baja
              </button>
            </div>
            {hasPermission('admin_panel') && (
              <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                {player.username ? (
                  <button onClick={() => onReset(player)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#E8B931', borderColor: 'rgba(232, 185, 49,0.3)' }}>
                    Restablecer Pass
                  </button>
                ) : (
                  <button onClick={() => onCredential(player)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#2EE57A', borderColor: 'rgba(46, 229, 122,0.3)' }}>
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

          {!isCoach && (
            <div style={{ background: 'var(--bg-dark)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
              <div className="pro-section-header" style={{ marginBottom: '10px' }}>
                <div className="pro-section-title" style={{ fontSize: '0.92rem' }}>
                  <Wallet size={16} color="var(--color-gold)" />
                  <span>Estado Financiero y Campañas 360°</span>
                </div>
                <span className={`pro-chip ${memDebt === 0 ? 'pro-chip-success' : 'pro-chip-danger'} tabular-nums`}>
                  {memDebt === 0 ? 'Membresía al día' : `Debe membresía: $${memDebt.toLocaleString()}`}
                </span>
              </div>
              {playerCampaigns.length > 0 ? (
                <div className="pro-table-wrap">
                  <table className="pro-table">
                    <thead>
                      <tr>
                        <th>Campaña / Actividad</th>
                        <th>Detalle</th>
                        <th className="num">Abonado</th>
                        <th className="num">Meta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerCampaigns.map(a => {
                        const c = a.campaign || {};
                        const isUni = c.subtype === 'uniform';
                        const isFood = c.type === 'food';
                        return (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 700 }}>{c.name || 'Campaña'}</td>
                            <td style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                              {isUni ? `Entrega: ${a.delivery_status === 'delivered' ? 'Entregado' : a.delivery_status === 'ordered' ? 'En confección' : 'Por pedir'}` : isFood ? `${a.units_sold || 0}/${a.units_assigned || 1} uds` : 'Cuota / Rifa'}
                            </td>
                            <td className="num" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                              ${Number(a.amount_paid || 0).toLocaleString()}
                            </td>
                            <td className="num">${Number(a.amount_due || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Abonado en membresía: <strong className="tabular-nums">${(m.paid || 0).toLocaleString()}</strong> / <span className="tabular-nums">${(m.due || 10000).toLocaleString()} COP</span>.
                </p>
              )}
            </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '15px' }}>
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
          hasPhoto={!!player?.photo_url}
          photoUrl={player?.photo_url}
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
