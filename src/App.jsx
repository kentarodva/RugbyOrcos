import React, { useState, useContext, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClubContext } from './context/ClubContext';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Header from './components/Header';
import AdminPanel from './components/Admin/AdminPanel';
import Footer from './components/Footer';
import AnnouncementModal from './components/AnnouncementModal';
import BirthdayCelebration from './components/BirthdayCelebration';
import ImportCSVModal from './components/Admin/ImportCSVModal';
import Sidebar, { QuickNavBar } from './components/Sidebar';
import { ChangePasswordModal } from './components/Auth/ChangePasswordModal';
import apisupabase, { supabasePlayerToReact } from './data/supabaseApi';

import { useGlobalShortcuts } from './utils/keyboardShortcuts';
import { addPushNavigateListener } from './utils/pushNotifications';
import ErrorBoundary from './components/ErrorBoundary';
import { lazyWithRetry } from './utils/lazyWithRetry';

const Roster = lazyWithRetry(() => import('./components/Roster'));
const Tribunal = lazyWithRetry(() => import('./components/Tribunal'));
const Calendario = lazyWithRetry(() => import('./components/Calendario'));
const Finanzas = lazyWithRetry(() => import('./components/Finanzas'));
const PlayerDashboard = lazyWithRetry(() => import('./components/PlayerDashboard'));
const AwardsHall = lazyWithRetry(() => import('./components/AwardsHall'));
const MakgoraHub = lazyWithRetry(() => import('./components/MakgoraHub'));
const MatchInvitation = lazyWithRetry(() => import('./components/MatchInvitation'));
const Invitaciones = lazyWithRetry(() => import('./components/Invitaciones'));
const Messages = lazyWithRetry(() => import('./components/Messages'));
const CanchaTactica = lazyWithRetry(() => import('./components/CanchaTactica'));
const TrainingHub = lazyWithRetry(() => import('./components/TrainingHub'));
const AIChat = lazyWithRetry(() => import('./components/AIChat'));
const Estadisticas = lazyWithRetry(() => import('./components/Estadisticas'));

function App() {
  const {
    exportData, importData, hasPermission,
    getAllClubsLabels, addClub, deleteClub, dynamicClubs, syncStatus,
    viewMode, setViewMode, divisionView, setDivisionView,
    makgoraTeamId, setMakgoraTeamId, makgoraTeams, setPlayers,
    liveMatch,
  } = useContext(ClubContext);
  const { isAuthenticated, signOut, profile, user, requirePasswordChange, clearPasswordChangeFlag } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState('users');
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('orcos_theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('orcos_theme', theme); } catch (e) { /* localStorage no disponible */ }
  }, [theme]);

  useGlobalShortcuts(activeTab, setActiveTab);

  useEffect(() => {
    return addPushNavigateListener(({ tab }) => {
      if (tab && typeof tab === 'string') {
        setActiveTab(tab);
      }
    });
  }, []);

  if (window.location.pathname.startsWith('/invitacion/') || window.location.pathname.startsWith('/invitation/')) {
    return <MatchInvitation />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (requirePasswordChange) {
    return <ChangePasswordModal onPasswordChanged={clearPasswordChangeFlag} />;
  }

  if (profile?.system_role === 'jugador') {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <PlayerDashboard />
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-root)', padding: '20px' }}>
        <div className="glass-panel" style={{ maxWidth: '440px', padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <span style={{ fontSize: '3rem' }}>🛡️</span>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-gold)' }}>
            Sin rango en el Reino
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Tu cuenta fue autenticada pero no tiene un rol asignado en el sistema.
            Esto suele pasar cuando el perfil en <strong>user_profiles</strong> no existe o no esta vinculado a tu cuenta.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            Contacta al <strong>Arquitecto del Reino</strong> o <strong>Senor de la Guerra</strong> para que repare tu perfil.
          </p>
          <button onClick={() => signOut()}
            className="btn-outline"
            style={{ padding: '10px', fontSize: '0.85rem', color: 'var(--color-red)', borderColor: 'var(--color-red)', alignSelf: 'center' }}>
            Cerrar Sesion
          </button>
        </div>
      </div>
    );
  }

  const handleImportFileChange = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      const success = importData(event.target.result);
      if (success) {
        showToast('Base de datos del club restaurada correctamente. ' + file.name, 'success');
      } else {
        showToast('Error al leer el archivo JSON. Verifica que sea un respaldo valido.', 'error');
      }
    };

    fileReader.onerror = () => {
      showToast('Error al leer el archivo.', 'error');
    };

    fileReader.readAsText(file, "UTF-8");
    e.target.value = '';
  };

  const triggerImportClick = () => {
    fileInputRef.current.click();
  };

  const handleImportCSV = async (players) => {
    if (!user) {
      showToast('Debes iniciar sesion para importar.', 'error');
      return;
    }
    const { data, error } = await apisupabase.batchUpsertPlayers(players, user.id);
    if (error) throw error;
    if (data?.length && setPlayers) {
      const imported = data.map(supabasePlayerToReact);
      setPlayers(prev => {
        const byId = new Map((prev || []).map(p => [p.id, p]));
        imported.forEach(p => byId.set(p.id, p));
        return Array.from(byId.values());
      });
    }
    showToast(`${data?.length || players.length} jugadores importados correctamente.`, 'success');
  };

  const handleAddClub = (e) => {
    e.preventDefault();
    if (!newClubName.trim()) return;
    const code = newClubName.toLowerCase().replace(/\s+/g, '_');
    const ok = addClub(newClubName, code);
    if (ok) {
      showToast(`Club "${newClubName}" creado con exito.`, 'success');
      setNewClubName('');
    } else {
      showToast('Error: nombre duplicado o sin permisos.', 'error');
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const allLabels = getAllClubsLabels();

  const tabVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        profile={profile}
        syncStatus={syncStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        divisionView={divisionView}
        setDivisionView={setDivisionView}
        makgoraTeamId={makgoraTeamId}
        setMakgoraTeamId={setMakgoraTeamId}
        makgoraTeams={makgoraTeams}
        hasPermission={hasPermission}
        showAdminPanel={showAdminPanel}
        setShowAdminPanel={setShowAdminPanel}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showImportCSV={showImportCSV}
        setShowImportCSV={setShowImportCSV}
        fileInputRef={fileInputRef}
        handleImportFileChange={handleImportFileChange}
        triggerImportClick={triggerImportClick}
        handleLogout={handleLogout}
        exportData={exportData}
      />

      {isAuthenticated && <QuickNavBar activeTab={activeTab} setActiveTab={setActiveTab} hasPermission={hasPermission} profile={profile} onOpenDrawer={() => setSidebarOpen(true)} />}

      {isAuthenticated && liveMatch && (liveMatch.status === 'live' || liveMatch.status === 'paused' || liveMatch.status === 'delayed') && (
        <div
          onClick={() => setActiveTab('calendario')}
          style={{
            background: liveMatch.status === 'delayed'
              ? 'linear-gradient(90deg, rgba(255, 171, 0, 0.25) 0%, rgba(10, 20, 32, 0.95) 50%, rgba(255, 171, 0, 0.25) 100%)'
              : 'linear-gradient(90deg, rgba(255, 23, 68, 0.22) 0%, rgba(10, 20, 32, 0.95) 50%, rgba(0, 230, 118, 0.22) 100%)',
            borderBottom: `1px solid ${liveMatch.status === 'delayed' ? 'var(--color-orange, #ffab00)' : 'var(--color-primary)'}`,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 800,
            zIndex: 900,
            transition: 'background 0.2s ease',
          }}
          title="Clic para ir directamente a la transmisión del partido en vivo"
        >
          <span style={{ color: liveMatch.status === 'delayed' ? '#ffab00' : '#ff1744', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: liveMatch.status === 'delayed' ? '#ffab00' : '#ff1744', display: 'inline-block' }} />
            {liveMatch.status === 'live' ? 'PARTIDO EN VIVO' : liveMatch.status === 'delayed' ? 'PARTIDO EN ESPERA (COROZAL)' : 'PARTIDO PAUSADO'}:
          </span>
          <span style={{ color: 'var(--color-primary)' }}>Orcos {liveMatch.orcos_score ?? 0}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>vs</span>
          <span style={{ color: '#fff' }}>{liveMatch.opponent_name || 'Rival'} {liveMatch.opponent_score ?? 0}</span>
          {liveMatch.status === 'delayed' && liveMatch.delay_reason && (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem', fontStyle: 'italic' }}>
              ({liveMatch.delay_reason})
            </span>
          )}
          <span style={{ color: 'var(--color-gold)', fontSize: '0.72rem', border: '1px solid var(--color-gold)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
            Ver Partido ➔
          </span>
        </div>
      )}
      {showAdminPanel && hasPermission('admin_panel') && (
        <motion.div key="admin" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
        <AdminPanel
          hasPermission={hasPermission}
          adminSubTab={adminSubTab}
          setAdminSubTab={setAdminSubTab}
          handleAddClub={handleAddClub}
          newClubName={newClubName}
          setNewClubName={setNewClubName}
          dynamicClubs={dynamicClubs}
          allLabels={allLabels}
          deleteClub={deleteClub}
          showToast={showToast}
        />
        </motion.div>
      )}

      <main style={{ flex: 1, padding: '15px 15px 40px 15px' }}>
        <AnimatePresence mode="wait">
        <ErrorBoundary>
        <Suspense fallback={<motion.div key="suspense" className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >Cargando modulo...</motion.div>}>
        {activeTab === 'dashboard' && <motion.div key="dashboard" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><Dashboard onNavigate={setActiveTab} /></motion.div>}
        {activeTab === 'mi_ficha' && <motion.div key="mi_ficha" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><PlayerDashboard /></motion.div>}
        {activeTab === 'roster' && <motion.div key="roster" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><Roster /></motion.div>}
        {activeTab === 'estadisticas' && <motion.div key="estadisticas" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><Estadisticas /></motion.div>}
        {activeTab === 'cancha' && <motion.div key="cancha" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><CanchaTactica /></motion.div>}
        {activeTab === 'tribunal' && <motion.div key="tribunal" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><Tribunal /></motion.div>}
        {activeTab === 'awards' && <motion.div key="awards" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><AwardsHall /></motion.div>}
        {activeTab === 'makgora' && <motion.div key="makgora" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><MakgoraHub /></motion.div>}
        {activeTab === 'calendario' && <motion.div key="calendario" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><Calendario /></motion.div>}
        {activeTab === 'invitaciones' && <motion.div key="invitaciones" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><Invitaciones /></motion.div>}
        {activeTab === 'finanzas' && <motion.div key="finanzas" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><Finanzas /></motion.div>}
        {activeTab === 'entrenamientos' && <motion.div key="entrenamientos" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><TrainingHub /></motion.div>}
        {activeTab === 'messages' && <motion.div key="messages" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><Messages /></motion.div>}
        {activeTab === 'ia' && <motion.div key="ia" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><AIChat /></motion.div>}
        </Suspense>
        </ErrorBoundary>
        </AnimatePresence>
      </main>

      <AnimatePresence>
      {showImportCSV && (
        <motion.div key="importcsv"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <ImportCSVModal
            onClose={() => setShowImportCSV(false)}
            onImport={handleImportCSV}
            makgoraTeams={makgoraTeams || []}
          />
        </motion.div>
      )}
      {showSettings && (
        <motion.div key="settings"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <Settings onClose={() => setShowSettings(false)} theme={theme} setTheme={setTheme} />
        </motion.div>
      )}
      {showAnnouncements && isAuthenticated && (
        <motion.div key="announcements"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <AnnouncementModal onClose={() => setShowAnnouncements(false)} />
        </motion.div>
      )}
      </AnimatePresence>
      {isAuthenticated && <BirthdayCelebration />}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasPermission={hasPermission}
        profile={profile}
      />

      <Footer />

    </div>
  );
}

export default App;
