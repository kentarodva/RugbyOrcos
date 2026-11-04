import React from 'react';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

const POSITION_NAMES = {
  1: 'Pilar Izq', 2: 'Talonador', 3: 'Pilar Der',
  4: '2ª Línea', 5: '2ª Línea', 6: 'Ala', 7: 'Ala',
  8: 'N8', 9: 'Medio Melé', 10: 'Apertura',
  11: 'Wing Izq', 12: 'Centro Int', 13: 'Centro Ext',
  14: 'Wing Der', 15: 'Zaguero',
};

function PlayerSelectModal({ selectedSlot, teamPlayers, isPlayerAligned, availabilities = {}, onAssign, onClose }) {
  const slotPosId = selectedSlot?.id;
  const slotPositionName = POSITION_NAMES[slotPosId] || '';

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '480px' }}>

        <h3 className="neon-text-primary" style={{ marginBottom: '12px', fontFamily: 'Outfit' }}>
          Alinear en Posición #{selectedSlot.id}
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
          Selecciona el jugador para ocupar el rol de <strong>{selectedSlot.name}</strong>.
          {slotPositionName && <span style={{ marginLeft: '8px', color: 'var(--color-gold)', fontWeight: 700 }}>({slotPositionName})</span>}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '5px' }}>

          <button
            onClick={() => onAssign(null)}
            className="btn-outline"
            style={{ justifyContent: 'center', borderColor: 'var(--color-red)', color: 'var(--color-red)' }}
          >
            Vaciar / Dejar Libre Posición
          </button>

          {teamPlayers.map(p => {
            const isUnavailable = p.estado === 'lesionado' || p.estado === 'suspendido';
            const alreadyAligned = isPlayerAligned(p.id);
            const playerPosId = p.position_id;
            const isNaturalFit = playerPosId && playerPosId === slotPosId;
            const isRelatedFit = playerPosId && (
              (slotPosId <= 8 && playerPosId <= 8) ||
              (slotPosId > 8 && playerPosId > 8)
            );
            const matchAvail = availabilities[p.id];

            let borderColor = 'var(--border-glass)';
            if (alreadyAligned) borderColor = 'var(--color-gold)';
            else if (isNaturalFit) borderColor = 'var(--color-primary)';
            else if (isRelatedFit) borderColor = 'rgba(0, 230, 118, 0.3)';

            return (
              <button
                key={p.id}
                onClick={() => !isUnavailable && onAssign(p.id)}
                disabled={isUnavailable}
                className="btn-outline"
                style={{
                  justifyContent: 'space-between',
                  opacity: isUnavailable ? 0.4 : 1,
                  borderColor,
                  cursor: isUnavailable ? 'not-allowed' : 'pointer',
                  background: alreadyAligned ? 'rgba(255, 179, 0, 0.03)' : isNaturalFit ? 'rgba(0, 230, 118, 0.06)' : 'transparent',
                  padding: '8px 12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', textAlign: 'left' }}>
                  <strong>{p.name}</strong>
                  {p.apodo && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>("{p.apodo}")</span>}
                  {alreadyAligned && <span className="pro-chip pro-chip-warning">Alineado</span>}
                  {matchAvail === 'going' && (
                    <span className="pro-chip pro-chip-success"><CheckCircle2 size={10} /> Confirmado</span>
                  )}
                  {matchAvail === 'maybe' && (
                    <span className="pro-chip pro-chip-warning"><HelpCircle size={10} /> Duda</span>
                  )}
                  {matchAvail === 'not_going' && (
                    <span className="pro-chip pro-chip-danger"><XCircle size={10} /> Baja</span>
                  )}
                  {playerPosId && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: isNaturalFit ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontWeight: isNaturalFit ? 700 : 400,
                    }}>
                      [{POSITION_NAMES[playerPosId] || playerPosId}]
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '0.75rem', color: isUnavailable ? 'var(--color-red)' : 'var(--color-primary)', flexShrink: 0 }} className="tabular-nums">
                  {p.estado === 'lesionado' && 'Lesionado'}
                  {p.estado === 'suspendido' && 'Suspendido'}
                  {p.estado === 'activo' && `Fuerza: ${p.attributes.force}`}
                </span>
              </button>
            );
          })}

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={onClose} className="btn-outline">
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}

export default PlayerSelectModal;
