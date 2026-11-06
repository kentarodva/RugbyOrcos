import React, { useMemo, useState } from 'react';

const POSITION_NAMES = {
  1: 'Pilar Izq', 2: 'Talonador', 3: 'Pilar Der',
  4: '2ª Línea', 5: '2ª Línea', 6: 'Ala', 7: 'Ala',
  8: 'N8', 9: 'Medio Melé', 10: 'Apertura',
  11: 'Wing Izq', 12: 'Centro Int', 13: 'Centro Ext',
  14: 'Wing Der', 15: 'Zaguero',
};

const AVAIL = {
  going: { label: 'Confirmado', color: 'var(--color-primary)' },
  maybe: { label: 'En duda', color: 'var(--color-gold)' },
  not_going: { label: 'No va', color: 'var(--color-red)' },
};

/** Lower is better: who the coach most likely wants for this slot. */
function rank(p, slotPosId, availability) {
  const unavailable = p.estado === 'lesionado' || p.estado === 'suspendido';
  if (unavailable) return 100;
  let r = 50;
  if (p.position_id && p.position_id === slotPosId) r -= 30;
  else if (p.position_id && ((slotPosId <= 8) === (p.position_id <= 8))) r -= 10;
  if (availability === 'going') r -= 15;
  if (availability === 'maybe') r -= 5;
  if (availability === 'not_going') r += 30;
  return r;
}

function PlayerSelectModal({ selectedSlot, teamPlayers, isPlayerAligned, lineup = {}, availabilities = {}, onAssign, onClose }) {
  const slotPosId = selectedSlot?.id;
  const slotPositionName = POSITION_NAMES[slotPosId] || '';
  const [query, setQuery] = useState('');
  const currentId = lineup[slotPosId];

  const slotOf = useMemo(() => {
    const map = {};
    Object.entries(lineup).forEach(([slot, pid]) => { map[pid] = slot; });
    return map;
  }, [lineup]);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teamPlayers
      .filter(p => !q || p.name?.toLowerCase().includes(q) || p.apodo?.toLowerCase().includes(q))
      .map(p => ({ p, r: rank(p, slotPosId, availabilities[p.id]) }))
      .sort((a, b) => a.r - b.r || a.p.name.localeCompare(b.p.name))
      .map(x => x.p);
  }, [teamPlayers, query, slotPosId, availabilities]);

  return (
    <div className="modal-overlay pz-sheet-overlay" onClick={onClose}>
      <div className="modal-content pz-sheet" role="dialog" aria-label={`Elegir jugador para ${selectedSlot.name}`}
        onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <span className="page-eyebrow">Posición {selectedSlot.id}</span>
            <h3 className="section-title" style={{ fontSize: '1.125rem', marginTop: '2px' }}>{slotPositionName || selectedSlot.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-outline btn-sm">Cerrar</button>
        </header>

        <input type="search" className="form-input" placeholder="Buscar jugador" value={query}
          onChange={e => setQuery(e.target.value)} aria-label="Buscar jugador" />

        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0, flex: 1, margin: '0 -4px' }}>
          {sorted.map(p => {
            const isUnavailable = p.estado === 'lesionado' || p.estado === 'suspendido';
            const isCurrent = p.id === currentId;
            const otherSlot = !isCurrent && isPlayerAligned(p.id) ? slotOf[p.id] : null;
            const isNaturalFit = p.position_id && p.position_id === slotPosId;
            const avail = AVAIL[availabilities[p.id]];

            return (
              <button
                type="button"
                key={p.id}
                onClick={() => !isUnavailable && !isCurrent && onAssign(p.id)}
                disabled={isUnavailable}
                aria-current={isCurrent ? 'true' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left',
                  minHeight: '52px', padding: '8px 8px', borderRadius: 'var(--radius-md)',
                  background: isCurrent ? 'var(--bg-elevated)' : 'transparent',
                  border: 'none', color: 'var(--color-text)', font: 'inherit',
                  opacity: isUnavailable ? 0.45 : 1,
                  cursor: isUnavailable ? 'not-allowed' : 'pointer',
                }}
              >
                <span aria-hidden="true" style={{
                  width: 8, height: 8, borderRadius: 99, flexShrink: 0,
                  background: avail ? avail.color : 'var(--border-strong)',
                }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.apodo || p.name}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {[
                      p.position_id ? (POSITION_NAMES[p.position_id] || `#${p.position_id}`) : (p.posicion || null),
                      isUnavailable ? (p.estado === 'lesionado' ? 'Lesionado' : 'Suspendido') : avail?.label,
                    ].filter(Boolean).join(' · ') || 'Sin posición'}
                  </span>
                </span>
                {isCurrent && <span className="badge">Aquí</span>}
                {otherSlot && <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-soft)', flexShrink: 0 }}>Cambiar con {otherSlot}</span>}
                {!isCurrent && !otherSlot && isNaturalFit && !isUnavailable && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', flexShrink: 0 }}>Su puesto</span>
                )}
              </button>
            );
          })}
          {sorted.length === 0 && (
            <p style={{ padding: '16px 8px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Nadie coincide con “{query}”.</p>
          )}
        </div>

        {currentId != null && (
          <button type="button" onClick={() => onAssign(null)} className="btn-outline" style={{ color: 'var(--color-red)', justifyContent: 'center' }}>
            Dejar libre esta posición
          </button>
        )}
      </div>
    </div>
  );
}

export default PlayerSelectModal;
