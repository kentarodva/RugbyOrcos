import React from 'react';
import { STYLE } from './constants';

const TREND_UP = '↑';
const TREND_DOWN = '↓';
const TREND_SAME = '→';

export function StandingsTable({ standings }) {
  const prevPositions = {};
  const displayStandings = standings.map((s, i) => {
    const prev = prevPositions[s.team_id];
    const trend = prev === undefined ? TREND_SAME : prev === i ? TREND_SAME : prev > i ? TREND_UP : TREND_DOWN;
    prevPositions[s.team_id] = i;
    return { ...s, trend, currentPos: i + 1 };
  });

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
      <h4 style={{ color: 'var(--color-gold)', marginBottom: '15px', fontFamily: 'Outfit' }}>Tabla de Posiciones</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
            <th style={STYLE.th}>#</th><th style={STYLE.th}>Equipo</th><th style={STYLE.th}>PJ</th><th style={STYLE.th}>PG</th><th style={STYLE.th}>PE</th><th style={STYLE.th}>PP</th><th style={STYLE.th}>PF</th><th style={STYLE.th}>PC</th><th style={STYLE.th}>Dif</th><th style={STYLE.th}>BP</th><th style={STYLE.th}>Pts</th><th style={STYLE.th}></th>
          </tr>
        </thead>
        <tbody>
          {displayStandings.map((s, i) => {
            return (
              <tr key={s.id} style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: i === 0 ? 'rgba(255,179,0,0.05)' : undefined,
                transition: 'background 0.3s ease',
              }}>
                <td style={STYLE.td}>{s.currentPos}</td>
                <td style={{...STYLE.td, fontWeight: 700}}>
                  {s.makgora_teams?.rpg_name || s.makgora_teams?.name || '—'}
                  {s.makgora_teams?.is_external && <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,179,0,0.15)', color: '#ffb300', marginLeft: '6px', verticalAlign: 'middle' }}>Invitado</span>}
                </td>
                <td style={STYLE.td}>{s.played}</td><td style={STYLE.td}>{s.won}</td><td style={STYLE.td}>{s.drawn}</td><td style={STYLE.td}>{s.lost}</td>
                <td style={STYLE.td}>{s.points_for}</td><td style={STYLE.td}>{s.points_against}</td><td style={STYLE.td}>{s.point_diff}</td>
                <td style={STYLE.td}>{s.bonus_points}</td><td style={{...STYLE.td, fontWeight: 800, color: 'var(--color-gold)'}}>{s.total_points}</td>
                <td style={{...STYLE.td, fontSize: '0.9rem', color: s.trend === TREND_UP ? '#00e676' : s.trend === TREND_DOWN ? '#ff3d00' : 'var(--color-text-muted)'}}>{s.trend}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
