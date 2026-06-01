import React from 'react';

function DeleteConfirmModal({ playerName, onClose, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>⚠️</div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '10px', color: 'var(--color-red)' }}>
          Dar de Baja al Orco
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
          Esta accion es irreversible. {playerName} sera eliminado permanentemente del roster del clan.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onClose} className="btn-outline">Cancelar</button>
          <button
            onClick={onConfirm}
            className="btn-neon"
            style={{ background: 'linear-gradient(135deg, var(--color-red), #d50000)', color: '#fff', boxShadow: '0 4px 15px rgba(255, 61, 0, 0.3)' }}
          >
            Confirmar Baja
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
