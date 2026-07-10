import React from 'react';

function PenaltyCard({ player, onRedeem }) {
  const handleRedeem = (type) => {
    const label = type === 'burpees' ? `${player.penalties.burpees} Burpees` : 'Recoger Conos';
    const ok = window.confirm(`Estas seguro de que ${player.name} ("${player.apodo}") ya pago ${label}? Esta accion no se puede deshacer.`);
    if (ok) onRedeem(player.id, type);
  };

  return (
    <div style={{ padding: '12px', background: 'rgba(255, 61, 0, 0.02)', border: '1px solid rgba(255, 61, 0, 0.15)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
        <strong>{player.name} <span style={{ color: 'var(--color-red)' }}>("{player.apodo}")</span></strong>
        {player.estado === 'suspendido' && <span className="badge badge-suspended" style={{ fontSize: '0.65rem' }}>Suspendido</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {player.penalties.burpees > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
            <span><strong>{player.penalties.burpees} Burpees</strong> pendientes</span>
            <button onClick={() => handleRedeem('burpees')} className="btn-neon" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
              Pagar Burpees
            </button>
          </div>
        )}
        {player.penalties.cones && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
            <span>Penitencia: <strong>Recoger Conos</strong></span>
            <button onClick={() => handleRedeem('cones')} className="btn-outline" style={{ padding: '2px 8px', fontSize: '0.65rem', color: 'var(--color-blue)', borderColor: 'rgba(0,176,255,0.2)' }}>
              Recogido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PenaltyCard;
