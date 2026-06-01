import React from 'react';
import AgendaCard from './AgendaCard';

function AgendaList({ events, onDelete, onWhatsApp, onToggleWeekly, showWeekly }) {
  if (events.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No hay actividades programadas. Comienza agendando un entrenamiento!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Outfit' }}>Agenda de Actividades y Practicas</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Lista de entrenamientos, partidos y eventos agendados.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onToggleWeekly} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--color-blue)', color: 'var(--color-blue)' }}>
            {showWeekly ? 'Lista' : 'Cronograma Semanal'}
          </button>
        </div>
      </div>

      {events.map(e => (
        <AgendaCard
          key={e.id}
          event={e}
          onDelete={onDelete}
          onWhatsApp={onWhatsApp}
        />
      ))}
    </div>
  );
}

export default AgendaList;
