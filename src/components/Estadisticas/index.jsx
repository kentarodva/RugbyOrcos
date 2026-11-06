import React, { useContext, useMemo, useState, useRef, useCallback } from 'react';
import { BarChart3, Dumbbell, Swords, Trophy, Users, Cake } from 'lucide-react';
import { ClubContext } from '../../context/ClubContext';
import { useTeamPlayers } from '../../context/hooks/useFilterByView';
import { formatLocalDate } from '../../utils/dates.js';
import { useRegisterSearchHandler } from '../../utils/keyboardShortcuts';
import { normalizeEPS } from '../../utils/csvImport';
import KPI from './KPI';
import Tabs from './Tabs';
import FilterBar from './FilterBar';
import Demografia from './Demografia';
import Fisico from './Fisico';
import Salud from './Salud';
import Cobertura from './Cobertura';
import EquiposTab from './EquiposTab';
import Atributos from './Atributos';
import AwardsHall from '../AwardsHall';
import { LeaderboardTab } from './LeaderboardTab';
import EstadisticasSkeleton from '../Skeletons/EstadisticasSkeleton';
import { getUpcomingBirthdays } from '../../services/statsService';

const TABS = [
  { id: 'plantilla', label: 'Plantilla', Icon: BarChart3 },
  { id: 'rendimiento', label: 'Rendimiento', Icon: Dumbbell },
  { id: 'salon', label: 'Salón de la Fama', Icon: Trophy },
];

const TAB_HELP = {
  plantilla: 'Quiénes son: edades, divisiones, cuántos hay por posición y cómo se reparten entre equipos.',
  rendimiento: 'Cómo están: físico y marcas de gimnasio, atributos de juego y reportes de salud.',
  salon: 'Los mejores del club en tries, MVPs y asistencia.',
};

function Block({ title, children }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

function Estadisticas() {
  const { players, makgoraTeams, syncStatus, recordWellness } = useContext(ClubContext);
  const teamPlayers = useTeamPlayers();
  const searchInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('plantilla');

  useRegisterSearchHandler(useCallback(() => {
    searchInputRef.current?.focus();
  }, []));
  const [filters, setFilters] = useState({
    estado: 'todos', edadMin: '', edadMax: '',
    categoria: '',
    pesoMin: '', pesoMax: '',
    alturaMin: '', alturaMax: '',
    eps: '', sinEPS: false,
    fracturas: 'todos', alergias: 'todos', enfermedades: 'todos',
    rol: '', tipoDoc: '',
    busqueda: '',
  });

  const uniqueEps = useMemo(() =>
    [...new Set(players.map(p => normalizeEPS(p.health_insurance)).filter(Boolean))].sort(),
  [players]);

  const filteredPlayers = useMemo(() => {
    let p = teamPlayers;
    if (filters.estado !== 'todos') p = p.filter(x => x.estado === filters.estado);
    if (filters.edadMin) p = p.filter(x => (x._meta?.age ?? x.age) >= parseInt(filters.edadMin));
    if (filters.edadMax) p = p.filter(x => (x._meta?.age ?? x.age) <= parseInt(filters.edadMax));
    if (filters.categoria) p = p.filter(x => x.teamCategory === filters.categoria);
    if (filters.pesoMin) p = p.filter(x => x.weight >= parseFloat(filters.pesoMin));
    if (filters.pesoMax) p = p.filter(x => x.weight <= parseFloat(filters.pesoMax));
    if (filters.alturaMin) p = p.filter(x => x.height >= parseFloat(filters.alturaMin));
    if (filters.alturaMax) p = p.filter(x => x.height <= parseFloat(filters.alturaMax));
    if (filters.eps) p = p.filter(x => normalizeEPS(x.health_insurance) === filters.eps);
    if (filters.sinEPS) p = p.filter(x => !x.health_insurance);
    if (filters.fracturas !== 'todos') p = p.filter(x => !!x.had_fractures === (filters.fracturas === 'si'));
    if (filters.alergias !== 'todos') p = p.filter(x => !!x.allergies === (filters.alergias === 'si'));
    if (filters.enfermedades !== 'todos') p = p.filter(x => !!x.medical_conditions === (filters.enfermedades === 'si'));
    if (filters.rol) p = p.filter(x => x.rol === filters.rol);
    if (filters.tipoDoc) p = p.filter(x => x.document_type === filters.tipoDoc);
    if (filters.busqueda) {
      const q = filters.busqueda.toLowerCase();
      p = p.filter(x => (x.name || '').toLowerCase().includes(q));
    }
    return p;
  }, [teamPlayers, filters]);

  const activePlayers = useMemo(() => filteredPlayers.filter(p => p.estado !== 'inactivo'), [filteredPlayers]);
  const avg = (arr) => arr.length > 0 ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : '-';
  const ages = filteredPlayers.map(p => p._meta?.age ?? p.age).filter(Boolean);
  const weights = filteredPlayers.map(p => p.weight).filter(Boolean);

  const upcomingBirthdays = useMemo(() => getUpcomingBirthdays(filteredPlayers, 5), [filteredPlayers]);

  if (syncStatus === 'idle' || syncStatus === 'syncing') {
    return <EstadisticasSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span className="page-eyebrow">{filteredPlayers.length} jugadores · {activePlayers.length} activos</span>
        <h1 className="page-title">Estadísticas</h1>
      </header>
      <div className="metrics-grid">
        <KPI value={filteredPlayers.length} label="En vista" icon={<Users size={16} />} color="#2EE57A" />
        <KPI value={activePlayers.length} label="Activos" icon={<Swords size={16} />} color="#2EE57A" sub={filteredPlayers.length > 0 ? `${(activePlayers.length / filteredPlayers.length * 100).toFixed(0)}% del total` : ''} />
        <KPI value={`${avg(ages)}`} label="Edad promedio" icon={<Cake size={16} />} color="#E8B931" sub={`${ages.length} reportaron edad`} />
        <KPI value={`${avg(weights)}kg`} label="Peso promedio" icon={<Dumbbell size={16} />} color="#448aff" sub={`${weights.length} reportaron peso`} />
      </div>
      {upcomingBirthdays.length > 0 && (
        <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Cake size={18} style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Próximos cumpleaños</span>
          {upcomingBirthdays.map((p, i) => (
            <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: p.days === 0 ? '#E8B931' : 'var(--text-primary)' }}>
              <span style={{ fontWeight: p.days === 0 ? 800 : 600 }}>{p.name}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                {p.days === 0 ? '¡Hoy!' : `${formatLocalDate(p.nextBD, { day: 'numeric', month: 'short' })} (${p.days}d)`}
              </span>
              {i < upcomingBirthdays.length - 1 && <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: '2px' }}>|</span>}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeTab !== 'salon' && (
          <FilterBar filters={filters} onChange={setFilters} uniqueEps={uniqueEps} searchInputRef={searchInputRef} />
        )}
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{TAB_HELP[activeTab]}</p>
        {activeTab === 'salon' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <LeaderboardTab players={players} />
            <AwardsHall />
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No hay jugadores que coincidan con los filtros actuales.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {activeTab === 'plantilla' && (
              <>
                <Block title="Demografía"><Demografia players={filteredPlayers} /></Block>
                <Block title="Cobertura por posición"><Cobertura players={filteredPlayers} /></Block>
                <Block title="Equipos"><EquiposTab players={filteredPlayers} makgoraTeams={makgoraTeams} /></Block>
              </>
            )}
            {activeTab === 'rendimiento' && (
              <>
                <Block title="Físico"><Fisico players={filteredPlayers} /></Block>
                <Block title="Atributos"><Atributos players={filteredPlayers} allPlayers={players} /></Block>
                <Block title="Salud"><Salud players={filteredPlayers} recordWellness={recordWellness} /></Block>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Estadisticas;
