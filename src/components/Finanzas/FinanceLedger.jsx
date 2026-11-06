import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { CATEGORY_LABELS } from './constants';

export function FinanceLedger({ teamFinances, onDeleteFinanceRecord, isSuperRole }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const sorted = [...teamFinances].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div className="pro-section-header" style={{ marginBottom: 0 }}>
        <div className="pro-section-title" style={{ fontSize: '1.02rem' }}>
          <span>Movimientos</span>
        </div>
        <span className="pro-chip pro-chip-muted tabular-nums">{teamFinances.length} mov.</span>
      </div>

      {teamFinances.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '15px 0' }}>Sin transacciones registradas.</p>
      ) : (
        <div className="pro-table-wrap" style={{ maxHeight: '340px', overflowY: 'auto' }}>
          <table className="pro-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th className="num">Monto</th>
                {isSuperRole && <th className="num"></th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map(f => {
                const catLabel = CATEGORY_LABELS[f.category] || 'General';
                const isIngreso = f.type === 'ingreso';
                return (
                  <tr key={f.id}>
                    <td className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {f.date}
                    </td>
                    <td style={{ fontWeight: 600 }}>{f.desc}</td>
                    <td>
                      <span className="pro-chip pro-chip-muted">{catLabel}</span>
                    </td>
                    <td className="num" style={{ fontWeight: 800, color: isIngreso ? 'var(--color-primary)' : 'var(--color-red)' }}>
                      {isIngreso ? '+' : '-'}${(f.amount || 0).toLocaleString()}
                    </td>
                    {isSuperRole && (
                      <td className="num">
                        <button
                          onClick={() => setDeleteConfirm(f)}
                          className="btn-outline"
                          style={{ padding: '4px 7px', color: 'var(--color-red)', borderColor: 'rgba(255, 92, 77,0.3)' }}
                          title="Eliminar transacción"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)} style={{ zIndex: 1000 }}>
          <div className="modal-content animated-slide" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} color="var(--color-red)" /> Eliminar Transacción
              </h3>
              <button onClick={() => setDeleteConfirm(null)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }} className="tabular-nums">
              ¿Eliminar <strong style={{ color: deleteConfirm.type === 'ingreso' ? 'var(--color-primary)' : 'var(--color-red)' }}>
                {deleteConfirm.type === 'ingreso' ? '+' : '-'}${Number(deleteConfirm.amount).toLocaleString()}
              </strong> — <strong>{deleteConfirm.desc}</strong>?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn-outline">Cancelar</button>
              <button onClick={() => { onDeleteFinanceRecord(deleteConfirm.id); setDeleteConfirm(null); }} className="btn-neon" style={{ background: 'var(--color-red)', borderColor: 'var(--color-red)' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
