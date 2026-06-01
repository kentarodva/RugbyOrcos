import React, { useMemo } from 'react';
import { DonutChart, HorizontalBar, AGE_COLORS, CAT_COLORS, STATUS_COLORS, COLORS } from './charts.jsx';

export default function Demografia({ players }) {
  const ageBuckets = useMemo(() => {
    const b = { '14-17': 0, '18-22': 0, '23-27': 0, '28-32': 0, '33-40': 0, '40+': 0 };
    for (const p of players) {
      const a = p._meta?.age ?? p.age;
      if (!a) continue;
      if (a < 18) b['14-17']++;
      else if (a < 23) b['18-22']++;
      else if (a < 28) b['23-27']++;
      else if (a < 33) b['28-32']++;
      else if (a < 40) b['33-40']++;
      else b['40+']++;
    }
    return Object.entries(b).map(([label, value], i) => ({ label, value, color: AGE_COLORS[i] }));
  }, [players]);

  const cats = useMemo(() => {
    const m = {};
    for (const p of players) {
      const c = (p.teamCategory || 'sin_categoria').replace('orcos_', '');
      m[c] = (m[c] || 0) + 1;
    }
    return Object.entries(m).map(([label, value]) => ({ label, value, color: CAT_COLORS[label] || '#888' })).sort((a, b) => b.value - a.value);
  }, [players]);

  const statuses = useMemo(() => {
    const m = {};
    for (const p of players) {
      const s = p.estado || 'activo';
      m[s] = (m[s] || 0) + 1;
    }
    return Object.entries(m).map(([label, value]) => ({ label, value, color: STATUS_COLORS[label] || '#888' }));
  }, [players]);

  const years = useMemo(() => {
    const buckets = { '0-1 año': 0, '2-3 años': 0, '4-5 años': 0, '6-10 años': 0, '10+ años': 0 };
    const currentYear = 2026;
    for (const p of players) {
      const sy = p._meta?.startYear;
      if (!sy) continue;
      const exp = currentYear - sy;
      if (exp <= 1) buckets['0-1 año']++;
      else if (exp <= 3) buckets['2-3 años']++;
      else if (exp <= 5) buckets['4-5 años']++;
      else if (exp <= 10) buckets['6-10 años']++;
      else buckets['10+ años']++;
    }
    return Object.entries(buckets).map(([label, value]) => ({ label, value, color: COLORS[Math.abs(label.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % COLORS.length] }));
  }, [players]);

  const posiciones = useMemo(() => {
    const m = {};
    for (const p of players) {
      const pos = p.posicion || 'Sin posición';
      m[pos] = (m[pos] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({
      label, value, color: COLORS[i % COLORS.length],
    }));
  }, [players]);

  const edadPosTable = useMemo(() => {
    const ageKeys = ['14-17', '18-22', '23-27', '28-32', '33-40', '40+'];
    const m = {};
    for (const p of players) {
      const pos = p.posicion || 'Sin posición';
      const a = p._meta?.age ?? p.age;
      if (!a) continue;
      let range;
      if (a < 18) range = '14-17';
      else if (a < 23) range = '18-22';
      else if (a < 28) range = '23-27';
      else if (a < 33) range = '28-32';
      else if (a < 40) range = '33-40';
      else range = '40+';
      if (!m[pos]) m[pos] = {};
      m[pos][range] = (m[pos][range] || 0) + 1;
    }
    const positions = Object.keys(m).sort((a, b) => {
      const sumA = ageKeys.reduce((s, k) => s + (m[a][k] || 0), 0);
      const sumB = ageKeys.reduce((s, k) => s + (m[b][k] || 0), 0);
      return sumB - sumA;
    });
    return { rows: m, keys: ageKeys, positions };
  }, [players]);

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
