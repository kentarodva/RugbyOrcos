import React, { useState } from 'react';

function HiaSection({ onHiaSubmit }) {
  const [showForm, setShowForm] = useState(false);
  const [symptoms, setSymptoms] = useState({
    headache: false, dizziness: false, confusion: false, nausea: false, balance: false
  });

  const toggle = (key) => () => setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const detected = symptoms.headache || symptoms.dizziness || symptoms.confusion || symptoms.nausea || symptoms.balance;
    onHiaSubmit(detected);
    setSymptoms({ headache: false, dizziness: false, confusion: false, nausea: false, balance: false });
    setShowForm(false);
  };

  return (
    <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-red)' }}>Protocolo Conmocion HIA</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-outline"
          style={{ padding: '3px 6px', fontSize: '0.7rem', color: 'var(--color-red)', borderColor: 'rgba(255, 92, 77, 0.2)' }}
        >
          {showForm ? 'Cerrar' : 'Correr Test'}
        </button>
      </div>

      {!showForm ? (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
          World Rugby HIA: Evalua de inmediato golpes de cabeza sospechosos en cancha para aplicar exclusion y descanso obligatorio.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '110px', overflowY: 'auto', paddingRight: '5px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={symptoms.headache} onChange={toggle('headache')} />
              Dolor / Presion de Cabeza
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={symptoms.dizziness} onChange={toggle('dizziness')} />
              Mareo o Inestabilidad
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={symptoms.confusion} onChange={toggle('confusion')} />
              Confusion o Desorientacion
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={symptoms.nausea} onChange={toggle('nausea')} />
              Nauseas / Vomitos
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={symptoms.balance} onChange={toggle('balance')} />
              Perdida de Equilibrio
            </label>
          </div>
          <button
            type="submit"
            className="btn-neon"
            style={{
              padding: '6px',
              fontSize: '0.7rem',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--color-red), #d50000)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(255, 92, 77, 0.2)'
            }}
          >
            Confirmar Diagnostico HIA
          </button>
        </form>
      )}
    </div>
  );
}

export default HiaSection;
