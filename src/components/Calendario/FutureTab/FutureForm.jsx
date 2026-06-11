import React, { useState } from 'react';

function FutureForm({ onSave }) {
  const [form, setForm] = useState({
    rivalName: '', matchDate: '', matchTime: '', location: '', notes: ''
  });

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.rivalName || !form.matchDate) return;

    onSave({
      opponent: form.rivalName,
      date: form.matchDate,
      time: form.matchTime,
      location: form.location,
      notes: form.notes
    });

    setForm({ rivalName: '', matchDate: '', matchTime: '', location: '', notes: '' });
  };

  return (
    <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
      <h3 className="neon-text-gold" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Programar Proximo Rival</h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="form-group">
          <label>Rival del Clan</label>
          <input
            type="text"
            value={form.rivalName}
            onChange={set('rivalName')}
            placeholder="Ej. Toros R.C. o Gatos del Norte"
            className="form-input"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label>Fecha de Contienda</label>
            <input
              type="date"
              value={form.matchDate}
              onChange={set('matchDate')}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label>Hora del Encuentro</label>
            <input
              type="time"
              value={form.matchTime}
              onChange={set('matchTime')}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Lugar de la Batalla</label>
          <input
            type="text"
            value={form.location}
            onChange={set('location')}
            placeholder="Ej. Cancha del Club, Estadio Municipal"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Notas Adicionales</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder="Detalles importantes sobre el partido..."
            className="form-input"
            rows={3}
          />
        </div>

        <button type="submit" className="btn-gold" style={{ justifyContent: 'center', marginTop: '10px' }}>
          Agendar Proximo Compromiso
        </button>
      </form>
    </div>
  );
}

export default FutureForm;
