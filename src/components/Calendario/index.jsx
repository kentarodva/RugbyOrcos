import React, { useContext, useState, useMemo, useCallback, useRef } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFilterByView } from '../../context/hooks/useFilterByView';
import { supabase } from '../../supabaseClient';
import { wrapCatch } from '../../utils/errorHandler';
import { fetchEventRsvps, upsertRsvp } from '../../services/dataService';
import { useDataListener } from '../../context/hooks/useDataListener';
import Rivales from '../Rivales';
import Invitaciones from '../Invitaciones';
import CalendarioTabs from './CalendarioTabs';
import AgendaTab from './AgendaTab';
import FixtureTab from './FixtureTab';
import FutureTab from './FutureTab';
import LiveMatch from './FixtureTab/LiveMatch';
import MatchSquadModal from './FixtureTab/MatchSquadModal';

const LiveMatchInline = LiveMatch;

import CalendarioSkeleton from '../Skeletons/CalendarioSkeleton';
import { downloadCalendarIcs } from '../../utils/exportCalendarIcs';

function Calendario() {
  const {
    schedule, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent, generateWhatsAppMessage, activeTeam,
    fixtures, addFixture, updateFixture, deleteFixture, players, recordMatchStats,
    futureFixtures, addFutureFixture, deleteFutureFixture, rivals,
    viewMode, divisionView, makgoraTeams,
    syncStatus, hasPermission,
    liveMatch, startLiveMatch, addLiveEvent,
    pauseLiveMatch, resumeLiveMatch, delayLiveMatch, setDesignatedScorer, endLiveMatch, deleteLiveMatch,
  } = useContext(ClubContext);
  const { showToast } = useToast();
  const { user, profile } = useAuth();
  const filterByView = useFilterByView();

  const currentPlayer = useMemo(() => {
    if (!players || players.length === 0) return null;
    return players.find(p => {
      if (profile?.display_name && p.name?.toLowerCase() === profile.display_name.toLowerCase()) return true;
      if (user?.email && p.contacto?.email === user.email) return true;
      return false;
    }) || null;
  }, [players, profile?.display_name, user?.email]);

  const canManageEvents = hasPermission('manage_schedule');

  const [activeTab, setActiveTab] = useState('agenda');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWeeklyView, setShowWeeklyView] = useState(false);
  const [showMonthlyView, setShowMonthlyView] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedFixtureForDetail, setSelectedFixtureForDetail] = useState(null);
  const [editingFixture, setEditingFixture] = useState(null);
  const [squadFixture, setSquadFixture] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [rsvpList, setRsvpList] = useState([]);
  const detailEventRef = useRef(detailEvent);
  detailEventRef.current = detailEvent;

  useDataListener('event_rsvp', () => {
    if (detailEventRef.current?.id) {
      fetchEventRsvps(detailEventRef.current.id).then(data => {
        if (data) setRsvpList(data);
      }).catch(() => {});
    }
  });

  const currentTeamCategory = useMemo(() => {
    if (viewMode === 'general' && divisionView !== 'all') {
      return `orcos_${divisionView}`;
    }
    return activeTeam;
  }, [viewMode, divisionView, activeTeam]);

  const activeTeamPlayers = useMemo(() => {
    return filterByView(players).filter(p => p.rol !== 'Entrenador');
  }, [players, filterByView]);

  const scheduleInView = useMemo(() => {
    return schedule.filter(e => {
      if (e.scopeType === 'all') return true;
      if (e.scopeType === 'makgora_team') {
        const targetTeamId = e.scopeValue?.makgora_team_id;
        if (!targetTeamId) return true;
        const teamPlayers = players.filter(p => p.makgora_team_id === targetTeamId);
        if (teamPlayers.length === 0) return filterByView([e]).length > 0;
        const inView = teamPlayers.some(p => filterByView([p]).length > 0);
        return inView;
      }
      return filterByView([e]).length > 0;
    });
  }, [schedule, players, filterByView]);

  const teamEvents = useMemo(() => {
    return scheduleInView
      .filter(s => {
        const eventStart = new Date(s.date + 'T' + (s.time || '00:00'));
        return new Date(eventStart.getTime() + 3 * 60 * 60 * 1000) >= new Date();
      })
      .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
  }, [scheduleInView]);

  const filteredFixtures = useMemo(() => filterByView(fixtures), [fixtures, filterByView]);
  const filteredFutureFixtures = useMemo(() => filterByView(futureFixtures), [futureFixtures, filterByView]);

  const getMatchStats = (fixture) => {
    if (!fixture) return [];
    const matchStatsList = [];
    activeTeamPlayers.forEach(p => {
      if (p.matchStats) {
        p.matchStats.forEach(st => {
          const matchDateMatch = st.date === fixture.date;
          const matchOpponentMatch = (st.opponent || '').trim().toLowerCase() === (fixture.opponent || '').trim().toLowerCase();
          if (matchDateMatch && matchOpponentMatch) {
            matchStatsList.push({ player: p, stats: st });
          }
        });
      }
    });
    return matchStatsList;
  };

  const handleSavePlayerStats = (statsData) => {
    recordMatchStats(statsData.playerId, {
      date: selectedFixtureForDetail.date,
      opponent: selectedFixtureForDetail.opponent,
      tries: Number(statsData.tries),
      conversions: Number(statsData.conversions),
      tackles: Number(statsData.tackles),
      turnovers: Number(statsData.turnovers),
      yellowCards: Number(statsData.yellowCards),
      redCards: Number(statsData.redCards),
      mvp: statsData.mvp
    });
    showToast('Estadisticas tecnicas registradas con exito.', 'success');
  };

  const handleSaveEvent = useCallback((formData) => {
    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      showToast('Completa todos los campos requeridos.', 'warning');
      return;
    }
    addScheduleEvent({ ...formData, teamCategory: currentTeamCategory });
    setShowAddForm(false);
    setEditingEvent(null);
    showToast('Evento creado exitosamente.', 'success');
  }, [addScheduleEvent, currentTeamCategory, showToast]);

  const handleEditEvent = useCallback((formData) => {
    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      showToast('Completa todos los campos requeridos.', 'warning');
      return;
    }
    if (editingEvent?.id) {
      updateScheduleEvent({ ...editingEvent, ...formData, teamCategory: currentTeamCategory });
    }
    setShowAddForm(false);
    setEditingEvent(null);
    showToast('Evento actualizado.', 'success');
  }, [editingEvent, updateScheduleEvent, currentTeamCategory, showToast]);

  const handleQuickCreate = useCallback(async (formData) => {
    addScheduleEvent({ ...formData, recurrence: 'custom', teamCategory: currentTeamCategory });
    showToast(`${formData.recurrenceDays?.length || 0} dias x ${formData.recurrenceWeeks || 4} semanas creados.`, 'success');
  }, [addScheduleEvent, currentTeamCategory, showToast]);

  const handleRsvp = useCallback(async (eventId, status) => {
    const playerId = currentPlayer?.id;
    if (!playerId) return;
    try {
      await upsertRsvp(playerId, eventId, status);
      const data = await fetchEventRsvps(eventId);
      if (data) setRsvpList(data);
      showToast('Asistencia confirmada.', 'success');
    } catch (err) {
      showToast('Error al confirmar asistencia.', 'error');
    }
  }, [currentPlayer?.id, showToast]);

  const loadRsvp = useCallback(async (eventId) => {
    try {
      const data = await fetchEventRsvps(eventId);
      if (data) setRsvpList(data);
    } catch (err) {
      wrapCatch('Calendario.loadRsvp', { notifyUser: true })(err);
      setRsvpList([]);
    }
  }, []);

  const handleSaveFixture = useCallback((fixtureData) => {
    addFixture({ ...fixtureData, teamCategory: currentTeamCategory });
    showToast('Resultado registrado con exito.', 'success');
  }, [addFixture, currentTeamCategory, showToast]);

  const handleEditFixture = useCallback((fixtureData) => {
    updateFixture({ ...fixtureData, teamCategory: currentTeamCategory });
    setEditingFixture(null);
    showToast('Resultado actualizado con exito.', 'success');
  }, [updateFixture, currentTeamCategory, showToast]);

  const handleStartLiveMatch = useCallback(async (fixture) => {
    const match = await startLiveMatch({
      fixtureId: fixture?.id || null,
      opponentName: fixture?.opponent || '',
      teamCategory: currentTeamCategory,
    });
    if (match) {
      setActiveTab('envivo');
      showToast('Partido iniciado!', 'success');
    }
  }, [startLiveMatch, currentTeamCategory, showToast]);

  const handleSaveSquad = useCallback(async (fixtureId, squad) => {
    const { error } = await supabase
      .from('fixtures')
      .update({ squad })
      .eq('id', fixtureId);
    if (error) {
      showToast('Error al guardar el squad.', 'error');
      return;
    }
    updateFixture({ id: fixtureId, squad });
    setSquadFixture(null);
    showToast('Squad guardado correctamente.', 'success');
  }, [updateFixture, showToast]);

  const handleDeleteLiveMatch = useCallback(async () => {
    if (!window.confirm('Eliminar el partido en vivo? Los datos no guardados se perderan.')) return;
    await deleteLiveMatch();
    showToast('Partido en vivo eliminado.', 'info');
  }, [deleteLiveMatch, showToast]);

  const handleEndLiveMatch = useCallback(async () => {
    await endLiveMatch();
    showToast('Partido finalizado.', 'success');
  }, [endLiveMatch, showToast]);

  const handleSaveFutureFixture = useCallback((futureData) => {
    addFutureFixture({ ...futureData, teamCategory: currentTeamCategory });
    showToast(`Partido vs ${futureData.opponent} agendado para el ${futureData.date}.`, 'success');
  }, [addFutureFixture, currentTeamCategory, showToast]);

  const handleWhatsAppShare = (event) => {
    const message = generateWhatsAppMessage(event);
    navigator.clipboard.writeText(message)
      .then(() => {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      })
      .catch((err) => {
        wrapCatch('Calendario.whatsappClipboard')(err);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      });
  };

  const handleOpenDetail = useCallback(async (event) => {
    setDetailEvent(event);
    await loadRsvp(event.id);
  }, [loadRsvp]);

  const myRsvp = useMemo(() => {
    const pid = currentPlayer?.id;
    if (!pid) return null;
    const mine = rsvpList.find(r => r.player_id === pid);
    return mine?.status || null;
  }, [currentPlayer?.id, rsvpList]);

  const handleExportIcs = () => {
    const allMatches = [...(futureFixtures || []), ...(fixtures || [])];
    downloadCalendarIcs({ matches: allMatches, teamLabel: 'Rugby Orcos Negros Club' });
    showToast('Calendario .ICS descargado. Ábrelo en tu teléfono para sincronizar.', 'success');
  };

  if (syncStatus === 'idle' || syncStatus === 'syncing') {
    return <CalendarioSkeleton activeTab={activeTab} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <CalendarioTabs activeTab={activeTab} onChange={setActiveTab} hasActiveMatch={!!liveMatch && liveMatch.status !== 'finished'} />
        <button
          onClick={handleExportIcs}
          className="btn-outline"
          style={{
            fontSize: '0.74rem',
            padding: '6px 12px',
            borderColor: 'rgba(59, 130, 246, 0.45)',
            color: '#60a5fa',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
          }}
          title="Descarga el archivo estándar .ICS para añadir todos los partidos a Google Calendar, iPhone o Outlook"
        >
          📅 Sincronizar Calendario (.ICS)
        </button>
      </div>

      {activeTab === 'agenda' && (
        <AgendaTab
          teamEvents={teamEvents}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          showWeeklyView={showWeeklyView}
          setShowWeeklyView={setShowWeeklyView}
          showMonthlyView={showMonthlyView}
          setShowMonthlyView={setShowMonthlyView}
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
          handleSaveEvent={handleSaveEvent}
          handleEditEvent={handleEditEvent}
          handleWhatsAppShare={handleWhatsAppShare}
          deleteScheduleEvent={deleteScheduleEvent}
          onQuickCreate={handleQuickCreate}
          currentTeamCategory={currentTeamCategory}
          onDetailEvent={handleOpenDetail}
          detailEvent={detailEvent}
          setDetailEvent={setDetailEvent}
          players={activeTeamPlayers}
          rsvpList={rsvpList}
          myRsvp={myRsvp}
          onRsvp={handleRsvp}
          makgoraTeams={makgoraTeams}
          canManageEvents={canManageEvents}
        />
      )}

      {activeTab === 'fixture' && (
        <FixtureTab
          fixtures={filteredFixtures}
          activeTeamPlayers={activeTeamPlayers}
          selectedFixtureForDetail={selectedFixtureForDetail}
          setSelectedFixtureForDetail={setSelectedFixtureForDetail}
          handleSaveFixture={handleSaveFixture}
          handleSavePlayerStats={handleSavePlayerStats}
          getMatchStats={getMatchStats}
          deleteFixture={deleteFixture}
          editingFixture={editingFixture}
          setEditingFixture={setEditingFixture}
          handleEditFixture={handleEditFixture}
          onStartMatch={handleStartLiveMatch}
          onSquad={setSquadFixture}
          hasActiveMatch={!!liveMatch && liveMatch.status !== 'finished'}
        />
      )}

      {activeTab === 'envivo' && (
        <LiveMatchInline
          liveMatch={liveMatch}
          players={activeTeamPlayers}
          onAddEvent={addLiveEvent}
          onPause={pauseLiveMatch}
          onResume={resumeLiveMatch}
          onDelay={delayLiveMatch}
          onSetScorer={setDesignatedScorer}
          onEnd={handleEndLiveMatch}
          onDelete={handleDeleteLiveMatch}
          onClose={() => setActiveTab('fixture')}
          onStart={handleStartLiveMatch}
          addFixture={addFixture}
          showToast={showToast}
          currentUser={user}
          currentProfile={profile}
          canManageMatch={hasPermission('admin_panel') || profile?.role === 'coach' || profile?.role === 'capitan'}
        />
      )}

      {squadFixture && (
        <MatchSquadModal
          fixture={squadFixture}
          players={activeTeamPlayers}
          onSave={handleSaveSquad}
          onClose={() => setSquadFixture(null)}
          showToast={showToast}
        />
      )}

      {activeTab === 'proximos' && (
        <FutureTab
          futureFixtures={filteredFutureFixtures}
          rivals={rivals}
          handleSaveFutureFixture={handleSaveFutureFixture}
          deleteFutureFixture={deleteFutureFixture}
          showToast={showToast}
        />
      )}

      {activeTab === 'rivales' && <Rivales />}
      {activeTab === 'invitaciones' && <Invitaciones />}
    </div>
  );
}

export default Calendario;
