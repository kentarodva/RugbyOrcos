import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient.js';
import { getRpgRole, CLUBS_LABELS, ClubContext } from '../context/ClubContext.jsx';

function UserManagement() {
  const { resetStaffPassword } = useContext(ClubContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', displayName: '', systemRole: 'jugador', clubScope: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, userId: null, userName: '', newPass: '' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (!error && data) {
      setUsers(data.map(u => ({ ...u, rpg: getRpgRole(u.system_role) })));
    }
    setLoading(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password || !form.displayName) { setError('Llena todos los campos.'); return; }
    if (form.password.length < 6) { setError('Contrasena: minimo 6 caracteres.'); return; }

    setSaving(true);
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
    if (!error) loadUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    const { error } = await supabase.from('user_profiles').update({ system_role: newRole }).eq('user_id', userId);
    if (!error) loadUsers();
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
        <button onClick={() => setShowCreate(!showCreate)} className="btn-neon"
          style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
          {showCreate ? 'Cancelar' : '+ Reclutar Miembro del Reino'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateUser} style={{
          background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 'var(--radius-md)',
          marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'
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
            <label style={labelS}>Contrasena</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              placeholder="Min. 6 caracteres" style={inputS} />
          </div>
          <div>
            <label style={labelS}>Rango</label>
            <select value={form.systemRole} onChange={e => setForm({...form, systemRole: e.target.value})}
              style={{...inputS, cursor: 'pointer'}}>
              <option value="jugador">👹 Guerrero</option>
              <option value="entrenador">🏋️ Maestro de Armas</option>
              <option value="tesorero">💰 Guardian del Botin</option>
              <option value="arbitro">⚖️ Juez del Coliseo</option>
              <option value="promotor">🛡️ Comandante de Horda</option>
              <option value="presidente">⚔️ Senor de la Guerra</option>
              <option value="desarrollador">🏰 Arquitecto del Reino</option>
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
            {saving ? 'Reclutando...' : 'Reclutar'}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '30px' }}>Cargando miembros...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                <th style={thS}>Nombre</th>
                <th style={thS}>Rango RPG</th>
                <th style={thS}>Club</th>
                <th style={thS}>Estado</th>
                <th style={thS}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: u.is_active ? 1 : 0.5 }}>
                  <td style={tdS}>
                    <span style={{ color: u.rpg.color, marginRight: '6px' }}>{u.rpg.icon}</span>
                    {u.display_name}
                  </td>
                  <td style={{...tdS, color: u.rpg.color, fontWeight: 700}}>{u.rpg.rpg}</td>
                  <td style={{...tdS, color: 'var(--color-text-muted)'}}>{u.club_scope || 'Todos'}</td>
                  <td style={tdS}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
                      background: u.is_active ? 'rgba(0,230,118,0.1)' : 'rgba(255,61,0,0.1)',
                      color: u.is_active ? 'var(--color-primary)' : 'var(--color-red)'
                    }}>{u.is_active ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td style={tdS}>
                    {u.system_role !== 'desarrollador' && (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button onClick={() => handleToggleActive(u.user_id, u.is_active)}
                          style={{
                            background: u.is_active ? 'rgba(255,61,0,0.1)' : 'rgba(0,230,118,0.1)',
                            border: `1px solid ${u.is_active ? 'var(--color-red)' : 'var(--color-primary)'}`,
                            color: u.is_active ? 'var(--color-red)' : 'var(--color-primary)',
                            padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700
                          }}>{u.is_active ? 'Desactivar' : 'Activar'}</button>
                        <select value={u.system_role} onChange={e => handleRoleChange(u.user_id, e.target.value)}
                          style={{...inputS, padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}>
                          {['jugador','entrenador','tesorero','arbitro','promotor','presidente'].map(r => (
                            <option key={r} value={r}>{getRpgRole(r).rpg}</option>
                          ))}
                        </select>
                        <button onClick={() => setResetModal({ open: true, userId: u.user_id, userName: u.display_name, newPass: '' })}
                          style={{ background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.3)', color: '#ffb300', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>🔑</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetModal.open && (
        <div className="modal-overlay" onClick={() => setResetModal({ ...resetModal, open: false })}>
          <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '400px', textAlign: 'center', padding: '25px' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔑</div>
            <h3 style={{ color: 'var(--color-gold)', fontFamily: 'Outfit', marginBottom: '8px' }}>Restablecer Contrasena</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>{resetModal.userName}</p>
            <input type="password" value={resetModal.newPass} onChange={e => setResetModal({ ...resetModal, newPass: e.target.value })}
              placeholder="Nueva contrasena (min. 6)" className="form-input"
              style={{ textAlign: 'center', padding: '12px', marginBottom: '15px', width: '100%', boxSizing: 'border-box' }} />
            {error && <p style={{ color: 'var(--color-red)', fontSize: '0.8rem', marginBottom: '10px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => { setResetModal({ ...resetModal, open: false }); setError(''); }} className="btn-outline">Cancelar</button>
              <button onClick={handleResetPassword} className="btn-neon" style={{ background: 'linear-gradient(135deg, var(--color-gold), #ff8f00)', color: '#000' }}>Restablecer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelS = { fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', display: 'block' };
const inputS = { width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', padding: '10px 14px', fontSize: '0.85rem', outline: 'none' };
const thS = { padding: '10px 12px', color: 'var(--color-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' };
const tdS = { padding: '10px 12px', color: 'var(--color-text)' };

export default UserManagement;
