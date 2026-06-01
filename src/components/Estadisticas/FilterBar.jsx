import React from 'react';

export default function FilterBar({ filters, onChange, makgoraTeams, uniqueEps, searchInputRef }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  const selStyle = { fontSize: '0.78rem', padding: '3px 8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', minWidth: '100px' };
  const inpStyle = { ...selStyle, minWidth: '70px' };
  const anyActive = Object.entries(filters).some(([_k, v]) => v !== '' && v !== 'todos' && v !== false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', background: 'var(--bg-dark)', borderRadius: '10px', padding: '8px 12px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Filtros</span>
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
          <option value="orcos_juveniles_masculina">Juvenil Masculino</option>
          <option value="orcos_juveniles_femenina">Juvenil Femenino</option>
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
        <input ref={searchInputRef} value={filters.busqueda} onChange={e => set({ busqueda: e.target.value })} placeholder="Buscar nombre..." style={{ ...inpStyle, minWidth: '140px' }} />
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
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
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filters.eps} onChange={e => set({ eps: e.target.value })} className="form-select" style={{ ...selStyle, minWidth: '120px' }}>
          <option value="">EPS</option>
          {uniqueEps.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
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
        <select value={filters.makgoraTeam} onChange={e => set({ makgoraTeam: e.target.value })} className="form-select" style={{ ...selStyle, minWidth: '130px' }}>
          <option value="">Eq. Mak'Gora</option>
          {makgoraTeams?.map(t => <option key={t.id} value={t.id}>{t.rpg_name || t.name}</option>)}
        </select>
        {anyActive && (
          <button onClick={() => onChange({
            estado: 'todos', edadMin: '', edadMax: '', categoria: '',
            pesoMin: '', pesoMax: '', alturaMin: '', alturaMax: '',
            eps: '', sinEPS: false, fracturas: 'todos', alergias: 'todos',
            enfermedades: 'todos', makgoraTeam: '', rol: '', tipoDoc: '', busqueda: '',
          })}
            style={{ background: 'none', border: '1px solid #ff5252', borderRadius: '6px', color: '#ff5252', cursor: 'pointer', fontSize: '0.78rem', padding: '3px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
