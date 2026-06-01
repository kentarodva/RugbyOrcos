import React from 'react';

function RadarChart({ teamPlayers }) {
  if (teamPlayers.length === 0) return null;
  const avg = (attr) => Math.round(teamPlayers.reduce((s, p) => s + (p.attributes?.[attr] || 50), 0) / teamPlayers.length);
  const vals = { force: avg('force'), speed: avg('speed'), stamina: avg('stamina'), technique: avg('technique') };
  const cx = 140, cy = 140, r = 110;
  const axes = [
    { id: 'force', label: 'Fuerza', angle: -Math.PI / 2, color: '#ff3d00' },
    { id: 'speed', label: 'Velocidad', angle: 0, color: '#00b0ff' },
    { id: 'stamina', label: 'Resistencia', angle: Math.PI / 2, color: '#00e676' },
    { id: 'technique', label: 'Tecnica', angle: Math.PI, color: '#9c27b0' },
  ];
  const getPoint = (id) => {
    const ax = axes.find(a => a.id === id);
    const dist = (vals[id] / 100) * r;
    return [cx + Math.cos(ax.angle) * dist, cy + Math.sin(ax.angle) * dist];
  };
  const pointsStr = axes.map(a => getPoint(a.id).join(',')).join(' ');
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-primary)' }}>
        Atributos Promedio del Clan ({teamPlayers.length} guerreros)
      </h3>
      <svg viewBox="0 0 280 280" style={{ width: '100%', maxWidth: '300px' }}>
        {[0.25, 0.5, 0.75, 1].map(s => (
          <circle key={s} cx={cx} cy={cy} r={r * s} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {axes.map(a => (
          <line key={a.id} x1={cx} y1={cy} x2={cx + Math.cos(a.angle) * r} y2={cy + Math.sin(a.angle) * r}
            stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}
        <polygon points={pointsStr} fill="rgba(0,230,118,0.15)" stroke="var(--color-primary)" strokeWidth="2" />
        {axes.map(a => {
          const [x, y] = getPoint(a.id);
          return <circle key={a.id} cx={x} cy={y} r="4" fill={a.color} stroke="#fff" strokeWidth="1" />;
        })}
        {axes.map(a => (
          <text key={a.id + '_lbl'} x={cx + Math.cos(a.angle) * (r + 22)} y={cy + Math.sin(a.angle) * (r + 22)}
            textAnchor="middle" dominantBaseline="middle" fill={a.color} fontSize="11" fontWeight="700" fontFamily="Outfit">
            {a.label} {vals[a.id]}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default RadarChart;
