import React, { useContext, useState, useEffect } from 'react';
import { TriangleAlert, Compass, Plus, ClipboardCheck, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClubContext } from '../context/ClubContext';
import { useToast } from '../context/ToastContext';
import { useFilterByView } from '../context/hooks/useFilterByView';
import {
  MetricsCards,
  ChampionshipCountdown,
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
  const { profile } = useAuth();
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

  const handleAddChampionship = (champ) => {
    addChampionship(champ);
    showToast('Campeonato agendado correctamente.', 'success');
  };

  const today = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(time);
  const firstName = (profile?.display_name || '').trim().split(/\s+/)[0];
  const accent = viewMode === 'makgora' ? 'var(--color-gold)' : 'var(--color-primary)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        <section className="hero-command-banner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <span className="page-eyebrow">{today.charAt(0).toUpperCase() + today.slice(1)}</span>
            <h2 className="page-title">{firstName ? `Hola, ${firstName}` : 'Panel del club'}</h2>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {viewMode === 'makgora' ? "Mak'Gora · " : ''}
              <span style={{ color: accent, fontWeight: 600 }}>{panelTitle}</span>
            </span>
          </div>
        </section>

        {hiaSuspendedPlayers.length > 0 && (
          <div
            role="alert"
            className="glass-panel"
            style={{
              padding: '14px 16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              borderColor: 'color-mix(in srgb, var(--color-red) 45%, transparent)',
              background: 'color-mix(in srgb, var(--color-red) 8%, var(--bg-surface))',
            }}
          >
            <TriangleAlert size={22} color="var(--color-red)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'var(--color-red)', fontWeight: 600, fontSize: '0.9375rem' }}>
                Protocolo HIA: sin contacto físico
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-soft)', marginTop: '2px' }}>
                Suspensión preventiva de 14 días por conmoción cerebral.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {hiaSuspendedPlayers.map((p) => (
                  <span key={p.id} className="badge badge-injured">{p.name}</span>
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

        <AgendaSemanal onNavigate={onNavigate} />

        {onNavigate && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 className="section-title">Acciones rápidas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
              <button type="button" className="btn-neon" onClick={() => onNavigate('tribunal')}>
                <ClipboardCheck size={18} /> Pasar lista
              </button>
              <button type="button" className="btn-outline" onClick={() => onNavigate('messages')}>
                <Megaphone size={18} /> Anuncio
              </button>
              <button type="button" className="btn-outline" onClick={() => onNavigate('cancha')}>
                <Compass size={18} /> Pizarra XV
              </button>
              <button type="button" className="btn-outline" onClick={() => setShowAddChamp(true)}>
                <Plus size={18} /> Nuevo hito
              </button>
            </div>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '12px' }}>
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
