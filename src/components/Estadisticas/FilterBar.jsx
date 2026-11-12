import React from 'react';

export default function FilterBar({ filters, onChange, uniqueEps, searchInputRef }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  const selStyle = { fontSize: '0.875rem', minHeight: '40px', width: '100%', minWidth: 0 };
  const activeCount = Object.entries(filters).filter(([k, v]) => k !== 'busqueda' && v !== '' && v !== 'todos' && v !== false).length;
  const anyActive = activeCount > 0 || !!filters.busqueda;
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: '8px', padding: '0 14px 14px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
      <div className="search-field">
        <span aria-hidden="true">⌕</span>
        <input ref={searchInputRef} value={filters.busqueda} onChange={e => set({ busqueda: e.target.value })} placeholder="Buscar jugador por nombre" aria-label="Buscar jugador por nombre" />
      </div>
      <details className="disclosure" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
        <summary>
          <span style={{ flex: 1 }}>Filtros{activeCount > 0 && <span className="badge" style={{ marginLeft: '8px' }}>{activeCount} activos</span>}</span>
        </summary>
      <div style={grid}>
        <select value={filters.estado} onChange={e => set({ estado: e.target.value })} className="form-select" style={selStyle}>
          <option value="todos">Estado</option>
          <option value="activo">Activos</option>
          <option value="lesionado">Lesionados</option>
          <option value="suspendido">Suspendidos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <select value={filters.categoria} onChange={e => set({ categoria: e.target.value })} className="form-select" style={selStyle}>
          <option value="">Categoría</option>
          <option value="orcos_masculina_mayor">Masculina Mayor</option>
          <option value="orcos_femenina_mayor">Femenina Mayor</option>
          <option value="orcos_juveniles_masculina">Juveniles Masculina</option>
          <option value="orcos_juveniles_femenina">Juveniles Femenina</option>
        </select>
        <select value={filters.rol} onChange={e => set({ rol: e.target.value })} className="form-select" style={selStyle}>
          <option value="">Rol</option>
          <option value="Titular">Titular</option>
          <option value="Suplente">Suplente</option>
        </select>
        <select value={filters.tipoDoc} onChange={e => set({ tipoDoc: e.target.value })} className="form-select" style={selStyle}>
          <option value="">Tipo Doc</option>
          <option value="CC">CC</option>
          <option value="TI">TI</option>
          <option value="OTRO">Otro</option>
        </select>
        <select value={filters.edadMin} onChange={e => set({ edadMin: e.target.value })} className="form-select" style={selStyle}>
          <option value="">Edad ≥</option>
          <option value="14">14</option><option value="18">18</option><option value="23">23</option><option value="28">28</option><option value="33">33</option>
        </select>
        <select value={filters.edadMax} onChange={e => set({ edadMax: e.target.value })} className="form-select" style={selStyle}>
          <option value="">Edad ≤</option>
          <option value="17">17</option><option value="22">22</option><option value="27">27</option><option value="32">32</option><option value="40">40</option><option value="99">40+</option>
        </select>
        <select value={filters.pesoMin} onChange={e => set({ pesoMin: e.target.value })} className="form-select" style={selStyle}>
          <option value="">Peso ≥</option>
          <option value="50">50</option><option value="60">60</option><option value="70">70</option><option value="80">80</option><option value="90">90</option><option value="100">100</option><option value="120">120</option>
        </select>
        <select value={filters.pesoMax} onChange={e => set({ pesoMax: e.target.value })} className="form-select" style={selStyle}>
          <option value="">Peso ≤</option>
          <option value="60">60</option><option value="70">70</option><option value="80">80</option><option value="90">90</option><option value="100">100</option><option value="120">120</option><option value="150">150</option>
        </select>
        <select value={filters.alturaMin} onChange={e => set({ alturaMin: e.target.value })} className="form-select" style={selStyle}>
          <option value="">Altura ≥</option>
          <option value="1.5">1.50</option><option value="1.6">1.60</option><option value="1.7">1.70</option><option value="1.8">1.80</option>
        </select>
        <select value={filters.alturaMax} onChange={e => set({ alturaMax: e.target.value })} className="form-select" style={selStyle}>
          <option value="">Altura ≤</option>
          <option value="1.6">1.60</option><option value="1.7">1.70</option><option value="1.8">1.80</option><option value="1.9">1.90</option>
        </select>
        <select value={filters.eps} onChange={e => set({ eps: e.target.value })} className="form-select" style={selStyle}>
          <option value="">EPS</option>
          {uniqueEps.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-soft)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minHeight: '40px' }}>
          <input type="checkbox" checked={filters.sinEPS} onChange={e => set({ sinEPS: e.target.checked, eps: e.target.checked ? '' : filters.eps })} />
          Sin EPS
        </label>
        <select value={filters.fracturas} onChange={e => set({ fracturas: e.target.value })} className="form-select" style={selStyle}>
          <option value="todos">Fracturas</option>
          <option value="si">Sí</option>
          <option value="no">No</option>
        </select>
        <select value={filters.alergias} onChange={e => set({ alergias: e.target.value })} className="form-select" style={selStyle}>
          <option value="todos">Alergias</option>
          <option value="si">Sí</option>
          <option value="no">No</option>
        </select>
        <select value={filters.enfermedades} onChange={e => set({ enfermedades: e.target.value })} className="form-select" style={selStyle}>
          <option value="todos">Enfermedades</option>
          <option value="si">Sí</option>
          <option value="no">No</option>
        </select>
        {anyActive && (
          <button onClick={() => onChange({
            estado: 'todos', edadMin: '', edadMax: '', categoria: '',
            pesoMin: '', pesoMax: '', alturaMin: '', alturaMax: '',
            eps: '', sinEPS: false, fracturas: 'todos', alergias: 'todos',
            enfermedades: 'todos', rol: '', tipoDoc: '', busqueda: '',
          })}
            type="button" className="btn-outline btn-sm" style={{ minHeight: '40px' }}>
            Limpiar filtros
          </button>
        )}
      </div>
      </details>
    </div>
  );
}
