import React, { useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { STYLE } from './constants';
import { useToast } from '../../context/ToastContext.jsx';

export function CreateTournamentForm({ teams, onCreate, onCancel }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [newExtName, setNewExtName] = useState('');
  const [newExtRpgName, setNewExtRpgName] = useState('');

  const internalTeams = teams.filter(t => !t.is_external);
  const externalTeams = teams.filter(t => t.is_external);
  const allAvailable = teams.filter(t => t.is_active);

  React.useEffect(() => {
    setSelectedTeamIds(allAvailable.filter(t => !t.is_external).map(t => t.id));
  }, []);

  const toggleTeam = (id) => {
    setSelectedTeamIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddExternal = async () => {
    if (!newExtName.trim()) return;
    const { data, error } = await supabase.from('makgora_teams').insert({
      name: newExtName.trim(),
      rpg_name: newExtRpgName.trim() || null,
      is_external: true,
      is_active: true,
      sort_order: 99,
    }).select().single();
    if (error) { showToast(error.message, 'error'); return; }
    setSelectedTeamIds(prev => [...prev, data.id]);
    setNewExtName('');
    setNewExtRpgName('');
    showToast(`"${data.name}" agregado al torneo`, 'success');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) return;
    if (selectedTeamIds.length < 2) { showToast('Selecciona al menos 2 equipos', 'warning'); return; }
    onCreate({ ...form, teamIds: selectedTeamIds });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={STYLE.lbl}>Nombre del Torneo</label>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            placeholder="MakGora 2026 - Edición Verano" style={STYLE.inp} />
        </div>
        <div><label style={STYLE.lbl}>Inicio</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} style={STYLE.inp} /></div>
        <div><label style={STYLE.lbl}>Fin</label><input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} style={STYLE.inp} /></div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={STYLE.lbl}>Equipos Participantes</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          {allAvailable.map(t => (
            <label key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', cursor: 'pointer',
              background: selectedTeamIds.includes(t.id) ? (t.is_external ? 'rgba(255,179,0,0.1)' : 'rgba(0,230,118,0.1)') : 'rgba(255,255,255,0.03)',
              border: '1px solid ' + (selectedTeamIds.includes(t.id) ? (t.is_external ? '#ffb300' : 'var(--color-primary)') : 'var(--border-glass)'),
              borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', userSelect: 'none',
            }}>
              <input type="checkbox" checked={selectedTeamIds.includes(t.id)} onChange={() => toggleTeam(t.id)} style={{ accentColor: 'var(--color-primary)' }} />
              <span style={{ color: 'var(--color-text)', fontWeight: selectedTeamIds.includes(t.id) ? 700 : 400 }}>
                {t.rpg_name || t.name}
              </span>
              {t.is_external && <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,179,0,0.15)', color: '#ffb300' }}>Invitado</span>}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="text" value={newExtName} onChange={e => setNewExtName(e.target.value)}
            placeholder="Nombre equipo invitado..." style={{ ...STYLE.inp, flex: 1, padding: '6px', fontSize: '0.75rem' }} />
          <input type="text" value={newExtRpgName} onChange={e => setNewExtRpgName(e.target.value)}
            placeholder="Nombre RPG (opcional)" style={{ ...STYLE.inp, flex: 1, padding: '6px', fontSize: '0.75rem' }} />
          <button type="button" onClick={handleAddExternal} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            + Invitar
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" className="btn-neon" style={{ flex: 1, padding: '10px' }}>
          Crear Torneo ({selectedTeamIds.length} equipos)
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-outline" style={{ padding: '10px 20px' }}>Cancelar</button>}
      </div>
    </form>
  );
}
