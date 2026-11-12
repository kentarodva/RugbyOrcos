import React, { useMemo } from 'react';
import { SmallDonut, HorizontalBar, COLORS } from './charts.jsx';
import { getEPSDistribution, getDataCoverage } from '../../services/statsService';

export default function Cobertura({ players }) {
  const epsData = useMemo(() => {
    return getEPSDistribution(players).map((d, i) => ({
      ...d,
      color: d.label === 'Sin EPS' ? '#FF5C4D' : COLORS[i % COLORS.length],
    }));
  }, [players]);

  const hasPhone = players.filter(p => p.contacto?.phone).length;
  const hasContact = players.filter(p => p.emergency_contact_name || p.emergency_contact_phone).length;
  const total = players.length;

  const phoneData = [
    { label: 'Con teléfono', value: hasPhone, color: '#2EE57A' },
    { label: 'Sin teléfono', value: total - hasPhone, color: 'rgba(255,255,255,0.25)' },
  ];
  const emergencyData = [
    { label: 'Con contacto', value: hasContact, color: '#448aff' },
    { label: 'Sin contacto', value: total - hasContact, color: 'rgba(255,255,255,0.25)' },
  ];

  const coberturaData = useMemo(() => {
    return getDataCoverage(players).map(d => ({ ...d, pct: Math.round((d.count / d.total) * 100), color: '#2EE57A' }));
  }, [players]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '14px' }}>
      <HorizontalBar data={epsData} title="Distribución EPS" color="#448aff" height={22} suffix=" jug" />
      <div className="glass-panel" style={{ padding: '12px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Cobertura de Contacto</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px' }}>
          <SmallDonut data={phoneData} centerLabel="tel" />
          <SmallDonut data={emergencyData} centerLabel="con" />
        </div>
      </div>
      <HorizontalBar data={coberturaData} title="Cobertura de Datos" subtitle={`Completitud de campos — ${players.length} jugadores`} color="#2EE57A" height={32} suffix=" jug" />
    </div>
  );
}
