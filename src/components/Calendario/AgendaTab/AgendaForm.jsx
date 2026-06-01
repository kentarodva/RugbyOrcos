import React, { useState } from 'react';

function AgendaForm({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: '', date: '', time: '', location: '',
    maps: '', type: 'entrenamiento', recurrence: 'none', linkedRoutine: ''
  });

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || !form.location) return;

    const finalMapsLink = form.maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`;

    onSave({
      title: form.title,
      date: form.date,
      time: form.time,
      location: form.location,
      mapsLink: finalMapsLink,
      type: form.type,
      recurrence: form.recurrence,
      linkedRoutine: form.linkedRoutine || null
    });
  };

  return (
    <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
      <h3 className="neon-text-primary" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Programar Sesion</h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="form-group">
          <label>Nombre de la Actividad</label>
          <input
            type="text"
            value={form.title}
            onChange={set('title')}
            placeholder="Ej. Entrenamiento Scrum, Practica General, Partido vs Toros"
            className="form-input"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={form.date} onChange={set('date')} className="form-input" required />
          </div>
          <div className="form-group">
            <label>Hora</label>
            <input type="time" value={form.time} onChange={set('time')} className="form-input" required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label>Tipo de Evento</label>
            <select value={form.type} onChange={set('type')} className="form-select">
              <option value="entrenamiento">Entrenamiento</option>
              <option value="partido">Partido</option>
              <option value="reunion">Reunion</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Recurrencia</label>
            <select value={form.recurrence} onChange={set('recurrence')} className="form-select">
              <option value="none">Sin repeticion</option>
              <option value="semanal">Cada semana (x4)</option>
              <option value="quincenal">Cada 2 semanas (x2)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Lugar / Complejo Deportivo</label>
          <input
            type="text"
            value={form.location}
            onChange={set('location')}
            placeholder="Ej. Cancha de Rugby Timiza"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label>Enlace de Google Maps (Opcional)</label>
          <input
            type="url"
            value={form.maps}
            onChange={set('maps')}
            placeholder="https://maps.google.com/?q=..."
            className="form-input"
          />
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Si se deja vacio, la app generara un enlace de busqueda automatico con el nombre del lugar.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
          <button type="submit" className="btn-neon">Guardar en Agenda</button>
        </div>
      </form>
    </div>
  );
}

export default AgendaForm;
