import React, { useState } from 'react';
import { Crown, X } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { useToast } from '../../context/ToastContext.jsx';

const playerName = (p) => p?.name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Guerrero';

/**
 * Chiefs of one clan (migration 75). Admins (presidente/desarrollador) assign or remove them;
 * only clan members with a login (userId) can be chiefs, since permissions follow the account.
 */
export function ClanChiefsRow({ team, players = [], chiefs = [], canAssign = false, onChanged }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const teamChiefs = chiefs.filter(c => c.team_id === team.id);
  const chiefUserIds = new Set(teamChiefs.map(c => c.user_id));
  const members = players.filter(p => p.makgora_team_id === team.id);
  const candidates = members.filter(p => p.userId && !chiefUserIds.has(p.userId));
  const withoutLogin = members.filter(p => !p.userId).length;

  const assign = async (playerId) => {
    const p = members.find(m => m.id === playerId);
    if (!p?.userId) return;
    setBusy(true);
    const { error } = await supabase.from('makgora_team_staff').insert({ team_id: team.id, user_id: p.userId, player_id: p.id });
    setBusy(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(`${playerName(p)} ahora es jefe de ${team.rpg_name || team.name}`, 'success');
    onChanged?.();
  };

  const remove = async (chief) => {
    setBusy(true);
    const { data, error } = await supabase.from('makgora_team_staff').delete().eq('id', chief.id).select('id');
    setBusy(false);
    if (error || !data?.length) { showToast(error?.message || 'No tienes permiso para retirar jefes.', 'error'); return; }
    showToast('Jefe retirado', 'success');
    onChanged?.();
  };

  if (!canAssign && teamChiefs.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', width: '100%', paddingLeft: '50px' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', fontWeight: 800, color: '#E8B931' }}>
        <Crown size={12} aria-hidden="true" /> JEFES
      </span>
      {teamChiefs.length === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Sin jefe</span>}
      {teamChiefs.map(c => {
        const p = players.find(x => x.id === c.player_id) || players.find(x => x.userId === c.user_id);
        return (
          <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 4px 2px 10px', borderRadius: '999px', fontSize: '0.72rem', color: '#E8B931', background: 'rgba(232, 185, 49,0.1)', border: '1px solid rgba(232, 185, 49,0.3)' }}>
            {playerName(p)}
            {canAssign && (
              <button type="button" onClick={() => remove(c)} disabled={busy} aria-label={`Retirar a ${playerName(p)} como jefe`}
                style={{ width: '24px', height: '24px', display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: '#E8B931', cursor: 'pointer' }}>
                <X size={12} aria-hidden="true" />
              </button>
            )}
          </span>
        );
      })}
      {canAssign && (
        <select aria-label={`Asignar jefe a ${team.rpg_name || team.name}`} value="" disabled={busy || candidates.length === 0}
          onChange={e => e.target.value && assign(e.target.value)}
          className="form-select" style={{ fontSize: '0.72rem', padding: '4px 8px', minHeight: '32px', maxWidth: '220px' }}>
          <option value="">{candidates.length ? '+ Asignar jefe…' : 'Nadie del clan tiene cuenta'}</option>
          {candidates.map(p => <option key={p.id} value={p.id}>{playerName(p)}</option>)}
        </select>
      )}
      {canAssign && withoutLogin > 0 && (
        <span style={{ fontSize: '0.64rem', color: 'var(--color-text-muted)' }}>({withoutLogin} sin cuenta no pueden ser jefes)</span>
      )}
    </div>
  );
}
