import React from 'react';

const PHASES = ['Reposo Absoluto', 'Fortalecimiento', 'Reacondicionamiento', 'Alta para Contacto'];

function InjuryReport({ teamPlayers }) {
  const injured = teamPlayers.filter(p => p.estado === 'lesionado');

  return (
    <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-red)' }}>
        Control Clinico de Lesionados
      </h3>

      {injured.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
          Excelente! No hay jugadores en el departamento medico.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {injured.map(p => {
            const injury = (Array.isArray(p.injuryLog) && p.injuryLog[0]) || { diagnosis: 'Lesion sin especificar', weeks: 1, phase: 1 };
            return (
              <div key={p.id} style={{ padding: '12px', background: 'rgba(255, 61, 0, 0.03)', border: '1px solid rgba(255, 61, 0, 0.1)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, marginRight: '10px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{p.name} <span style={{ color: 'var(--color-red)', fontWeight: 500 }}>({p.apodo})</span></h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{injury.diagnosis}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-blue)', fontWeight: 600, marginTop: '4px' }}>Fase: {PHASES[injury.phase - 1] || 'Fase HIA'}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className="badge badge-injured" style={{ padding: '5px 8px' }}>
                    {injury.weeks} Semanas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default InjuryReport;
