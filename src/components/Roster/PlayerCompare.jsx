import React, { useState, useMemo } from 'react';

function PlayerCompare({ players, onClose }) {
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');

  const playerA = players.find(p => p.id === selectedA);
  const playerB = players.find(p => p.id === selectedB);

  const attrKeys = [
    { key: 'force', label: 'Fuerza', color: 'var(--color-red)' },
    { key: 'speed', label: 'Velocidad', color: 'var(--color-blue)' },
    { key: 'stamina', label: 'Resistencia', color: 'var(--color-primary)' },
    { key: 'technique', label: 'Técnica', color: 'var(--color-gold)' },
  ];

  const gymKeys = [
    { key: 'squat', label: 'Sentadilla', suffix: 'kg' },
    { key: 'bench', label: 'Banca', suffix: 'kg' },
    { key: 'deadlift', label: 'Peso Muerto', suffix: 'kg' },
  ];

  const statKeys = [
    { key: 'tries', label: 'Tries' },
    { key: 'tackles', label: 'Tackles' },
    { key: 'conversions', label: 'Conversiones' },
    { key: 'mvp', label: 'MVP' },
  ];

  const getStats = (player, statKey) => {
    if (!player?.matchStats) return 0;
    return player.matchStats.reduce((s, m) => s + (m[statKey] || 0), 0);
  };

  const bars = useMemo(() => {
    if (!playerA || !playerB) return [];
    return attrKeys.map(attr => {
      const aVal = playerA.attributes?.[attr.key] || 50;
      const bVal = playerB.attributes?.[attr.key] || 50;
      const max = Math.max(aVal, bVal, 100);
      return { ...attr, aVal, bVal, max };
    });
  }, [playerA, playerB]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content glass-panel animated-slide"
        style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1.2rem' }}>⚔️ Comparar Jugadores</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.72rem' }}>Jugador A</label>
            <select value={selectedA} onChange={(e) => setSelectedA(e.target.value)} className="form-select" style={{ fontSize: '0.78rem' }}>
              <option value="">Seleccionar...</option>
              {players.filter(p => p.id !== selectedB).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.72rem' }}>Jugador B</label>
            <select value={selectedB} onChange={(e) => setSelectedB(e.target.value)} className="form-select" style={{ fontSize: '0.78rem' }}>
              <option value="">Seleccionar...</option>
              {players.filter(p => p.id !== selectedA).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {playerA && playerB && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
              {[playerA, playerB].map((p, i) => (
                <div key={i} style={{
                  padding: '12px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{p.posicion || '—'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {p.attendance?.present || 0}/{p.attendance?.total || 0} asistencias
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>📊 Atributos RPG</h4>
              {bars.map(bar => (
                <div key={bar.key} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '3px' }}>
                    <span style={{ color: bar.color }}>{bar.label}</span>
                    <span>{bar.aVal} vs {bar.bVal}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative' }}>
                      <div style={{ height: '100%', width: `${(bar.aVal / bar.max) * 100}%`, background: bar.color, borderRadius: '4px', opacity: 0.8 }} />
                    </div>
                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative' }}>
                      <div style={{ height: '100%', width: `${(bar.bVal / bar.max) * 100}%`, background: bar.color, borderRadius: '4px', opacity: 0.8 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>🏋️ Gimnasio</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px', fontSize: '0.72rem' }}>
                {gymKeys.map(g => (
                  <React.Fragment key={g.key}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{g.label}</span>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{ color: (playerA.gymStats?.[g.key] || 0) >= (playerB.gymStats?.[g.key] || 0) ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                        {playerA.gymStats?.[g.key] || 0}{g.suffix}
                      </span>
                      {' vs '}
                      <span style={{ color: (playerB.gymStats?.[g.key] || 0) >= (playerA.gymStats?.[g.key] || 0) ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                        {playerB.gymStats?.[g.key] || 0}{g.suffix}
                      </span>
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>⚡ Estadísticas de Partido</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px', fontSize: '0.72rem' }}>
                {statKeys.map(s => (
                  <React.Fragment key={s.key}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{ color: getStats(playerA, s.key) >= getStats(playerB, s.key) ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                        {getStats(playerA, s.key)}
                      </span>
                      {' vs '}
                      <span style={{ color: getStats(playerB, s.key) >= getStats(playerA, s.key) ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                        {getStats(playerB, s.key)}
                      </span>
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {!playerA || !playerB ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
            Selecciona dos jugadores para comparar sus atributos, estadísticas y rendimiento.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PlayerCompare;
