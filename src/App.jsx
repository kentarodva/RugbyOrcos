import React, { useState, useContext, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClubContext } from './context/ClubContext';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Roster from './components/Roster';
import Tribunal from './components/Tribunal';
import Calendario from './components/Calendario';
import Finanzas from './components/Finanzas';
import Settings from './components/Settings';
import PlayerDashboard from './components/PlayerDashboard';
import Header from './components/Header';
import AdminPanel from './components/Admin/AdminPanel';
import Footer from './components/Footer';
import AwardsHall from './components/AwardsHall';
import MakgoraHub from './components/MakgoraHub';
import MatchInvitation from './components/MatchInvitation';
import Invitaciones from './components/Invitaciones';
import Messages from './components/Messages';
import AnnouncementModal from './components/AnnouncementModal';
import BirthdayCelebration from './components/BirthdayCelebration';
import ImportCSVModal from './components/Admin/ImportCSVModal';
import Sidebar from './components/Sidebar';
import apisupabase from './data/supabaseApi';

import { useGlobalShortcuts } from './utils/keyboardShortcuts';
import { addPushNavigateListener } from './utils/pushNotifications';

const CanchaTactica = lazy(() => import('./components/CanchaTactica'));
const TrainingHub = lazy(() => import('./components/TrainingHub'));
const AIChat = lazy(() => import('./components/AIChat'));
const Estadisticas = lazy(() => import('./components/Estadisticas'));

function App() {
  const {
    exportData, importData, hasPermission,
    getAllClubsLabels, addClub, deleteClub, dynamicClubs, syncStatus,
    viewMode, setViewMode, divisionView, setDivisionView,
    makgoraTeamId, setMakgoraTeamId, makgoraTeams,
  } = useContext(ClubContext);
  const { isAuthenticated, signOut, profile, user } = useAuth();
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

  if (profile?.system_role === 'jugador') {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <PlayerDashboard />
        <Footer />
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
        <Suspense fallback={<motion.div key="suspense" className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >Cargando modulo...</motion.div>}>
        {activeTab === 'dashboard' && <motion.div key="dashboard" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}><Dashboard /></motion.div>}
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
          <Settings onClose={() => setShowSettings(false)} />
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
      />

      <Footer />

    </div>
  );
}

export default App;
