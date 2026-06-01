import React, { useMemo } from 'react';
import { ScatterChart, Scatter, ZAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HorizontalBar, ScatterTooltip, AXIS_TICK, CAT_COLORS } from './charts.jsx';

export default function Fisico({ players }) {
  const byCat = useMemo(() => {
    const m = {};
    for (const p of players) {
      const c = (p.teamCategory || 'otros').replace('orcos_', '');
      if (!m[c]) m[c] = { weights: [], heights: [] };
      if (p.weight) m[c].weights.push(p.weight);
      if (p.height) m[c].heights.push(p.height);
    }
    const avg = arr => arr.length > 0 ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1)) : 0;
    const allW = players.map(p => p.weight).filter(Boolean);
    const allH = players.map(p => p.height).filter(Boolean);
    return {
      weightData: Object.entries(m).map(([label, d]) => ({ label, value: avg(d.weights), color: CAT_COLORS[label] })).filter(d => d.value > 0),
      heightData: Object.entries(m).map(([label, d]) => ({ label, value: avg(d.heights), color: CAT_COLORS[label] })).filter(d => d.value > 0),
      overallW: avg(allW), overallH: avg(allH), nW: allW.length, nH: allH.length,
    };
  }, [players]);

  const byPos = useMemo(() => {
    const m = {};
    for (const p of players) {
      const pos = p.posicion || 'Sin posición';
      if (!m[pos]) m[pos] = { weights: [], heights: [], count: 0 };
      if (p.weight) m[pos].weights.push(p.weight);
      if (p.height) m[pos].heights.push(p.height);
      m[pos].count++;
    }
    const avg = arr => arr.length > 0 ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1)) : '-';
    return Object.entries(m)
      .map(([label, d]) => ({ label, weight: avg(d.weights), height: avg(d.heights), n: d.count }))
      .filter(d => d.n >= 2)
      .sort((a, b) => b.n - a.n);
  }, [players]);

  const imcByCat = useMemo(() => {
    const m = {};
    for (const p of players) {
      if (!p.weight || !p.height) continue;
      const c = (p.teamCategory || 'otros').replace('orcos_', '');
      const bmi = p.weight / (p.height * p.height);
      if (!m[c]) m[c] = [];
      m[c].push(bmi);
    }
    const avg = arr => arr.length > 0 ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1)) : 0;
    return Object.entries(m).map(([label, d]) => ({ label, value: avg(d), color: CAT_COLORS[label] })).filter(d => d.value > 0);
  }, [players]);

  const pesoBuckets = useMemo(() => {
    const b = { '<60kg': 0, '60-70kg': 0, '70-80kg': 0, '80-90kg': 0, '90-100kg': 0, '100+kg': 0 };
    for (const p of players) {
      const w = p.weight;
      if (!w) continue;
      if (w < 60) b['<60kg']++;
      else if (w < 70) b['60-70kg']++;
      else if (w < 80) b['70-80kg']++;
      else if (w < 90) b['80-90kg']++;
      else if (w < 100) b['90-100kg']++;
      else b['100+kg']++;
    }
    const wColors = ['#448aff', '#00e676', '#ffd740', '#ffab40', '#ff5252', '#ce93d8'];
    return Object.entries(b).map(([label, value], i) => ({ label, value, color: wColors[i] }));
  }, [players]);

  const nW = players.filter(p => p.weight).length;
  const nH = players.filter(p => p.height).length;
  const nIMC = players.filter(p => p.weight && p.height).length;

  const alturaBuckets = useMemo(() => {
    const b = { '<1.60m': 0, '1.60-1.70m': 0, '1.70-1.80m': 0, '1.80-1.90m': 0, '1.90+m': 0 };
    for (const p of players) {
      const h = p.height;
      if (!h) continue;
      if (h < 1.6) b['<1.60m']++;
      else if (h < 1.7) b['1.60-1.70m']++;
      else if (h < 1.8) b['1.70-1.80m']++;
      else if (h < 1.9) b['1.80-1.90m']++;
      else b['1.90+m']++;
    }
    const hColors = ['#448aff', '#00e676', '#ffd740', '#ffab40', '#ce93d8'];
    return Object.entries(b).map(([label, value], i) => ({ label, value, color: hColors[i] }));
  }, [players]);

  const imcOmsBuckets = useMemo(() => {
    const b = { 'Bajo peso (<18.5)': 0, Normal: 0, Sobrepeso: 0, Obesidad: 0 };
    for (const p of players) {
      if (!p.weight || !p.height) continue;
      const bmi = p.weight / (p.height * p.height);
      if (bmi < 18.5) b['Bajo peso (<18.5)']++;
      else if (bmi < 25) b.Normal++;
      else if (bmi < 30) b.Sobrepeso++;
      else b.Obesidad++;
    }
    const total = Object.values(b).reduce((s, v) => s + v, 0);
    const omsColors = ['#ff5252', '#00e676', '#ffd740', '#ff5252'];
    return Object.entries(b).map(([label, value], i) => ({ label, value, pct: total > 0 ? Math.round((value / total) * 100) : 0, total, color: omsColors[i] }));
  }, [players]);

  const scatterData = useMemo(() => {
    return players.filter(p => p.weight && p.height).map(p => ({
      weight: p.weight,
      height: p.height,
      name: p.name,
      categoria: (p.teamCategory || '').replace('orcos_', '') || 'otros',
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
      <HorizontalBar data={byCat.weightData} title="Peso Promedio por Categoría"
        subtitle={`General: ${byCat.overallW}kg (${byCat.nW} jugs)`} color="#448aff" height={36} suffix="kg" />
      <HorizontalBar data={byCat.heightData} title="Altura Promedio por Categoría"
        subtitle={`General: ${byCat.overallH}m (${byCat.nH} jugs)`} color="#00e676" height={36} suffix="m" />
      <HorizontalBar data={imcByCat} title="IMC Promedio por Categoría" color="#ffd740" height={36} suffix=" IMC" />
      <HorizontalBar data={imcOmsBuckets} title="Clasificación IMC (OMS)" subtitle={`${nIMC} con ambos datos`} color="#00e676" height={32} suffix=" jug" />
      <HorizontalBar data={pesoBuckets} title="Distribución de Peso" subtitle={`${nW} reportaron peso`} color="#ff5252" height={32} suffix=" jug" />
      <HorizontalBar data={alturaBuckets} title="Distribución de Altura" subtitle={`${nH} reportaron altura`} color="#00e676" height={32} suffix=" jug" />
      {byPos.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px', fontFamily: 'Outfit' }}>Físico por Posición</h4>
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
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px', fontFamily: 'Outfit' }}>Peso vs Altura</h4>
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
