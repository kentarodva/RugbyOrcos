import React, { Suspense, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClubContext, getRpgRole } from '../context/ClubContext.jsx';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getOrGeneratePlan, getActivePlan } from '../engine/trainingPlanService';
import { usePlayerAvatar } from '../hooks/usePlayerAvatar';
import { AvatarPicker } from './AvatarPicker';
import PlayerSaleTicketModal from './PlayerSaleTicketModal';
import WorkoutLogger from './WorkoutLogger';
import RoutineBuilder from './RoutineBuilder';
import PlanOnboarding from './PlanOnboarding';
import EventDetailModal from './Calendario/AgendaTab/EventDetailModal';
import { PaymentHistoryModal } from './Finanzas/PaymentHistoryModal';
import PlayerSidebar from './PlayerSidebar';
import { StatsHeroCards, Skeleton } from './StatsHeroCards';
import PlayerProfileTab from './PlayerProfileTab';
import PlayerAgendaTab from './PlayerAgendaTab';
import PlayerWellnessTab from './PlayerWellnessTab';
import PlayerFinanzasTab from './PlayerFinanzasTab';

const PlayerProgressTab = React.lazy(() => import('./PlayerProgressTab'));
const AIChat = React.lazy(() => import('./AIChat'));

function PlayerDashboard() {
  const { players, recordWellness, schedule, futureFixtures, updatePlayer, campaigns, allPayments, logWorkout, userTier } = useContext(ClubContext);
  const { profile, user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('perfil');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rsvpList, setRsvpList] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [planVersion, setPlanVersion] = useState(0);
  const [setupForm, setSetupForm] = useState({
    birth_date: '', weight: '', height: '', health_insurance: '',
    contacto_phone: '', emergency_contact_name: '', emergency_contact_phone: '',
  });

  const player = (userTier >= 4 ? players.find(p => p.userId === user?.id) : null)
    ?? players.find(p => {
      if (profile?.display_name && p.name.toLowerCase() === profile.display_name.toLowerCase()) return true;
      if (user?.email && p.contacto?.email === user.email) return true;
      return false;
    });

  useEffect(() => {
    if (player && !player.birth_date && !sessionStorage.getItem('setup_skip_' + player.id)) {
      setSetupForm(f => ({ ...f,
        birth_date: player.birth_date || '',
        weight: player.weight || '',
        height: player.height || '',
        health_insurance: player.health_insurance || '',
        contacto_phone: player.contacto?.phone || '',
        emergency_contact_name: player.emergency_contact_name || '',
        emergency_contact_phone: player.emergency_contact_phone || '',
      }));
      setShowSetup(true);
    }
  }, [player]);

  const handleSetupSave = async () => {
    const f = setupForm;
    if (!f.birth_date || !f.weight || !f.height) {
      showToast('Completa fecha de nacimiento, peso y altura.', 'error');
      return;
    }
    const calcAge = f.birth_date
      ? Math.max(0, Math.floor((Date.now() - new Date(f.birth_date).getTime()) / 31557600000))
      : null;
    await updatePlayer({
      ...player,
      name: player.name,
      birth_date: f.birth_date || null,
      ...(calcAge != null && { age: calcAge }),
      weight: Number(f.weight), height: Number(f.height),
      health_insurance: f.health_insurance === 'OTRA' ? (f.custom_eps || null) : f.health_insurance || null,
      contacto: { phone: f.contacto_phone || null, email: player.contacto?.email },
      emergency_contact_name: f.emergency_contact_name || null,
      emergency_contact_phone: f.emergency_contact_phone || null,
    });
    setShowSetup(false);
    showToast('¡Perfil completado! Bienvenido al club.', 'success');
  };

  const avatarHooks = usePlayerAvatar(player, updatePlayer);

  const matchesPlayerScope = useCallback((event) => {
    if (!player) return false;
    if (event.teamCategory === player.teamCategory) return true;
    if (event.teamId && player.teamId && event.teamId === player.teamId) return true;
    if (event.scopeType === 'all') return true;
    if (event.scopeType === 'makgora_team' && event.scopeValue?.makgora_team_id) {
      return player.makgora_team_id === event.scopeValue.makgora_team_id;
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

  const allCalendarEvents = useMemo(() => {
    if (!player?.teamCategory) return [];
    return schedule
      .filter(e => matchesPlayerScope(e))
      .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
  }, [schedule, player?.teamCategory, matchesPlayerScope]);

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

  const eventRsvpCounts = useMemo(() => {
    const result = {};
    rsvpList.forEach(r => {
      if (!result[r.event_id]) result[r.event_id] = { going: 0, maybe: 0, notGoing: 0 };
      result[r.event_id][r.status === 'going' ? 'going' : r.status === 'maybe' ? 'maybe' : 'notGoing']++;
    });
    return result;
  }, [rsvpList]);

  const [myRsvpMap, setMyRsvpMap] = useState({});

  useEffect(() => {
    if (!player?.id) return;
    supabase.from('event_rsvp').select('event_id, status').eq('player_id', player.id).then(({ data }) => {
      if (data) {
        const map = {};
        data.forEach(r => { map[r.event_id] = r.status; });
        setMyRsvpMap(map);
      }
    }).catch(() => {});
  }, [player?.id]);

  const [myTrainingPlan, setMyTrainingPlan] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    if (!player) return;
    getActivePlan(player.id).then(plan => {
      if (plan) {
        setMyTrainingPlan({
          id: plan.id, playerId: plan.player_id, weekStart: plan.week_start,
          source: plan.source, provider: plan.provider, model: plan.model,
          plan: plan.plan, aiAnalysis: plan.ai_analysis?.analisis,
          matchFaults: plan.plan?.matchFaults || [],
          isInjured: plan.plan?.isInjured || false,
          fromDB: true,
        });
      }
    }).catch(() => {});
  }, [player, planVersion]);

  const handleGeneratePlan = () => {
    if (!player) return;
    const prefs = player.preferences?.training_prefs || {};
    setShowOnboarding(true);
  };

  const handleOnboardingSubmit = async (prefs) => {
    setShowOnboarding(false);
    if (!player) return;
    setGeneratingPlan(true);
    try {
      await updatePlayer({
        ...player,
        name: player.name,
        preferences: { ...(player.preferences || {}), ...prefs, onboarding_completed: true },
      });
      const enriched = { ...player, preferences: { ...(player.preferences || {}), ...prefs } };
      const plan = await getOrGeneratePlan(enriched);
      if (plan) {
        setMyTrainingPlan(plan);
        setPlanVersion(v => v + 1);
      }
      showToast('¡Plan generado con IA!', 'success');
    } catch {
      showToast('Error al generar el plan.', 'error');
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (!player) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-gold)' }}>Guerrero no encontrado</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Contacta a tu Comandante de Horda para vincular tu cuenta.</p>
      </div>
    );
  }

  const rpgRole = getRpgRole(player.systemRole || 'jugador');

  return (
    <div className="flex h-full min-h-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <motion.aside
        animate={{ width: sidebarCollapsed ? 56 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="shrink-0 border-r border-zinc-800/40 overflow-hidden"
      >
        <PlayerSidebar
          player={player}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAvatarPicker={() => setShowAvatarPicker(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        />
      </motion.aside>

      <main className="flex-1 overflow-y-auto p-6 min-h-0">
        <StatsHeroCards
          player={player}
          nextMatch={myUpcomingMatches?.[0] || null}
          hasActivePlan={!!myTrainingPlan}
        />
        <AnimatePresence mode="wait">
          {activeTab === 'perfil' && (
            <motion.div key="perfil" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <PlayerProfileTab
                player={player}
                players={players}
                updatePlayer={updatePlayer}
                campaigns={campaigns}
                allPayments={allPayments}
                onOpenAvatarPicker={() => setShowAvatarPicker(true)}
                onOpenTickets={() => setShowTickets(true)}
              />
            </motion.div>
          )}

          {activeTab === 'agenda' && (
            <motion.div key="agenda" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <PlayerAgendaTab
                myTeamEvents={myTeamEvents}
                myUpcomingMatches={myUpcomingMatches}
                allCalendarEvents={allCalendarEvents}
                handleOpenDetail={handleOpenDetail}
                eventRsvpCounts={eventRsvpCounts}
                myRsvp={myRsvp}
                myRsvpMap={myRsvpMap}
                onRsvp={handleRsvp}
              />
            </motion.div>
          )}

          {activeTab === 'entreno' && (
            <motion.div key="entreno" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <WorkoutLogger
                player={player}
                logWorkout={logWorkout}
                myTrainingPlan={myTrainingPlan}
                onOpenBuilder={() => setShowRoutineBuilder(true)}
                onGeneratePlan={handleGeneratePlan}
                generatingPlan={generatingPlan}
              />
              {showRoutineBuilder && (
                <RoutineBuilder
                  player={player}
                  existingPlan={myTrainingPlan}
                  onSaved={() => { setShowRoutineBuilder(false); setPlanVersion(v => v + 1); }}
                  onClose={() => setShowRoutineBuilder(false)}
                />
              )}
              {showOnboarding && (
                <PlanOnboarding
                  savedPrefs={player.preferences}
                  onGenerate={handleOnboardingSubmit}
                  onClose={() => setShowOnboarding(false)}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'bienestar' && (
            <motion.div key="bienestar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <PlayerWellnessTab
                player={player}
                recordWellness={recordWellness}
              />
            </motion.div>
          )}

          {activeTab === 'progreso' && (
            <motion.div key="progreso" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<Skeleton rows={4} />}>
                <PlayerProgressTab playerId={player.id} />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'finanzas' && (
            <motion.div key="finanzas" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <PlayerFinanzasTab
                player={player}
                allPayments={allPayments}
                campaigns={campaigns}
                onOpenTickets={() => setShowTickets(true)}
                onOpenPaymentHistory={() => setShowPaymentHistory(true)}
              />
            </motion.div>
          )}

          {activeTab === 'ia' && (
            <motion.div key="ia" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<Skeleton rows={3} />}>
                <AIChat />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
          hasPhoto={!!player?.photo_url}
          photoUrl={player?.photo_url}
          onSelect={(id) => { avatarHooks.setAvatar(id); setShowAvatarPicker(false); }}
          onPhoto={(file) => { avatarHooks.setPhoto(file); setShowAvatarPicker(false); }}
          onClear={() => { avatarHooks.clearPhoto(); setShowAvatarPicker(false); }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      {showTickets && (
        <PlayerSaleTicketModal playerId={player.id} onClose={() => setShowTickets(false)} />
      )}

      {showSetup && (
        <div className="modal-overlay" onClick={() => {}}>
          <div className="modal-content glass-panel animated-slide" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 style={{ color: 'var(--color-gold)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px', fontFamily: 'Outfit' }}>
              ⚔️ ¡Bienvenido al club!
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Completa tu perfil para aparecer en las estadísticas del equipo.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>⭐ Fecha de nacimiento</label>
                  <input type="date" value={setupForm.birth_date} onChange={e => setSetupForm(p => ({ ...p, birth_date: e.target.value }))}
                    className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>⭐ EPS / Seguro</label>
                  <select value={setupForm.health_insurance} onChange={e => setSetupForm(p => ({ ...p, health_insurance: e.target.value }))}
                    className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }}>
                    <option value="">No tiene EPS</option>
                    <option value="Nueva EPS">Nueva EPS</option>
                    <option value="Sanitas">Sanitas</option>
                    <option value="Salud Total">Salud Total</option>
                    <option value="Coosalud">Coosalud</option>
                    <option value="Mutual Ser">Mutual Ser</option>
                    <option value="Cajacopi">Cajacopi</option>
                    <option value="Familiar de Colombia">Familiar de Colombia</option>
                    <option value="FOMAG">FOMAG</option>
                    <option value="OTRA">Otra...</option>
                  </select>
                </div>
              </div>
              {setupForm.health_insurance === 'OTRA' && (
                <input type="text" value={setupForm.custom_eps} onChange={e => setSetupForm(p => ({ ...p, custom_eps: e.target.value }))}
                  placeholder="Escribe tu EPS..." className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>⭐ Peso (kg)</label>
                  <input type="number" step="0.1" value={setupForm.weight} onChange={e => setSetupForm(p => ({ ...p, weight: e.target.value }))}
                    placeholder="Peso" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>⭐ Altura (m)</label>
                  <input type="number" step="0.01" value={setupForm.height} onChange={e => setSetupForm(p => ({ ...p, height: e.target.value }))}
                    placeholder="Altura" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
                </div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>📞 Opcionales</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Teléfono</label>
                  <input type="text" value={setupForm.contacto_phone} onChange={e => setSetupForm(p => ({ ...p, contacto_phone: e.target.value }))}
                    placeholder="Teléfono" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Contacto emergencia</label>
                  <input type="text" value={setupForm.emergency_contact_name} onChange={e => setSetupForm(p => ({ ...p, emergency_contact_name: e.target.value }))}
                    placeholder="Nombre" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Teléfono emergencia</label>
                <input type="text" value={setupForm.emergency_contact_phone} onChange={e => setSetupForm(p => ({ ...p, emergency_contact_phone: e.target.value }))}
                  placeholder="Teléfono" className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => { sessionStorage.setItem('setup_skip_' + player.id, '1'); setShowSetup(false); }}
                  className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem' }}>
                  Saltar
                </button>
                <button onClick={handleSetupSave} className="btn-neon" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem' }}>
                  💾 Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerDashboard;
