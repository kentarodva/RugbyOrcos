import React from 'react';

const FORWARDS_POSITIONS = ['Pilar', 'Talonador', 'Segunda Linea', 'Flanker', 'Octavo'];
const BACKS_POSITIONS = ['Medio Mele', 'Apertura', 'Centro', 'Ala', 'Zaguero'];

function ForwardsBacksBalance({ teamPlayers }) {
  const forwardsCount = teamPlayers.filter(p => FORWARDS_POSITIONS.includes(p.posicion)).length;
  const backsCount = teamPlayers.filter(p => BACKS_POSITIONS.includes(p.posicion)).length;
  const totalPositioned = forwardsCount + backsCount || 1;
  const forwardsPct = totalPositioned > 0 ? Math.round((forwardsCount / totalPositioned) * 100) : 0;
  const backsPct = totalPositioned > 0 ? 100 - forwardsPct : 0;

  return (
    <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>Balance de Plantilla (Delanteros vs Backs)</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Distribucion de posiciones del roster en campo de rugby.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginTop: '10px' }}>
        <span>Delanteros (Forwards): <strong style={{ color: 'var(--color-primary)' }}>{forwardsCount}</strong></span>
        <span>Backs (Tres Cuartos): <strong style={{ color: 'var(--color-gold)' }}>{backsCount}</strong></span>
      </div>

      <div style={{ width: '100%', height: '14px', background: 'var(--bg-dark)', borderRadius: '7px', display: 'flex', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
        <div style={{ width: `${forwardsPct}%`, height: '100%', background: 'var(--color-primary)', boxShadow: '0 0 10px var(--color-primary-glow)', transition: 'width 0.5s' }} />
        <div style={{ width: `${backsPct}%`, height: '100%', background: 'var(--color-gold)', boxShadow: '0 0 10px var(--color-gold-glow)', transition: 'width 0.5s' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <span>{forwardsPct}% Forwards</span>
        <span>{backsPct}% Backs</span>
      </div>
    </div>
  );
}

export default ForwardsBacksBalance;
