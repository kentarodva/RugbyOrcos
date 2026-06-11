import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { ClubContext, getRpgRole } from '../context/ClubContext.jsx';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getOrGeneratePlan } from '../engine/trainingPlanService';
import { formatLocalDate, parseLocalDate } from '../utils/dates.js';

import { usePlayerAvatar } from '../hooks/usePlayerAvatar';
import { PlayerPhoto } from './PlayerPhoto';
import { AvatarPicker } from './AvatarPicker';
import PlayerSaleTicketModal from './PlayerSaleTicketModal';
import PlayerProgressTab from './PlayerProgressTab';
import AIChat from './AIChat';
import WorkoutLogger from './WorkoutLogger';
import EventDetailModal from './Calendario/AgendaTab/EventDetailModal';
import WeeklyView from './Calendario/AgendaTab/WeeklyView';
import { PaymentHistoryModal } from './Finanzas/PaymentHistoryModal';
import { MENSUALIDAD_BASE, MEMBERSHIP_STATUS } from './Finanzas/constants';

function PlayerDashboard() {
  const { players, recordWellness, schedule, futureFixtures, updatePlayer, campaigns, allPayments, logWorkout } = useContext(ClubContext);
  const { profile, user } = useAuth();
  const { showToast } = useToast();

  const [wellness, setWellness] = useState({ sleep: 3, soreness: 3, stress: 3 });
  const [activeTab, setActiveTab] = useState('perfil');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [rsvpList, setRsvpList] = useState([]);
  const [showCalendarView, setShowCalendarView] = useState(false);

  const player = players.find(p => {
    if (profile?.display_name && p.name.toLowerCase() === profile.display_name.toLowerCase()) return true;
    if (user?.email && p.contacto?.email === user.email) return true;
    return false;
  });

  const avatarHooks = usePlayerAvatar(player, updatePlayer);

  const matchesPlayerScope = useCallback((event) => {
    if (!player) return false;
    if (event.teamCategory === player.teamCategory) return true;
    if (event.scopeType === 'all') return true;
    if (event.scopeType === 'makgora_team' && event.scopeValue?.makgora_team_id) {
      return player.makgoraTeamId === event.scopeValue.makgora_team_id;
    }
    return false;
  }, [player]);

  const myTeamEvents = useMemo(() => {
    if (!player?.teamCategory) return [];
    return schedule
      .filter(e => matchesPlayerScope(e))
      .filter(e => new Date(e.date + 'T' + (e.time || '00:00')) >= new Date(new Date().toDateString()))
      .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
      .slice(0, 5);
  }, [schedule, player?.teamCategory, matchesPlayerScope]);

  const myUpcomingMatches = useMemo(() => {
    if (!player?.teamCategory) return [];
    return futureFixtures
      .filter(f => f.teamCategory === player.teamCategory)
      .filter(f => new Date(f.date + 'T00:00:00') >= new Date(new Date().toDateString()))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  }, [futureFixtures, player?.teamCategory]);

  const handleOpenDetail = async (event) => {
    setSelectedEvent(event);
    try {
      const { data } = await supabase.from('event_rsvp').select('*').eq('event_id', event.id);
      if (data) setRsvpList(data);
    } catch { setRsvpList([]); }
  };

  const handleRsvp = async (eventId, status) => {
    if (!player?.id) return;
    try {
      await supabase.from('event_rsvp').upsert(
        { event_id: eventId, player_id: player.id, status },
        { onConflict: 'event_id, player_id' }
      );
      const { data } = await supabase.from('event_rsvp').select('*').eq('event_id', eventId);
      if (data) setRsvpList(data);
      showToast('Asistencia confirmada.', 'success');
    } catch { showToast('Error al confirmar asistencia.', 'error'); }
  };

  const myRsvp = useMemo(() => {
    if (!player?.id) return null;
    const mine = rsvpList.find(r => r.player_id === player.id);
    return mine?.status || null;
  }, [player?.id, rsvpList]);

  const rsvpCounts = useMemo(() => {
    const going = rsvpList.filter(r => r.status === 'going').length;
    const maybe = rsvpList.filter(r => r.status === 'maybe').length;
    const notGoing = rsvpList.filter(r => r.status === 'not_going').length;
    return { going, maybe, notGoing };
  }, [rsvpList]);

  const allCalendarEvents = useMemo(() => {
    if (!player?.teamCategory) return [];
    return schedule
      .filter(e => matchesPlayerScope(e))
      .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
  }, [schedule, player?.teamCategory, matchesPlayerScope]);

  const eventRsvpCounts = useMemo(() => {
    const result = {};
    rsvpList.forEach(r => {
      if (!result[r.event_id]) result[r.event_id] = { going: 0, maybe: 0, notGoing: 0 };
      result[r.event_id][r.status === 'going' ? 'going' : r.status === 'maybe' ? 'maybe' : 'notGoing']++;
    });
    return result;
  }, [rsvpList]);

  const [myTrainingPlan, setMyTrainingPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    if (!player) return;
    setLoadingPlan(true);
    getOrGeneratePlan(player).then(plan => {
      if (plan) setMyTrainingPlan(plan);
    }).catch(() => {
      /* fallback: se queda null, WorkoutLogger muestra su empty state */
    }).finally(() => setLoadingPlan(false));
  }, [player]);

  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    if (!player?.id || !campaigns?.length) return;
    setLoadingAssignments(true);
    supabase.from('fundraising_assignments')
      .select('*, campaign:campaign_id(name, type, status, deadline, ticket_price)')
      .eq('player_id', player.id)
      .then(({ data }) => {
        if (data) setAssignments(data);
        setLoadingAssignments(false);
      });
  }, [player?.id, campaigns?.length]);

  if (!player) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-gold)' }}>Guerrero no encontrado</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Contacta a tu Comandante de Horda para vincular tu cuenta.</p>
      </div>
    );
  }

  const attrs = player.attributes || { force: 50, speed: 50, stamina: 50, technique: 50 };
  const rpgRole = getRpgRole(player.systemRole || 'jugador');

  const badges = [];
  if (player.attendance && player.attendance.total >= 5 && (player.attendance.present / player.attendance.total) >= 0.9)
    badges.push({ name: 'Orco de Hierro', icon: '🛡️', desc: 'Asistencia perfecta' });
  const totalTackles = (player.matchStats || []).reduce((s, m) => s + (m.tackles || 0), 0);
  if (totalTackles >= 12) badges.push({ name: 'Muralla Verde', icon: '🧱', desc: `${totalTackles} tackles` });
  const totalTries = (player.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0);
  if (totalTries >= 3) badges.push({ name: 'Demoledor', icon: '💥', desc: `${totalTries} tries` });
  const totalMvp = (player.matchStats || []).filter(m => m.mvp).length;
  if (totalMvp >= 1) badges.push({ name: 'Gladiador MVP', icon: '🏆', desc: `${totalMvp} MVP` });

  const attrColors = { force: '#ff3d00', speed: '#00b0ff', stamina: '#00e676', technique: '#9c27b0' };

  const handleWellnessSubmit = () => {
    recordWellness(player.id, { date: new Date().toISOString().split('T')[0], ...wellness });
    showToast('Wellness registrado, Guerrero.', 'success');
  };

  const handleEditProfile = () => {
    const c = player.clothingSizes || player.clothing || {};
    setProfileForm({
      apodo: player.apodo || '',
      contacto_phone: player.contacto?.phone || '',
      contacto_email: player.contacto?.email || '',
      weight: player.weight || '',
      height: player.height || '',
      jersey: c.jersey || '',
      shorts: c.shorts || '',
      socks: c.socks || '',
      health_insurance: player.health_insurance || '',
      emergency_contact_name: player.emergency_contact_name || '',
      emergency_contact_phone: player.emergency_contact_phone || '',
    });
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    const f = profileForm;
    const updated = {
      id: player.id,
      name: player.name,
      apodo: f.apodo,
      contacto: { phone: f.contacto_phone, email: f.contacto_email },
      weight: f.weight ? Number(f.weight) : null,
      height: f.height ? Number(f.height) : null,
      clothingSizes: { jersey: f.jersey, shorts: f.shorts, socks: f.socks },
      clothing: { jersey: f.jersey, shorts: f.shorts, socks: f.socks },
      health_insurance: f.health_insurance,
      emergency_contact_name: f.emergency_contact_name,
      emergency_contact_phone: f.emergency_contact_phone,
    };
    await updatePlayer(updated);
    setEditMode(false);
    showToast('Perfil actualizado.', 'success');
  };

  const lastWellness = (player.wellnessLogs || []).slice(-1)[0];

  const injury = (player.injuryLog || [])[0];
  const att = player.attendance || { total: 0, present: 0, late: 0, absentUnjustified: 0, absentJustified: 0 };
  const attPct = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
  const gym = player.gymStats || { squat: 0, bench: 0, deadlift: 0 };
  const myPayments = (allPayments || [])
    .filter(p => p.player_id === player.id)
    .sort((a, b) => new Date(b.payment_date || b.date) - new Date(a.payment_date || a.date))
    .slice(0, 5);
  const activeCampaigns = (campaigns || []).filter(c => c.status === 'activa' || c.status === 'active');
  const cloth = player.clothingSizes || player.clothing;

  return (
    <div style={{ padding: '15px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { id: 'perfil', label: 'Mi Perfil', icon: '🛡️' },
            { id: 'agenda', label: 'Agenda', icon: '📅' },
            { id: 'entreno', label: 'Entreno', icon: '💪' },
            { id: 'bienestar', label: 'Bienestar', icon: '🧘' },
            { id: 'progreso', label: 'Progreso', icon: '📈' },
            { id: 'finanzas', label: 'Finanzas', icon: '💰' },
            { id: 'ia', label: 'Asistente IA', icon: '🤖' },
          ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'btn-neon' : 'btn-outline'}
            style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 700 : 500 }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'perfil' && (<>
      <div className="glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <PlayerPhoto player={player} size={80} editable onClick={() => setShowAvatarPicker(true)} />
        </div>
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '4px' }}>{rpgRole.icon}</span>
        <h2 style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit' }}>
          {player.name}
        </h2>
        <p style={{ color: rpgRole.color, fontWeight: 700, fontSize: '0.9rem' }}>
          {rpgRole.rpg} - {rpgRole.original} · #{player.camiseta || '—'} · {player.posicion || '—'}
        </p>
        {player.apodo && <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>"{player.apodo}"</p>}
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '10px' }}>
          {player.teamCategory || ''}
        </p>
        {!editMode && (
          <button onClick={handleEditProfile} className="btn-outline" style={{ marginTop: '12px', padding: '6px 14px', fontSize: '0.75rem' }}>
            ✏️ Editar Perfil
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '15px', fontFamily: 'Outfit' }}>
          Atributos de Batalla
        </h3>
        {Object.entries(attrs).map(([key, val]) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{key === 'force' ? 'Fuerza' : key === 'speed' ? 'Velocidad' : key === 'stamina' ? 'Resistencia' : 'Técnica'}</span>
              <span style={{ fontSize: '0.8rem', color: attrColors[key], fontWeight: 700 }}>{val}/100</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${val}%`, background: attrColors[key], borderRadius: '4px',
                boxShadow: `0 0 10px ${attrColors[key]}` }} />
            </div>
          </div>
        ))}
        {player.weight && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '15px', textAlign: 'center' }}>
            Fuerza Relativa: {gym.squat || gym.bench || gym.deadlift ? ((gym.squat + gym.bench + gym.deadlift) / player.weight).toFixed(1) : '—'} · Peso: {player.weight}kg · Altura: {player.height || '—'}m
          </p>
        )}
      </div>

      {injury && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', border: '1px solid rgba(255,61,0,0.3)' }}>
          <h3 style={{ color: '#ff3d00', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Lesion Activa
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
              <span style={{ fontWeight: 700 }}>Diagnostico:</span> {injury.diagnosis || 'No especificado'}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Fase {injury.phase || 1}/4 de recuperacion · {injury.weeks || '?'} semanas estimadas
            </p>
            <div style={{ height: '8px', background: 'rgba(255,61,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((injury.phase || 1) / 4) * 100}%`, background: '#ff3d00', borderRadius: '4px', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-blue)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
          Rendimiento Fisico
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '15px' }}>
          {[
            { label: 'Sentadilla', key: 'squat', val: gym.squat || 0, color: '#ff3d00' },
            { label: 'Banca', key: 'bench', val: gym.bench || 0, color: '#00b0ff' },
            { label: 'Peso Muerto', key: 'deadlift', val: gym.deadlift || 0, color: '#9c27b0' },
          ].map(s => (
            <div key={s.key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { label: 'Sentadilla', key: 'squat', val: gym.squat || 0, color: '#ff3d00' },
            { label: 'Banca', key: 'bench', val: gym.bench || 0, color: '#00b0ff' },
            { label: 'Peso Muerto', key: 'deadlift', val: gym.deadlift || 0, color: '#9c27b0' },
          ].map(s => (
            <div key={s.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{s.label}</span>
                <span style={{ fontSize: '0.7rem', color: s.color, fontWeight: 700 }}>{s.val}kg</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(s.val / (gym.squat + gym.bench + gym.deadlift || 1)) * 100}%`, background: s.color, borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {badges.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Insignias de Batalla
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {badges.map((b, i) => (
              <div key={i} style={{ padding: '8px 14px', background: 'rgba(255,179,0,0.08)', border: '1px solid rgba(255,179,0,0.2)',
                borderRadius: '20px', fontSize: '0.8rem', color: 'var(--color-gold)' }}>
                {b.icon} {b.name} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
          Estadisticas de Combate
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Tries', val: totalTries, color: '#ff3d00' },
            { label: 'Conversiones', val: (player.matchStats || []).reduce((s,m) => s + (m.conversions||0), 0), color: '#ffb300' },
            { label: 'Tackles', val: totalTackles, color: '#00b0ff' },
            { label: 'Recuperaciones', val: (player.matchStats || []).reduce((s,m) => s + (m.turnovers||0), 0), color: '#00e676' },
            { label: 'MVP', val: totalMvp, color: '#e040fb' },
            { label: 'Partidos', val: (player.matchStats || []).length, color: '#9e9e9e' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-green)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
          Asistencia
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: attPct >= 80 ? '#00e676' : attPct >= 60 ? '#ffb300' : '#ff3d00' }}>
            {attPct}%
          </div>
          <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${attPct}%`, background: attPct >= 80 ? '#00e676' : attPct >= 60 ? '#ffb300' : '#ff3d00', borderRadius: '5px' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
          <div><div style={{ fontSize: '1rem', fontWeight: 700, color: '#00e676' }}>{att.present}</div><span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Presente</span></div>
          <div><div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffb300' }}>{att.late}</div><span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Tarde</span></div>
          <div><div style={{ fontSize: '1rem', fontWeight: 700, color: '#ff3d00' }}>{att.absentUnjustified}</div><span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Injustif.</span></div>
          <div><div style={{ fontSize: '1rem', fontWeight: 700, color: '#9e9e9e' }}>{att.absentJustified}</div><span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Justif.</span></div>
        </div>
      </div>

      {/* Metas personales */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
          🎯 Mis Metas
        </h3>
        <div style={{ fontSize: '0.82rem' }}>
          {player.goals && player.goals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {player.goals.map((g, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                  background: g.done ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-glass)', fontSize: '0.78rem',
                }}>
                  <span style={{ fontSize: '1rem' }}>{g.done ? '✅' : '⬜'}</span>
                  <span style={{ flex: 1, textDecoration: g.done ? 'line-through' : 'none', color: g.done ? 'var(--color-text-muted)' : 'var(--color-text)' }}>{g.text}</span>
                  <button onClick={() => {
                    const updated = [...(player.goals || [])];
                    updated[i] = { ...updated[i], done: !updated[i].done };
                    updatePlayer({ ...player, goals: updated });
                    showToast(g.done ? 'Meta pendiente' : `¡Meta "${g.text}" completada!`, 'success');
                  }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.7rem', padding: '2px 6px' }}>
                    {g.done ? '↩️' : '✅'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '10px' }}>
              Define tus metas de entrenamiento. Ej: "Llegar a 100kg en sentadilla", "Asistir al 90% de los entrenos"
            </p>
          )}
          <form onSubmit={(e) => {
            e.preventDefault();
            const input = e.target.elements.newGoal;
            if (!input.value.trim()) return;
            updatePlayer({ ...player, goals: [...(player.goals || []), { text: input.value.trim(), done: false }] });
            input.value = '';
            showToast('Meta agregada. ¡A por ella!', 'success');
          }} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <input name="newGoal" type="text" placeholder="Nueva meta..." className="form-input"
              style={{ flex: 1, padding: '5px 8px', fontSize: '0.75rem' }} />
            <button type="submit" className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>+</button>
          </form>
        </div>
      </div>

      {/* Leaderboard personal */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
          🏆 Mi Ranking
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
          {[
            { label: 'Tries', value: (player.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0), key: 'tries' },
            { label: 'Tackles', value: (player.matchStats || []).reduce((s, m) => s + (m.tackles || 0), 0), key: 'tackles' },
            { label: 'MVP', value: (player.matchStats || []).filter(m => m.mvp).length, key: 'mvp' },
            { label: 'Asistencia', value: player.attendance?.present || 0, key: 'attendance' },
          ].map(stat => {
            const ranks = players.filter(p => p.rol !== 'Entrenador')
              .map(p => ({
                id: p.id,
                val: stat.key === 'tries' ? (p.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0) :
                     stat.key === 'tackles' ? (p.matchStats || []).reduce((s, m) => s + (m.tackles || 0), 0) :
                     stat.key === 'mvp' ? (p.matchStats || []).filter(m => m.mvp).length :
                     (p.attendance?.present || 0),
              }))
              .sort((a, b) => b.val - a.val);
            const rank = ranks.findIndex(r => r.id === player?.id) + 1;
            const total = ranks.length;
            return (
              <div key={stat.key} style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: rank <= 3 ? 'var(--color-gold)' : 'var(--color-text)' }}>
                  #{rank} / {total}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{stat.value} total</div>
              </div>
            );
          })}
        </div>
      </div>

      {(player.memberships) && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            👑 Membresia del Clan
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${player.memberships.due > 0 ? Math.min(100, (player.memberships.paid / player.memberships.due) * 100) : 100}%`,
                background: '#00e676', borderRadius: '5px', boxShadow: '0 0 8px rgba(0,230,118,0.4)' }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              ${(player.memberships.paid || 0).toLocaleString()} / ${player.memberships.due > 0 ? (player.memberships.due || MENSUALIDAD_BASE).toLocaleString() : 'Completo'} COP
            </span>
          </div>
        </div>
      )}

      {activeCampaigns.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Campañas Activas
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
            Hay <strong>{activeCampaigns.length}</strong> campaña(s) activa(s) de recaudacion.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button onClick={() => setShowTickets(true)} className="btn-neon"
              style={{ padding: '8px 16px', fontSize: '0.78rem' }}>
              🎟️ Mis Tickets
            </button>
          </div>
        </div>
      )}

      {myPayments.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: '#00e676', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Historial de Pagos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {myPayments.map((p, i) => {
              const d = new Date(p.payment_date || p.date);
              const src = p.source === 'membership' ? 'Membresia' : 'Recaudacion';
              return (
                <div key={p.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>${(p.amount || 0).toLocaleString()}</span>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '0.7rem' }}>{src}</span>
                  </div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.68rem' }}>
                    {formatLocalDate(d, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editMode ? (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-blue)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Editar Perfil
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Apodo</label>
                <input type="text" value={profileForm.apodo} onChange={e => setProfileForm(p => ({ ...p, apodo: e.target.value }))}
                  placeholder="Apodo" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Teléfono</label>
                <input type="text" value={profileForm.contacto_phone} onChange={e => setProfileForm(p => ({ ...p, contacto_phone: e.target.value }))}
                  placeholder="Teléfono" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Email</label>
                <input type="email" value={profileForm.contacto_email} onChange={e => setProfileForm(p => ({ ...p, contacto_email: e.target.value }))}
                  placeholder="Email" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Seguro médico</label>
                <input type="text" value={profileForm.health_insurance} onChange={e => setProfileForm(p => ({ ...p, health_insurance: e.target.value }))}
                  placeholder="EPS / Seguro" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Peso (kg)</label>
                <input type="number" step="0.1" value={profileForm.weight} onChange={e => setProfileForm(p => ({ ...p, weight: e.target.value }))}
                  placeholder="Peso" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Altura (m)</label>
                <input type="number" step="0.01" value={profileForm.height} onChange={e => setProfileForm(p => ({ ...p, height: e.target.value }))}
                  placeholder="Altura" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Jersey</label>
                <input type="text" value={profileForm.jersey} onChange={e => setProfileForm(p => ({ ...p, jersey: e.target.value }))}
                  placeholder="Talla" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Short</label>
                <input type="text" value={profileForm.shorts} onChange={e => setProfileForm(p => ({ ...p, shorts: e.target.value }))}
                  placeholder="Talla" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Medias</label>
                <input type="text" value={profileForm.socks} onChange={e => setProfileForm(p => ({ ...p, socks: e.target.value }))}
                  placeholder="Talla" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Contacto emergencia — nombre</label>
                <input type="text" value={profileForm.emergency_contact_name} onChange={e => setProfileForm(p => ({ ...p, emergency_contact_name: e.target.value }))}
                  placeholder="Nombre completo" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Teléfono emergencia</label>
                <input type="text" value={profileForm.emergency_contact_phone} onChange={e => setProfileForm(p => ({ ...p, emergency_contact_phone: e.target.value }))}
                  placeholder="Teléfono" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => setEditMode(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem' }}>
                Cancelar
              </button>
              <button onClick={handleSaveProfile} className="btn-neon" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem' }}>
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      ) : (
        (cloth?.jersey || cloth?.shorts || cloth?.socks || player.health_insurance || player.emergency_contact_name) && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-blue)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Informacion Adicional
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
            {cloth?.jersey && <div><span style={{ color: 'var(--color-text-muted)' }}>Jersey:</span> <span style={{ fontWeight: 600 }}>{cloth.jersey}</span></div>}
            {cloth?.shorts && <div><span style={{ color: 'var(--color-text-muted)' }}>Short:</span> <span style={{ fontWeight: 600 }}>{cloth.shorts}</span></div>}
            {cloth?.socks && <div><span style={{ color: 'var(--color-text-muted)' }}>Medias:</span> <span style={{ fontWeight: 600 }}>{cloth.socks}</span></div>}
            {player.health_insurance && <div><span style={{ color: 'var(--color-text-muted)' }}>Seguro:</span> <span style={{ fontWeight: 600 }}>{player.health_insurance}</span></div>}
            {player.emergency_contact_name && (
              <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Contacto emergencia:</span>
                <span style={{ fontWeight: 600, marginLeft: '4px' }}>{player.emergency_contact_name}</span>
                {player.emergency_contact_phone && <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>— {player.emergency_contact_phone}</span>}
              </div>
            )}
          </div>
        </div>
      ))}
      </>)}

      {activeTab === 'agenda' && (<>

      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit' }}>
            Agenda del Equipo
          </h3>
          <button
            onClick={() => setShowCalendarView(!showCalendarView)}
            className="btn-outline"
            style={{ padding: '4px 12px', fontSize: '0.7rem', borderColor: 'var(--color-blue)', color: 'var(--color-blue)' }}
          >
            {showCalendarView ? '📋 Vista Lista' : '📅 Vista Calendario'}
          </button>
        </div>

        {showCalendarView ? (
          <WeeklyView teamEvents={allCalendarEvents} />
        ) : (
          myTeamEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myTeamEvents.map((e, i) => {
              const d = new Date(e.date + 'T00:00:00');
              const isToday = d.toDateString() === new Date().toDateString();
              const isMultiDay = e.endDate && e.endDate > e.date;
              const hasNotes = !!e.notes;
              const counts = eventRsvpCounts[e.id] || { going: 0, maybe: 0, notGoing: 0 };
              return (
                <div key={e.id || i} onClick={() => handleOpenDetail(e)}
                  style={{
                    padding: '12px 14px', cursor: 'pointer',
                    background: isToday ? 'rgba(0,230,118,0.06)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isToday ? 'var(--color-primary)' : 'var(--border-glass)'}`,
                    display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isToday ? 'var(--color-primary)' : 'var(--border-glass)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, color: isToday ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {e.type === 'partido' ? '🏉' : '🏋️'} {e.title}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                          {formatLocalDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}
                          {isMultiDay && (
                            <> → {formatLocalDate(new Date(e.endDate + 'T00:00:00'), { day: 'numeric', month: 'short' })}</>
                          )}
                          {' · '}{e.time}
                        </span>
                        {e.recurrence && e.recurrence !== 'none' && (
                          <span className="badge" style={{
                            background: 'rgba(100,100,255,0.1)', border: '1px solid var(--color-blue)',
                            color: 'var(--color-blue)', fontSize: '0.55rem', padding: '1px 6px'
                          }}>
                            {e.recurrence === 'semanal' ? 'Semanal' : e.recurrence === 'quincenal' ? 'Quincenal' : 'Personalizado'}
                          </span>
                        )}
                        {isMultiDay && (
                          <span className="badge" style={{
                            background: 'rgba(255,179,0,0.1)', border: '1px solid var(--color-gold)',
                            color: 'var(--color-gold)', fontSize: '0.55rem', padding: '1px 6px'
                          }}>
                            Multi-dia
                          </span>
                        )}
                      </div>
                      {e.linkedRoutine && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', marginTop: '2px', opacity: 0.7 }}>
                          💪 Rutina: {e.linkedRoutine}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{e.location}</div>
                      {e.mapsLink && (
                        <a href={e.mapsLink} target="_blank" rel="noopener noreferrer"
                          onClick={ev => ev.stopPropagation()}
                          style={{ fontSize: '0.62rem', color: 'var(--color-primary)', display: 'inline-block', marginTop: '2px' }}>
                          📍 Maps
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {hasNotes && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '10px' }}>
                        📝 {e.notes.length > 40 ? e.notes.slice(0, 40) + '...' : e.notes}
                      </span>
                    )}
                    {counts.going + counts.maybe + counts.notGoing > 0 && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>
                        ✅ {counts.going} van{counts.maybe > 0 ? ` · ❓ ${counts.maybe} tal vez` : ''}
                      </span>
                    )}
                    <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                      Toca para detalle →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null
      )}
      </div>

      {myUpcomingMatches.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Proximos Partidos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myUpcomingMatches.map((f, i) => {
              const daysUntil = Math.ceil((new Date(f.date + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={f.id || i} style={{
                  padding: '10px 12px', background: daysUntil <= 7 ? 'rgba(255,179,0,0.06)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)', border: `1px solid ${daysUntil <= 7 ? 'var(--color-gold)' : 'var(--border-glass)'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '0.78rem',
                }}>
                  <span style={{ fontWeight: 700 }}>vs {f.opponent}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                    {formatLocalDate(new Date(f.date + 'T00:00:00'), { weekday: 'short', day: 'numeric', month: 'short' })}
                    {f.time ? ` · ${f.time}` : ''}
                    {daysUntil <= 7 ? ` (${daysUntil}d)` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>)}

      {activeTab === 'entreno' && (<>
        <WorkoutLogger
          player={player}
          logWorkout={logWorkout}
          myTrainingPlan={myTrainingPlan}
        />
      </>)}

      {activeTab === 'bienestar' && (<>

      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
          Wellness Check-in
        </h3>
        {lastWellness && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
            Ultimo registro: {lastWellness.date} — Sueño: {'⭐'.repeat(lastWellness.sleep || 0)} Dolor: {'⭐'.repeat(lastWellness.soreness || 0)} Estres: {'⭐'.repeat(lastWellness.stress || 0)}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '15px' }}>
          {[
            { key: 'sleep', label: 'Sueño' },
            { key: 'soreness', label: 'Dolor Muscular' },
            { key: 'stress', label: 'Estrés' },
          ].map(w => (
            <div key={w.key} style={{ textAlign: 'center' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>{w.label}</label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setWellness({...wellness, [w.key]: n})}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%', border: '1px solid',
                      borderColor: wellness[w.key] >= n ? 'var(--color-gold)' : 'var(--border-glass)',
                      background: wellness[w.key] >= n ? 'rgba(255,179,0,0.15)' : 'transparent',
                      color: wellness[w.key] >= n ? 'var(--color-gold)' : 'var(--color-text-muted)',
                      cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
                    }}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleWellnessSubmit} className="btn-neon"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.85rem' }}>
          Registrar Wellness
        </button>
      </div>
      </>)}

      {activeTab === 'progreso' && (
        <PlayerProgressTab playerId={player.id} />
      )}

      {activeTab === 'finanzas' && (<>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Balance General
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Pagado</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00e676' }}>${(player.memberships?.paid || 0).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Debe</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ff3d00' }}>${((player.memberships?.due || 0) - (player.memberships?.paid || 0)).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Estado</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: (() => {
                const m = player.memberships || { paid: 0, due: MENSUALIDAD_BASE };
                if (m.paid >= m.due) return '#00e676';
                if (m.paid > 0 && m.paid < m.due - 2000) return 'var(--color-gold)';
                if (m.paid > 0) return 'var(--color-blue)';
                return '#ff3d00';
              })() }}>
                {(() => {
                  const m = player.memberships || { paid: 0, due: MENSUALIDAD_BASE };
                  if (m.paid >= m.due) return 'Al día';
                  if (m.paid > 0 && m.paid < m.due - 2000) return 'Pago parcial';
                  if (m.paid > 0) return 'Casi al día';
                  return 'Moroso';
                })()}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Membresía mensual: ${MENSUALIDAD_BASE.toLocaleString()} COP
            </p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${player.memberships?.due > 0 ? Math.min(100, ((player.memberships?.paid || 0) / player.memberships.due) * 100) : 100}%`,
                  background: (player.memberships?.paid || 0) >= (player.memberships?.due || 0) ? '#00e676' : 'var(--color-gold)', borderRadius: '5px' }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                ${(player.memberships?.paid || 0).toLocaleString()} / ${player.memberships?.due > 0 ? player.memberships.due.toLocaleString() : 'Completo'} COP
              </span>
            </div>
          </div>

          {player.memberships?.lastPayment && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '12px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              Último abono: <strong>${(player.memberships.lastAmount || 0).toLocaleString()}</strong> el {player.memberships.lastPayment}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowTickets(true)} className="btn-neon" style={{ padding: '8px 16px', fontSize: '0.78rem' }}>
              🎟️ Mis Tickets
            </button>
            <button onClick={() => setShowPaymentHistory(true)} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.78rem', borderColor: 'var(--color-blue)', color: 'var(--color-blue)' }}>
              📋 Historial completo
            </button>
          </div>
        </div>

        {assignments.length > 0 && (
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--color-blue)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
              Mis Campañas
            </h3>
            {assignments.map(a => {
              const c = a.campaign || {};
              const pct = a.amount_due > 0 ? Math.min(100, (a.amount_paid / a.amount_due) * 100) : 0;
              const isExpired = c.deadline ? parseLocalDate(c.deadline) < new Date(new Date().toDateString()) : false;
              const statusColor = c.status === 'closed' ? 'var(--color-blue)' : isExpired ? '#ff3d00' : '#00e676';
              const statusLabel = c.status === 'closed' ? 'Completada' : isExpired ? 'Vencida' : 'Activa';
              const prizes = c.prizes || [];
              return (
                <div key={a.id} style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)' }}>{c.name || 'Campaña'}</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span className="badge" style={{ fontSize: '0.55rem', padding: '1px 6px', background: `${statusColor}15`, border: `1px solid ${statusColor}40`, color: statusColor }}>
                        {statusLabel}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                        {c.type === 'raffle' ? '🎟️' : c.type === 'food' ? '🍔' : '📦'} {a.ticket_start && a.ticket_end ? `#${a.ticket_start}-${a.ticket_end}` : ''}
                      </span>
                    </div>
                  </div>
                  {prizes.length > 0 && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--color-gold)', marginBottom: '6px' }}>
                      🏆 Premios: {prizes.map(p => p.name).join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#00e676' : '#ff9800', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      ${a.amount_paid.toLocaleString()} / ${a.amount_due.toLocaleString()}
                    </span>
                  </div>
                  {c.deadline && !isExpired && c.status !== 'closed' && (
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      ⏳ {Math.ceil((parseLocalDate(c.deadline) - new Date()) / (1000 * 60 * 60 * 24))} días restantes
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {myPayments.length > 0 && (
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
            <h3 style={{ color: '#00e676', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
              Historial de Pagos
            </h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {['membership', 'fundraising'].map(src => {
                const count = myPayments.filter(p => p.source === src).length;
                if (!count) return null;
                return (
                  <span key={src} style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: '20px', background: src === 'membership' ? 'rgba(0,230,118,0.1)' : 'rgba(255,152,0,0.1)', color: src === 'membership' ? '#00e676' : '#ff9800' }}>
                    {src === 'membership' ? '💰 Membresía' : '🎟️ Recaudación'} × {count}
                  </span>
                );
              })}
            </div>
            {myPayments.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--color-text)' }}>
                  {p.source === 'fundraising' ? '🎟️' : '💰'} {p.payment_date || p.date || '—'}
                  {p.notes ? <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '0.65rem' }}>— {p.notes}</span> : ''}
                </span>
                <span style={{ color: '#00e676', fontWeight: 700 }}>${Number(p.amount || p.monto || 0).toLocaleString()}</span>
              </div>
            ))}
        </div>
      )}
      </>)}

      {activeTab === 'ia' && (
        <AIChat />
      )}

      {(player.workoutLog || []).slice(-3).length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Ultimas Rutinas
          </h3>
          {(player.workoutLog || []).slice(-3).reverse().map((w, i) => (
            <div key={i} style={{ padding: '10px', marginBottom: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{w.routine || 'Rutina'} — {w.date}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{w.category || ''} · {w.completed ? 'Completada' : 'Pendiente'}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)', padding: '20px' }}>
        {rpgRole.icon} Fuerza, Honor y Tercer Tiempo. {rpgRole.icon}
      </p>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          players={players}
          rsvpList={rsvpList}
          myRsvp={myRsvp}
          onRsvp={handleRsvp}
        />
      )}
      {showPaymentHistory && (
        <PaymentHistoryModal
          onClose={() => setShowPaymentHistory(false)}
          playerId={player.id}
        />
      )}
      {showAvatarPicker && (
        <AvatarPicker
          currentAvatarId={player?.avatar_id}
          onSelect={(id) => { avatarHooks.setAvatar(id); setShowAvatarPicker(false); }}
          onPhoto={(file) => { avatarHooks.setPhoto(file); setShowAvatarPicker(false); }}
          onClear={() => { avatarHooks.clearPhoto(); setShowAvatarPicker(false); }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      {showTickets && (
        <PlayerSaleTicketModal playerId={player.id} onClose={() => setShowTickets(false)} />
      )}
    </div>
  );
}

export default PlayerDashboard;
