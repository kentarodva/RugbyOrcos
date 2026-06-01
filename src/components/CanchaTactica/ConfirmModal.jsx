import React from 'react';

function ConfirmModal({ confirmState, onConfirm, onCancel }) {
  if (!confirmState) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>⚙️</div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '10px' }}>
          Confirmar Accion
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
          {confirmState.message}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onCancel} className="btn-outline">
            Cancelar
          </button>
          <button onClick={onConfirm} className="btn-neon">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
