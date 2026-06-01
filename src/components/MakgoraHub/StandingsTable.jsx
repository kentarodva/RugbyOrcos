import React from 'react';
import { STYLE } from './constants';

export function StandingsTable({ standings }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
      <h4 style={{ color: 'var(--color-gold)', marginBottom: '15px', fontFamily: 'Outfit' }}>Tabla de Posiciones</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
            <th style={STYLE.th}>#</th><th style={STYLE.th}>Equipo</th><th style={STYLE.th}>PJ</th><th style={STYLE.th}>PG</th><th style={STYLE.th}>PE</th><th style={STYLE.th}>PP</th><th style={STYLE.th}>PF</th><th style={STYLE.th}>PC</th><th style={STYLE.th}>Dif</th><th style={STYLE.th}>BP</th><th style={STYLE.th}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i === 0 ? 'rgba(255,179,0,0.05)' : undefined }}>
              <td style={STYLE.td}>{i + 1}</td>
              <td style={{...STYLE.td, fontWeight: 700}}>{s.makgora_teams?.rpg_name || s.makgora_teams?.name || '�'}</td>
              <td style={STYLE.td}>{s.played}</td><td style={STYLE.td}>{s.won}</td><td style={STYLE.td}>{s.drawn}</td><td style={STYLE.td}>{s.lost}</td>
              <td style={STYLE.td}>{s.points_for}</td><td style={STYLE.td}>{s.points_against}</td><td style={STYLE.td}>{s.point_diff}</td>
              <td style={STYLE.td}>{s.bonus_points}</td><td style={{...STYLE.td, fontWeight: 800, color: 'var(--color-gold)'}}>{s.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
