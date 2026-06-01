import React from 'react';
import { INVENTORY_STATUSES } from './constants';

export function InventoryCard({ item, players, onStockChange, onCustodianChange, onStatusChange }) {
  const getStatusColor = (status) => {
    if (status === 'Excelente' || status === 'Completo') return 'var(--color-primary)';
    if (status === 'Bueno') return 'var(--color-gold)';
    return 'var(--color-red)';
  };

  return (
    <div className="glass-panel animated-slide" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>?? {item.name}</h4>
        <span className="badge" style={{
          fontSize: '0.75rem',
          border: '1px solid ' + getStatusColor(item.status),
          color: getStatusColor(item.status),
          background: 'rgba(255,255,255,0.02)'
        }}>
          {item.status}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark)', padding: '10px 15px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
        <span style={{ fontSize: '0.8rem' }}>Total Stock:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onStockChange(item.id, item.total, -1)}
            style={{
              width: '26px', height: '26px', borderRadius: '50%',
              border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)',
              color: '#fff', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >-</button>
          <strong style={{ fontSize: '1.15rem', color: 'var(--color-primary)' }}>{item.total}</strong>
          <button
            onClick={() => onStockChange(item.id, item.total, 1)}
            style={{
              width: '26px', height: '26px', borderRadius: '50%',
              border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)',
              color: '#fff', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >+</button>
        </div>
      </div>

      <div className="form-group">
        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Responsable / Custodio</label>
        <select
          value={item.assignedTo}
          onChange={(e) => onCustodianChange(item.id, e.target.value)}
          className="form-select"
          style={{ padding: '6px', fontSize: '0.8rem' }}
        >
          <option value="">-- Sin Asignar --</option>
          {players.map(p => (
            <option key={p.id} value={p.name}>#{p.camiseta ?? '—'} {p.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Estado de Conservacion</label>
        <select
          value={item.status}
          onChange={(e) => onStatusChange(item.id, e.target.value)}
          className="form-select"
          style={{ padding: '6px', fontSize: '0.8rem' }}
        >
          {INVENTORY_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
