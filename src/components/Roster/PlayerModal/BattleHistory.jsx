import React from 'react';
import { Swords, Crown } from 'lucide-react';

function BattleHistory({ player }) {
  const stats = player.matchStats || [];
  const totalTries = stats.reduce((sum, s) => sum + (s.tries || 0), 0);
  const totalConversions = stats.reduce((sum, s) => sum + (s.conversions || 0), 0);
  const totalTackles = stats.reduce((sum, s) => sum + (s.tackles || 0), 0);
  const totalTurnovers = stats.reduce((sum, s) => sum + (s.turnovers || 0), 0);
  const totalMvp = stats.filter(s => s.mvp).length;

  return (
    <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)', marginTop: '10px' }}>
      <div className="pro-section-header" style={{ marginBottom: '12px' }}>
        <div className="pro-section-title" style={{ fontSize: '0.95rem' }}>
          <Swords size={16} color="var(--color-primary)" />
          <span>Historial de Batallas ({stats.length} partidos)</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }} className="tabular-nums">
          <div style={{ background: 'rgba(0, 230, 118, 0.02)', border: '1px solid rgba(0, 230, 118, 0.1)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', display: 'block' }}>ENSAYOS</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{totalTries}</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', display: 'block' }}>CONV.</span>
            <strong style={{ fontSize: '1rem', color: '#fff' }}>{totalConversions}</strong>
          </div>
          <div style={{ background: 'rgba(255, 179, 0, 0.02)', border: '1px solid rgba(255, 179, 0, 0.1)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', display: 'block' }}>PLACAJES</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>{totalTackles}</strong>
          </div>
          <div style={{ background: 'rgba(33, 150, 243, 0.02)', border: '1px solid rgba(33, 150, 243, 0.1)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', display: 'block' }}>TURNOVERS</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-blue)' }}>{totalTurnovers}</strong>
          </div>
          <div style={{ background: 'rgba(255, 234, 0, 0.02)', border: '1px solid rgba(255, 234, 0, 0.1)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', display: 'block' }}>MVP</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>{totalMvp}</strong>
          </div>
        </div>

        {stats.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: '10px 0' }}>
            Aún no se han disputado batallas registradas para este guerrero.
          </p>
        ) : (
          <div className="pro-table-wrap" style={{ maxHeight: '220px', overflowY: 'auto' }}>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Rival</th>
                  <th className="num">Tries</th>
                  <th className="num">Conv.</th>
                  <th className="num">Tackles</th>
                  <th className="num">Recup.</th>
                  <th className="num">MVP</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice().reverse().map((st, idx) => (
                  <tr key={st.id || idx} style={{ fontWeight: st.mvp ? 700 : 400 }}>
                    <td className="tabular-nums" style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>{st.date}</td>
                    <td>{st.opponent}</td>
                    <td className="num" style={{ color: st.tries > 0 ? 'var(--color-primary)' : 'inherit' }}>{st.tries}</td>
                    <td className="num">{st.conversions}</td>
                    <td className="num" style={{ color: st.tackles >= 10 ? 'var(--color-gold)' : 'inherit' }}>{st.tackles}</td>
                    <td className="num">{st.turnovers}</td>
                    <td className="num">{st.mvp ? <Crown size={13} color="var(--color-gold)" style={{ display: 'inline' }} /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BattleHistory;
