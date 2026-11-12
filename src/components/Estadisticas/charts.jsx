import React from 'react';
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export const COLORS = ['#2EE57A', '#448aff', '#E8B931', '#FF5C4D', '#ce93d8', '#ffab40', '#18ffff', '#ff4081', '#7DF0AC', '#b388ff'];

export const CAT_COLORS = {
  masculina_mayor: '#2EE57A',
  femenina_mayor: '#ff4081',
  juveniles_masculina: '#448aff',
  juveniles_femenina: '#ce93d8',
  'Masculina Mayor': '#2EE57A',
  'Femenina Mayor': '#ff4081',
  'Juveniles Masculina': '#448aff',
  'Juveniles Femenina': '#ce93d8',
  'Juvenil Masculino': '#448aff',
  'Juvenil Femenino': '#ce93d8',
  'Sin Categoría': '#9e9e9e',
  sin_categoria: '#9e9e9e',
  Otros: '#ffab40',
  otros: '#ffab40',
};

export const STATUS_COLORS = { activo: '#2EE57A', lesionado: '#FF5C4D', suspendido: '#E8B931', inactivo: '#757575' };

export const AGE_COLORS = ['#18ffff', '#448aff', '#2EE57A', '#E8B931', '#ffab40', '#FF5C4D'];

export const TT = { contentStyle: { background: '#212422', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }, labelStyle: { color: '#fff', fontWeight: 600 }, itemStyle: { color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' } };

export const AXIS_TICK = { fill: 'rgba(255,255,255,0.7)', fontSize: 12 };

export const makeBarTooltip = (suffix) => {
  const BarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const pct = d.pct !== undefined ? ` (${d.pct}%)` : '';
    return (
      <div style={{ background: '#212422', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
        <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>{d.label}</div>
        <div style={{ color: '#e0e0e0', fontSize: '0.78rem' }}>{d.value}{suffix}{pct}</div>
      </div>
    );
  };
  BarTooltip.displayName = 'BarTooltip';
  return BarTooltip;
};

export const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#212422', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
      <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>{d.name}</div>
      <div style={{ color: '#e0e0e0', fontSize: '0.78rem' }}>{d.weight}kg · {d.height}m</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>{d.categoria}</div>
    </div>
  );
};
ScatterTooltip.displayName = 'ScatterTooltip';

export function DonutChart({ data, title, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="glass-panel" style={{ padding: '16px' }}>
        {title && <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>{title}</h4>}
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Sin datos</div>
      </div>
    );
  }
  return (
    <div className="glass-panel" style={{ padding: '16px', position: 'relative' }}>
      {title && <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>{title}</h4>}
      <div style={{ position: 'relative', width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}
              animationBegin={0} animationDuration={600} animationEasing="ease-out"
            >
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip {...TT} />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel !== false && (
          <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{total}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '-2px' }}>{centerLabel || 'total'}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: '8px', justifyContent: 'center' }}>
        {data.map((d, i) => d.value > 0 && (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{d.label}:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.value}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>({(d.value / total * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SmallDonut({ data, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>Sin datos</div>;
  }
  return (
    <div style={{ position: 'relative', width: '100%', height: 140 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} nameKey="label" cx="50%" cy="50%" innerRadius={35} outerRadius={52} dataKey="value" paddingAngle={2}
            animationBegin={0} animationDuration={600} animationEasing="ease-out"
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip {...TT} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{total}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '-2px' }}>{centerLabel || 'total'}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: '4px', justifyContent: 'center', fontSize: '0.72rem' }}>
        {data.filter(d => d.value > 0).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{d.label}:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.value}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>({(d.value / total * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBar({ data, title, subtitle, color = '#448aff', height = 40, suffix = '' }) {
  return (
    <div className="glass-panel" style={{ padding: '16px' }}>
      {title && <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>{title}</h4>}
      {subtitle && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{subtitle}</p>}
      <div style={{ width: '100%', height: Math.max(data.length * height + 20, 60) }}>
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }} barCategoryGap={6}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" tick={AXIS_TICK} width={112} />
            <Tooltip content={makeBarTooltip(suffix)} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={height - 8} animationDuration={500} label={{ position: 'right', fill: 'var(--color-text-muted)', fontSize: 12 }}>
              {data.map((d, i) => <Cell key={i} fill={d.color || color} />)}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
