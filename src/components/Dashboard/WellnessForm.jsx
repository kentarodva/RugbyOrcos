import React, { useState } from 'react';

function WellnessForm({ teamPlayers, recordWellness }) {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [sleep, setSleep] = useState(5);
  const [soreness, setSoreness] = useState(5);
  const [stress, setStress] = useState(5);
  const [logged, setLogged] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    const today = new Date().toISOString().split('T')[0];
    recordWellness(selectedPlayer, {
      date: today,
      sleep: Number(sleep),
      soreness: Number(soreness),
      stress: Number(stress)
    });

    setLogged(true);
    setTimeout(() => setLogged(false), 3000);
    setSelectedPlayer('');
    setSleep(5);
    setSoreness(5);
    setStress(5);
  };

  const renderRating = (label, value, setValue, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.8rem' }}>{label}:</span>
      <div style={{ display: 'flex', gap: '5px' }}>
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => setValue(v)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '4px',
              border: 'none',
              background: value >= v ? color : 'var(--bg-dark)',
              color: value >= v ? '#000' : '#fff',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)' }}>
        Test Wellness Diario (Fatiga)
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Monitorea el descanso y la recuperacion de tus orcos antes de los entrenos.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Selecciona al Jugador</label>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="form-select"
            required
            style={{ padding: '8px' }}
          >
            <option value="">-- Seleccionar Jugador --</option>
            {teamPlayers.filter(p => p.rol !== 'Entrenador').map(p => (
              <option key={p.id} value={p.id}>#{p.camiseta ?? '—'} {p.name} ("{p.apodo || ''}")</option>
            ))}
          </select>
        </div>

        {selectedPlayer && (
          <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {renderRating('Calidad de Sueno', sleep, setSleep, 'var(--color-primary)')}
            {renderRating('Estado Muscular', soreness, setSoreness, 'var(--color-gold)')}
            {renderRating('Estres Mental', stress, setStress, 'var(--color-blue)')}

            <button
              type="submit"
              className="btn-neon"
              style={{
                padding: '8px',
                fontSize: '0.8rem',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--color-primary), #2EE57A)',
                color: '#000',
                fontWeight: 700,
                boxShadow: '0 4px 15px rgba(46, 229, 122, 0.2)'
              }}
            >
              Registrar Bienestar
            </button>
          </div>
        )}

        {logged && (
          <div className="animated-fade" style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, padding: '5px 0' }}>
            Recuperacion registrada con exito!
          </div>
        )}
      </form>
    </div>
  );
}

export default WellnessForm;
