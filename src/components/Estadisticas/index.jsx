import React, { useContext, useMemo, useState, useRef, useCallback } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { formatLocalDate, parseLocalDate } from '../../utils/dates.js';
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
import EstadisticasSkeleton from '../Skeletons/EstadisticasSkeleton';

const TABS = [
  { id: 'demografia', label: '📊 Demografía' },
  { id: 'fisico', label: '💪 Físico' },
  { id: 'atributos', label: '⚔️ Atributos' },
  { id: 'salud', label: '🏥 Salud' },
  { id: 'cobertura', label: '📋 Cobertura' },
  { id: 'equipos', label: '🏟️ Equipos' },
];

function Estadisticas() {
  const { players, viewMode, divisionView, makgoraTeamId, makgoraTeams, activeTeam, syncStatus, recordWellness } = useContext(ClubContext);
  const searchInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('demografia');

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
    let p;
    if (viewMode === 'general' && divisionView === 'all') p = players.filter(x => x.teamCategory?.startsWith('orcos'));
    else if (viewMode === 'general') p = players.filter(x => x.teamCategory === `orcos_${divisionView}`);
    else if (viewMode === 'makgora' && makgoraTeamId) {
      p = players.filter(x => x.makgora_team_id === makgoraTeamId);
      if (divisionView !== 'all') p = p.filter(x => x.teamCategory === `orcos_${divisionView}`);
    }
    else p = players.filter(x => x.teamCategory?.startsWith('orcos'));
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
  }, [players, viewMode, divisionView, makgoraTeamId, activeTeam, filters]);

  const activePlayers = useMemo(() => filteredPlayers.filter(p => p.estado !== 'inactivo'), [filteredPlayers]);
  const avg = (arr) => arr.length > 0 ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : '-';
  const ages = filteredPlayers.map(p => p._meta?.age ?? p.age).filter(Boolean);
  const weights = filteredPlayers.map(p => p.weight).filter(Boolean);

  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    return filteredPlayers
      .filter(p => p.birth_date)
      .map(p => {
        const bd = parseLocalDate(p.birth_date);
        const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
        if (next < today) next.setFullYear(next.getFullYear() + 1);
        const days = Math.round((next - today) / (1000 * 60 * 60 * 24));
        const age = (p._meta?.age ?? 0) + (days === 0 ? 0 : 1);
        return { ...p, nextBD: next, days, nextAge: age };
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [filteredPlayers]);

  if (syncStatus === 'idle' || syncStatus === 'syncing') {
    return <EstadisticasSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 className="neon-text-primary" style={{ fontSize: '1.1rem', fontFamily: 'Outfit', margin: 0 }}>📊 Estadísticas del Club</h3>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{filteredPlayers.length} jugadores · {activePlayers.length} activos</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        <KPI value={filteredPlayers.length} label="Jugadores en vista" icon="👥" color="#00e676" />
        <KPI value={activePlayers.length} label="Guerreros activos" icon="⚔️" color="#00e676" sub={filteredPlayers.length > 0 ? `${(activePlayers.length / filteredPlayers.length * 100).toFixed(0)}% del total` : ''} />
        <KPI value={`${avg(ages)}`} label="Edad promedio" icon="🎂" color="#ffd740" sub={`${ages.length} reportaron edad`} />
        <KPI value={`${avg(weights)}kg`} label="Peso promedio" icon="🏋️" color="#448aff" sub={`${weights.length} reportaron peso`} />
      </div>
      {upcomingBirthdays.length > 0 && (
        <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.2rem' }}>🎂</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Próximos cumpleaños</span>
          {upcomingBirthdays.map((p, i) => (
            <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: p.days === 0 ? '#ffd740' : 'var(--text-primary)' }}>
              <span style={{ fontWeight: p.days === 0 ? 800 : 600 }}>{p.name}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                {p.days === 0 ? '🎉 ¡Hoy!' : `${formatLocalDate(p.nextBD, { day: 'numeric', month: 'short' })} (${p.days}d)`}
              </span>
              {i < upcomingBirthdays.length - 1 && <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: '2px' }}>|</span>}
            </span>
          ))}
        </div>
      )}
      <div className="glass-panel" style={{ padding: '14px 18px' }}>
        <FilterBar filters={filters} onChange={setFilters} uniqueEps={uniqueEps} searchInputRef={searchInputRef} />
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        {filteredPlayers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No hay jugadores que coincidan con los filtros actuales.</div>
        ) : (
          <>
            {activeTab === 'demografia' && <Demografia players={filteredPlayers} />}
            {activeTab === 'fisico' && <Fisico players={filteredPlayers} />}
            {activeTab === 'atributos' && <Atributos players={filteredPlayers} allPlayers={players} />}
            {activeTab === 'salud' && <Salud players={filteredPlayers} recordWellness={recordWellness} />}
            {activeTab === 'cobertura' && <Cobertura players={filteredPlayers} />}
            {activeTab === 'equipos' && <EquiposTab players={filteredPlayers} makgoraTeams={makgoraTeams} />}
          </>
        )}
      </div>
    </div>
  );
}

export default Estadisticas;
