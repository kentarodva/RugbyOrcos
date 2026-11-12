import React, { useMemo } from 'react';
import { HorizontalBar } from './charts.jsx';
import AttendanceTimeline from '../Dashboard/AttendanceTimeline';
import InjuryReport from '../Dashboard/InjuryReport';
import WellnessForm from '../Dashboard/WellnessForm';
import { getHealthSummary, getFracturesByCategory } from '../../services/statsService';

export default function Salud({ players, recordWellness }) {
  const stats = useMemo(() => getHealthSummary(players), [players]);

  const byCat = useMemo(() => {
    return getFracturesByCategory(players).map(d => ({ ...d, color: '#FF5C4D' }));
  }, [players]);

  const detailPlayers = useMemo(() =>
    players.filter(p => p.allergies || p.medical_conditions || p.fracture_details).slice(0, 20),
  [players]);

  const fractByPos = useMemo(() => {
    const m = {};
    for (const p of players) {
      const pos = p.posicion || 'Sin posición';
      if (!m[pos]) m[pos] = { total: 0, fractures: 0 };
      m[pos].total++;
      if (p.had_fractures) m[pos].fractures++;
    }
    return Object.entries(m)
      .filter(([, d]) => d.total > 0)
      .map(([label, d]) => ({ label, value: d.fractures, pct: Math.round((d.fractures / d.total) * 100), total: d.total, color: '#FF5C4D' }));
  }, [players]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '14px' }}>
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>Resumen de Salud</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '8px' }}>
          <div style={{ background: 'rgba(255, 92, 77,0.12)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FF5C4D' }}>{stats.withF}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fracturas</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{stats.total > 0 ? (stats.withF / stats.total * 100).toFixed(0) : 0}%</div>
          </div>
          <div style={{ background: 'rgba(255,193,7,0.12)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#E8B931' }}>{stats.withA}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Alergias</div>
          </div>
          <div style={{ background: 'rgba(206,147,216,0.12)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ce93d8' }}>{stats.withC}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Enfermedades</div>
          </div>
        </div>
      </div>
      <HorizontalBar data={byCat} title="Fracturas por Categoría" subtitle={`${stats.withF} de ${stats.total} jugadores han tenido fracturas`} color="#FF5C4D" height={28} suffix=" fracturas" />
      <HorizontalBar data={fractByPos} title="Fracturas por Posición" color="#FF5C4D" height={26} suffix=" fracturas" />
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>Detalles</h4>
        {detailPlayers.length > 0 ? detailPlayers.map(p => (
          <div key={p.id} style={{ fontSize: '0.78rem', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.name}</span>
            {p.fracture_details && <span style={{ color: '#FF5C4D', marginLeft: '6px' }}>⚡ {p.fracture_details}</span>}
            {p.allergies && <span style={{ color: '#E8B931', marginLeft: '6px' }}>🤧 {p.allergies}</span>}
            {p.medical_conditions && <span style={{ color: '#ce93d8', marginLeft: '6px' }}>💊 {p.medical_conditions}</span>}
          </div>
        )) : <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sin registros de salud</p>}
      </div>
      <AttendanceTimeline teamPlayers={players} />
      <InjuryReport teamPlayers={players} />
      {recordWellness && <WellnessForm teamPlayers={players} recordWellness={recordWellness} />}
    </div>
  );
}
