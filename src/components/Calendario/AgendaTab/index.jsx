import React from 'react';
import AgendaList from './AgendaList';
import AgendaForm from './AgendaForm';
import WeeklyView from './WeeklyView';
import QuickTrainingPanel from './QuickTrainingPanel';

function AgendaTab({
  teamEvents,
  showAddForm,
  setShowAddForm,
  showWeeklyView,
  setShowWeeklyView,
  editingEvent,
  setEditingEvent,
  handleSaveEvent,
  handleEditEvent,
  handleWhatsAppShare,
  deleteScheduleEvent,
  onQuickCreate,
  currentTeamCategory,
}) {
  const handleOpenAdd = () => {
    setEditingEvent(null);
    setShowAddForm(true);
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setShowAddForm(true);
  };

  const existingLocations = [...new Set(teamEvents.map(e => e.location).filter(Boolean))];

  return (
    <div className="animated-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <AgendaList
          events={teamEvents}
          onDelete={deleteScheduleEvent}
          onEdit={handleOpenEdit}
          onAdd={handleOpenAdd}
          onWhatsApp={handleWhatsAppShare}
          onToggleWeekly={() => setShowWeeklyView(!showWeeklyView)}
          showWeekly={showWeeklyView}
        />
        {showWeeklyView && <WeeklyView teamEvents={teamEvents} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {showAddForm ? (
          <AgendaForm
            initialData={editingEvent ? {
              title: editingEvent.title,
              date: editingEvent.date,
              time: editingEvent.time,
              location: editingEvent.location,
              maps: editingEvent.mapsLink || '',
              type: editingEvent.type || 'entrenamiento',
              recurrence: editingEvent.recurrence || 'none',
              recurrenceDays: editingEvent.recurrenceDays,
              recurrenceWeeks: editingEvent.recurrenceWeeks,
              linkedRoutine: editingEvent.linkedRoutine || '',
            } : undefined}
            onClose={() => { setShowAddForm(false); setEditingEvent(null); }}
            onSave={editingEvent ? handleEditEvent : handleSaveEvent}
          />
        ) : (
          <>
            <QuickTrainingPanel
              onCreate={onQuickCreate}
              existingLocations={existingLocations}
              currentTeamCategory={currentTeamCategory}
            />
            <button
              onClick={handleOpenAdd}
              className="btn-outline"
              style={{
                width: '100%', padding: '8px', fontSize: '0.8rem',
                color: 'var(--color-text-muted)', borderColor: 'var(--border-glass)',
              }}
            >
              📋 Formulario completo (partidos, reuniones...)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AgendaTab;
