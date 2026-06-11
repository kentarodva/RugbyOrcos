import React from 'react';

function RosterControls({ search, onSearchChange, makgoraFilter, onMakgoraFilterChange, onAdd, onPrint, onToggleBulk, bulkMode, searchInputRef, onCompare }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
      <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '600px' }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar por nombre, apodo o camiseta..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="form-input"
          style={{ width: '100%', paddingLeft: '15px' }}
        />
        <select
          value={makgoraFilter}
          onChange={(e) => onMakgoraFilterChange(e.target.value)}
          className="form-select"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-glass)',
            color: 'var(--color-gold)',
            fontWeight: '600',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            minWidth: '140px'
          }}
        >
          <option value="all">Todos</option>
          <option value="assigned">Con equipo Mak'Gora</option>
          <option value="unassigned">Sin equipo Mak'Gora</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onCompare} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--color-blue)', borderColor: 'var(--color-blue)' }}>
          ⚔️ Comparar
        </button>
        <button onClick={onPrint} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
          Imprimir
        </button>
        <button onClick={onToggleBulk} className={bulkMode ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 14px', fontSize: '0.8rem', borderColor: bulkMode ? undefined : 'var(--color-purple)', color: bulkMode ? undefined : 'var(--color-purple)' }}>
          {bulkMode ? 'Cancelar Asignacion' : 'Asignar Posiciones'}
        </button>
        <button onClick={onAdd} className="btn-neon">
          Reclutar Orco
        </button>
      </div>
    </div>
  );
}

export default RosterControls;
