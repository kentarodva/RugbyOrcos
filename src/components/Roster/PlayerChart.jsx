import React from 'react';

const STATS_KEYS = [
  { key: 'force', color: '#ff1744', name: 'Fza' },
  { key: 'speed', color: '#2979ff', name: 'Vel' },
  { key: 'stamina', color: '#00e676', name: 'Res' },
  { key: 'technique', color: '#d500f9', name: 'Tec' }
];

function PlayerChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div style={{ padding: '20px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Agrega al menos 2 pruebas fisicas para visualizar el grafico de progreso.
      </div>
    );
  }

  const chartWidth = 460;
  const chartHeight = 150;
  const padding = 20;
  const xStep = (chartWidth - padding * 2) / (history.length - 1);

  const getPoints = (key) => {
    return history.map((h, index) => {
      const x = padding + index * xStep;
      const val = h[key] || 50;
      const y = chartHeight - padding - (val / 100) * (chartHeight - padding * 2);
      return { x, y, value: val };
    });
  };

  const drawPath = (points) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Curva de Progreso Fisico</h4>

      <div style={{ width: '100%', overflowX: 'auto', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', padding: '10px 5px' }}>
        <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
          {[25, 50, 75, 100].map(val => {
            const y = chartHeight - padding - (val / 100) * (chartHeight - padding * 2);
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={chartWidth - padding + 5} y={y + 3} fill="rgba(255,255,255,0.2)" fontSize="7" fontWeight="bold">{val}</text>
              </g>
            );
          })}

          {STATS_KEYS.map(stat => {
            const points = getPoints(stat.key);
            const pathD = drawPath(points);
            return (
              <g key={stat.key}>
                <path d={pathD} fill="none" stroke={stat.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${stat.color}44)` }} />
                {points.map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="4" fill="var(--bg-dark)" stroke={stat.color} strokeWidth="2" />
                    <text x={pt.x} y={pt.y - 8} fill={stat.color} fontSize="8" fontWeight="bold" textAnchor="middle">{pt.value}</text>
                  </g>
                ))}
              </g>
            );
          })}

          {history.map((h, i) => {
            const x = padding + i * xStep;
            const dateStr = h.date.split('-').slice(1).join('/');
            return (
              <text key={i} x={x} y={chartHeight - 4} fill="rgba(255,255,255,0.3)" fontSize="7.5" fontWeight="600" textAnchor="middle">
                {dateStr}
              </text>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '5px' }}>
        {STATS_KEYS.map(st => (
          <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.color }} />
            <span style={{ color: 'var(--color-text-muted)' }}>{st.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerChart;
