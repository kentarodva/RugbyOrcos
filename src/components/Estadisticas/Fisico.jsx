import React, { useMemo } from 'react';
import { ScatterChart, Scatter, ZAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HorizontalBar, ScatterTooltip, AXIS_TICK, CAT_COLORS } from './charts.jsx';
import { formatTeamCategory } from '../../context/constants';
import {
  getPhysicalAveragesByCategory, getPhysicalByPosition, getIMCByCategory,
  getWeightBuckets, getHeightBuckets, getIMCClassification,
} from '../../services/statsService';

export default function Fisico({ players }) {
  const byCat = useMemo(() => {
    const raw = getPhysicalAveragesByCategory(players);
    return {
      weightData: raw.weightData.map(d => ({ ...d, color: CAT_COLORS[d.label] })),
      heightData: raw.heightData.map(d => ({ ...d, color: CAT_COLORS[d.label] })),
      overallW: raw.overallW, overallH: raw.overallH, nW: raw.nW, nH: raw.nH,
    };
  }, [players]);

  const byPos = useMemo(() => getPhysicalByPosition(players), [players]);

  const imcByCat = useMemo(() => {
    return getIMCByCategory(players).map(d => ({ ...d, color: CAT_COLORS[d.label] }));
  }, [players]);

  const pesoBuckets = useMemo(() => {
    const wColors = ['#448aff', '#2EE57A', '#E8B931', '#ffab40', '#FF5C4D', '#ce93d8'];
    return getWeightBuckets(players).map((d, i) => ({ ...d, color: wColors[i] }));
  }, [players]);

  const nW = players.filter(p => p.weight).length;
  const nH = players.filter(p => p.height).length;
  const nIMC = players.filter(p => p.weight && p.height).length;

  const alturaBuckets = useMemo(() => {
    const hColors = ['#448aff', '#2EE57A', '#E8B931', '#ffab40', '#ce93d8'];
    return getHeightBuckets(players).map((d, i) => ({ ...d, color: hColors[i] }));
  }, [players]);

  const imcOmsBuckets = useMemo(() => {
    const omsColors = ['#FF5C4D', '#2EE57A', '#E8B931', '#FF5C4D'];
    return getIMCClassification(players).map((d, i) => ({ ...d, color: omsColors[i] }));
  }, [players]);

  const scatterData = useMemo(() => {
    return players.filter(p => p.weight && p.height).map(p => ({
      weight: p.weight,
      height: p.height,
      name: p.name,
      categoria: formatTeamCategory(p.teamCategory || 'otros'),
    }));
  }, [players]);

  const scatterByCat = useMemo(() => {
    const groups = {};
    for (const d of scatterData) {
      if (!groups[d.categoria]) groups[d.categoria] = [];
      groups[d.categoria].push(d);
    }
    return groups;
  }, [scatterData]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '14px' }}>
      <HorizontalBar data={byCat.weightData} title="Peso Promedio por Categoría"
        subtitle={`General: ${byCat.overallW}kg (${byCat.nW} jugs)`} color="#448aff" height={36} suffix="kg" />
      <HorizontalBar data={byCat.heightData} title="Altura Promedio por Categoría"
        subtitle={`General: ${byCat.overallH}m (${byCat.nH} jugs)`} color="#2EE57A" height={36} suffix="m" />
      <HorizontalBar data={imcByCat} title="IMC Promedio por Categoría" color="#E8B931" height={36} suffix=" IMC" />
      <HorizontalBar data={imcOmsBuckets} title="Clasificación IMC (OMS)" subtitle={`${nIMC} con ambos datos`} color="#2EE57A" height={32} suffix=" jug" />
      <HorizontalBar data={pesoBuckets} title="Distribución de Peso" subtitle={`${nW} reportaron peso`} color="#FF5C4D" height={32} suffix=" jug" />
      <HorizontalBar data={alturaBuckets} title="Distribución de Altura" subtitle={`${nH} reportaron altura`} color="#2EE57A" height={32} suffix=" jug" />
      {byPos.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Físico por Posición</h4>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Solo posiciones con ≥2 jugadores</div>
          <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left', color: 'var(--text-secondary)' }}>Posición</th>
                <th style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-secondary)' }}>Ø Peso</th>
                <th style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-secondary)' }}>Ø Altura</th>
                <th style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-secondary)' }}>N</th>
              </tr>
            </thead>
            <tbody>
              {byPos.map(r => (
                <tr key={r.label} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '3px 6px', color: 'var(--text-primary)' }}>{r.label}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.weight}kg</td>
                  <td style={{ padding: '3px 6px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.height}m</td>
                  <td style={{ padding: '3px 6px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {Object.keys(scatterByCat).length > 1 && (
        <div className="glass-panel" style={{ padding: '16px', gridColumn: '1 / -1' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Peso vs Altura</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{scatterData.length} jugadores con ambos datos</p>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <XAxis type="number" dataKey="weight" name="Peso" unit="kg" tick={AXIS_TICK} domain={['auto', 'auto']} />
                <YAxis type="number" dataKey="height" name="Altura" unit="m" tick={AXIS_TICK} domain={['auto', 'auto']} />
                <ZAxis type="number" range={[40, 40]} />
                <Tooltip content={ScatterTooltip} />
                {Object.entries(scatterByCat).map(([cat, data]) => (
                  <Scatter key={cat} data={data} fill={CAT_COLORS[cat] || '#888'} name={cat} shape="circle" animationDuration={500} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: '8px', justifyContent: 'center', fontSize: '0.78rem' }}>
            {Object.entries(CAT_COLORS).map(([cat, color]) => {
              const count = scatterByCat[cat]?.length || 0;
              return count > 0 ? (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{cat}:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{count}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
