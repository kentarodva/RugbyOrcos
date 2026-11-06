import React, { useState, useEffect } from 'react';
import { X, Pencil } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import TeamCrest from '../common/TeamCrest';
import CrestUploadButton from '../common/CrestUploadButton';
import { clanCrestUrl } from './TeamsGrid';
import { RUGBY_POSITIONS, positionName } from '../../utils/rugbyPositions';

// No 'ala': in Spanish that is the wing (a back). Flankers are 'flanker' / 'tercera'.
const FORWARD_WORDS = ['pilar', 'pilier', 'talonador', 'hooker', 'segunda', 'tercera', 'flanker', 'octavo', 'numero 8', 'n8'];
const fold = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** 'forward' | 'back' | null. position_id (1-15) wins, then the free-text position. */
export function positionLine(p) {
  const id = Number(p.position_id);
  if (id >= 1 && id <= 8) return 'forward';
  if (id >= 9 && id <= 15) return 'back';
  if (!p.position) return null;
  const pos = fold(p.position);
  return FORWARD_WORDS.some(w => pos.includes(w)) ? 'forward' : 'back';
}

function PlayerChips({ title, list, color, onPick }) {
  if (list.length === 0) return null;
  return (
    <div style={{ marginBottom: '14px' }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color, margin: '0 0 6px' }}>{title} · {list.length}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {list.map(p => {
          const label = positionName(p.position_id) || p.position;
          const chipStyle = {
            fontSize: '0.78rem', color: 'var(--color-text)', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', padding: '5px 10px', borderRadius: '8px',
          };
          const content = (
            <>
              {p.first_name} {p.last_name}
              {p.jersey_number && <span style={{ color: 'var(--color-gold)', marginLeft: '5px', fontWeight: 700 }}>#{p.jersey_number}</span>}
            </>
          );
          return onPick ? (
            <button key={p.id} type="button" onClick={() => onPick(p)} title={label || undefined}
              aria-label={`Editar posición y dorsal de ${p.first_name} ${p.last_name}`}
              style={{ ...chipStyle, cursor: 'pointer', minHeight: '36px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              {content}
              <Pencil size={11} aria-hidden="true" style={{ marginLeft: '6px', opacity: 0.5 }} />
            </button>
          ) : (
            <span key={p.id} title={label || undefined} style={chipStyle}>{content}</span>
          );
        })}
      </div>
    </div>
  );
}

export function TeamDetailModal({ team, onClose, canEdit = false, isChief = false, onChanged }) {
  const { showToast } = useToast();
  const [players, setPlayers] = useState([]);
  const [tournamentHistory, setTournamentHistory] = useState([]);
  const [editing, setEditing] = useState(false);
  const [motto, setMotto] = useState('');
  const [color, setColor] = useState('#2EE57A');
  const [saving, setSaving] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null); // { id, name, positionId, jersey }
  const [reloadKey, setReloadKey] = useState(0);
  const teamId = team?.id;
  const isExternal = team?.is_external;

  useEffect(() => {
    if (!teamId) return;
    let alive = true;
    if (!isExternal) {
      supabase.from('players')
        .select('id, first_name, last_name, position, position_id, jersey_number')
        .eq('makgora_team_id', teamId)
        .order('first_name')
        .then(({ data }) => { if (alive && data) setPlayers(data); });
    }
    supabase.from('tournaments')
      .select('name, status, winner_team_id, start_date')
      .order('start_date', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (alive && data) setTournamentHistory(data.filter(t => t.winner_team_id === teamId || t.status === 'en_curso')); });
    return () => { alive = false; };
  }, [teamId, isExternal, reloadKey]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!team) return null;
  const teamColor = team.emblem_color || '#2EE57A';
  const displayName = team.rpg_name || team.name;

  const startEdit = () => { setMotto(team.motto || ''); setColor(teamColor); setEditing(true); };

  // All writes go through SECURITY DEFINER RPCs (migration 75): the server checks staff / clan chief.
  const saveDetails = async () => {
    setSaving(true);
    const { error } = await supabase.rpc('makgora_update_clan', { p_team: team.id, p_changes: { motto: motto.trim() || null, emblem_color: color } });
    setSaving(false);
    if (error) { showToast(error.message || 'No tienes permiso para editar este clan.', 'error'); return; }
    showToast('Clan actualizado', 'success');
    setEditing(false);
    onChanged?.();
  };

  const saveCrest = async (url) => {
    const { error } = await supabase.rpc('makgora_update_clan', { p_team: team.id, p_changes: { crest_url: url } });
    if (error) throw new Error(error.message || 'No tienes permiso para cambiar este escudo.');
    onChanged?.();
  };

  const pickPlayer = (p) => setEditPlayer({
    id: p.id, name: `${p.first_name} ${p.last_name}`,
    positionId: p.position_id ? String(p.position_id) : '', jersey: p.jersey_number ? String(p.jersey_number) : '',
  });

  const savePlayer = async () => {
    setSaving(true);
    const { error } = await supabase.rpc('makgora_update_player', {
      p_player: editPlayer.id,
      p_position_id: editPlayer.positionId ? Number(editPlayer.positionId) : null,
      p_jersey: editPlayer.jersey ? Number(editPlayer.jersey) : null,
    });
    setSaving(false);
    if (error) { showToast(error.message || 'No se pudo guardar.', 'error'); return; }
    showToast(`${editPlayer.name} actualizado`, 'success');
    setEditPlayer(null);
    setReloadKey(k => k + 1);
  };

  const forwards = players.filter(p => positionLine(p) === 'forward');
  const backs = players.filter(p => positionLine(p) === 'back');
  const unassigned = players.filter(p => positionLine(p) === null);
  const onPick = canEdit ? pickPlayer : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" role="dialog" aria-modal="true" aria-label={`Clan ${displayName}`}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: 0,
          background: 'var(--bg-surface-solid, #191C1A)', borderRadius: '18px',
          border: `1px solid ${teamColor}55`, boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${teamColor}22`,
        }}>
        <div style={{ position: 'relative', padding: '28px 20px 20px', textAlign: 'center', background: `linear-gradient(180deg, ${teamColor}26, transparent)`, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button type="button" onClick={onClose} aria-label="Cerrar"
            style={{ position: 'absolute', top: '10px', right: '10px', width: '44px', height: '44px', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--color-text)', cursor: 'pointer' }}>
            <X size={20} aria-hidden="true" />
          </button>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <TeamCrest url={clanCrestUrl(team)} name={displayName} color={teamColor} size={112} rounded="20%" glow />
          </div>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1.3rem', margin: 0 }}>
            {displayName}
            {isExternal && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(232, 185, 49,0.1)', color: '#E8B931', marginLeft: '8px', verticalAlign: 'middle' }}>Invitado</span>}
          </h3>
          {team.rpg_name && team.name !== team.rpg_name && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '4px 0 0' }}>{team.name}</p>}
          {isChief && (
            <p style={{ display: 'inline-block', margin: '8px 0 0', padding: '2px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800, color: '#E8B931', background: 'rgba(232, 185, 49,0.12)', border: '1px solid rgba(232, 185, 49,0.35)' }}>
              👑 Eres jefe de este clan
            </p>
          )}
          {team.motto && !editing && <p style={{ color: teamColor, fontStyle: 'italic', fontSize: '0.85rem', margin: '8px 0 0' }}>«{team.motto}»</p>}

          {canEdit && !editing && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
              <CrestUploadButton kind="clans" id={team.id} currentUrl={team.crest_url} onUploaded={saveCrest} />
              <button type="button" onClick={startEdit} className="btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '40px', padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700 }}>
                <Pencil size={14} aria-hidden="true" /> Lema y color
              </button>
            </div>
          )}

          {canEdit && editing && (
            <div style={{ display: 'grid', gap: '10px', marginTop: '14px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                Lema de guerra
                <input type="text" value={motto} onChange={e => setMotto(e.target.value)} maxLength={80} placeholder="Ej: Sangre y trueno"
                  className="form-input" style={{ width: '100%', marginTop: '4px', minHeight: '44px', fontSize: '0.9rem' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                Color del clan
                <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="Color del clan"
                  style={{ width: '44px', height: '44px', padding: '2px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', background: 'transparent' }} />
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditing(false)} className="btn-outline" style={{ minHeight: '44px', padding: '0 16px' }}>Cancelar</button>
                <button type="button" onClick={saveDetails} disabled={saving} className="btn-neon" style={{ minHeight: '44px', padding: '0 18px' }}>{saving ? 'Guardando…' : 'Guardar'}</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '18px 20px 22px' }}>
          {tournamentHistory.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-gold)', margin: '0 0 6px' }}>🏆 HISTORIAL</p>
              {tournamentHistory.map((t, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: t.winner_team_id === team.id ? 'var(--color-gold)' : 'var(--color-text-muted)', padding: '3px 0' }}>
                  {t.name} {t.winner_team_id === team.id && '· Campeón'}
                </div>
              ))}
            </div>
          )}

          {isExternal ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '10px' }}>Equipo invitado — sin plantel interno</p>
          ) : players.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '10px' }}>Sin guerreros asignados</p>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px' }}>Guerreros del clan ({players.length})</p>
              {canEdit && !editPlayer && (
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '-6px 0 12px' }}>Toca un guerrero para asignar su posición y dorsal.</p>
              )}
              {editPlayer && (
                <div role="group" aria-label={`Editar ${editPlayer.name}`}
                  style={{ display: 'grid', gap: '10px', padding: '12px', marginBottom: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${teamColor}55` }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>{editPlayer.name}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,minmax(0, 1fr)) 84px', gap: '8px' }}>
                    <select aria-label="Posición" value={editPlayer.positionId} onChange={e => setEditPlayer({ ...editPlayer, positionId: e.target.value })}
                      className="form-select" style={{ minHeight: '44px', fontSize: '0.85rem' }}>
                      <option value="">Sin posición</option>
                      {RUGBY_POSITIONS.map(pos => <option key={pos.id} value={pos.id}>{pos.id}. {pos.name}</option>)}
                    </select>
                    <input aria-label="Dorsal" type="number" inputMode="numeric" min="1" max="99" placeholder="#" value={editPlayer.jersey}
                      onChange={e => setEditPlayer({ ...editPlayer, jersey: e.target.value })}
                      className="form-input" style={{ minHeight: '44px', fontSize: '0.9rem', textAlign: 'center' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setEditPlayer(null)} className="btn-outline" style={{ minHeight: '44px', padding: '0 16px' }}>Cancelar</button>
                    <button type="button" onClick={savePlayer} disabled={saving} className="btn-neon" style={{ minHeight: '44px', padding: '0 18px' }}>{saving ? 'Guardando…' : 'Guardar guerrero'}</button>
                  </div>
                </div>
              )}
              <PlayerChips title="DELANTEROS" list={forwards} color="#E8B931" onPick={onPick} />
              <PlayerChips title="TRES CUARTOS" list={backs} color="#2EE57A" onPick={onPick} />
              <PlayerChips title="SIN POSICIÓN ASIGNADA" list={unassigned} color="var(--color-text-muted)" onPick={onPick} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
