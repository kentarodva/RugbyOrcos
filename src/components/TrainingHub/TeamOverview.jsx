import React, { useMemo } from 'react';
import { getTeamOvertrainingRisk } from '../../engine/overtrainingDetector';

function TeamOverview({ teamPlayers, onSelectPlayer }) {
  const risks = useMemo(() => getTeamOvertrainingRisk(teamPlayers), [teamPlayers]);

  const stats = useMemo(() => {
    const active = teamPlayers.filter(p => p.estado === 'activo');
    const injured = teamPlayers.filter(p => p.estado === 'lesionado');
    const highRisk = risks.filter(r => r.maxSeverity === 'alta').length;
    const withPlan = teamPlayers.filter(p => p.workoutLog && p.workoutLog.length > 0).length;
    return { active: active.length, injured: injured.length, highRisk, withPlan, total: teamPlayers.length };
  }, [teamPlayers, risks]);

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stats.active}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>🛡️ Activos</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-red)' }}>{stats.injured}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>🩹 Lesionados</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stats.highRisk > 0 ? 'var(--color-gold)' : 'var(--color-primary)' }}>{stats.highRisk}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>⚠️ Alerta carga</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-blue)' }}>{stats.withPlan}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>📋 Con plan</div>
        </div>
      </div>

      {risks.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>⚠️ Jugadores con alertas</h4>
          {risks.map(r => (
            <div key={r.playerId} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px', borderRadius: 'var(--radius-sm)',
              background: r.maxSeverity === 'alta' ? 'rgba(255, 92, 77,0.06)' : 'rgba(232, 185, 49,0.05)',
              border: `1px solid ${r.maxSeverity === 'alta' ? 'rgba(255, 92, 77,0.2)' : 'rgba(232, 185, 49,0.15)'}`,
              cursor: 'pointer', fontSize: '0.78rem',
            }} onClick={() => onSelectPlayer(r.playerId)}>
              <div>
                <strong>{r.playerName}</strong>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {r.warnings.slice(0, 2).map(w => w.icon + ' ' + w.text.split('—')[0]).join(' | ')}
                </div>
              </div>
              <span style={{
                padding: '2px 8px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 700,
                background: r.maxSeverity === 'alta' ? 'var(--color-red)' : 'var(--color-gold)',
                color: '#000',
              }}>
                {r.maxSeverity === 'alta' ? 'ALTA' : 'MEDIA'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>👥 Todos los guerreros</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '8px' }}>
          {teamPlayers.filter(p => p.estado === 'activo').map(p => (
            <div key={p.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)',
              cursor: 'pointer', fontSize: '0.75rem',
            }} onClick={() => onSelectPlayer(p.id)}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{p.posicion || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeamOverview;
