import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Dumbbell, Shield, Trophy, ClipboardCheck, Target, Award, Crown, CreditCard, FileText, Edit3 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { formatLocalDate } from '../utils/dates';
import { MENSUALIDAD_BASE } from './Finanzas/constants';
import { HeightInput, WeightInput, SizeSelect } from './common/FormattedInputs';
import PositionSelect from './Roster/PositionSelect';
import { formatHeightM, formatWeightKg } from '../utils/inputFormatters';

const EPS_LIST = ['Nueva EPS', 'Sanitas', 'Salud Total', 'Coosalud', 'Mutual Ser', 'Cajacopi', 'Familiar de Colombia', 'FOMAG'];

const attrColors = { force: '#ef4444', speed: '#3b82f6', stamina: '#22c55e', technique: '#eab308' };
const attrLabels = { force: 'Fuerza', speed: 'Velocidad', stamina: 'Resistencia', technique: 'Técnica' };

function Section({ title, children, icon, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden mb-4">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors">
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm">{icon}</span>}
          <h3 className="text-[13px] font-bold text-zinc-200 font-display uppercase tracking-wide">{title}</h3>
        </div>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

function ProgressBar({ val, max, color }) {
  return (
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (val / max) * 100)}%` }} transition={{ duration: 0.5 }} style={{ background: color }} />
    </div>
  );
}

export default function PlayerProfileTab({ player, players, updatePlayer, campaigns, allPayments, onOpenTickets }) {
  const { showToast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  const attrs = player.attributes || { force: 50, speed: 50, stamina: 50, technique: 50 };
  const gym = player.gymStats || { squat: 0, bench: 0, deadlift: 0 };
  const injury = (player.injuryLog || [])[0];
  const att = player.attendance || { total: 0, present: 0, late: 0, absentUnjustified: 0, absentJustified: 0 };
  const attPct = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
  const cloth = player.clothingSizes || player.clothing;
  const totalTries = (player.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0);
  const totalTackles = (player.matchStats || []).reduce((s, m) => s + (m.tackles || 0), 0);
  const totalMvp = (player.matchStats || []).filter(m => m.mvp).length;
  const activeCampaigns = (campaigns || []).filter(c => c.status === 'activa' || c.status === 'active');
  const myPayments = (allPayments || []).filter(p => p.player_id === player.id).sort((a, b) => new Date(b.payment_date || b.date) - new Date(a.payment_date || a.date)).slice(0, 5);

  const badges = [];
  if (player.attendance?.total >= 5 && (player.attendance.present / player.attendance.total) >= 0.9) badges.push({ name: 'Orco de Hierro', icon: '🛡️', desc: 'Asistencia perfecta' });
  if (totalTackles >= 12) badges.push({ name: 'Muralla Verde', icon: '🧱', desc: `${totalTackles} tackles` });
  if (totalTries >= 3) badges.push({ name: 'Demoledor', icon: '💥', desc: `${totalTries} tries` });
  if (totalMvp >= 1) badges.push({ name: 'Gladiador MVP', icon: '🏆', desc: `${totalMvp} MVP` });

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
      fracture_details: f.had_fractures ? (f.fracture_details || null) : null,
      allergies: f.allergies || null, medical_conditions: f.medical_conditions || null,
      start_year: f.start_year ? Number(f.start_year) : null,
    };
    const newWeight = f.weight !== '' && f.weight != null ? Number(f.weight) : null;
    const newHeight = f.height !== '' && f.height != null ? Number(f.height) : null;
    if (newWeight && (newWeight !== player.weight || newHeight !== player.height)) {
      try {
        await supabase.rpc('player_record_progress_snapshot', {
          p_player_id: player.id,
          p_weight: newWeight,
          p_height: newHeight,
          p_squat: Number(player.gymStats?.squat || 0),
          p_bench: Number(player.gymStats?.bench || 0),
          p_deadlift: Number(player.gymStats?.deadlift || 0),
          p_custom_lifts: player.preferences?.custom_lifts || {},
          p_tracked_exercises: player.preferences?.tracked_exercises || ['squat', 'bench', 'deadlift'],
        });
      } catch {
        // non-blocking
      }
    }
    await updatePlayer(updated);
    setEditMode(false);
    showToast('Perfil actualizado.', 'success');
  };

  const setF = (key) => (e) => setProfileForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      {!editMode && (
        <div className="flex justify-end">
          <button onClick={handleEditProfile} className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all inline-flex items-center gap-1.5">
            <Edit3 size={13} /> Editar Perfil
          </button>
        </div>
      )}

      <Section title="Atributos de Batalla" icon={<Swords size={14} className="text-emerald-400" />}>
        <div className="space-y-3">
          {Object.entries(attrs).map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-zinc-400 font-medium">{attrLabels[key]}</span>
                <span className="text-[11px] font-bold" style={{ color: attrColors[key] }}>{val}/100</span>
              </div>
              <ProgressBar val={val} max={100} color={attrColors[key]} />
            </div>
          ))}
          {player.weight && (
            <p className="text-[11px] text-zinc-500 text-center pt-1">
              Relativa: {gym.squat || gym.bench || gym.deadlift ? ((gym.squat + gym.bench + gym.deadlift) / player.weight).toFixed(1) : '—'} · {formatWeightKg(player.weight)} · {formatHeightM(player.height)}
            </p>
          )}
        </div>
      </Section>

      {injury && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
          <h3 className="text-[13px] font-bold text-red-400 font-display uppercase tracking-wide mb-3">🚑 Lesión Activa</h3>
          <p className="text-sm text-zinc-200"><span className="font-semibold">Diagnóstico:</span> {injury.diagnosis || 'No especificado'}</p>
          <p className="text-xs text-zinc-500 mt-1">Fase {injury.phase || 1}/4 · {injury.weeks || '?'} semanas</p>
          <ProgressBar val={injury.phase || 1} max={4} color="#ef4444" />
        </div>
      )}

      <Section title="Rendimiento Físico" icon={<Dumbbell size={14} className="text-emerald-400" />}>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[{ label: 'Sentadilla', val: gym.squat || 0, color: '#ef4444' }, { label: 'Banca', val: gym.bench || 0, color: '#3b82f6' }, { label: 'Peso Muerto', val: gym.deadlift || 0, color: '#a855f7' }].map(s => (
            <div key={s.label} className="text-center p-3 rounded-lg bg-zinc-800/30">
              <div className="text-base font-extrabold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[10px] text-zinc-500 uppercase mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Estadísticas de Combate" icon={<Shield size={14} className="text-emerald-400" />}>
        <div className="grid grid-cols-3 gap-2">
          {[{ label: 'Tries', val: totalTries, color: '#ef4444' }, { label: 'Conversiones', val: (player.matchStats || []).reduce((s, m) => s + (m.conversions || 0), 0), color: '#f59e0b' }, { label: 'Tackles', val: totalTackles, color: '#3b82f6' }, { label: 'Recup.', val: (player.matchStats || []).reduce((s, m) => s + (m.turnovers || 0), 0), color: '#22c55e' }, { label: 'MVP', val: totalMvp, color: '#a855f7' }, { label: 'Partidos', val: (player.matchStats || []).length, color: '#71717a' }].map((s, i) => (
            <div key={i} className="text-center p-2.5 rounded-lg bg-zinc-800/30">
              <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[10px] text-zinc-500 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {badges.length > 0 && (
        <Section title="Insignias de Batalla" icon={<Award size={14} className="text-amber-400" />} defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {badges.map((b, i) => (
              <div key={i} className="px-3 py-1.5 rounded-full text-xs bg-amber-400/5 border border-amber-400/20 text-amber-400">
                {b.icon} {b.name}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Asistencia" icon={<ClipboardCheck size={14} className="text-emerald-400" />} defaultOpen={false}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`text-2xl font-extrabold ${attPct >= 80 ? 'text-emerald-400' : attPct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{attPct}%</div>
          <div className="flex-1"><ProgressBar val={attPct} max={100} color={attPct >= 80 ? '#22c55e' : attPct >= 60 ? '#f59e0b' : '#ef4444'} /></div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div><div className="text-sm font-bold text-emerald-400">{att.present}</div><div className="text-[10px] text-zinc-500">Presente</div></div>
          <div><div className="text-sm font-bold text-amber-400">{att.late}</div><div className="text-[10px] text-zinc-500">Tarde</div></div>
          <div><div className="text-sm font-bold text-red-400">{att.absentUnjustified}</div><div className="text-[10px] text-zinc-500">Injustif.</div></div>
          <div><div className="text-sm font-bold text-zinc-400">{att.absentJustified}</div><div className="text-[10px] text-zinc-500">Justif.</div></div>
        </div>
      </Section>

      <Section title="Mis Metas" icon={<Target size={14} className="text-emerald-400" />} defaultOpen={false}>
        {player.goals?.length > 0 ? (
          <div className="space-y-1.5 mb-3">
            {player.goals.map((g, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${g.done ? 'bg-emerald-400/5 border border-emerald-400/10' : 'bg-zinc-800/30 border border-zinc-700/30'}`}>
                <span>{g.done ? '✅' : '⬜'}</span>
                <span className={`flex-1 ${g.done ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>{g.text}</span>
                <button onClick={() => { const u = [...(player.goals || [])]; u[i] = { ...u[i], done: !u[i].done }; updatePlayer({ ...player, goals: u }); }}
                  className="text-zinc-500 hover:text-zinc-300 text-xs px-1">{g.done ? '↩' : '✅'}</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 mb-3">Define tus metas. Ej: "100kg en sentadilla", "90% asistencia"</p>
        )}
        <form onSubmit={e => { e.preventDefault(); const i = e.target.elements.goal; if (!i.value.trim()) return; updatePlayer({ ...player, goals: [...(player.goals || []), { text: i.value.trim(), done: false }] }); i.value = ''; showToast('Meta agregada.', 'success'); }}
          className="flex gap-2">
          <input name="goal" type="text" placeholder="Nueva meta..." className="flex-1 bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600" />
          <button type="submit" className="px-3 py-1.5 rounded-lg border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 text-xs">+</button>
        </form>
      </Section>

      <Section title="Mi Ranking" icon={<Trophy size={14} className="text-amber-400" />} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          {[{ label: 'Tries', key: 'tries' }, { label: 'Tackles', key: 'tackles' }, { label: 'MVP', key: 'mvp' }, { label: 'Asistencia', key: 'attendance' }].map(stat => {
            const ranks = players.filter(p => p.rol !== 'Entrenador').map(p => ({
              id: p.id,
              val: stat.key === 'tries' ? (p.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0)
                : stat.key === 'tackles' ? (p.matchStats || []).reduce((s, m) => s + (m.tackles || 0), 0)
                : stat.key === 'mvp' ? (p.matchStats || []).filter(m => m.mvp).length
                : (p.attendance?.present || 0),
            })).sort((a, b) => b.val - a.val);
            const rank = ranks.findIndex(r => r.id === player?.id) + 1;
            return (
              <div key={stat.key} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30 text-center">
                <div className="text-[10px] text-zinc-500 uppercase">{stat.label}</div>
                <div className={`text-base font-extrabold ${rank <= 3 ? 'text-amber-400' : 'text-zinc-200'}`}>#{rank}/{ranks.length}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {(player.memberships) && (
        <Section title="Membresía del Clan" icon={<Crown size={14} className="text-amber-400" />} defaultOpen={false}>
          <div className="flex items-center gap-3">
            <div className="flex-1"><ProgressBar val={player.memberships.paid || 0} max={player.memberships.due || MENSUALIDAD_BASE} color="#22c55e" /></div>
            <span className="text-xs text-zinc-400 whitespace-nowrap">
              ${(player.memberships.paid || 0).toLocaleString()} / ${player.memberships.due > 0 ? (player.memberships.due || MENSUALIDAD_BASE).toLocaleString() : 'Completo'}
            </span>
          </div>
        </Section>
      )}

      {activeCampaigns.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <span className="text-sm text-zinc-200 font-medium">{activeCampaigns.length} campaña(s) activa(s)</span>
          </div>
          <button onClick={() => onOpenTickets?.()} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-all">
            Mis Tickets
          </button>
        </div>
      )}

      {myPayments.length > 0 && (
        <Section title="Historial de Pagos" icon={<CreditCard size={14} className="text-emerald-400" />} defaultOpen={false}>
          <div className="space-y-1">
            {myPayments.map((p, i) => (
              <div key={p.id || i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-zinc-800/30 text-xs">
                <div>
                  <span className="font-semibold text-zinc-200">${(p.amount || 0).toLocaleString()}</span>
                  <span className="text-zinc-500 ml-2">{p.source === 'membership' ? 'Membresía' : 'Recaudación'}</span>
                </div>
                <span className="text-zinc-500">{formatLocalDate(new Date(p.payment_date || p.date), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {(cloth?.jersey || cloth?.shorts || cloth?.socks || player.health_insurance || player._meta?.docType || player.had_fractures || player.allergies || player.medical_conditions || player._meta?.startYear) && (
        <Section title="Info Adicional" icon={<FileText size={14} className="text-emerald-400" />} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {cloth?.jersey && <div className="text-zinc-400">Jersey: <span className="text-zinc-200 font-semibold">{cloth.jersey}</span></div>}
            {cloth?.shorts && <div className="text-zinc-400">Short: <span className="text-zinc-200 font-semibold">{cloth.shorts}</span></div>}
            {cloth?.socks && <div className="text-zinc-400">Medias: <span className="text-zinc-200 font-semibold">{cloth.socks}</span></div>}
            {player.health_insurance && <div className="text-zinc-400">Seguro: <span className="text-zinc-200 font-semibold">{player.health_insurance}</span></div>}
            {player._meta?.docType && <div className="text-zinc-400">Documento: <span className="text-zinc-200 font-semibold">{player._meta.docType}</span></div>}
            {player.had_fractures && <div className="text-zinc-400">Fracturas: <span className="text-red-400 font-semibold">Sí</span></div>}
            {player.allergies && <div className="text-zinc-400">Alergias: <span className="text-amber-400 font-semibold">{player.allergies}</span></div>}
            {player.medical_conditions && <div className="text-zinc-400">Condiciones: <span className="text-purple-400 font-semibold">{player.medical_conditions}</span></div>}
            {player.fracture_details && <div className="col-span-2 text-zinc-400">Detalle fracturas: <span className="text-red-400 font-semibold">{player.fracture_details}</span></div>}
            {player._meta?.startYear && <div className="text-zinc-400">Ingreso: <span className="text-zinc-200 font-semibold">{player._meta.startYear}</span></div>}
            {player.emergency_contact_name && (
              <div className="col-span-2 mt-1 text-zinc-400">
                Emergencia: <span className="text-zinc-200 font-semibold">{player.emergency_contact_name}</span>
                {player.emergency_contact_phone && <span className="text-zinc-500"> — {player.emergency_contact_phone}</span>}
              </div>
            )}
          </div>
        </Section>
      )}

      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditMode(false)}>
          <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-extrabold text-zinc-200 font-display uppercase tracking-wide">Editar Perfil</h3>
              <button onClick={() => setEditMode(false)} className="text-zinc-500 hover:text-zinc-200 text-lg leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Apodo" value={profileForm.apodo} onChange={setF('apodo')} />
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">⭐ Posición en Cancha</label>
                  <PositionSelect
                    value={profileForm.position_id}
                    onChange={({ position_id, position_name }) => setProfileForm(p => ({ ...p, position_id, posicion: position_name }))}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '0.76rem' }}
                  />
                </div>
                <Input label="Teléfono" value={profileForm.contacto_phone} onChange={setF('contacto_phone')} />
                <Input label="Email" type="email" value={profileForm.contacto_email} onChange={setF('contacto_email')} />
                <Input label="⭐ Nacimiento" type="date" value={profileForm.birth_date} onChange={setF('birth_date')} />
                <Select label="Documento" value={profileForm.document_type} onChange={setF('document_type')} options={['', 'CC', 'TI', 'CE', 'Pasaporte', 'NIT']} />
                <Select label="⭐ EPS" value={profileForm.health_insurance} onChange={setF('health_insurance')} options={['', ...EPS_LIST, 'OTRA']} />
              </div>
              {profileForm.health_insurance === 'OTRA' && <Input label="Escribe tu EPS" value={profileForm.custom_eps} onChange={setF('custom_eps')} />}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">⭐ Peso (KG)</label>
                  <WeightInput value={profileForm.weight} onChange={setF('weight')} placeholder="85" />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">⭐ Altura (Ej. 1,85M)</label>
                  <HeightInput value={profileForm.height} onChange={setF('height')} placeholder="1,85" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Camiseta</label>
                  <SizeSelect kind="jersey" value={profileForm.jersey} onChange={setF('jersey')} />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Pantaloneta</label>
                  <SizeSelect kind="shorts" value={profileForm.shorts} onChange={setF('shorts')} />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Medias</label>
                  <SizeSelect kind="socks" value={profileForm.socks} onChange={setF('socks')} />
                </div>
              </div>
              <hr className="border-zinc-800" />
              <h4 className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">Experiencia</h4>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isNew" checked={profileForm.start_year == 2026} onChange={e => setProfileForm(p => ({ ...p, start_year: e.target.checked ? '2026' : '' }))} className="accent-emerald-400" />
                <label htmlFor="isNew" className="text-xs text-zinc-400 cursor-pointer">Soy nuevo — este año</label>
              </div>
              {profileForm.start_year != 2026 && (
                <Select label="Año de ingreso" value={profileForm.start_year} onChange={setF('start_year')} options={['', ...Array.from({ length: 17 }, (_, i) => String(2026 - i))]} />
              )}
              <hr className="border-zinc-800" />
              <h4 className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">Salud</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="fractures" checked={profileForm.had_fractures} onChange={e => setProfileForm(p => ({ ...p, had_fractures: e.target.checked }))} className="accent-emerald-400" />
                  <label htmlFor="fractures" className="text-xs text-zinc-400 cursor-pointer">Fracturas</label>
                </div>
                <Input label="Alergias" value={profileForm.allergies} onChange={setF('allergies')} />
                {profileForm.had_fractures && <Input label="Detalle fracturas" value={profileForm.fracture_details} onChange={setF('fracture_details')} className="col-span-2" textarea />}
                <Input label="Cond. médicas" value={profileForm.medical_conditions} onChange={setF('medical_conditions')} className="col-span-2" />
              </div>
              <hr className="border-zinc-800" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Emergencia" value={profileForm.emergency_contact_name} onChange={setF('emergency_contact_name')} />
                <Input label="Tel. Emergencia" value={profileForm.emergency_contact_phone} onChange={setF('emergency_contact_phone')} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditMode(false)} className="flex-1 py-2 rounded-lg border border-zinc-700/50 text-zinc-400 text-sm hover:bg-zinc-800 transition-all">Cancelar</button>
                <button onClick={handleSaveProfile} className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/30 transition-all">💾 Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, type = 'text', value, onChange, className = '', textarea, ...rest }) {
  const Comp = textarea ? 'textarea' : 'input';
  return (
    <div className={`${className || ''}`}>
      <label className="block text-[10px] text-zinc-500 mb-1">{label}</label>
      <Comp type={type} value={value} onChange={onChange} {...rest}
        className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600" />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[10px] text-zinc-500 mb-1">{label}</label>
      <select value={value} onChange={onChange} className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600">
        {options.map(o => <option key={o} value={o}>{o || '—'}</option>)}
      </select>
    </div>
  );
}
