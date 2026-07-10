import React, { useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { STYLE } from './constants';
import { useToast } from '../../context/ToastContext.jsx';

export function TeamManager({ teams, onTeamsChanged }) {
  const { showToast } = useToast();
  const [newName, setNewName] = useState('');
  const [newRpgName, setNewRpgName] = useState('');
  const [newColor, setNewColor] = useState('#00e676');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRpgName, setEditRpgName] = useState('');
  const [editColor, setEditColor] = useState('');

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

  const handleUpdate = async (teamId) => {
    const { error } = await supabase.from('makgora_teams')
      .update({ name: editName.trim(), rpg_name: editRpgName.trim() || null, emblem_color: editColor })
      .eq('id', teamId);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Equipo actualizado', 'success');
    setEditing(null);
    onTeamsChanged();
  };

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
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.emblem_color || '#00e676', display: 'inline-block' }} />
              <span style={{ flex: 1, color: 'var(--color-text)' }}>{t.rpg_name || t.name}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{t.name}</span>
            </div>
          ))}
        </div>
      )}

      {externalTeams.length > 0 && (
        <div>
          <h5 style={{ color: 'var(--color-text)', fontSize: '0.8rem', marginBottom: '8px' }}>Equipos Invitados</h5>
          {externalTeams.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
              {editing === t.id ? (
                <>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ ...STYLE.inp, flex: 1, padding: '4px', fontSize: '0.75rem' }} />
                  <input type="text" value={editRpgName} onChange={e => setEditRpgName(e.target.value)} style={{ ...STYLE.inp, flex: 1, padding: '4px', fontSize: '0.75rem' }} />
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} style={{ width: '30px', height: '30px', padding: '1px', border: 'none', borderRadius: '3px' }} />
                  <button onClick={() => handleUpdate(t.id)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.65rem' }}>Guardar</button>
                  <button onClick={() => setEditing(null)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.65rem' }}>×</button>
                </>
              ) : (
                <>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.emblem_color || '#ff6d00', display: 'inline-block' }} />
                  <span style={{ flex: 1, color: 'var(--color-text)' }}>{t.rpg_name || t.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{t.name}</span>
                  <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(255,179,0,0.1)', color: '#ffb300' }}>Invitado</span>
                  <button onClick={() => { setEditing(t.id); setEditName(t.name); setEditRpgName(t.rpg_name || ''); setEditColor(t.emblem_color || '#ff6d00'); }} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.65rem' }}>Editar</button>
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
