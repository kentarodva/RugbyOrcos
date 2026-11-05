import React, { useContext, useState, useEffect } from 'react';
import {
  TriangleAlert,
  Users,
  Calendar,
  Compass,
  Dumbbell,
  Wallet,
  Swords,
  Shield,
  Plus,
} from 'lucide-react';
import { ClubContext } from '../context/ClubContext';
import { useToast } from '../context/ToastContext';
import { useFilterByView } from '../context/hooks/useFilterByView';
import {
  MetricsCards,
  ChampionshipCountdown,
  SinBinConsole,
  RecentMatches,
  AddChampionshipModal,
} from './Dashboard/index';
import AgendaSemanal from './Dashboard/AgendaSemanal';
import ActivityFeed from './Dashboard/ActivityFeed';
import MiniRanking from './Dashboard/MiniRanking';

function Dashboard({ onNavigate }) {
  const {
    players,
    championships,
    fixtures,
    addChampionship,
    activeTeam,
    divisionView,
    teams,
    viewMode,
    makgoraTeams,
    makgoraTeamId,
    finances,
    schedule,
  } = useContext(ClubContext);
  const { showToast } = useToast();
  const filterByView = useFilterByView();

  const [showAddChamp, setShowAddChamp] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const teamPlayers = filterByView(players);
  const teamChamps = filterByView(championships);

  const panelTitle =
    viewMode === 'makgora'
      ? makgoraTeams.find((t) => String(t.id) === String(makgoraTeamId))?.rpg_name || "Mak'Gora"
      : divisionView === 'all'
        ? 'Todas las Divisiones'
        : teams.find((t) => t.division === divisionView)?.label || activeTeam;

  const hiaSuspendedPlayers = teamPlayers.filter(
    (p) =>
      p.estado === 'lesionado' &&
      Array.isArray(p.injuryLog) &&
      p.injuryLog.length > 0 &&
      p.injuryLog[0]?.diagnosis?.toLowerCase().includes('hia')
  );

  const totalOrcos = teamPlayers.filter((p) => p.rol !== 'Entrenador').length;
  const activos = teamPlayers.filter((p) => p.estado === 'activo' && p.rol !== 'Entrenador').length;
  const lesionados = teamPlayers.filter((p) => p.estado === 'lesionado').length;
  const suspendidos = teamPlayers.filter((p) => p.estado === 'suspendido').length;
  const inactivos = teamPlayers.filter((p) => p.estado === 'inactivo').length;
  const readinessPct = totalOrcos > 0 ? Math.round((activos / totalOrcos) * 100) : 0;

  const handleAddChampionship = (champ) => {
    addChampionship(champ);
    showToast('Campeonato agendado correctamente.', 'success');
  };

  const quickActions = [
    { id: 'roster', label: 'Guerreros', icon: Users, primary: true },
    { id: 'calendario', label: 'Agenda y Asistencia', icon: Calendar },
    { id: 'cancha', label: 'Pizarra XV', icon: Compass },
    { id: 'entrenamientos', label: 'Planes y Rutinas', icon: Dumbbell },
    { id: 'finanzas', label: 'Tesorería', icon: Wallet },
    { id: 'makgora', label: "Torneo Mak'Gora", icon: Swords },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>
        {/* Hero Command Banner v5.0 */}
        <section className="hero-command-banner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                className="badge"
                style={{
                  background: viewMode === 'makgora' ? 'rgba(255, 179, 0, 0.14)' : 'rgba(0, 230, 118, 0.12)',
                  color: viewMode === 'makgora' ? 'var(--color-gold)' : 'var(--color-primary)',
                  border: `1px solid ${viewMode === 'makgora' ? 'rgba(255, 179, 0, 0.3)' : 'rgba(0, 230, 118, 0.25)'}`,
                  fontSize: '0.68rem',
                  padding: '3px 9px',
                }}
              >
                {viewMode === 'makgora' ? <Swords size={12} /> : <Shield size={12} />}
                {viewMode === 'makgora' ? "MODO CLAN MAK'GORA" : 'COMANDO GENERAL DEL CLUB'}
              </span>
              <span
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--color-text-muted)',
                  fontWeight: 600,
                }}
              >
                Disponibilidad de tropa: <strong style={{ color: 'var(--color-primary)' }}>{readinessPct}%</strong>
              </span>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'Outfit, sans-serif', lineHeight: 1.15 }}>
              Panel General:{' '}
              <span style={{ color: viewMode === 'makgora' ? 'var(--color-gold)' : 'var(--color-primary)' }}>
                {panelTitle}
              </span>
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>
              Monitoreo en tiempo real del estado físico, asistencia, disciplina y próximos compromisos del clan.
            </p>
          </div>

          {onNavigate && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => onNavigate(action.id)}
                    className={action.primary ? 'btn-neon' : 'btn-outline'}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      borderRadius: '10px',
                      textTransform: 'none',
                      letterSpacing: '0.2px',
                    }}
                  >
                    <Icon size={15} />
                    {action.label}
                  </button>
                );
              })}
              <button
                onClick={() => setShowAddChamp(true)}
                className="btn-outline"
                style={{
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  borderRadius: '10px',
                  borderColor: 'rgba(255, 179, 0, 0.35)',
                  color: 'var(--color-gold)',
                }}
                title="Programar nuevo campeonato o hito"
              >
                <Plus size={14} /> Hito
              </button>
            </div>
          )}
        </section>

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
              boxShadow: '0 0 15px rgba(255, 61, 0, 0.2)',
            }}
          >
            <TriangleAlert size={35} color="var(--color-red)" />
            <div>
              <h4
                style={{
                  color: 'var(--color-red)',
                  fontWeight: 800,
                  fontFamily: 'Outfit',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                }}
              >
                Alerta Médica: Suspensión Preventiva HIA
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#fff', marginTop: '3px' }}>
                Los siguientes orcos están bajo protocolo de conmoción cerebral y tienen restringido el contacto físico
                por seguridad:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {hiaSuspendedPlayers.map((p) => (
                  <span
                    key={p.id}
                    className="badge badge-injured"
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      background: 'var(--color-red)',
                      color: '#fff',
                      border: '1px solid #ff1744',
                    }}
                  >
                    {p.name} (Protocolo HIA de 14 Días)
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

        <AgendaSemanal />

        <SinBinConsole teamPlayers={teamPlayers} showToast={showToast} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <ChampionshipCountdown
            teamChamps={teamChamps}
            currentTime={time}
            onAddChampionship={() => setShowAddChamp(true)}
          />
          <RecentMatches fixtures={fixtures} activeTeam={activeTeam} />
        </div>

        <MiniRanking teamPlayers={teamPlayers} />

        <ActivityFeed players={teamPlayers} fixtures={fixtures} finances={finances} schedule={schedule} />
      </div>

      {showAddChamp && (
        <AddChampionshipModal onClose={() => setShowAddChamp(false)} onAdd={handleAddChampionship} />
      )}
    </div>
  );
}

export default Dashboard;
