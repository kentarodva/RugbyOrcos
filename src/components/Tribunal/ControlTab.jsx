import React from 'react';
import AttendanceForm from './AttendanceForm';
import InfractionForm from './InfractionForm';
import PenaltyCard from './PenaltyCard';

function ControlTab({
  teamPlayers,
  sessionDate,
  setSessionDate,
  attendanceState,
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
          sessionDate={sessionDate}
          setSessionDate={setSessionDate}
          attendanceState={attendanceState}
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

      <div className="glass-panel" style={{ padding: '25px' }}>
        <h2 className="neon-text-gold" style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '10px' }}>
          La Redencion del Orco (Deudas Correctivas)
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
          Los jugadores deben saldar su penitencia fisica ante el clan para poder alinearse en el XV tactico.
        </p>

        {penalizedPlayers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span style={{ fontSize: '3rem' }}>🟢</span>
            <h4 style={{ marginTop: '15px', fontWeight: 700 }}>Tribunal en Paz!</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>
              No hay deudas de burpees ni de recoger conos pendientes en esta categoria.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {penalizedPlayers.map(p => (
              <PenaltyCard key={p.id} player={p} onRedeem={redeemPenalty} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ControlTab;
