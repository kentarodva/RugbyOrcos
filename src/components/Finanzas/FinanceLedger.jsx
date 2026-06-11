import React, { useState } from 'react';
import { CATEGORY_LABELS } from './constants';

export function FinanceLedger({ teamFinances, onDeleteFinanceRecord, isSuperRole }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const sorted = [...teamFinances].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>📋 Historial de Caja (Ledger)</h3>
      {teamFinances.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '15px 0' }}>Sin transacciones registradas.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
          {sorted.map(f => {
            const catLabel = CATEGORY_LABELS[f.category] || '';
            return (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <strong>{f.desc}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                    📅 {f.date} {catLabel && ' | ' + catLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: f.type === 'ingreso' ? 'var(--color-primary)' : 'var(--color-red)' }}>
                    {f.type === 'ingreso' ? '+' : '-'}${(f.amount || 0).toLocaleString()}
                  </strong>
                  {isSuperRole && (
                    <button
                      onClick={() => setDeleteConfirm(f)}
                      className="btn-outline"
                      style={{ padding: '3px 6px', fontSize: '0.65rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.3)' }}
                      title="Eliminar transaccion"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)} style={{ zIndex: 1000 }}>
          <div className="modal-content animated-slide" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>⚠️ Eliminar Transaccion</h3>
              <button onClick={() => setDeleteConfirm(null)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }}>
              ¿Eliminar <strong style={{ color: deleteConfirm.type === 'ingreso' ? 'var(--color-primary)' : 'var(--color-red)' }}>
                {deleteConfirm.type === 'ingreso' ? '+' : '-'}${Number(deleteConfirm.amount).toLocaleString()}
              </strong> — <strong>{deleteConfirm.desc}</strong>?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
              Esta accion no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn-outline">Cancelar</button>
              <button onClick={() => { onDeleteFinanceRecord(deleteConfirm.id); setDeleteConfirm(null); }} className="btn-neon" style={{ background: 'var(--color-red)', borderColor: 'var(--color-red)' }}>
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
