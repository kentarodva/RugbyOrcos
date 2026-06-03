import React, { useContext, useState, useEffect, useCallback } from 'react';
import { ClubContext, EQUIPOS_LABELS } from '../context/ClubContext';
import { useToast } from '../context/ToastContext';
import {
  RadarChart,
  AttendanceTimeline,
  DivisionComparison,
  MetricsCards,
  ForwardsBacksBalance,
  ChampionshipCountdown,
  SinBinConsole,
  WellnessForm,
  InjuryReport,
  UpcomingEvents,
  RecentMatches,
  AddChampionshipModal,
} from './Dashboard/index';

function Dashboard() {
  const { players, schedule, championships, fixtures, addChampionship, activeTeam, recordWellness, viewMode, divisionView, makgoraTeamId } = useContext(ClubContext);
  const { showToast } = useToast();

  const filterByView = useCallback((items) => {
    if (viewMode === 'general' && divisionView === 'all') {
      return items.filter(x => x.teamCategory?.startsWith('orcos'));
    }
    if (viewMode === 'general') {
      return items.filter(x => x.teamCategory === `orcos_${divisionView}`);
    }
    if (viewMode === 'makgora' && makgoraTeamId) {
      let filtered = items.filter(x => x.makgora_team_id === makgoraTeamId);
      if (divisionView !== 'all') {
        filtered = filtered.filter(x => x.teamCategory === `orcos_${divisionView}`);
      }
      return filtered;
    }
    return items.filter(x => x.teamCategory === activeTeam);
  }, [viewMode, divisionView, makgoraTeamId, activeTeam]);

  const [showAddChamp, setShowAddChamp] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const teamPlayers = filterByView(players);
  const teamSchedule = filterByView(schedule)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const teamChamps = filterByView(championships);

  const hiaSuspendedPlayers = teamPlayers.filter(p =>
    p.estado === 'lesionado' &&
    Array.isArray(p.injuryLog) && p.injuryLog.length > 0 &&
    p.injuryLog[0]?.diagnosis?.toLowerCase().includes('hia')
  );

  const totalOrcos = teamPlayers.filter(p => p.rol !== 'Entrenador').length;
  const activos = teamPlayers.filter(p => p.estado === 'activo' && p.rol !== 'Entrenador').length;
  const lesionados = teamPlayers.filter(p => p.estado === 'lesionado').length;
  const suspendidos = teamPlayers.filter(p => p.estado === 'suspendido').length;
  const inactivos = teamPlayers.filter(p => p.estado === 'inactivo').length;

  const handleAddChampionship = (champ) => {
    addChampionship(champ);
    showToast('Campeonato agendado correctamente.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '25px', width: '100%' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
              Panel General: <span style={{ color: 'var(--color-primary)' }}>{EQUIPOS_LABELS[activeTeam]}</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Resumen en tiempo real del estado de tus guerreros y torneos.
            </p>
          </div>
        </div>

        {hiaSuspendedPlayers.length > 0 && (
          <div
            className="animated-pulse"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 61, 0, 0.15), rgba(255, 179, 0, 0.15))',
              border: '2px dashed var(--color-red)',
              borderRadius: 'var(--radius-lg)',
              padding: '15px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              boxShadow: '0 0 15px rgba(255, 61, 0, 0.2)'
            }}
          >
            <div style={{ fontSize: '2.2rem' }}>⚠️</div>
            <div>
              <h4 style={{ color: 'var(--color-red)', fontWeight: 800, fontFamily: 'Outfit', fontSize: '1rem', textTransform: 'uppercase' }}>
                Alerta Medica: Suspension Preventiva HIA
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#fff', marginTop: '3px' }}>
                Los siguientes orcos estan bajo protocolo de conmocion cerebral y tienen restringido el contacto fisico por seguridad:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {hiaSuspendedPlayers.map(p => (
                  <span key={p.id} className="badge badge-injured" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--color-red)', color: '#fff', border: '1px solid #ff1744' }}>
                    {p.name} (Protocolo HIA de 14 Dias)
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <MetricsCards
          totalOrcos={totalOrcos}
          activos={activos}
          lesionados={lesionados}
          suspendidos={suspendidos}
          inactivos={inactivos}
        />

        <RadarChart teamPlayers={teamPlayers.filter(p => p.rol !== 'Entrenador')} />

        <DivisionComparison allPlayers={players.filter(p => p.rol !== 'Entrenador')} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <ForwardsBacksBalance teamPlayers={teamPlayers} />
          <ChampionshipCountdown
            teamChamps={teamChamps}
            currentTime={time}
            onAddChampionship={() => setShowAddChamp(true)}
          />
        </div>

        <SinBinConsole
          teamPlayers={teamPlayers}
          showToast={showToast}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <WellnessForm teamPlayers={teamPlayers} recordWellness={recordWellness} />
          <InjuryReport teamPlayers={teamPlayers} />
          <AttendanceTimeline teamPlayers={teamPlayers.filter(p => p.rol !== 'Entrenador')} />
          <UpcomingEvents teamSchedule={teamSchedule} />
          <RecentMatches fixtures={fixtures} activeTeam={activeTeam} />
        </div>
      </div>

      {showAddChamp && (
        <AddChampionshipModal
          onClose={() => setShowAddChamp(false)}
          onAdd={handleAddChampionship}
        />
      )}
    </div>
  );
}

export default Dashboard;
