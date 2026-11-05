import React, { Suspense, useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../supabaseClient.js';
import { ClubContext } from '../context/ClubContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getOrGeneratePlan, getActivePlan } from '../engine/trainingPlanService';
import { fetchEventRsvps, upsertRsvp, fetchPlayerRsvps } from '../services/dataService';
import { useDataListener } from '../context/hooks/useDataListener';
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
import { TRACKABLE_EXERCISES } from './PlayerProgressTab';
import { HeightInput, WeightInput, SizeSelect } from './common/FormattedInputs';
import PositionSelect from './Roster/PositionSelect';
import { copyOrDownloadPlayerCard } from '../utils/exportPlayerCard';
import { printCertificateOfAffiliation } from '../utils/exportPdf';

const PlayerProgressTab = React.lazy(() => import('./PlayerProgressTab'));
const AIChat = React.lazy(() => import('./AIChat'));

function PlayerDashboard() {
  const { players, recordWellness, schedule, futureFixtures, setMatchAvailability, updatePlayer, campaigns, allPayments, logWorkout, userTier } = useContext(ClubContext);
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
  const [cardStatus, setCardStatus] = useState('');
  const [setupForm, setSetupForm] = useState({
    birth_date: '', weight: '', height: '', health_insurance: '', custom_eps: '',
    position_id: null, posicion: '',
    contacto_phone: '', emergency_contact_name: '', emergency_contact_phone: '',
    jersey: 'M', shorts: 'M', socks: '40-42',
    tracked_exercises: ['squat', 'bench', 'deadlift'],
    lifts: { squat: '', bench: '', deadlift: '' },
  });

  const player = (userTier >= 4 ? players.find(p => p.userId === user?.id) : null)
    ?? players.find(p => {
      if (profile?.display_name && p.name.toLowerCase() === profile.display_name.toLowerCase()) return true;
      if (user?.email && p.contacto?.email === user.email) return true;
      return false;
    });

  useEffect(() => {
    if (!showSetup) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && player?.id) {
        sessionStorage.setItem('setup_skip_' + player.id, '1');
        setShowSetup(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSetup, player?.id]);

  useEffect(() => {
    if (player && !player.preferences?.profile_confirmed && !sessionStorage.getItem('setup_skip_' + player.id)) {
      const cloth = player.clothingSizes || player.clothing || {};
      const tracked = Array.isArray(player.preferences?.tracked_exercises) && player.preferences.tracked_exercises.length > 0
        ? player.preferences.tracked_exercises
        : ['squat', 'bench', 'deadlift'];
      setSetupForm({
        birth_date: player.birth_date || '',
        weight: player.weight || '',
        height: player.height || '',
        position_id: player.position_id || null,
        posicion: player.posicion || '',
        health_insurance: player.health_insurance || '',
        custom_eps: '',
        contacto_phone: player.contacto?.phone || '',
        emergency_contact_name: player.emergency_contact_name || '',
        emergency_contact_phone: player.emergency_contact_phone || '',
        jersey: cloth.jersey || 'M',
        shorts: cloth.shorts || 'M',
        socks: cloth.socks || '40-42',
        tracked_exercises: tracked,
        lifts: {
          squat: player.gymStats?.squat || '',
          bench: player.gymStats?.bench || '',
          deadlift: player.gymStats?.deadlift || '',
          ...(player.preferences?.custom_lifts || {}),
        },
      });
      setShowSetup(true);
    }
  }, [player]);

  const handleSetupSave = async () => {
    const f = setupForm;
    if (!f.birth_date || !f.weight || !f.height) {
      showToast('Completa fecha de nacimiento, peso y altura para iniciar tu historial.', 'error');
      return;
    }
    const calcAge = f.birth_date
      ? Math.max(0, Math.floor((Date.now() - new Date(f.birth_date).getTime()) / 31557600000))
      : null;

    const tracked = f.tracked_exercises || [];
    const squatVal = tracked.includes('squat') ? Number(f.lifts?.squat || 0) : Number(player.gymStats?.squat || 0);
    const benchVal = tracked.includes('bench') ? Number(f.lifts?.bench || 0) : Number(player.gymStats?.bench || 0);
    const deadliftVal = tracked.includes('deadlift') ? Number(f.lifts?.deadlift || 0) : Number(player.gymStats?.deadlift || 0);
    const customLifts = {};
    TRACKABLE_EXERCISES.forEach(ex => {
      if (!['squat', 'bench', 'deadlift'].includes(ex.key) && tracked.includes(ex.key)) {
        customLifts[ex.key] = Number(f.lifts?.[ex.key] || 0);
      }
    });

    const nextPrefs = {
      ...(player.preferences || {}),
      profile_confirmed: true,
      profile_confirmed_at: new Date().toISOString(),
      tracked_exercises: tracked,
      custom_lifts: customLifts,
    };

    try {
      await supabase.rpc('player_record_progress_snapshot', {
        p_player_id: player.id,
        p_weight: Number(f.weight),
        p_height: Number(f.height),
        p_squat: squatVal,
        p_bench: benchVal,
        p_deadlift: deadliftVal,
        p_custom_lifts: customLifts,
        p_tracked_exercises: tracked,
      });
    } catch {
      // Fallback handled by updatePlayer below
    }

    await updatePlayer({
      ...player,
      name: player.name,
      position_id: f.position_id || player.position_id || null,
      posicion: f.posicion || player.posicion || '',
      birth_date: f.birth_date || null,
      ...(calcAge != null && { age: calcAge }),
      weight: Number(f.weight),
      height: Number(f.height),
      clothingSizes: { jersey: f.jersey || 'M', shorts: f.shorts || 'M', socks: f.socks || '40-42' },
      gymStats: { squat: squatVal, bench: benchVal, deadlift: deadliftVal },
      health_insurance: f.health_insurance === 'OTRA' ? (f.custom_eps || null) : f.health_insurance || null,
      contacto: { phone: f.contacto_phone || null, email: player.contacto?.email },
      emergency_contact_name: f.emergency_contact_name || null,
      emergency_contact_phone: f.emergency_contact_phone || null,
      preferences: nextPrefs,
    });
    setShowSetup(false);
    showToast('¡Datos confirmados e historial de progreso iniciado!', 'success');
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
      const data = await fetchEventRsvps(event.id);
      if (data) setRsvpList(data);
    } catch { setRsvpList([]); }
  };

  const handleRsvp = async (eventId, status) => {
    if (!player?.id) return;
    try {
      await upsertRsvp(player.id, eventId, status);
      const data = await fetchEventRsvps(eventId);
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
    fetchPlayerRsvps(player.id).then((data) => {
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

  const playerRef = useRef(player);
  playerRef.current = player;
  useDataListener('event_rsvp', () => {
    if (playerRef.current?.id) {
      fetchPlayerRsvps(playerRef.current.id).then((data) => {
        if (data) {
          const map = {};
          data.forEach(r => { map[r.event_id] = r.status; });
          setMyRsvpMap(map);
        }
      }).catch(() => {});
    }
  });
  useDataListener('training_plans', () => {
    if (playerRef.current?.id) setPlanVersion(v => v + 1);
  });
  useDataListener('attendance', () => {
    if (playerRef.current?.id) setPlanVersion(v => v + 1);
  });
  useDataListener('player_payments', () => {
    if (playerRef.current?.id) setPlanVersion(v => v + 1);
  });

  const handleGeneratePlan = () => {
    if (!player) return;
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

  const handleExportPlayerCard = async (quality = 'standard') => {
    if (!player) return;
    const is4k = quality === '4k';
    setCardStatus(is4k ? 'Generando Ficha 4K...' : 'Generando Ficha HD...');
    try {
      const res = await copyOrDownloadPlayerCard(player, 'Rugby Orcos Negros Club', { quality });
      if (res?.copied) {
        setCardStatus(is4k ? '✅ Ficha 4K Copiada' : '✅ Ficha Copiada');
        showToast(is4k ? 'Ficha Ultra 4K de Guerrero copiada y descargada.' : 'Ficha de Guerrero copiada y descargada.', 'success');
      } else {
        setCardStatus(is4k ? '✅ Ficha 4K Descargada' : '✅ Ficha Descargada');
        showToast(is4k ? 'Ficha Ultra 4K de Guerrero descargada con éxito.' : 'Ficha de Guerrero descargada con éxito.', 'success');
      }
    } catch {
      setCardStatus('⚠️ Error al generar');
      showToast('Error al generar la ficha de guerrero.', 'error');
    }
    setTimeout(() => setCardStatus(''), 4000);
  };

  const handlePrintPazYSalvo = () => {
    if (!player) return;
    printCertificateOfAffiliation({
      player,
      teamLabel: 'Rugby Orcos Negros Club',
      division: player.teamCategory || 'Masculina Mayor',
    });
  };

  if (!player) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-gold)' }}>Guerrero no encontrado</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Contacta a tu Comandante de Horda para vincular tu cuenta.</p>
      </div>
    );
  }

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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleExportPlayerCard('standard')}
            className="btn-outline"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              borderColor: 'rgba(255, 215, 64, 0.45)',
              color: 'var(--color-gold)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Genera tu Ficha de Guerrero RPG oficial en HD para descargar y compartir en Instagram Stories / WhatsApp"
          >
            🎴 {cardStatus.includes('4K') ? 'Ficha HD' : (cardStatus || 'Ficha HD')}
          </button>

          <button
            onClick={() => handleExportPlayerCard('4k')}
            className="btn-outline"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              borderColor: 'rgba(0, 230, 118, 0.45)',
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Genera tu Ficha de Guerrero RPG en resolución ULTRA 4K (2400x2400px con tu foto local)"
          >
            💎 Ficha 4K Ultra
          </button>

          <button
            onClick={handlePrintPazYSalvo}
            className="btn-outline"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              borderColor: 'rgba(0, 230, 118, 0.4)',
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Genera e imprime tu Certificado Oficial de Afiliación y Paz y Salvo en PDF"
          >
            📜 Certificado & Paz y Salvo PDF
          </button>
        </div>

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
                playerId={player.id}
                myTeamEvents={myTeamEvents}
                myUpcomingMatches={myUpcomingMatches}
                allCalendarEvents={allCalendarEvents}
                handleOpenDetail={handleOpenDetail}
                eventRsvpCounts={eventRsvpCounts}
                myRsvp={myRsvp}
                myRsvpMap={myRsvpMap}
                onRsvp={handleRsvp}
                onSetMatchAvailability={setMatchAvailability}
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
        <div className="modal-overlay" onClick={() => { sessionStorage.setItem('setup_skip_' + player.id, '1'); setShowSetup(false); }}>
          <div className="modal-content glass-panel animated-slide" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div>
                <h3 style={{ color: 'var(--color-gold)', fontSize: '1.15rem', fontWeight: 800, marginBottom: '4px', fontFamily: 'Outfit' }}>
                  Verifica tus Datos e Inicia tu Historial de Progreso
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                  Revisa tus datos registrados, confirma tus tallas de uniforme y selecciona qué ejercicios de fuerza realizas para llevar tu curva de progreso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { sessionStorage.setItem('setup_skip_' + player.id, '1'); setShowSetup(false); }}
                className="btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.85rem', color: 'var(--color-text-muted)', borderColor: 'rgba(255,255,255,0.15)' }}
                title="Cerrar y recordar luego"
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Fecha de nacimiento *</label>
                  <input type="date" value={setupForm.birth_date} onChange={e => setSetupForm(p => ({ ...p, birth_date: e.target.value }))}
                    className="form-input" style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>EPS / Seguro Médico</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Posición en Cancha</label>
                  <PositionSelect
                    value={setupForm.position_id}
                    onChange={({ position_id, position_name }) => setSetupForm(p => ({ ...p, position_id, posicion: position_name }))}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '0.76rem' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Peso Actual (KG) *</label>
                  <WeightInput
                    value={setupForm.weight}
                    onChange={e => setSetupForm(p => ({ ...p, weight: e.target.value }))}
                    placeholder="85"
                    style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Altura (Ej. 1,85M) *</label>
                  <HeightInput
                    value={setupForm.height}
                    onChange={e => setSetupForm(p => ({ ...p, height: e.target.value }))}
                    placeholder="1,85"
                    style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(64,196,255,0.05)', border: '1px solid rgba(64,196,255,0.18)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#40c4ff', marginBottom: '6px' }}>Tallas de Uniforme / Kit</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Camiseta</label>
                    <SizeSelect
                      kind="jersey"
                      value={setupForm.jersey}
                      onChange={e => setSetupForm(p => ({ ...p, jersey: e.target.value }))}
                      style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Pantaloneta</label>
                    <SizeSelect
                      kind="shorts"
                      value={setupForm.shorts}
                      onChange={e => setSetupForm(p => ({ ...p, shorts: e.target.value }))}
                      style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Medias</label>
                    <SizeSelect
                      kind="socks"
                      value={setupForm.socks}
                      onChange={e => setSetupForm(p => ({ ...p, socks: e.target.value }))}
                      style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.18)' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
                  ¿Qué ejercicios realizas y cuánto levantas hoy? (Desmarca los que no hagas)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {TRACKABLE_EXERCISES.map(ex => {
                    const isChecked = (setupForm.tracked_exercises || []).includes(ex.key);
                    return (
                      <div key={ex.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '5px 8px', borderRadius: '6px', background: isChecked ? 'rgba(0,230,118,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isChecked ? 'rgba(0,230,118,0.22)' : 'var(--border-glass)'}` }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.73rem', cursor: 'pointer', margin: 0, flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSetupForm(p => {
                                const curr = p.tracked_exercises || [];
                                const next = curr.includes(ex.key) ? curr.filter(k => k !== ex.key) : [...curr, ex.key];
                                return { ...p, tracked_exercises: next };
                              });
                            }}
                            style={{ accentColor: 'var(--color-primary)' }}
                          />
                          <span>{ex.label}</span>
                        </label>
                        {isChecked && (
                          <WeightInput
                            value={setupForm.lifts?.[ex.key] ?? ''}
                            onChange={e => setSetupForm(p => ({ ...p, lifts: { ...(p.lifts || {}), [ex.key]: e.target.value } }))}
                            placeholder="0"
                            style={{ width: '92px', padding: '3px 6px', fontSize: '0.74rem', textAlign: 'right' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Teléfono</label>
                  <input type="text" value={setupForm.contacto_phone} onChange={e => setSetupForm(p => ({ ...p, contacto_phone: e.target.value }))}
                    placeholder="Teléfono" className="form-input" style={{ padding: '6px 8px', fontSize: '0.76rem' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Contacto emergencia</label>
                  <input type="text" value={setupForm.emergency_contact_name} onChange={e => setSetupForm(p => ({ ...p, emergency_contact_name: e.target.value }))}
                    placeholder="Nombre" className="form-input" style={{ padding: '6px 8px', fontSize: '0.76rem' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Tel. emergencia</label>
                  <input type="text" value={setupForm.emergency_contact_phone} onChange={e => setSetupForm(p => ({ ...p, emergency_contact_phone: e.target.value }))}
                    placeholder="Teléfono" className="form-input" style={{ padding: '6px 8px', fontSize: '0.76rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button onClick={() => { sessionStorage.setItem('setup_skip_' + player.id, '1'); setShowSetup(false); }}
                  className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem' }}>
                  Recordarme luego
                </button>
                <button onClick={handleSetupSave} className="btn-neon" style={{ flex: 2, justifyContent: 'center', padding: '8px', fontSize: '0.8rem' }}>
                  Confirmar Datos e Iniciar Historial
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
