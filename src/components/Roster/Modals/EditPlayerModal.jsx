import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PositionSelect from '../PositionSelect';

const ROLES_CLUB = ['Entrenador', 'Capitan', 'Subcapitan', 'Titular', 'Suplente'];

function EditPlayerModal({ player, onClose, onSubmit, makgoraTeams, SYSTEM_ROLES, SYSTEM_ROLES_LABELS }) {
  const [form, setForm] = useState({
    name: '', apodo: '', camiseta: '', phone: '', email: '',
    rol: 'Titular', systemRole: 'jugador',
    positionId: null, makgoraTeamId: ''
  });

  useEffect(() => {
    if (player) {
      setForm({
        name: player.name || '',
        apodo: player.apodo || '',
        camiseta: player.camiseta ?? '',
        phone: player.contacto?.phone || '',
        email: player.contacto?.email || '',
        rol: player.rol || 'Titular',
        systemRole: player.systemRole || 'jugador',
        positionId: player.position_id ?? null,
        makgoraTeamId: player.makgora_team_id || ''
      });
    }
  }, [player]);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handlePositionChange = ({ position_id, position_name }) => {
    setForm(prev => ({ ...prev, positionId: position_id, posicion: position_name }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...player,
      name: form.name,
      apodo: form.apodo,
      camiseta: form.camiseta ? Number(form.camiseta) : null,
      contacto: { phone: form.phone, email: form.email },
      rol: form.rol,
      posicion: form.posicion || '',
      position_id: form.positionId,
      systemRole: form.systemRole,
      makgora_team_id: form.makgoraTeamId || null
    });
  };

  return (
    <motion.div className="modal-overlay" style={{ zIndex: 1100 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <motion.div className="modal-content glass-panel"
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}>
        <h3 className="neon-text-gold" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Editar Datos de Guerrero</h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input type="text" value={form.name} onChange={set('name')} className="form-input" required />
            </div>
            <div className="form-group">
              <label>Apodo / Nickname</label>
              <input type="text" value={form.apodo} onChange={set('apodo')} className="form-input" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Numero de Camiseta</label>
              <input type="number" value={form.camiseta} onChange={set('camiseta')} className="form-input" />
            </div>
            <div className="form-group">
              <label>Rol en el Equipo</label>
              <select value={form.rol} onChange={set('rol')} className="form-select">
                {ROLES_CLUB.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {SYSTEM_ROLES && (
            <div className="form-group">
              <label>Rol del Sistema (Permisos)</label>
              <select value={form.systemRole} onChange={set('systemRole')} className="form-select">
                {Object.values(SYSTEM_ROLES).map(r => (
                  <option key={r} value={r}>{SYSTEM_ROLES_LABELS?.[r] || r}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Posicion en Campo</label>
            <PositionSelect
              value={form.positionId}
              onChange={handlePositionChange}
            />
          </div>

          <div className="form-group">
            <label>Equipo Mak'Gora (Torneo Interno)</label>
            <select value={form.makgoraTeamId} onChange={set('makgoraTeamId')} className="form-select">
              <option value="">-- Sin equipo --</option>
              {makgoraTeams.map(t => (
                <option key={t.id} value={t.id}>{t.rpg_name || t.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Celular / WhatsApp</label>
              <input type="text" value={form.phone} onChange={set('phone')} className="form-input" />
            </div>
            <div className="form-group">
              <label>Correo Electronico</label>
              <input type="email" value={form.email} onChange={set('email')} className="form-input" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="submit" className="btn-neon" style={{ background: 'linear-gradient(135deg, var(--color-gold), #ff8f00)', color: '#000', boxShadow: '0 4px 15px rgba(255, 179, 0, 0.3)' }}>
              Guardar Cambios
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default EditPlayerModal;
