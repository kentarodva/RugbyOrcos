import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PositionSelect from '../PositionSelect';

const ROLES_CLUB = ['Entrenador', 'Capitan', 'Subcapitan', 'Titular', 'Suplente'];

function AddPlayerModal({ onClose, onSubmit, makgoraTeams, SYSTEM_ROLES, SYSTEM_ROLES_LABELS }) {
  const [form, setForm] = useState({
    name: '', apodo: '', camiseta: '', phone: '', email: '',
    rol: 'Titular', systemRole: SYSTEM_ROLES?.JUGADOR || 'jugador',
    positionId: null, posicion: '',
    weight: '', height: '', age: '',
    makgoraTeamId: ''
  });

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handlePositionChange = ({ position_id, position_name }) => {
    setForm(prev => ({ ...prev, positionId: position_id, posicion: position_name }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      apodo: form.apodo,
      camiseta: form.camiseta ? Number(form.camiseta) : null,
      contacto: { phone: form.phone, email: form.email },
      rol: form.rol,
      posicion: form.posicion || '',
      position_id: form.positionId,
      systemRole: form.systemRole,
      makgora_team_id: form.makgoraTeamId || null,
      weight: form.weight ? Number(form.weight) : null,
      height: form.height ? Number(form.height) : null,
      _meta: { age: form.age ? Number(form.age) : undefined },
    });
  };

  return (
    <motion.div className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <motion.div className="modal-content glass-panel"
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}>
        <h3 className="neon-text-primary" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Reclutar Nuevo Orco</h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Ej. Grom Hellscream" className="form-input" required />
            </div>
            <div className="form-group">
              <label>Apodo / Nickname</label>
              <input type="text" value={form.apodo} onChange={set('apodo')} placeholder="Ej. El Rompelineas" className="form-input" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Numero de Camiseta</label>
              <input type="number" value={form.camiseta} onChange={set('camiseta')} placeholder="Ej. 8" className="form-input" />
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
              <input type="text" value={form.phone} onChange={set('phone')} placeholder="Ej. +57 300 000 0000" className="form-input" />
            </div>
            <div className="form-group">
              <label>Correo Electronico</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="orco@rugby.com" className="form-input" />
            </div>
          </div>

          <div style={{ background: 'var(--bg-dark)', padding: '15px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>Datos Fisicos (Opcional)</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Los atributos RPG se calculan automaticamente segun posicion, peso, altura y edad.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.72rem' }}>Peso (kg)</label>
                <input type="number" value={form.weight} onChange={set('weight')} placeholder="Ej. 95" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} min="40" max="160" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.72rem' }}>Altura (m)</label>
                <input type="number" value={form.height} onChange={set('height')} placeholder="Ej. 1.82" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} min="1.4" max="2.2" step="0.01" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.72rem' }}>Edad</label>
                <input type="number" value={form.age} onChange={set('age')} placeholder="Ej. 25" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} min="14" max="60" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="submit" className="btn-neon">Reclutar Orco</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default AddPlayerModal;
