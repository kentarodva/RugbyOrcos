import React, { useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { STYLE } from './constants';
import { useToast } from '../../context/ToastContext.jsx';

export function EditTournamentModal({ tournament, onClose, onSaved }) {
  const { showToast } = useToast();
  const [name, setName] = useState(tournament.name);
  const [startDate, setStartDate] = useState(tournament.start_date);
  const [endDate, setEndDate] = useState(tournament.end_date);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('tournaments')
      .update({ name, start_date: startDate, end_date: endDate, updated_at: new Date().toISOString() })
      .eq('id', tournament.id);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Torneo actualizado', 'success');
    onSaved();
  };

  const handleCancelTournament = async () => {
    if (!window.confirm('¿Estás seguro de cancelar este torneo? Se resetearán las posiciones.')) return;
    const { error } = await supabase.from('tournaments')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', tournament.id);
    if (error) { showToast(error.message, 'error'); return; }
    await supabase.from('tournament_standings').delete().eq('tournament_id', tournament.id);
    showToast('Torneo cancelado', 'success');
    onSaved();
  };

  const handleDeleteTournament = async () => {
    if (!window.confirm('¿Eliminar torneo permanentemente? Esta acción no se puede deshacer.')) return;
    if (!window.confirm('¿Estás completamente seguro? Se eliminarán todos los partidos y estadísticas.')) return;
    await supabase.from('tournament_player_stats').delete().eq('tournament_id', tournament.id);
    await supabase.from('tournament_matches').delete().eq('tournament_id', tournament.id);
    await supabase.from('tournament_standings').delete().eq('tournament_id', tournament.id);
    await supabase.from('tournament_teams').delete().eq('tournament_id', tournament.id);
    const { error } = await supabase.from('tournaments').delete().eq('id', tournament.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Torneo eliminado', 'success');
    onSaved();
  };

  const handleStartTournament = async () => {
    const { error } = await supabase.from('tournaments')
      .update({ status: 'en_curso', updated_at: new Date().toISOString() })
      .eq('id', tournament.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Torneo iniciado!', 'success');
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontFamily: 'Outfit' }}>Editar Torneo</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={STYLE.lbl}>Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} style={STYLE.inp} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={STYLE.lbl}>Inicio</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={STYLE.inp} required />
            </div>
            <div>
              <label style={STYLE.lbl}>Fin</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={STYLE.inp} required />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-neon" style={{ padding: '10px', justifyContent: 'center' }}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {tournament.status === 'proximo' && (
            <button onClick={handleStartTournament} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              ▶ Iniciar Torneo
            </button>
          )}
          {tournament.status !== 'cancelado' && tournament.status !== 'finalizado' && (
            <button onClick={handleCancelTournament} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem', borderColor: 'var(--color-red)', color: 'var(--color-red)' }}>
              ✕ Cancelar Torneo
            </button>
          )}
          <button onClick={handleDeleteTournament} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem', borderColor: '#ff3d00', color: '#ff3d00' }}>
            🗑 Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
