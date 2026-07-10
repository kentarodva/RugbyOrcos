import React, { useMemo } from 'react';
import { DonutChart, HorizontalBar, AGE_COLORS, CAT_COLORS, STATUS_COLORS, COLORS } from './charts.jsx';
import {
  getAgeDistribution, getCategoryDistribution, getStatusDistribution,
  getExperienceDistribution, getPositionDistribution, getAgeByPositionMatrix,
} from '../../services/statsService';

export default function Demografia({ players }) {
  const ageBuckets = useMemo(() => {
    return getAgeDistribution(players).map((d, i) => ({ ...d, color: AGE_COLORS[i] }));
  }, [players]);

  const cats = useMemo(() => {
    return getCategoryDistribution(players).map(d => ({ ...d, color: CAT_COLORS[d.label] || '#888' }));
  }, [players]);

  const statuses = useMemo(() => {
    return getStatusDistribution(players).map(d => ({ ...d, color: STATUS_COLORS[d.label] || '#888' }));
  }, [players]);

  const years = useMemo(() => {
    return getExperienceDistribution(players).map(d => ({
      ...d,
      color: COLORS[Math.abs(d.label.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % COLORS.length],
    }));
  }, [players]);

  const posiciones = useMemo(() => {
    return getPositionDistribution(players).map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }));
  }, [players]);

  const edadPosTable = useMemo(() => getAgeByPositionMatrix(players), [players]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
      <div style={{ flex: '1 1 280px', minWidth: 200 }}><DonutChart data={ageBuckets} title="Distribución por Edad" centerLabel="jug" /></div>
      <div style={{ flex: '1 1 280px', minWidth: 200 }}><DonutChart data={cats} title="Distribución por Categoría" centerLabel="jug" /></div>
      <div style={{ flex: '1 1 280px', minWidth: 200 }}><DonutChart data={statuses} title="Estado de Jugadores" centerLabel="jug" /></div>
      <div style={{ flex: '1 1 280px', minWidth: 200 }}><DonutChart data={years} title="Experiencia en el Club" centerLabel="jug" /></div>
      <div style={{ flex: '1 1 280px', minWidth: 200 }}><HorizontalBar data={posiciones} title="Distribución por Posición" color="#ffab40" height={26} suffix=" jug" /></div>
      {edadPosTable.positions.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px', flex: '1 1 100%' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px', fontFamily: 'Outfit' }}>Edad por Posición</h4>
          <div style={{ overflowX: 'auto', fontSize: '0.78rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--text-secondary)' }}>Posición</th>
                  {edadPosTable.keys.map(k => <th key={k} style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>{k}</th>)}
                  <th style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {edadPosTable.positions.map(pos => {
                  const vals = edadPosTable.keys.map(k => edadPosTable.rows[pos][k] || 0);
                  const total = vals.reduce((s, v) => s + v, 0);
                  const maxVal = Math.max(...vals, 1);
                  return (
                    <tr key={pos} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '3px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>{pos}</td>
                      {vals.map((v, i) => (
                        <td key={i} style={{
                          padding: '3px 8px', textAlign: 'center', color: 'var(--text-primary)',
                          background: v > 0 ? `rgba(0,230,118,${((v / maxVal) * 0.35).toFixed(2)})` : 'transparent',
                          borderRadius: '4px', fontWeight: v > 0 ? 600 : 400,
                        }}>{v || '-'}</td>
                      ))}
                      <td style={{ padding: '3px 8px', textAlign: 'center', color: 'var(--color-primary)', fontWeight: 700 }}>{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
