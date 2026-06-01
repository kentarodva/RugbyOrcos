import React, { useState } from 'react';

function FixtureForm({ players, activeTeam, onSave }) {
  const [form, setForm] = useState({
    rivalName: '', scoreOrcos: 0, scoreRival: 0,
    matchDate: '', tries: 0, mvp: ''
  });

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.rivalName || !form.matchDate) return;

    onSave({
      opponent: form.rivalName,
      orcosScore: Number(form.scoreOrcos),
      opponentScore: Number(form.scoreRival),
      date: form.matchDate,
      tries: Number(form.tries),
      mvp: form.mvp
    });

    setForm({ rivalName: '', scoreOrcos: 0, scoreRival: 0, matchDate: '', tries: 0, mvp: '' });
  };

  const eligiblePlayers = players.filter(p => p.teamCategory === activeTeam && p.rol !== 'Entrenador');

  return (
    <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
      <h3 className="neon-text-gold" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Registrar Resultado</h3>

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
            <label>Puntos Orcos</label>
            <input
              type="number"
              value={form.scoreOrcos}
              onChange={set('scoreOrcos')}
              className="form-input"
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Puntos Rival</label>
            <input
              type="number"
              value={form.scoreRival}
              onChange={set('scoreRival')}
              className="form-input"
              min="0"
              required
            />
          </div>
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
            <label>Tries Anotados</label>
            <input
              type="number"
              value={form.tries}
              onChange={set('tries')}
              className="form-input"
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>MVP Elegido (Guerrero de la Fecha)</label>
          <select
            value={form.mvp}
            onChange={set('mvp')}
            className="form-select"
          >
            <option value="">-- Selecciona el MVP --</option>
            {eligiblePlayers.map(p => (
              <option key={p.id} value={p.name}>
                #{p.camiseta ?? '—'} {p.name} "{p.apodo || ''}"
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-neon" style={{ justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-gold), #ff8f00)', color: '#000', marginTop: '10px' }}>
          Publicar Hazana de Partido
        </button>
      </form>
    </div>
  );
}

export default FixtureForm;
