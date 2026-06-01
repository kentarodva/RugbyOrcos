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
    <div className="glass-panel animated-slide" style={{
      margin: '0 15px 10px 15px',
      padding: '20px 25px',
      borderRadius: 'var(--radius-md)',
      borderLeft: '3px solid var(--color-gold)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>
          Administracion del Reino
        </h3>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setAdminSubTab('users')} className={adminSubTab === 'users' ? 'btn-neon' : 'btn-outline'}
          style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
          Miembros
        </button>
        <button onClick={() => setAdminSubTab('clubs')} className={adminSubTab === 'clubs' ? 'btn-neon' : 'btn-outline'}
          style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
          Equipos
        </button>
      </div>

      {adminSubTab === 'users' && <UserManagement />}
      {adminSubTab === 'clubs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Crear Nuevo Equipo</h4>
            <form onSubmit={handleAddClub} style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={newClubName} onChange={(e) => setNewClubName(e.target.value)}
                placeholder="Nombre del equipo" className="form-input" style={{ flex: 1 }} />
              <button type="submit" className="btn-neon" style={{ padding: '8px 16px' }}>Crear</button>
            </form>
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Equipos Actuales</h4>
            {Object.keys(dynamicClubs).length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No hay equipos dinamicos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(dynamicClubs).map(([key, code]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.85rem' }}>{allLabels[code] || code}</span>
                    <button onClick={() => { if (window.confirm(`Eliminar "${allLabels[code]}"?`)) { deleteClub(code); showToast(`"${allLabels[code]}" eliminado.`, 'info'); } }}
                      style={{ background: 'rgba(255, 61, 0, 0.1)', border: '1px solid var(--color-red)', color: 'var(--color-red)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
