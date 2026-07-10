import React from 'react';
import { Shield, Circle, HeartPulse, Scale } from 'lucide-react';

function MetricsCards({ totalOrcos, activos, lesionados, suspendidos, inactivos }) {
  return (
    <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Shield size={40} />
        <div>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit' }}>{totalOrcos}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Guerreros Totales</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '3px solid var(--color-primary)' }}>
        <Circle size={40} fill="var(--color-primary)" stroke="none" />
        <div>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'Outfit' }}>{activos}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Listos para Combate</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '3px solid var(--color-red)' }}>
        <HeartPulse size={40} color="var(--color-red)" />
        <div>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-red)', fontFamily: 'Outfit' }}>{lesionados}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Bajas por Lesion</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '3px solid var(--color-yellow)' }}>
        <Scale size={40} color="var(--color-yellow)" />
        <div>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-yellow)', fontFamily: 'Outfit' }}>{suspendidos + inactivos}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Sanciones / Bajas</p>
        </div>
      </div>
    </div>
  );
}

export default MetricsCards;
