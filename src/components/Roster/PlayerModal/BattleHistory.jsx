import React from 'react';

function BattleHistory({ player }) {
  const stats = player.matchStats || [];
  const totalTries = stats.reduce((sum, s) => sum + (s.tries || 0), 0);
  const totalConversions = stats.reduce((sum, s) => sum + (s.conversions || 0), 0);
  const totalTackles = stats.reduce((sum, s) => sum + (s.tackles || 0), 0);
  const totalTurnovers = stats.reduce((sum, s) => sum + (s.turnovers || 0), 0);
  const totalMvp = stats.filter(s => s.mvp).length;

  return (
    <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)', marginTop: '20px' }}>
      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '15px' }}>
        Historial de Batallas (Estadisticas Tecnicas)
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }}>
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
            Aun no se han disputado batallas registradas para este guerrero.
          </p>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '6px 4px' }}>FECHA</th>
                  <th style={{ padding: '6px 4px' }}>RIVAL</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>Tries</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>Conv.</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>Tackles</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>Recup.</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>MVP</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice().reverse().map(st => (
                  <tr key={st.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: st.mvp ? 700 : 400 }}>
                    <td style={{ padding: '8px 4px', color: 'var(--color-text-muted)' }}>{st.date}</td>
                    <td style={{ padding: '8px 4px' }}>{st.opponent}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: st.tries > 0 ? 'var(--color-primary)' : 'inherit' }}>{st.tries}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>{st.conversions}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: st.tackles >= 10 ? 'var(--color-gold)' : 'inherit' }}>{st.tackles}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>{st.turnovers}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>{st.mvp ? '👑' : '-'}</td>
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
