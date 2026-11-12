import React from 'react';
import UserManagement from '../UserManagement';

export default function AdminPanel({
  hasPermission: _hasPermission,
  adminSubTab,
  setAdminSubTab,
  handleAddClub,
  newClubName,
  setNewClubName,
  dynamicClubs,
  allLabels,
  deleteClub,
  showToast,
}) {
  return (
    <section className="animated-slide" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-glass)' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span className="page-eyebrow">Solo staff autorizado</span>
        <h1 className="page-title">Administración</h1>
      </header>

      <div className="segmented" role="tablist" aria-label="Secciones de administración">
        {[['users', 'Miembros'], ['clubs', 'Equipos']].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={adminSubTab === id}
            className={adminSubTab === id ? 'is-on' : ''} onClick={() => setAdminSubTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {adminSubTab === 'users' && <UserManagement />}
      {adminSubTab === 'clubs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
          <div>
            <h4 className="section-title" style={{ marginBottom: '10px' }}>Crear equipo</h4>
            <form onSubmit={handleAddClub} style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={newClubName} onChange={(e) => setNewClubName(e.target.value)}
                placeholder="Nombre del equipo" className="form-input" style={{ flex: 1 }} />
              <button type="submit" className="btn-neon" style={{ padding: '8px 16px' }}>Crear</button>
            </form>
          </div>
          <div>
            <h4 className="section-title" style={{ marginBottom: '10px' }}>Equipos actuales</h4>
            {Object.keys(dynamicClubs).length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No hay equipos dinamicos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(dynamicClubs).map(([key, code]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.85rem' }}>{allLabels[code] || code}</span>
                    <button onClick={() => { if (window.confirm(`Eliminar "${allLabels[code]}"?`)) { deleteClub(code); showToast(`"${allLabels[code]}" eliminado.`, 'info'); } }}
                      type="button" className="btn-outline btn-sm" style={{ color: 'var(--color-red)' }}>
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
