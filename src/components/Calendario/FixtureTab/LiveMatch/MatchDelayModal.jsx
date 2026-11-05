import React, { useState } from 'react';
import { OrcosDelayClockIcon, OrcosWhistleIcon } from '../../../common/OrcosIcons';

export const DELAY_REASONS = [
  { id: 'transporte', label: '🚌 Retraso en transporte intermunicipal (Sincelejo / Montería / Barranquilla)' },
  { id: 'primeros_auxilios', label: '🚑 Espera obligatoria de paramédico / primeros auxilios en cancha Corozal' },
  { id: 'clima', label: '⛈️ Tormenta tropical caribeña / descarga eléctrica' },
  { id: 'partido_previo', label: '⏱️ Partido preliminar alargado (tiempo extra o definiciones)' },
  { id: 'planillas_fcr', label: '📋 Verificación oficial de fichajes, carnets y planillas FCR' },
  { id: 'otro', label: '⚠️ Otro retraso logístico o de comisario de campo' },
];

export function MatchDelayModal({ isOpen, onClose, currentReason, status, onSetDelay, onConfirmKickoff }) {
  const [selectedReason, setSelectedReason] = useState(currentReason || DELAY_REASONS[0].label);
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleApplyDelay = () => {
    const finalReason = selectedReason === 'custom' ? (customReason.trim() || 'Retraso logístico') : selectedReason;
    onSetDelay(finalReason);
    onClose();
  };

  const handleKickoff = () => {
    onConfirmKickoff();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(5px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--color-bg-secondary, #0c1522)',
          border: '1px solid var(--color-gold, #ffd740)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '24px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 64, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <OrcosDelayClockIcon size={26} color="var(--color-gold, #ffd740)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-gold, #ffd740)' }}>
              Protocolo de Retraso de Partido (Corozal, Sucre)
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              El cronómetro oficial permanecerá pausado hasta que el árbitro dé el pitazo inicial real.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '8px' }}>
            Motivo del Retraso / Espera:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DELAY_REASONS.map(r => (
              <label
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${selectedReason === r.label ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: selectedReason === r.label ? 'rgba(255, 215, 64, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  color: selectedReason === r.label ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                <input
                  type="radio"
                  name="delay_reason"
                  checked={selectedReason === r.label}
                  onChange={() => setSelectedReason(r.label)}
                />
                <span>{r.label}</span>
              </label>
            ))}

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${selectedReason === 'custom' ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.08)'}`,
                background: selectedReason === 'custom' ? 'rgba(255, 215, 64, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                color: selectedReason === 'custom' ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              <input
                type="radio"
                name="delay_reason"
                checked={selectedReason === 'custom'}
                onChange={() => setSelectedReason('custom')}
              />
              <span>✏️ Escribir otro motivo personalizado...</span>
            </label>

            {selectedReason === 'custom' && (
              <input
                type="text"
                placeholder="Ej: Retraso por bloqueo en la Troncal de Occidente..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.8rem', marginTop: '4px' }}
                autoFocus
              />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button
            onClick={handleApplyDelay}
            className="btn-gold"
            style={{ width: '100%', padding: '10px', fontSize: '0.82rem', fontWeight: 800 }}
          >
            ⏳ Establecer Partido en Espera
          </button>

          {(status === 'delayed' || status === 'paused') && (
            <button
              onClick={handleKickoff}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '0.82rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <OrcosWhistleIcon size={18} color="#000" />
              ¡Pitazo de Kickoff Confirmado! (Iniciar Cronómetro)
            </button>
          )}

          <button
            onClick={onClose}
            className="btn-outline"
            style={{ width: '100%', padding: '8px', fontSize: '0.75rem', marginTop: '4px' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchDelayModal;
