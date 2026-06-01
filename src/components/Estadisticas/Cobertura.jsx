import React, { useMemo } from 'react';
import { SmallDonut, HorizontalBar, COLORS } from './charts.jsx';
import { normalizeEPS } from '../../utils/csvImport';

export default function Cobertura({ players }) {
  const epsData = useMemo(() => {
    const m = {};
    for (const p of players) {
      const eps = normalizeEPS(p.health_insurance) || 'Sin EPS';
      m[eps] = (m[eps] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({
      label, value,
      color: label === 'Sin EPS' ? '#ff5252' : COLORS[Math.abs(label.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % COLORS.length],
    }));
  }, [players]);

  const hasPhone = players.filter(p => p.contacto?.phone).length;
  const hasContact = players.filter(p => p.emergency_contact_name || p.emergency_contact_phone).length;
  const total = players.length;

  const phoneData = [
    { label: 'Con teléfono', value: hasPhone, color: '#00e676' },
    { label: 'Sin teléfono', value: total - hasPhone, color: 'rgba(255,255,255,0.25)' },
  ];
  const emergencyData = [
    { label: 'Con contacto', value: hasContact, color: '#448aff' },
    { label: 'Sin contacto', value: total - hasContact, color: 'rgba(255,255,255,0.25)' },
  ];

  const coberturaData = useMemo(() => {
    const t = players.length;
    const fields = [
      { label: 'Teléfono', check: p => !!p.contacto?.phone },
      { label: 'Contacto emergencia', check: p => !!p.emergency_contact_name || !!p.emergency_contact_phone },
      { label: 'Peso', check: p => !!p.weight },
      { label: 'Altura', check: p => !!p.height },
      { label: 'EPS', check: p => !!p.health_insurance },
    ];
    return fields.map(f => {
      const count = players.filter(f.check).length;
      return { label: f.label, value: count, pct: Math.round((count / t) * 100), total: t, color: '#00e676' };
    });
  }, [players]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
      <HorizontalBar data={epsData} title="Distribución EPS" color="#448aff" height={22} suffix=" jug" />
      <div className="glass-panel" style={{ padding: '12px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px', fontFamily: 'Outfit' }}>Cobertura de Contacto</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <SmallDonut data={phoneData} centerLabel="tel" />
          <SmallDonut data={emergencyData} centerLabel="con" />
        </div>
      </div>
      <HorizontalBar data={coberturaData} title="Cobertura de Datos" subtitle={`Completitud de campos — ${players.length} jugadores`} color="#00e676" height={32} suffix=" jug" />
    </div>
  );
}
