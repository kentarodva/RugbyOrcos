import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Award, Edit3 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatTeamCategory } from '../context/constants';
import {
  OrcosRugbyBallIcon,
  OrcosBattleAxeHPostsIcon,
  OrcosTackleShieldIcon,
  OrcosThirdTimeHornIcon,
  OrcosWarBannerIcon,
} from './common/OrcosIcons';

const EPS_LIST = ['Nueva EPS', 'Sanitas', 'Salud Total', 'Coosalud', 'Mutual Ser', 'Cajacopi', 'Familiar de Colombia', 'FOMAG'];

const RUGBY_POSITIONS_GROUPS = [
  {
    group: 'Primera Línea (Scrum & Choque Frontal)',
    options: [
      { id: 1, name: 'Pilar Izquierdo', num: 1 },
      { id: 2, name: 'Talonador (Hooker)', num: 2 },
      { id: 3, name: 'Pilar Derecho', num: 3 },
    ],
  },
  {
    group: 'Segunda Línea (Salto & Empuje de Melé)',
    options: [
      { id: 4, name: 'Segunda Línea #4', num: 4 },
      { id: 5, name: 'Segunda Línea #5', num: 5 },
    ],
  },
  {
    group: 'Tercera Línea (Flankers & Octavo - Portadores)',
    options: [
      { id: 6, name: 'Ala / Flanker Ciego #6', num: 6 },
      { id: 7, name: 'Ala / Flanker Abierto #7', num: 7 },
      { id: 8, name: 'Octavo (N8)', num: 8 },
    ],
  },
  {
    group: 'Medios (Conducción & Estrategia)',
    options: [
      { id: 9, name: 'Medio Scrum #9', num: 9 },
      { id: 10, name: 'Apertura (Fly-half) #10', num: 10 },
    ],
  },
  {
    group: 'Centros (Penetración & Defensa Frontal)',
    options: [
      { id: 12, name: 'Centro Interior #12', num: 12 },
      { id: 13, name: 'Centro Exterior #13', num: 13 },
    ],
  },
  {
    group: 'Tres Cuartos / Definidores (Velocidad & Fondo)',
    options: [
      { id: 11, name: 'Wing Izquierdo #11', num: 11 },
      { id: 14, name: 'Wing Derecho #14', num: 14 },
      { id: 15, name: 'Zaguero (Fullback) #15', num: 15 },
    ],
  },
];

const attrColors = { force: '#FF5C4D', speed: '#2EE57A', stamina: '#5AA9FF', technique: '#E8B931' };
const attrLabels = { force: 'Fuerza', speed: 'Velocidad', stamina: 'Resistencia', technique: 'Técnica' };
const attrIcons = {
  force: <OrcosBattleAxeHPostsIcon size={16} color="#FF5C4D" />,
  speed: <OrcosRugbyBallIcon size={16} color="#2EE57A" />,
  stamina: <OrcosTackleShieldIcon size={16} color="#5AA9FF" />,
  technique: <OrcosThirdTimeHornIcon size={16} color="#E8B931" />,
};

function Section({ title, children, icon, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '52px',
          padding: '0 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderBottom: open ? '1px solid var(--border-glass)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon}
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>
            {title}
          </h3>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div style={{ padding: '14px 16px 16px' }}>{children}</div>}
    </div>
  );
}

function ProgressBar({ val, max, color }) {
  return (
    <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '6px', overflow: 'hidden' }}>
      <motion.div
        style={{ height: '100%', borderRadius: '6px', background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (val / max) * 100)}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}

export default function PlayerProfileTab({ player, _players, updatePlayer, _campaigns, _allPayments, _onOpenTickets }) {
  const { showToast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  const attrs = player.attributes || { force: 70, speed: 30, stamina: 45, technique: 50 };
  const gym = player.gymStats || { squat: 0, bench: 0, deadlift: 0 };
  const totalTries = (player.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0);
  const totalTackles = (player.matchStats || []).reduce((s, m) => s + (m.tackles || 0), 0);
  const totalMvp = (player.matchStats || []).filter(m => m.mvp).length;

  const badges = [];
  if (player.attendance?.total >= 5 && (player.attendance.present / player.attendance.total) >= 0.9) badges.push({ name: 'Orco de Hierro', icon: '🛡️', desc: 'Asistencia impecable' });
  if (totalTackles >= 12) badges.push({ name: 'Muralla Verde', icon: '🧱', desc: `${totalTackles} tackles` });
  if (totalTries >= 3) badges.push({ name: 'Demoledor', icon: '💥', desc: `${totalTries} tries anotados` });
  if (totalMvp >= 1) badges.push({ name: 'Gladiador MVP', icon: '🏆', desc: `${totalMvp} MVP del partido` });
  if ((player.weight || 0) >= 100) badges.push({ name: 'Tanque Primera Línea', icon: '🐗', desc: 'Poder de melé pesada' });

  const handleEditProfile = () => {
    const c = player.clothingSizes || player.clothing || {};
    setProfileForm({
      apodo: player.apodo || '', contacto_phone: player.contacto?.phone || '', contacto_email: player.contacto?.email || '',
      position_id: player.position_id || null,
      posicion: player.posicion || '',
      weight: player.weight || '', height: player.height || '',
      jersey: c.jersey || '', shorts: c.shorts || '', socks: c.socks || '',
      health_insurance: EPS_LIST.includes(player.health_insurance) ? player.health_insurance : 'OTRA',
      custom_eps: EPS_LIST.includes(player.health_insurance) ? '' : player.health_insurance || '',
      emergency_contact_name: player.emergency_contact_name || '', emergency_contact_phone: player.emergency_contact_phone || '',
      birth_date: player.birth_date || '', document_type: player._meta?.docType || '',
      had_fractures: player.had_fractures || false, fracture_details: player.fracture_details || '',
      allergies: player.allergies || '', medical_conditions: player.medical_conditions || '',
      start_year: player._meta?.startYear || '',
    });
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    const f = profileForm;
    const calcAge = f.birth_date ? Math.max(0, Math.floor((Date.now() - new Date(f.birth_date).getTime()) / 31557600000)) : null;
    const updated = {
      ...player, name: player.name, apodo: f.apodo,
      position_id: f.position_id || null,
      posicion: f.posicion || player.posicion || '',
      contacto: { phone: f.contacto_phone, email: f.contacto_email },
      weight: f.weight !== '' && f.weight != null ? Number(f.weight) : null,
      height: f.height !== '' && f.height != null ? Number(f.height) : null,
      clothingSizes: { jersey: f.jersey, shorts: f.shorts, socks: f.socks },
      clothing: { jersey: f.jersey, shorts: f.shorts, socks: f.socks },
      health_insurance: f.health_insurance === 'OTRA' ? (f.custom_eps || null) : f.health_insurance,
      emergency_contact_name: f.emergency_contact_name, emergency_contact_phone: f.emergency_contact_phone,
      birth_date: f.birth_date || null, ...(calcAge != null && { age: calcAge }),
      document_type: f.document_type || null, had_fractures: f.had_fractures,
      fracture_details: f.fracture_details || null, allergies: f.allergies || null,
      medical_conditions: f.medical_conditions || null,
    };
    try {
      await updatePlayer(updated);
      showToast('Perfil de Guerrero actualizado con éxito.', 'success');
      setEditMode(false);
    } catch {
      showToast('Error al actualizar perfil.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Profile header */}
      <section className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <span className="page-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <OrcosWarBannerIcon size={16} color="var(--color-text-subtle)" />
            Orcos Rugby Club · {player.teamCategory ? formatTeamCategory(player.teamCategory) : 'Sin categoría'}
          </span>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text)', margin: 0, lineHeight: 1.1, overflowWrap: 'anywhere' }}>
            {player.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
            <span className="badge">
              {player.posicion || 'Sin posición'}{(player.camiseta ?? player.position_id) != null ? ` · #${player.camiseta ?? player.position_id}` : ''}
            </span>
            {player.apodo && (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>«{player.apodo}»</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => (editMode ? setEditMode(false) : handleEditProfile())}
          className="btn-outline btn-sm"
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Edit3 size={14} aria-hidden="true" />
          {editMode ? 'Cancelar edición' : 'Editar mi perfil'}
        </button>
      </section>

      {/* Edit Profile Modal Dialog */}
      {editMode && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setEditMode(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="modal-content"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '1.2rem', margin: 0 }}>
                  Editar mi ficha
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                  Datos oficiales del club. La posición en cancha está estandarizada según las 15 posiciones de World Rugby.
                </p>
              </div>
              <button
                onClick={() => setEditMode(false)}
                className="btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '14px' }}>
              {/* Apodo */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '4px' }}>
                  Apodo / Alias de Combate
                </label>
                <input
                  type="text"
                  value={profileForm.apodo}
                  onChange={e => setProfileForm(prev => ({ ...prev, apodo: e.target.value }))}
                  className="form-input"
                  placeholder="Ej: El Tanque, La Muralla..."
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              {/* Posición en Cancha Standard Select */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold)', display: 'block', marginBottom: '4px' }}>
                  🏉 Posición en Cancha (World Rugby)
                </label>
                <select
                  value={profileForm.position_id || ''}
                  onChange={e => {
                    const posId = e.target.value ? Number(e.target.value) : null;
                    let foundName = '';
                    RUGBY_POSITIONS_GROUPS.forEach(g => {
                      const match = g.options.find(o => o.id === posId);
                      if (match) foundName = match.name;
                    });
                    setProfileForm(prev => ({
                      ...prev,
                      position_id: posId,
                      posicion: foundName || prev.posicion,
                    }));
                  }}
                  className="form-select"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', background: '#191C1A', border: '1px solid rgba(255, 215, 64, 0.4)', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="">Selecciona tu posición oficial...</option>
                  {RUGBY_POSITIONS_GROUPS.map(group => (
                    <optgroup key={group.group} label={group.group} style={{ background: '#111412', color: 'var(--color-gold)' }}>
                      {group.options.map(opt => (
                        <option key={opt.id} value={opt.id} style={{ background: '#191C1A', color: '#fff' }}>
                          #{opt.num} - {opt.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {profileForm.posicion ? `Seleccionada: ${profileForm.posicion}` : 'Elige tu puesto táctico'}
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '4px' }}>
                  📱 Celular / WhatsApp
                </label>
                <input
                  type="text"
                  value={profileForm.contacto_phone}
                  onChange={e => setProfileForm(prev => ({ ...prev, contacto_phone: e.target.value }))}
                  className="form-input"
                  placeholder="300 123 4567"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              {/* Peso (kg) */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '4px' }}>
                  ⚖️ Peso Corporal (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={profileForm.weight}
                  onChange={e => setProfileForm(prev => ({ ...prev, weight: e.target.value }))}
                  className="form-input"
                  placeholder="Ej: 110"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              {/* Estatura (m) */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '4px' }}>
                  📏 Estatura (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={profileForm.height}
                  onChange={e => setProfileForm(prev => ({ ...prev, height: e.target.value }))}
                  className="form-input"
                  placeholder="Ej: 1.83"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              {/* EPS */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '4px' }}>
                  🏥 Cobertura Médica / EPS
                </label>
                <select
                  value={profileForm.health_insurance}
                  onChange={e => setProfileForm(prev => ({ ...prev, health_insurance: e.target.value }))}
                  className="form-select"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', background: '#191C1A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="">Selecciona EPS...</option>
                  {EPS_LIST.map(eps => (
                    <option key={eps} value={eps}>{eps}</option>
                  ))}
                  <option value="OTRA">Otra EPS / Medicina Prepagada</option>
                </select>
                {profileForm.health_insurance === 'OTRA' && (
                  <input
                    type="text"
                    value={profileForm.custom_eps}
                    onChange={e => setProfileForm(prev => ({ ...prev, custom_eps: e.target.value }))}
                    placeholder="Escribe el nombre de tu EPS..."
                    style={{ width: '100%', marginTop: '6px', padding: '7px 10px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff' }}
                  />
                )}
              </div>

              {/* Contacto de Emergencia */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '4px' }}>
                  🚨 Contacto de Emergencia (Nombre)
                </label>
                <input
                  type="text"
                  value={profileForm.emergency_contact_name}
                  onChange={e => setProfileForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                  className="form-input"
                  placeholder="Nombre de familiar"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              {/* Teléfono de Emergencia */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '4px' }}>
                  ☎️ Teléfono de Emergencia
                </label>
                <input
                  type="text"
                  value={profileForm.emergency_contact_phone}
                  onChange={e => setProfileForm(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  className="form-input"
                  placeholder="300 000 0000"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              {/* Talla Camiseta */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '4px' }}>
                  👕 Talla Camiseta Oficial
                </label>
                <select
                  value={profileForm.jersey || ''}
                  onChange={e => setProfileForm(prev => ({ ...prev, jersey: e.target.value }))}
                  className="form-select"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', background: '#191C1A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="">Selecciona talla...</option>
                  {['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Talla Pantaloneta */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '4px' }}>
                  🩳 Talla Pantaloneta
                </label>
                <select
                  value={profileForm.shorts || ''}
                  onChange={e => setProfileForm(prev => ({ ...prev, shorts: e.target.value }))}
                  className="form-select"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', background: '#191C1A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="">Selecciona talla...</option>
                  {['S', 'M', 'L', 'XL', '2XL', '3XL'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <button onClick={() => setEditMode(false)} className="btn-outline" style={{ fontSize: '0.82rem', padding: '9px 18px' }}>
                Cancelar
              </button>
              <button onClick={handleSaveProfile} className="btn-primary" style={{ fontSize: '0.82rem', padding: '9px 24px', fontWeight: 800 }}>
                💾 Guardar Ficha Oficial
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Battle Attributes (4 Pillars Grid) */}
      <Section title="Atributos" icon={<OrcosTackleShieldIcon size={18} color="var(--color-text-muted)" />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px' }}>
          {Object.entries(attrs).map(([key, val]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {attrIcons[key]}
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {attrLabels[key]}
                  </span>
                </div>
                <span className="stat-number" style={{ fontSize: '1.25rem' }}>
                  {val}<span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}> / 100</span>
                </span>
              </div>
              <ProgressBar val={val} max={100} color={attrColors[key]} />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                {key === 'force' && 'Poder de empuje en scrum y choque'}
                {key === 'speed' && 'Sprint lineal y reacción en carrera'}
                {key === 'stamina' && 'Resistencia aeróbica durante 80 minutos'}
                {key === 'technique' && 'Destreza en pase, ruck y tackle legal'}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Gym 1RM Performance */}
      <Section title="Gimnasio · 1RM" icon={<Dumbbell size={18} color="var(--color-text-muted)" />}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { label: 'Sentadilla', val: gym.squat || 0, desc: 'Piernas y empuje de scrum' },
            { label: 'Press de banca', val: gym.bench || 0, desc: 'Tren superior y hand-off' },
            { label: 'Peso muerto', val: gym.deadlift || 0, desc: 'Cadena posterior y ruck' },
          ].map((s, i) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: i ? '1px solid var(--border-glass)' : 'none' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>{s.desc}</div>
              </div>
              <span style={{ flexShrink: 0 }}>
                <span className="stat-number" style={{ fontSize: '1.5rem' }}>{s.val}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>kg</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Combat Stats */}
      <Section title="En cancha" icon={<OrcosRugbyBallIcon size={18} color="var(--color-text-muted)" />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 120px), 1fr))', gap: '10px' }}>
          {[
            { label: 'Tries', val: totalTries },
            { label: 'Tackles', val: totalTackles },
            { label: 'Recuperaciones', val: (player.matchStats || []).reduce((s, m) => s + (m.turnovers || 0), 0) },
            { label: 'MVP', val: totalMvp },
            { label: 'Partidos', val: (player.matchStats || []).length },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
              <div className="stat-number" style={{ fontSize: '1.625rem', marginTop: '4px' }}>{s.val}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Badges and Medals */}
      <Section title="Insignias" icon={<Award size={18} color="var(--color-text-muted)" />}>
        {badges.length === 0 && (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Aún sin insignias. Se ganan con asistencia, tackles, tries y MVPs.</p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {badges.map((b, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '30px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                color: 'var(--color-text)',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{b.icon}</span>
              <div>
                <span>{b.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '6px' }}>({b.desc})</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
