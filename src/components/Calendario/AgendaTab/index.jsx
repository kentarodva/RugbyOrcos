import React from 'react';
import AgendaList from './AgendaList';
import AgendaForm from './AgendaForm';
import WeeklyView from './WeeklyView';
import MonthlyView from './MonthlyView';
import QuickTrainingPanel from './QuickTrainingPanel';
import EventDetailModal from './EventDetailModal';

function AgendaTab({
  teamEvents,
  showAddForm,
  setShowAddForm,
  showWeeklyView,
  setShowWeeklyView,
  showMonthlyView,
  setShowMonthlyView,
  editingEvent,
  setEditingEvent,
  handleSaveEvent,
  handleEditEvent,
  handleWhatsAppShare,
  deleteScheduleEvent,
  onQuickCreate,
  currentTeamCategory,
  onDetailEvent: _onDetailEvent,
  detailEvent,
  setDetailEvent,
  players,
  rsvpList,
  myRsvp,
  onRsvp,
  makgoraTeams,
  canManageEvents,
}) {
  const handleOpenAdd = () => {
    setEditingEvent(null);
    setShowAddForm(true);
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setShowAddForm(true);
  };

  const handleOpenDetail = (event) => {
    setDetailEvent(event);
  };

  const existingLocations = [...new Set(teamEvents.map(e => e.location).filter(Boolean))];

  return (
    <div className="animated-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {!showWeeklyView && !showMonthlyView && (
        <AgendaList
          events={teamEvents}
          onDelete={deleteScheduleEvent}
          onEdit={handleOpenEdit}
          onAdd={handleOpenAdd}
          onWhatsApp={handleWhatsAppShare}
          onToggleWeekly={() => setShowWeeklyView(!showWeeklyView)}
          showWeekly={showWeeklyView}
          onToggleMonthly={() => setShowMonthlyView(!showMonthlyView)}
          showMonthly={showMonthlyView}
          onDetail={handleOpenDetail}
        />
        )}
        {showWeeklyView && (
          <>
            <button onClick={() => setShowWeeklyView(false)} className="btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
              ← Volver a la lista
            </button>
            <WeeklyView teamEvents={teamEvents} />
          </>
        )}
        {showMonthlyView && (
          <>
            <button onClick={() => setShowMonthlyView(false)} className="btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
              ← Volver a la lista
            </button>
            <MonthlyView teamEvents={teamEvents} />
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {showAddForm ? (
          <AgendaForm
            initialData={editingEvent ? {
              title: editingEvent.title,
              date: editingEvent.date,
              endDate: editingEvent.endDate || '',
              time: editingEvent.time,
              location: editingEvent.location,
              maps: editingEvent.mapsLink || '',
              type: editingEvent.type || 'entrenamiento',
              recurrence: editingEvent.recurrence || 'none',
              recurrenceDays: editingEvent.recurrenceDays,
              recurrenceWeeks: editingEvent.recurrenceWeeks,
              linkedRoutine: editingEvent.linkedRoutine || '',
              notes: editingEvent.notes || '',
            } : undefined}
            onClose={() => { setShowAddForm(false); setEditingEvent(null); }}
            onSave={editingEvent ? handleEditEvent : handleSaveEvent}
            existingEvents={teamEvents}
            currentTeamCategory={currentTeamCategory}
            makgoraTeams={makgoraTeams}
          />
        ) : canManageEvents ? (
          <>
            <QuickTrainingPanel
              onCreate={onQuickCreate}
              existingLocations={existingLocations}
              currentTeamCategory={currentTeamCategory}
              makgoraTeams={makgoraTeams}
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
        ) : (
          <div style={{
            padding: '20px', textAlign: 'center',
            fontSize: '0.78rem', color: 'var(--color-text-muted)',
            border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-sm)',
          }}>
            Solo el staff puede crear eventos. Contacta a tu entrenador.
          </div>
        )}
      </div>

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          players={players}
          rsvpList={rsvpList}
          myRsvp={myRsvp}
          onRsvp={onRsvp}
        />
      )}
    </div>
  );
}

export default AgendaTab;
