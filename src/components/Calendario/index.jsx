import React, { useContext, useState } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import Rivales from '../Rivales';
import CalendarioTabs from './CalendarioTabs';
import AgendaTab from './AgendaTab';
import FixtureTab from './FixtureTab';
import FutureTab from './FutureTab';

import CalendarioSkeleton from '../Skeletons/CalendarioSkeleton';

function Calendario() {
  const {
    schedule, addScheduleEvent, deleteScheduleEvent, generateWhatsAppMessage, activeTeam,
    fixtures, addFixture, deleteFixture, players, recordMatchStats,
    futureFixtures, addFutureFixture, deleteFutureFixture, rivals,
    syncStatus,
  } = useContext(ClubContext);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('agenda');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWeeklyView, setShowWeeklyView] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventMaps, setEventMaps] = useState('');
  const [eventType, setEventType] = useState('entrenamiento');
  const [eventRecurrence, setEventRecurrence] = useState('none');
  const [eventLinkedRoutine, setEventLinkedRoutine] = useState('');
  const [selectedFixtureForDetail, setSelectedFixtureForDetail] = useState(null);

  const activeTeamPlayers = players.filter(p => p.teamCategory === activeTeam && p.rol !== 'Entrenador');

  const getMatchStats = (fixture) => {
    if (!fixture) return [];
    const matchStatsList = [];
    players.forEach(p => {
      if (p.matchStats) {
        p.matchStats.forEach(st => {
          const matchDateMatch = st.date === fixture.date;
          const matchOpponentMatch = st.opponent.trim().toLowerCase() === fixture.opponent.trim().toLowerCase();
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

  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventTime || !eventLocation) return;

    const finalMapsLink = eventMaps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventLocation)}`;

    addScheduleEvent({
      title: eventTitle,
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      mapsLink: finalMapsLink,
      type: eventType,
      recurrence: eventRecurrence,
      linkedRoutine: eventLinkedRoutine || null
    });

    setEventTitle('');
    setEventDate('');
    setEventTime('');
    setEventLocation('');
    setEventMaps('');
    setEventType('entrenamiento');
    setEventRecurrence('none');
    setEventLinkedRoutine('');
    setShowAddForm(false);
  };

  const handleSaveFixture = (fixtureData) => {
    addFixture(fixtureData);
    showToast('Resultado registrado con exito.', 'success');
  };

  const handleSaveFutureFixture = (futureData) => {
    addFutureFixture(futureData);
    showToast(`Partido vs ${futureData.opponent} agendado para el ${futureData.date}.`, 'success');
  };

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

  const teamEvents = schedule
    .filter(e => e.teamCategory === activeTeam)
    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

  if (syncStatus === 'idle' || syncStatus === 'syncing') {
    return <CalendarioSkeleton activeTab={activeTab} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <CalendarioTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'agenda' && (
        <AgendaTab
          teamEvents={teamEvents}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          showWeeklyView={showWeeklyView}
          setShowWeeklyView={setShowWeeklyView}
          handleSaveEvent={handleSaveEvent}
          handleWhatsAppShare={handleWhatsAppShare}
          deleteScheduleEvent={deleteScheduleEvent}
        />
      )}

      {activeTab === 'fixture' && (
        <FixtureTab
          fixtures={fixtures}
          activeTeam={activeTeam}
          players={players}
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
          futureFixtures={futureFixtures}
          activeTeam={activeTeam}
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
