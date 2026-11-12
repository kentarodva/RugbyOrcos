import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient.js';
import { getRpgRole, RPG_ROLES, CLUBS_LABELS, ClubContext } from '../context/ClubContext.jsx';

function UserManagement() {
  const { resetStaffPassword } = useContext(ClubContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', displayName: '', systemRole: 'jugador', clubScope: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, userId: null, userName: '', newPass: '' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (!error && data) {
      const grouped = {};
      data.forEach(u => {
        const key = u.display_name || u.user_id;
        if (!grouped[key] || new Date(u.created_at || 0) > new Date(grouped[key].created_at || 0)) {
          grouped[key] = u;
        }
      });
      setUsers(Object.values(grouped).map(u => ({ ...u, rpg: getRpgRole(u.system_role) })));
    }
    setLoading(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password || !form.displayName) { setError('Llena todos los campos.'); return; }
    if (form.password.length < 6) { setError('Contrasena: minimo 6 caracteres.'); return; }

    setSaving(true);
    if (typeof supabase.rpc === 'function') {
      const rpcRes = await supabase.rpc('admin_create_staff_user', {
        p_email: form.email,
        p_password: form.password,
        p_display_name: form.displayName,
        p_system_role: form.systemRole,
        p_club_scope: form.clubScope || null,
      });
      if (rpcRes && !rpcRes.error && rpcRes.data) {
        if (rpcRes.data.error) {
          setSaving(false);
          setError(rpcRes.data.error);
          return;
        }
        setSaving(false);
        setShowCreate(false);
        setForm({ email: '', password: '', displayName: '', systemRole: 'jugador', clubScope: '' });
        loadUsers();
        return;
      }
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { display_name: form.displayName },
      },
    });

    if (signUpError) {
      setSaving(false);
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        setError('Este email ya esta registrado.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    if (signUpData?.user) {
      const { error: updateError } = await supabase.from('user_profiles').upsert({
        user_id: signUpData.user.id,
        display_name: form.displayName,
        system_role: form.systemRole,
        club_scope: form.clubScope || null,
        is_active: true,
      }, { onConflict: 'user_id' });

      if (updateError) {
        setError('Usuario creado pero fallo la asignacion de rol: ' + updateError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowCreate(false);
    setForm({ email: '', password: '', displayName: '', systemRole: 'jugador', clubScope: '' });
    loadUsers();
  };

  const handleToggleActive = async (userId, currentActive) => {
    const { error } = await supabase.from('user_profiles').update({ is_active: !currentActive }).eq('user_id', userId);
    if (error) { setError(error.message); return; }
    setError('');
    loadUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    // The DB (migration 77) only lets presidente/desarrollador change roles; surface its message.
    const { error } = await supabase.from('user_profiles').update({ system_role: newRole }).eq('user_id', userId);
    if (error) { setError(error.message); loadUsers(); return; }
    setError('');
    loadUsers();
  };

  const handleResetPassword = async () => {
    if (resetModal.newPass.length < 6) return;
    const result = await resetStaffPassword(resetModal.userId, resetModal.newPass);
    if (result.error) { setError(result.error); return; }
    setResetModal({ open: false, userId: null, userName: '', newPass: '' });
    setError('');
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button type="button" onClick={() => setShowCreate(!showCreate)} className={showCreate ? 'btn-outline btn-sm' : 'btn-neon btn-sm'}>
          {showCreate ? 'Cancelar' : '+ Nuevo miembro'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateUser} style={{
          background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)',
          marginBottom: '20px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px'
        }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelS}>Nombre en el Reino</label>
            <input type="text" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})}
              placeholder="Ej: Thrain Puno de Hierro" style={inputS} />
          </div>
          <div>
            <label style={labelS}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              placeholder="guerrero@orcos.com" style={inputS} />
          </div>
          <div>
            <label style={labelS}>Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              placeholder="Min. 6 caracteres" style={inputS} />
          </div>
          <div>
            <label style={labelS}>Rango</label>
            <select value={form.systemRole} onChange={e => setForm({...form, systemRole: e.target.value})}
              style={{...inputS, cursor: 'pointer'}}>
              {Object.entries(RPG_ROLES).map(([key, val]) => (
                <option key={key} value={key}>{val.icon} {val.rpg} - {val.original}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelS}>Club</label>
            <select value={form.clubScope} onChange={e => setForm({...form, clubScope: e.target.value})}
              style={{...inputS, cursor: 'pointer'}}>
              <option value="">Todos los clubes</option>
              {Object.entries(CLUBS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {error && <p style={{ gridColumn: 'span 2', color: 'var(--color-red)', fontSize: '0.8rem', fontWeight: 600 }}>{error}</p>}
          <button type="submit" className="btn-neon" disabled={saving}
            style={{ gridColumn: 'span 2', padding: '12px', fontSize: '0.9rem', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Creando…' : 'Crear miembro'}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '30px' }}>Cargando miembros...</p>
      ) : (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, rol o club"
              className="form-input" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            {users.filter(u => !searchQuery || u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.system_role?.toLowerCase().includes(searchQuery.toLowerCase()) || u.club_scope?.toLowerCase().includes(searchQuery.toLowerCase())).map((u, i) => (
              <div key={u.id} style={{ padding: '12px 14px', borderTop: i ? '1px solid var(--border-glass)' : 'none', display: 'flex', flexDirection: 'column', gap: '10px', opacity: u.is_active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span aria-hidden="true" style={{ fontSize: '1.1rem', flexShrink: 0 }}>{u.rpg.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.display_name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {u.rpg.original} · {u.club_scope || 'Todos los clubes'}
                    </div>
                  </div>
                  <span className={`badge ${u.is_active ? '' : 'badge-inactive'}`} style={{ flexShrink: 0 }}>{u.is_active ? 'Activo' : 'Inactivo'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {u.system_role !== 'desarrollador' && (
                    <>
                      <select value={u.system_role} onChange={e => handleRoleChange(u.user_id, e.target.value)}
                        aria-label={`Rol de ${u.display_name}`}
                        className="form-select" style={{ flex: '1 1 180px', minWidth: 0, minHeight: '36px', fontSize: '0.8125rem' }}>
                        {Object.entries(RPG_ROLES).filter(([k]) => k !== 'desarrollador').map(([key, val]) => (
                          <option key={key} value={key}>{val.rpg} - {val.original}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => handleToggleActive(u.user_id, u.is_active)} className="btn-outline btn-sm">
                        {u.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => setResetModal({ open: true, userId: u.user_id, userName: u.display_name, newPass: '' })}
                    className="btn-outline btn-sm">
                    Contraseña
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resetModal.open && (
        <div className="modal-overlay" onClick={() => setResetModal({ ...resetModal, open: false })}>
          <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '400px', textAlign: 'center', padding: '25px' }} onClick={e => e.stopPropagation()}>
            <h3 className="section-title" style={{ fontSize: '1.125rem', marginBottom: '6px' }}>Restablecer contraseña</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>{resetModal.userName}</p>
            <input type="password" value={resetModal.newPass} onChange={e => setResetModal({ ...resetModal, newPass: e.target.value })}
              placeholder="Nueva contrasena (min. 6)" className="form-input"
              style={{ textAlign: 'center', padding: '12px', marginBottom: '15px', width: '100%', boxSizing: 'border-box' }} />
            {error && <p style={{ color: 'var(--color-red)', fontSize: '0.8rem', marginBottom: '10px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => { setResetModal({ ...resetModal, open: false }); setError(''); }} className="btn-outline">Cancelar</button>
              <button type="button" onClick={handleResetPassword} className="btn-neon">Restablecer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelS = { fontSize: '0.8125rem', color: 'var(--color-text-soft)', fontWeight: 500, marginBottom: '6px', display: 'block' };
const inputS = { width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', padding: '10px 14px', fontSize: '0.85rem', outline: 'none' };

export default UserManagement;
