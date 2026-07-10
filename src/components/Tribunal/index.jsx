import React, { useContext, useMemo } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { useTribunalState } from './useTribunalState';
import ControlTab from './ControlTab';
import FaultBookTab from './FaultBookTab';
import RankingsTab from './RankingsTab';

function Tribunal() {
  const { players, schedule, recordAttendance, recordMatchInfractions, redeemPenalty, activeTeam, viewMode, divisionView, makgoraTeamId } = useContext(ClubContext);
  const { showToast } = useToast();

  const teamPlayers = useMemo(() => {
    if (viewMode === 'general' && divisionView === 'all') {
      return players.filter(p => p.teamCategory?.startsWith('orcos') && p.rol !== 'Entrenador');
    }
    if (viewMode === 'general') {
      return players.filter(p => p.teamCategory === `orcos_${divisionView}` && p.rol !== 'Entrenador');
    }
    if (viewMode === 'makgora' && makgoraTeamId) {
      let filtered = players.filter(p => p.makgora_team_id === makgoraTeamId && p.rol !== 'Entrenador');
      if (divisionView !== 'all') {
        filtered = filtered.filter(p => p.teamCategory === `orcos_${divisionView}`);
      }
      return filtered;
    }
    return players.filter(p => p.teamCategory === activeTeam && p.rol !== 'Entrenador');
  }, [players, viewMode, divisionView, makgoraTeamId, activeTeam]);

  const teamEvents = useMemo(() => {
    const items = schedule || [];
    let filtered = items;
    if (viewMode === 'general' && divisionView === 'all') {
      filtered = items.filter(x => x.teamCategory?.startsWith('orcos'));
    } else if (viewMode === 'general') {
      filtered = items.filter(x => x.teamCategory === `orcos_${divisionView}`);
    } else if (viewMode === 'makgora' && makgoraTeamId) {
      if (divisionView !== 'all') {
        filtered = items.filter(x => x.teamCategory === `orcos_${divisionView}`);
      } else {
        filtered = items.filter(x => x.teamCategory?.startsWith('orcos'));
      }
    } else {
      filtered = items.filter(x => x.teamCategory === activeTeam);
    }
    return filtered
      .filter(e => {
        const eventStart = new Date(e.date + 'T' + (e.time || '00:00'));
        return new Date(eventStart.getTime() + 3 * 60 * 60 * 1000) >= new Date();
      })
      .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
  }, [schedule, viewMode, divisionView, makgoraTeamId, activeTeam]);

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
