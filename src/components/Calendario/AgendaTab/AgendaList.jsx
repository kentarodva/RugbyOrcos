import React from 'react';
import AgendaCard from './AgendaCard';

function AgendaList({ events, onDelete, onEdit, onAdd, onWhatsApp, onToggleWeekly, showWeekly, onToggleMonthly, showMonthly, onDetail, onOpenFixture }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 className="page-title" style={{ flex: 1, minWidth: 0 }}>Agenda</h2>
          <button onClick={onAdd} className="btn-neon btn-sm">+ Evento</button>
        </div>
        <div className="segmented" role="group" aria-label="Vista de la agenda" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <button type="button" aria-pressed={!showWeekly && !showMonthly} className={!showWeekly && !showMonthly ? 'is-on' : ''}
            onClick={() => { if (showWeekly) onToggleWeekly(); if (showMonthly) onToggleMonthly(); }}>Lista</button>
          <button type="button" aria-pressed={!!showWeekly} className={showWeekly ? 'is-on' : ''}
            onClick={() => { if (showMonthly) onToggleMonthly(); if (!showWeekly) onToggleWeekly(); }}>Semana</button>
          <button type="button" aria-pressed={!!showMonthly} className={showMonthly ? 'is-on' : ''}
            onClick={() => { if (showWeekly) onToggleWeekly(); if (!showMonthly) onToggleMonthly(); }}>Mes</button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="glass-panel" style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <p>No hay actividades programadas.</p>
          <button onClick={onAdd} className="btn-neon" style={{ marginTop: '14px' }}>
            Agendar primer evento
          </button>
        </div>
      ) : (
        events.map(e => (
          <AgendaCard
            key={e.id}
            event={e}
            onDelete={onDelete}
            onEdit={onEdit}
            onWhatsApp={onWhatsApp}
            onDetail={onDetail}
            onOpenFixture={onOpenFixture}
          />
        ))
      )}
    </div>
  );
}

export default AgendaList;
