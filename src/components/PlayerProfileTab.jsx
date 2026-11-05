import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Award, Edit3 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
  OrcosRugbyBallIcon,
  OrcosBattleAxeHPostsIcon,
  OrcosTackleShieldIcon,
  OrcosThirdTimeHornIcon,
  OrcosWarBannerIcon,
} from './common/OrcosIcons';

const EPS_LIST = ['Nueva EPS', 'Sanitas', 'Salud Total', 'Coosalud', 'Mutual Ser', 'Cajacopi', 'Familiar de Colombia', 'FOMAG'];

const attrColors = { force: '#ff1744', speed: '#00e676', stamina: '#00b0ff', technique: '#ffd740' };
const attrLabels = { force: 'Fuerza', speed: 'Velocidad', stamina: 'Resistencia', technique: 'Técnica' };
const attrIcons = {
  force: <OrcosBattleAxeHPostsIcon size={16} color="#ff1744" />,
  speed: <OrcosRugbyBallIcon size={16} color="#00e676" />,
  stamina: <OrcosTackleShieldIcon size={16} color="#00b0ff" />,
  technique: <OrcosThirdTimeHornIcon size={16} color="#ffd740" />,
};

function Section({ title, children, icon, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: 'rgba(10, 20, 32, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderBottom: open ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon}
          <h3 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 900, color: 'var(--color-gold)', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
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
      {open && <div style={{ padding: '18px' }}>{children}</div>}
    </div>
  );
}

function ProgressBar({ val, max, color }) {
  return (
    <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
      <motion.div
        style={{ height: '100%', borderRadius: '6px', background: color, boxShadow: `0 0 10px ${color}80` }}
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
      {/* Epic Hero Header Card */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.08) 0%, rgba(10, 22, 35, 0.95) 50%, rgba(255, 215, 64, 0.06) 100%)',
          border: '1px solid rgba(0, 230, 118, 0.35)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(0, 230, 118, 0.05)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <OrcosWarBannerIcon size={20} color="var(--color-primary)" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-primary)' }}>
                RUGBY ORCOS NEGROS CLUB · COROZAL, SUCRE
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'Outfit', color: '#fff', margin: 0, lineHeight: 1.1 }}>
              {player.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-gold)', background: 'rgba(255, 215, 64, 0.12)', border: '1px solid rgba(255, 215, 64, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                Posición: {player.posicion || 'Pilar Izquierdo'} #{player.camiseta ?? '1'}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                División: {player.teamCategory || 'Masculina Mayor'}
              </span>
              {player.apodo && (
                <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#38bdf8' }}>
                  "{player.apodo}"
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (editMode) {
                setEditMode(false);
              } else {
                handleEditProfile();
              }
            }}
            className="btn-outline"
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: editMode ? 'var(--color-red)' : 'var(--color-primary)',
              color: editMode ? 'var(--color-red)' : 'var(--color-primary)',
            }}
          >
            <Edit3 size={14} />
            {editMode ? 'Cancelar Edición' : 'Editar Mi Perfil'}
          </button>
        </div>
      </div>

      {/* Edit Mode Form */}
      {editMode && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--color-gold)' }}>
          <h4 style={{ color: 'var(--color-gold)', fontWeight: 800, marginBottom: '14px' }}>
            ✏️ Modificar Información de Guerrero
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Apodo / Alias de Combate</label>
              <input
                type="text"
                value={profileForm.apodo}
                onChange={e => setProfileForm(prev => ({ ...prev, apodo: e.target.value }))}
                className="form-input"
                placeholder="Ej: El Tanque, La Muralla..."
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Posición en Cancha</label>
              <input
                type="text"
                value={profileForm.posicion}
                onChange={e => setProfileForm(prev => ({ ...prev, posicion: e.target.value }))}
                className="form-input"
                placeholder="Ej: Pilar izquierdo, Octavo..."
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Teléfono Celular</label>
              <input
                type="text"
                value={profileForm.contacto_phone}
                onChange={e => setProfileForm(prev => ({ ...prev, contacto_phone: e.target.value }))}
                className="form-input"
                placeholder="300 000 0000"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Peso (kg)</label>
              <input
                type="number"
                value={profileForm.weight}
                onChange={e => setProfileForm(prev => ({ ...prev, weight: e.target.value }))}
                className="form-input"
                placeholder="Ej: 135"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Estatura (m)</label>
              <input
                type="number"
                step="0.01"
                value={profileForm.height}
                onChange={e => setProfileForm(prev => ({ ...prev, height: e.target.value }))}
                className="form-input"
                placeholder="Ej: 1.83"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>EPS / Cobertura Médica</label>
              <input
                type="text"
                value={profileForm.health_insurance}
                onChange={e => setProfileForm(prev => ({ ...prev, health_insurance: e.target.value }))}
                className="form-input"
                placeholder="Ej: Nueva EPS, Sanitas, Coosalud..."
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditMode(false)} className="btn-outline" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
              Cancelar
            </button>
            <button onClick={handleSaveProfile} className="btn-primary" style={{ fontSize: '0.8rem', padding: '8px 20px', fontWeight: 800 }}>
              💾 Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* Battle Attributes (4 Pillars Grid) */}
      <Section title="Atributos RPG de Batalla" icon={<OrcosTackleShieldIcon size={18} color="var(--color-primary)" />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {Object.entries(attrs).map(([key, val]) => (
            <div
              key={key}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${attrColors[key]}30`,
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {attrIcons[key]}
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                    {attrLabels[key]}
                  </span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: attrColors[key], fontFamily: 'Outfit' }}>
                  {val}/100
                </span>
              </div>
              <ProgressBar val={val} max={100} color={attrColors[key]} />
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
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
      <Section title="Rendimiento Físico & Cargas de Gimnasio (1RM)" icon={<Dumbbell size={18} color="var(--color-gold)" />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Sentadilla (Squat)', val: gym.squat || 0, color: '#ff1744', desc: 'Fuerza de piernas y empuje de scrum' },
            { label: 'Press de Banca', val: gym.bench || 0, color: '#00b0ff', desc: 'Potencia de tren superior y hand-off' },
            { label: 'Peso Muerto', val: gym.deadlift || 0, color: '#a855f7', desc: 'Estabilidad de cadena posterior y ruck' },
          ].map(s => (
            <div
              key={s.label}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${s.color}35`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color, fontFamily: 'Outfit', lineHeight: 1.1 }}>
                {s.val} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>KG</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Combat Stats */}
      <Section title="Estadísticas Oficiales en Cancha" icon={<OrcosRugbyBallIcon size={18} color="var(--color-primary)" />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Tries de Gloria', val: totalTries, color: '#00e676' },
            { label: 'Tackles Ganados', val: totalTackles, color: '#38bdf8' },
            { label: 'Balones Recuperados', val: (player.matchStats || []).reduce((s, m) => s + (m.turnovers || 0), 0), color: '#a855f7' },
            { label: 'Premios MVP', val: totalMvp, color: '#ffd740' },
            { label: 'Partidos Jugados (Caps)', val: (player.matchStats || []).length, color: '#ff9100' },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color, fontFamily: 'Outfit' }}>{s.val}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Badges and Medals */}
      <Section title="Insignias y Medallas del Clan" icon={<Award size={18} color="var(--color-gold)" />}>
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
                background: 'rgba(255, 215, 64, 0.08)',
                border: '1px solid rgba(255, 215, 64, 0.35)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{b.icon}</span>
              <div>
                <span style={{ color: 'var(--color-gold)' }}>{b.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '6px' }}>({b.desc})</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
