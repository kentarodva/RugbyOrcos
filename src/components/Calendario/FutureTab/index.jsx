import React, { useState } from 'react';
import FutureList from './FutureList';
import GuestRoster from '../GuestRoster';

function FutureTab({
  futureFixtures,
  rivals,
  handleSaveFutureFixture,
  deleteFutureFixture,
  showToast
}) {
  const [showFutureForm, setShowFutureForm] = useState(false);
  const [futureOpponent, setFutureOpponent] = useState('');
  const [futureOpponentCustom, setFutureOpponentCustom] = useState('');
  const [futureDate, setFutureDate] = useState('');
  const [futureTime, setFutureTime] = useState('');
  const [futureLocation, setFutureLocation] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    const opponent = futureOpponent === '__other__' ? futureOpponentCustom : futureOpponent;
    if (!opponent || !futureDate) {
      showToast('Rival y fecha son obligatorios.', 'warning');
      return;
    }
    const selectedRival = rivals.find(r => r.name === futureOpponent);
    handleSaveFutureFixture({
      opponent,
      date: futureDate,
      time: futureTime,
      location: futureLocation,
      rivalId: selectedRival?.id || null
    });
    setFutureOpponent('');
    setFutureOpponentCustom('');
    setFutureDate('');
    setFutureTime('');
    setFutureLocation('');
    setShowFutureForm(false);
  };

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)' }}>
          Próximos Partidos
        </h3>
        <button
          onClick={() => setShowFutureForm(!showFutureForm)}
          className="btn-neon"
          style={{ padding: '8px 14px', fontSize: '0.8rem' }}
        >
          {showFutureForm ? 'Cancelar' : '+ Agendar Partido'}
        </button>
      </div>

      {showFutureForm && (
        <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Equipo Rival</label>
              <select value={futureOpponent} onChange={(e) => setFutureOpponent(e.target.value)} className="form-select">
                <option value="">-- Seleccionar rival --</option>
                {rivals.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
                <option value="__other__">-- Otro (escribir) --</option>
              </select>
              {futureOpponent === '__other__' && (
                <input type="text" value={futureOpponentCustom} onChange={(e) => setFutureOpponentCustom(e.target.value)} placeholder="Nombre del rival" className="form-input" style={{ marginTop: '8px' }} />
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" value={futureDate} onChange={(e) => setFutureDate(e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label>Hora</label>
                <input type="time" value={futureTime} onChange={(e) => setFutureTime(e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="form-group">
              <label>Lugar / Cancha</label>
              <input type="text" value={futureLocation} onChange={(e) => setFutureLocation(e.target.value)} placeholder="Ej. Cancha Polideportiva El Salitre" className="form-input" />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowFutureForm(false)} className="btn-outline">Cancelar</button>
              <button type="submit" className="btn-neon">Agendar Partido</button>
            </div>
          </form>
        </div>
      )}

      <FutureList
        fixtures={futureFixtures}
        onDelete={(id) => { deleteFutureFixture(id); showToast('Partido eliminado.', 'info'); }}
      />

      {futureFixtures.sort((a, b) => new Date(a.date) - new Date(b.date)).map(f => (
        <GuestRoster key={`guest-${f.id}`} fixture={f} />
      ))}
    </div>
  );
}

export default FutureTab;
