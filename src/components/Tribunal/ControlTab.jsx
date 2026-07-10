import React from 'react';
import AttendanceForm from './AttendanceForm';
import InfractionForm from './InfractionForm';
import PenaltyCard from './PenaltyCard';

function ControlTab({
  teamPlayers,
  teamEvents,
  attendanceState,
  rsvpMap,
  onMarkConfirmedPresent,
  selectedEventId,
  setSelectedEventId,
  handleAttendanceChange,
  handleSaveAttendance,
  matchDate,
  setMatchDate,
  selectedPlayerForInf,
  setSelectedPlayerForInf,
  infPenales,
  setInfPenales,
  infAmarillas,
  setInfAmarillas,
  infRojas,
  setInfRojas,
  infBurpeesExtra,
  setInfBurpeesExtra,
  infCustomExercise,
  setInfCustomExercise,
  infCustomReps,
  setInfCustomReps,
  infFaultType,
  setInfFaultType,
  infContext,
  setInfContext,
  infNotes,
  setInfNotes,
  handleSaveInfraction,
  penalizedPlayers,
  redeemPenalty
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <AttendanceForm
          selectedEventId={selectedEventId}
          onEventChange={setSelectedEventId}
          teamEvents={teamEvents}
          attendanceState={attendanceState}
          rsvpMap={rsvpMap}
          onMarkConfirmedPresent={onMarkConfirmedPresent}
          teamPlayers={teamPlayers}
          onAttendanceChange={handleAttendanceChange}
          onSave={handleSaveAttendance}
        />

        <InfractionForm
          matchDate={matchDate}
          setMatchDate={setMatchDate}
          selectedPlayerForInf={selectedPlayerForInf}
          setSelectedPlayerForInf={setSelectedPlayerForInf}
          infPenales={infPenales}
          setInfPenales={setInfPenales}
          infAmarillas={infAmarillas}
          setInfAmarillas={setInfAmarillas}
          infRojas={infRojas}
          setInfRojas={setInfRojas}
          infBurpeesExtra={infBurpeesExtra}
          setInfBurpeesExtra={setInfBurpeesExtra}
          infCustomExercise={infCustomExercise}
          setInfCustomExercise={setInfCustomExercise}
          infCustomReps={infCustomReps}
          setInfCustomReps={setInfCustomReps}
          infFaultType={infFaultType}
          setInfFaultType={setInfFaultType}
          infContext={infContext}
          setInfContext={setInfContext}
          infNotes={infNotes}
          setInfNotes={setInfNotes}
          teamPlayers={teamPlayers}
          onSave={handleSaveInfraction}
        />

      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-red)', margin: 0 }}>
          La Redencion del Orco (Deudas Correctivas)
        </h3>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '0 0 10px 0' }}>
          Los jugadores deben saldar su penitencia fisica ante el clan para poder alinearse en el XV tactico.
        </p>
        {penalizedPlayers.length > 0 ? (
          penalizedPlayers.map(p => (
            <PenaltyCard key={p.id} player={p} onRedeem={redeemPenalty} />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-primary)', fontSize: '0.85rem' }}>
            🟢<br />Tribunal en Paz!<br />
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>No hay deudas de burpees ni de recoger conos pendientes.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ControlTab;
