import React, { useContext, useState, useMemo, useCallback } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../supabaseClient';
import Rivales from '../Rivales';
import CalendarioTabs from './CalendarioTabs';
import AgendaTab from './AgendaTab';
import FixtureTab from './FixtureTab';
import FutureTab from './FutureTab';

import CalendarioSkeleton from '../Skeletons/CalendarioSkeleton';

function Calendario() {
  const {
    schedule, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent, generateWhatsAppMessage, activeTeam,
    fixtures, addFixture, deleteFixture, players, recordMatchStats,
    futureFixtures, addFutureFixture, deleteFutureFixture, rivals,
    viewMode, divisionView, makgoraTeamId, makgoraTeams,
    syncStatus, hasPermission,
  } = useContext(ClubContext);
  const { showToast } = useToast();
  const { user, profile } = useAuth();

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
  const [detailEvent, setDetailEvent] = useState(null);
  const [rsvpList, setRsvpList] = useState([]);

  const currentTeamCategory = useMemo(() => {
    if (viewMode === 'general' && divisionView !== 'all') {
      return `orcos_${divisionView}`;
    }
    return activeTeam;
  }, [viewMode, divisionView, activeTeam]);

  const filterByView = useCallback((items) => {
    if (viewMode === 'general' && divisionView === 'all') {
      return items.filter(x => x.teamCategory?.startsWith('orcos'));
    }
    if (viewMode === 'general') {
      return items.filter(x => x.teamCategory === `orcos_${divisionView}`);
    }
    if (viewMode === 'makgora' && makgoraTeamId) {
      if (divisionView !== 'all') {
        return items.filter(x => x.teamCategory === `orcos_${divisionView}`);
      }
      return items.filter(x => x.teamCategory?.startsWith('orcos'));
    }
    return items.filter(x => x.teamCategory === activeTeam);
  }, [viewMode, divisionView, makgoraTeamId, activeTeam]);

  const activeTeamPlayers = useMemo(() => {
    return filterByView(players).filter(p => p.rol !== 'Entrenador');
  }, [players, filterByView]);

  const scheduleInView = useMemo(() => {
    return schedule.filter(e => {
      if (e.scopeType === 'all') return true;
      if (e.scopeType === 'makgora_team') {
        const targetTeamId = e.scopeValue?.makgora_team_id;
        if (!targetTeamId) return true;
        const teamPlayers = players.filter(p => p.makgoraTeamId === targetTeamId);
        if (teamPlayers.length === 0) return filterByView([e]).length > 0;
        const inView = teamPlayers.some(p => filterByView([p]).length > 0);
        return inView;
      }
      return filterByView([e]).length > 0;
    });
  }, [schedule, players, filterByView]);

  const teamEvents = useMemo(() => {
    return scheduleInView
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
      const { error } = await supabase.from('event_rsvp').upsert(
        { event_id: eventId, player_id: playerId, status },
        { onConflict: 'event_id, player_id' }
      );
      if (error) throw error;
      const { data } = await supabase.from('event_rsvp').select('*').eq('event_id', eventId);
      if (data) setRsvpList(data);
      showToast('Asistencia confirmada.', 'success');
    } catch (err) {
      showToast('Error al confirmar asistencia.', 'error');
    }
  }, [currentPlayer?.id, showToast]);

  const loadRsvp = useCallback(async (eventId) => {
    try {
      const { data } = await supabase.from('event_rsvp').select('*').eq('event_id', eventId);
      if (data) setRsvpList(data);
    } catch {
      setRsvpList([]);
    }
  }, []);

  const handleSaveFixture = useCallback((fixtureData) => {
    addFixture({ ...fixtureData, teamCategory: currentTeamCategory });
    showToast('Resultado registrado con exito.', 'success');
  }, [addFixture, currentTeamCategory, showToast]);

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
      .catch(() => {
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

  if (syncStatus === 'idle' || syncStatus === 'syncing') {
    return <CalendarioSkeleton activeTab={activeTab} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <CalendarioTabs activeTab={activeTab} onChange={setActiveTab} />

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
    </div>
  );
}

export default Calendario;
