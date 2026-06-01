import React from 'react';
import { STYLE } from './constants';

export function CreateTournamentForm({ onCreate }) {
  const [form, setForm] = React.useState({ name: '', startDate: '', endDate: '', status: 'proximo' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ ...form, resetForm: () => setForm({ name: '', startDate: '', endDate: '', status: 'proximo' }) });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderRadius: 'var(--radius-md)' }}>
      <div style={{ gridColumn: 'span 2' }}>
        <label style={STYLE.lbl}>Nombre del Torneo</label>
        <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          placeholder="MakGora 2026 � Edicion Verano" style={STYLE.inp} />
      </div>
      <div><label style={STYLE.lbl}>Fecha Inicio</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} style={STYLE.inp} /></div>
      <div><label style={STYLE.lbl}>Fecha Fin</label><input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} style={STYLE.inp} /></div>
      <button type="submit" className="btn-neon" style={{ gridColumn: 'span 2', padding: '10px' }}>Crear Torneo</button>
    </form>
  );
}
