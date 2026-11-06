import React from 'react';
import { STYLE } from './constants';

export function LoanForm({ players, teams, loanForm, setLoanForm, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="glass-panel animated-slide" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: 'var(--radius-md)' }}>
      <div className="form-group">
        <label style={STYLE.lbl}>Jugador</label>
        <select value={loanForm.playerId} onChange={e => setLoanForm({ ...loanForm, playerId: e.target.value })} style={STYLE.inp}>
          <option value="">-- Seleccionar Guerrero --</option>
          {players.filter(p => p.makgora_team_id).map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.posicion}) — {teams.find(t => t.id === p.makgora_team_id)?.rpg_name || 'Sin equipo'}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label style={STYLE.lbl}>Equipo Destino</label>
        <select value={loanForm.toTeamId} onChange={e => setLoanForm({ ...loanForm, toTeamId: e.target.value })} style={STYLE.inp}>
          <option value="">-- Seleccionar Equipo --</option>
          {teams.filter(t => t.is_active).map(t => (
            <option key={t.id} value={t.id}>{t.rpg_name || t.name}{t.is_external ? ' (Invitado)' : ''}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
        <div className="form-group">
          <label style={STYLE.lbl}>Dias de prestamo</label>
          <input type="number" min="1" max="90" value={loanForm.days} onChange={e => setLoanForm({ ...loanForm, days: Number(e.target.value) })} style={STYLE.inp} />
        </div>
        <div className="form-group">
          <label style={STYLE.lbl}>Motivo (opcional)</label>
          <input type="text" value={loanForm.reason} onChange={e => setLoanForm({ ...loanForm, reason: e.target.value })} placeholder="Ej. Suplente por lesion" style={STYLE.inp} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" className="btn-neon" style={{ flex: 1, padding: '10px', justifyContent: 'center' }}>Solicitar Prestamo</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-outline" style={{ padding: '10px 20px' }}>Cancelar</button>}
      </div>
    </form>
  );
}
