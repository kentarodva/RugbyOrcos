import React, { useContext, useMemo } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { useTeamPlayers, useViewFilter } from '../../context/hooks/useFilterByView';
import { useTribunalState } from './useTribunalState';
import ControlTab from './ControlTab';
import FaultBookTab from './FaultBookTab';
import RankingsTab from './RankingsTab';

function Tribunal() {
  const { players, schedule, recordAttendance, recordMatchInfractions, redeemPenalty } = useContext(ClubContext);
  const { showToast } = useToast();

  const allTeamPlayers = useTeamPlayers();
  const teamPlayers = useMemo(() => allTeamPlayers.filter(p => p.rol !== 'Entrenador'), [allTeamPlayers]);

  const filterItems = useViewFilter();
  const teamEvents = useMemo(() => {
    const items = schedule || [];
    return filterItems(items);
  }, [schedule, filterItems]);

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

      <div style={{ display: 'flex', gap: '10px', width: '100%', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('control')}
          className="btn-outline"
          style={{
            background: activeSubTab === 'control' ? 'var(--color-primary)' : 'transparent',
            color: activeSubTab === 'control' ? '#000' : '#fff',
            borderColor: activeSubTab === 'control' ? 'var(--color-primary)' : 'var(--border-glass)',
            fontWeight: activeSubTab === 'control' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          Control y Asistencia
        </button>

        <button
          onClick={() => setActiveSubTab('faltas')}
          className="btn-outline"
          style={{
            background: activeSubTab === 'faltas' ? 'var(--color-red)' : 'transparent',
            color: activeSubTab === 'faltas' ? '#fff' : '#fff',
            borderColor: activeSubTab === 'faltas' ? 'var(--color-red)' : 'var(--border-glass)',
            fontWeight: activeSubTab === 'faltas' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          Libro de Faltas
        </button>
        <button
          onClick={() => setActiveSubTab('rankings')}
          className="btn-outline"
          style={{
            background: activeSubTab === 'rankings' ? 'var(--color-blue)' : 'transparent',
            color: activeSubTab === 'rankings' ? '#000' : '#fff',
            borderColor: activeSubTab === 'rankings' ? 'var(--color-blue)' : 'var(--border-glass)',
            fontWeight: activeSubTab === 'rankings' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          Rankings del Clan
        </button>
      </div>

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
        <FaultBookTab
          teamPlayers={teamPlayers}
          penalizedPlayers={penalizedPlayers}
          redeemPenalty={handleRedeemPenalty}
          onShareBlacklist={handleShareBlacklistWhatsApp}
        />
      )}

      {activeSubTab === 'rankings' && (
        <RankingsTab
          honorOrcs={honorOrcs}
          mvpLeaders={mvpLeaders}
          tryLeaders={tryLeaders}
          tackleLeaders={tackleLeaders}
          dungeonOrcs={dungeonOrcs}
        />
      )}
    </div>
  );
}

export default Tribunal;
