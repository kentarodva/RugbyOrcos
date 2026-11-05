import React, { useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { STYLE } from './constants';
import { useToast } from '../../context/ToastContext.jsx';
import TeamCrest from '../common/TeamCrest';
import CrestUploadButton from '../common/CrestUploadButton';
import { clanCrestUrl } from './TeamsGrid';

export function TeamManager({ teams, onTeamsChanged }) {
  const { showToast } = useToast();
  const [newName, setNewName] = useState('');
  const [newRpgName, setNewRpgName] = useState('');
  const [newColor, setNewColor] = useState('#00e676');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRpgName, setEditRpgName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editMotto, setEditMotto] = useState('');

  const internalTeams = teams.filter(t => !t.is_external);
  const externalTeams = teams.filter(t => t.is_external);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const { error } = await supabase.from('makgora_teams').insert({
      name: newName.trim(),
      rpg_name: newRpgName.trim() || null,
      emblem_color: newColor,
      is_external: true,
      is_active: true,
      sort_order: 99,
    });
    if (error) { showToast(error.message, 'error'); return; }
    showToast(`Equipo "${newName}" creado`, 'success');
    setNewName(''); setNewRpgName(''); setNewColor('#00e676');
    onTeamsChanged();
  };

  const startEdit = (t, fallbackColor) => {
    setEditing(t.id); setEditName(t.name); setEditRpgName(t.rpg_name || '');
    setEditColor(t.emblem_color || fallbackColor); setEditMotto(t.motto || '');
  };

  const handleUpdate = async (team) => {
    const changes = { name: editName.trim(), rpg_name: editRpgName.trim() || null, emblem_color: editColor };
    // motto column arrives with migration 73: only send it when it actually changed.
    if (editMotto.trim() !== (team.motto || '')) changes.motto = editMotto.trim() || null;
    const { error } = await supabase.from('makgora_teams').update(changes).eq('id', team.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Equipo actualizado', 'success');
    setEditing(null);
    onTeamsChanged();
  };

  const handleCrest = async (teamId, url) => {
    const { error } = await supabase.from('makgora_teams').update({ crest_url: url }).eq('id', teamId);
    if (error) throw error;
    onTeamsChanged();
  };

  const editRow = (t) => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
      <input type="text" aria-label="Nombre" value={editName} onChange={e => setEditName(e.target.value)} style={{ ...STYLE.inp, flex: '1 1 120px', padding: '6px', fontSize: '0.75rem' }} />
      <input type="text" aria-label="Nombre RPG" value={editRpgName} onChange={e => setEditRpgName(e.target.value)} placeholder="Nombre RPG" style={{ ...STYLE.inp, flex: '1 1 120px', padding: '6px', fontSize: '0.75rem' }} />
      <input type="text" aria-label="Lema de guerra" value={editMotto} onChange={e => setEditMotto(e.target.value)} placeholder="Lema de guerra" maxLength={80} style={{ ...STYLE.inp, flex: '2 1 180px', padding: '6px', fontSize: '0.75rem', textAlign: 'left' }} />
      <input type="color" aria-label="Color del clan" value={editColor} onChange={e => setEditColor(e.target.value)} style={{ width: '34px', height: '34px', padding: '1px', border: 'none', borderRadius: '4px' }} />
      <button type="button" onClick={() => handleUpdate(t)} className="btn-neon" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>Guardar</button>
      <button type="button" onClick={() => setEditing(null)} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>Cancelar</button>
    </div>
  );

  const handleDelete = async (teamId) => {
    if (!window.confirm('¿Eliminar este equipo externo permanentemente?')) return;
    const { error } = await supabase.from('makgora_teams').delete().eq('id', teamId);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Equipo eliminado', 'success');
    onTeamsChanged();
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
      <h4 style={{ color: 'var(--color-gold)', marginBottom: '15px', fontFamily: 'Outfit' }}>Gestión de Equipos</h4>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre equipo externo" style={{ ...STYLE.inp, flex: 2, minWidth: '150px' }} required />
        <input type="text" value={newRpgName} onChange={e => setNewRpgName(e.target.value)} placeholder="Nombre RPG (opcional)" style={{ ...STYLE.inp, flex: 2, minWidth: '150px' }} />
        <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '2px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
        <button type="submit" className="btn-neon" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Crear Equipo</button>
      </form>

      {internalTeams.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h5 style={{ color: 'var(--color-text)', fontSize: '0.8rem', marginBottom: '8px' }}>Equipos Internos</h5>
          {internalTeams.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
              {editing === t.id ? editRow(t) : (
                <>
                  <TeamCrest url={clanCrestUrl(t)} name={t.rpg_name || t.name} color={t.emblem_color || '#00e676'} size={40} />
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <div style={{ color: 'var(--color-text)', fontWeight: 700 }}>{t.rpg_name || t.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{t.motto ? `«${t.motto}»` : t.name}</div>
                  </div>
                  <CrestUploadButton kind="clans" id={t.id} currentUrl={t.crest_url} compact onUploaded={(url) => handleCrest(t.id, url)} />
                  <button type="button" onClick={() => startEdit(t, '#00e676')} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.68rem', minHeight: '32px' }}>Editar</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {externalTeams.length > 0 && (
        <div>
          <h5 style={{ color: 'var(--color-text)', fontSize: '0.8rem', marginBottom: '8px' }}>Equipos Invitados</h5>
          {externalTeams.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
              {editing === t.id ? editRow(t) : (
                <>
                  <TeamCrest url={clanCrestUrl(t)} name={t.rpg_name || t.name} color={t.emblem_color || '#ff6d00'} size={36} />
                  <span style={{ flex: 1, color: 'var(--color-text)' }}>{t.rpg_name || t.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{t.name}</span>
                  <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(255,179,0,0.1)', color: '#ffb300' }}>Invitado</span>
                  <CrestUploadButton kind="clans" id={t.id} currentUrl={t.crest_url} compact onUploaded={(url) => handleCrest(t.id, url)} />
                  <button onClick={() => startEdit(t, '#ff6d00')} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.65rem' }}>Editar</button>
                  <button onClick={() => handleDelete(t.id)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.65rem', borderColor: '#ff3d00', color: '#ff3d00' }}>×</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
