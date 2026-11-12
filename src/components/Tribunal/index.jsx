import React, { useContext, useMemo } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { useTeamPlayers, useViewFilter } from '../../context/hooks/useFilterByView';
import { useTribunalState } from './useTribunalState';
import { attendanceOptions } from '../../utils/attendanceSources';
import ControlTab from './ControlTab';
import FaultBookTab from './FaultBookTab';
import RankingsTab from './RankingsTab';

function Tribunal() {
  const { schedule, futureFixtures, recordAttendance, recordMatchInfractions, redeemPenalty } = useContext(ClubContext);
  const { showToast } = useToast();

  const allTeamPlayers = useTeamPlayers();
  const teamPlayers = useMemo(() => allTeamPlayers.filter(p => p.rol !== 'Entrenador'), [allTeamPlayers]);

  const filterItems = useViewFilter();
  // Eventos del calendario y partidos programados: a los dos se les pasa lista (punto 8).
  const teamEvents = useMemo(
    () => attendanceOptions(filterItems(schedule || []), filterItems(futureFixtures || [])),
    [schedule, futureFixtures, filterItems]
  );

  const {
    activeSubTab, setActiveSubTab,
    selectedEventId, handleEventChange,
    attendanceState, rsvpMap, onMarkConfirmedPresent,
    handleAttendanceChange,
    handleSaveAttendance,
    matchDate, setMatchDate,
    selectedPlayerForInf, setSelectedPlayerForInf,
    infPenales, setInfPenales,
    infAmarillas, setInfAmarillas,
    infRojas, setInfRojas,
    infBurpeesExtra, setInfBurpeesExtra,
    infCustomExercise, setInfCustomExercise,
    infCustomReps, setInfCustomReps,
    infFaultType, setInfFaultType,
    infContext, setInfContext,
    infNotes, setInfNotes,
    handleSaveInfraction,
    penalizedPlayers,
    honorOrcs, mvpLeaders, tryLeaders, tackleLeaders, dungeonOrcs,
    handleShareBlacklistWhatsApp,
    redeemPenalty: handleRedeemPenalty,
  } = useTribunalState(teamPlayers, teamEvents, recordAttendance, recordMatchInfractions, redeemPenalty, showToast);

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div className="segmented" role="tablist" aria-label="Secciones del tribunal" style={{ alignSelf: 'flex-start' }}>
        {[['control', 'Asistencia'], ['faltas', 'Faltas y castigos']].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={activeSubTab === id}
            className={activeSubTab === id ? 'is-on' : ''} onClick={() => setActiveSubTab(id)}>{label}</button>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        {activeSubTab === 'faltas'
          ? 'Arriba quién acumula más; abajo cada falta registrada y su castigo pendiente.'
          : 'Elige el entreno, marca presente, tarde o falta, y guarda. También puedes anotar una infracción.'}
      </p>

      {activeSubTab === 'control' && (
        <ControlTab
          teamPlayers={teamPlayers}
          teamEvents={teamEvents}
          attendanceState={attendanceState}
          rsvpMap={rsvpMap}
          onMarkConfirmedPresent={onMarkConfirmedPresent}
          selectedEventId={selectedEventId}
          setSelectedEventId={handleEventChange}
          handleAttendanceChange={handleAttendanceChange}
          handleSaveAttendance={handleSaveAttendance}
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
          handleSaveInfraction={handleSaveInfraction}
          penalizedPlayers={penalizedPlayers}
          redeemPenalty={handleRedeemPenalty}
        />
      )}

      {activeSubTab === 'faltas' && (
        <RankingsTab
          honorOrcs={honorOrcs}
          mvpLeaders={mvpLeaders}
          tryLeaders={tryLeaders}
          tackleLeaders={tackleLeaders}
          dungeonOrcs={dungeonOrcs}
        />
      )}

      {activeSubTab === 'faltas' && (
        <FaultBookTab
          teamPlayers={teamPlayers}
          penalizedPlayers={penalizedPlayers}
          redeemPenalty={handleRedeemPenalty}
          onShareBlacklist={handleShareBlacklistWhatsApp}
        />
      )}

    </div>
  );
}

export default Tribunal;
