import React, { useState, useMemo } from 'react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export function MonthlyChargeModal({ players, mensualidadBase, lastMonthlyCharge, onConfirm, onClose }) {
  const [playerSearch, setPlayerSearch] = useState('');

  const [selected, setSelected] = useState(() => {
    const map = {};
    players.forEach(p => {
      if (lastMonthlyCharge && p.created_at && new Date(p.created_at) > new Date(lastMonthlyCharge)) {
        map[p.id] = false;
      } else {
        map[p.id] = true;
      }
    });
    return map;
  });

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);
  const totalAmount = selectedCount * mensualidadBase;

  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return players;
    const q = playerSearch.toLowerCase();
    return players.filter(p =>
      p.name.toLowerCase().includes(q) || (p.apodo || '').toLowerCase().includes(q)
    );
  }, [players, playerSearch]);

  const toggleAll = (value) => {
    setSelected(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => { next[id] = value; });
      return next;
    });
  };

  const togglePlayer = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const chargeDate = new Date();
  const monthLabel = `${MONTHS[chargeDate.getMonth()]} ${chargeDate.getFullYear()}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '520px', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>📋 Generar Cobro Mensual</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          Cobro correspondiente a <strong style={{ color: 'var(--color-gold)' }}>{monthLabel}</strong> —{' '}
          <strong>${mensualidadBase.toLocaleString()}</strong> por jugador.
          {lastMonthlyCharge && (
            <> Ultimo cobro: <strong>{lastMonthlyCharge}</strong>.</>
          )}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button onClick={() => toggleAll(true)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
            ✅ Seleccionar Todos
          </button>
          <button onClick={() => toggleAll(false)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
            ❌ Deseleccionar Todos
          </button>
        </div>

        <input
          type="text"
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          placeholder="Buscar guerrero..."
          className="form-input"
          style={{ marginBottom: '8px', padding: '6px 10px', fontSize: '0.78rem' }}
        />

        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          {selectedCount} de {players.length} jugadores seleccionados
          {playerSearch.trim() && <span> · Mostrando {filteredPlayers.length} de {players.length}</span>}
        </div>

        <div style={{ maxHeight: '40vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '16px' }}>
          {filteredPlayers.map(p => {
            const isSelected = selected[p.id];
            const isNew = lastMonthlyCharge && p.created_at && new Date(p.created_at) > new Date(lastMonthlyCharge);
            return (
              <label key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', cursor: 'pointer',
                background: isSelected ? 'rgba(46, 229, 122,0.04)' : 'transparent',
                border: '1px solid ' + (isSelected ? 'rgba(46, 229, 122,0.15)' : 'var(--border-glass)'),
                borderRadius: 'var(--radius-sm)', opacity: isNew ? 0.5 : 1,
              }}>
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={() => togglePlayer(p.id)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <div style={{ flex: 1, fontSize: '0.8rem' }}>
                  <strong>{p.name}</strong>
                  {p.apodo && <span style={{ color: 'var(--color-primary)', marginLeft: '4px' }}>"{p.apodo}"</span>}
                  {isNew && (
                    <span style={{ marginLeft: '6px', fontSize: '0.6rem', color: 'var(--color-gold)', background: 'rgba(232, 185, 49,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                      NUEVO
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  debe: <strong style={{ color: (p.memberships?.due || 0) > 0 ? 'var(--color-red)' : 'var(--color-primary)' }}>
                    ${(p.memberships?.due || 0).toLocaleString()}
                  </strong>
                </div>
              </label>
            );
          })}
        </div>

        <div style={{
          padding: '12px', background: 'rgba(232, 185, 49,0.06)', borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(232, 185, 49,0.15)', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '0.85rem' }}>
            <strong style={{ color: 'var(--color-gold)' }}>Preview del cobro:</strong>
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--color-text-muted)' }}>
            {selectedCount} jugadores × ${mensualidadBase.toLocaleString()} ={' '}
            <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>
              ${totalAmount.toLocaleString()}
            </strong>{' '}
            en nueva deuda acumulada
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-outline">Cancelar</button>
          <button
            onClick={() => onConfirm(Object.keys(selected).filter(id => selected[id]))}
            className="btn-neon"
            disabled={selectedCount === 0}
            style={{ opacity: selectedCount === 0 ? 0.4 : 1 }}
          >
            💰 Aplicar Cobro ({selectedCount} jugs.)
          </button>
        </div>
      </div>
    </div>
  );
}
