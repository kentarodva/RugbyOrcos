import React, { useState, useMemo } from 'react';
import { PlayerPhoto } from '../PlayerPhoto';

function FaultBookTab({ teamPlayers, penalizedPlayers, redeemPenalty, onShareBlacklist }) {
  const [search, setSearch] = useState('');
  const [onlyDebtors, setOnlyDebtors] = useState(false);

  const filteredPlayers = useMemo(() => {
    let list = teamPlayers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || (p.apodo || '').toLowerCase().includes(q)
      );
    }
    if (onlyDebtors) {
      list = list.filter(p => p.penalties.burpees > 0 || p.penalties.cones);
    }
    return list;
  }, [teamPlayers, search, onlyDebtors]);

  const totalBurpees = teamPlayers.reduce((sum, p) => sum + (p.penalties.burpees || 0), 0);
  const totalCones = teamPlayers.filter(p => p.penalties.cones).length;
  const totalPenalized = penalizedPlayers.length;

  const handleRedeem = (player, type) => {
    const label = type === 'burpees' ? `${player.penalties.burpees} Burpees` : 'Recoger Conos';
    const ok = window.confirm(`Estas seguro de que ${player.name} ya pago ${label}? Esta accion no se puede deshacer.`);
    if (ok) redeemPenalty(player.id, type);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-red)', background: 'rgba(255, 61, 0, 0.02)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Burpees a Pagar</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-red)', marginTop: '5px' }}>
            {totalBurpees} Burpees
          </h2>
          <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>Faltas, tardanzas e infracciones activas.</p>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-blue)', background: 'rgba(0, 176, 255, 0.02)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Conos a Recoger</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-blue)', marginTop: '5px' }}>
            {totalCones} Orcos
          </h2>
          <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>Tienen deudas pendientes de servicio logistico.</p>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-gold)', background: 'rgba(255, 234, 0, 0.02)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Orco-Multados Activos</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-gold)', marginTop: '5px' }}>
            {totalPenalized} Guerreros
          </h2>
          <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>Sancionados con penitencias fisicas.</p>
        </div>

      </div>

      <div className="glass-panel" style={{ padding: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-red)', margin: 0 }}>
            Reporte de Historial de Faltas e Infracciones
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar guerrero..."
              className="form-input"
              style={{ width: '180px', padding: '6px 10px', fontSize: '0.78rem' }}
            />
            <button
              type="button"
              onClick={() => setOnlyDebtors(v => !v)}
              className={onlyDebtors ? 'btn-neon' : 'btn-outline'}
              style={{ padding: '6px 10px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
            >
              {onlyDebtors ? 'Ver Todos' : 'Solo con Deudas'}
            </button>
            {penalizedPlayers.length > 0 && (
              <button
                onClick={onShareBlacklist}
                className="btn-neon"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  background: 'linear-gradient(135deg, #25d366, #128c7e)',
                  color: '#fff',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.2)',
                  fontWeight: 700
                }}
              >
                Compartir Lista Negra (WhatsApp)
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '10px 5px' }}>Guerrero</th>
                <th style={{ padding: '10px 5px', textAlign: 'center' }}>Llegadas Tarde</th>
                <th style={{ padding: '10px 5px', textAlign: 'center' }}>Faltas Injust.</th>
                <th style={{ padding: '10px 5px', textAlign: 'center' }}>Amarillas</th>
                <th style={{ padding: '10px 5px', textAlign: 'center' }}>Rojas</th>
                <th style={{ padding: '10px 5px', textAlign: 'center' }}>Por Pagar (Burpees)</th>
                <th style={{ padding: '10px 5px', textAlign: 'center' }}>Por Pagar (Servicio)</th>
                <th style={{ padding: '10px 5px', textAlign: 'center' }}>Accion Redentora</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map(p => {
                const totalYellows = (p.matchStats || []).reduce((sum, s) => sum + (s.yellowCards || 0), 0);
                const totalReds = (p.matchStats || []).reduce((sum, s) => sum + (s.redCards || 0), 0);
                const hasPenalties = p.penalties.burpees > 0 || p.penalties.cones;

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: hasPenalties ? 'rgba(255, 61, 0, 0.01)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px 5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PlayerPhoto player={p} size={28} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong>{p.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>#{p.camiseta ?? '—'} "{p.apodo || ''}"</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                      <span style={{ color: p.attendance.late > 0 ? 'var(--color-yellow)' : 'var(--color-text-muted)', fontWeight: 700 }}>
                        {p.attendance.late}
                      </span>
                    </td>
                    <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                      <span style={{ color: p.attendance.absentUnjustified > 0 ? 'var(--color-red)' : 'var(--color-text-muted)', fontWeight: 700 }}>
                        {p.attendance.absentUnjustified}
                      </span>
                    </td>
                    <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                      <span style={{ color: totalYellows > 0 ? 'var(--color-yellow)' : 'var(--color-text-muted)', fontWeight: totalYellows > 0 ? 700 : 400 }}>
                        {totalYellows}
                      </span>
                    </td>
                    <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                      <span style={{ color: totalReds > 0 ? 'var(--color-red)' : 'var(--color-text-muted)', fontWeight: totalReds > 0 ? 700 : 400 }}>
                        {totalReds}
                      </span>
                    </td>
                    <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                      {p.penalties.burpees > 0 ? (
                        <strong style={{ color: 'var(--color-yellow)', fontSize: '0.95rem' }}>
                          {p.penalties.burpees} Burpees
                        </strong>
                      ) : (
                        <span style={{ color: 'var(--color-primary)' }}>Limpio</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                      {p.penalties.cones ? (
                        <span style={{ color: 'var(--color-blue)', fontWeight: 700 }}>
                          Conos (Servicio)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>Ninguno</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                      {hasPenalties ? (
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                           {p.penalties.burpees > 0 && (
                             <button
                               onClick={() => handleRedeem(p, 'burpees')}
                              className="btn-neon"
                              style={{ padding: '3px 8px', fontSize: '0.65rem', textTransform: 'none' }}
                            >
                              Pagar Burpees
                            </button>
                          )}
                           {p.penalties.cones && (
                             <button
                               onClick={() => handleRedeem(p, 'cones')}
                              className="btn-outline"
                              style={{ padding: '3px 8px', fontSize: '0.65rem', color: 'var(--color-blue)', borderColor: 'rgba(0,176,255,0.2)' }}
                            >
                              Recogido
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Sin deudas</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default FaultBookTab;
