import React from 'react';
import AgendaList from './AgendaList';
import AgendaForm from './AgendaForm';
import WeeklyView from './WeeklyView';

function AgendaTab({
  teamEvents,
  showAddForm,
  setShowAddForm,
  showWeeklyView,
  setShowWeeklyView,
  handleSaveEvent,
  handleWhatsAppShare,
  deleteScheduleEvent
}) {
  return (
    <div className="animated-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <AgendaList
          events={teamEvents}
          onDelete={deleteScheduleEvent}
          onWhatsApp={handleWhatsAppShare}
          onToggleWeekly={() => setShowWeeklyView(!showWeeklyView)}
          showWeekly={showWeeklyView}
        />
        {showWeeklyView && <WeeklyView teamEvents={teamEvents} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {showAddForm ? (
          <AgendaForm
            onClose={() => setShowAddForm(false)}
            onSave={() => handleSaveEvent({ preventDefault: () => {} })}
          />
        ) : (
          <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>Convocatorias Eficientes</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
              La cultura del club Rugby Orcos exige compromiso y puntualidad.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
              Usa el boton de WhatsApp en cada evento para copiar una plantilla oficial con emojis de rugby, enlaces de localizacion geograficos y hora. Compartela en el grupo del equipo para notificar a todos al instante.
            </p>
            <div style={{ background: 'rgba(0, 230, 118, 0.03)', border: '1px dashed var(--color-primary)', padding: '15px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
              [DIA] [FECHA] <br />
              Hora: 7:30 PM <br />
              Lugar: Cancha La Fragua <br />
              Maps: https://maps...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgendaTab;
