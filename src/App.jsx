import React, { useState, useContext, useRef } from 'react';
import { ClubContext, DIVISIONES, DIVISIONES_LABELS } from './context/ClubContext';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Roster from './components/Roster';
import CanchaTactica from './components/CanchaTactica';
import Tribunal from './components/Tribunal';
import Calendario from './components/Calendario';
import Finanzas from './components/Finanzas';
import TrainingHub from './components/TrainingHub';
import AIChat from './components/AIChat';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import PlayerDashboard from './components/PlayerDashboard';
import AwardsHall from './components/AwardsHall';
import MakgoraHub from './components/MakgoraHub';
import { isGeminiConfigured } from './engine/geminiCoach';

const RPG_TITLES = {
  desarrollador: 'Arquitecto del Reino',
  presidente: 'Señor de la Guerra',
  promotor: 'Comandante de Horda',
  entrenador: 'Maestro de Armas',
  tesorero: 'Guardian del Botin',
  arbitro: 'Juez del Coliseo',
  jugador: 'Guerrero',
};

function getRpgTitle(role) {
  return RPG_TITLES[role] || role;
}

function App() {
  const { activeTeam, setActiveTeam, exportData, importData, hasPermission, getAllClubs, getAllClubsLabels, addClub, deleteClub, dynamicClubs, syncStatus } = useContext(ClubContext);
  const { isAuthenticated, signOut, profile } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState('users');
  const [newClubName, setNewClubName] = useState('');
  const fileInputRef = useRef(null);

  if (!isAuthenticated) {
    return <Login />;
  }

  if (profile?.system_role === 'jugador') {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <PlayerDashboard />
        <footer style={{ textAlign: 'center', padding: '15px', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--border-glass)' }}>
          Rugby Orcos Negros 2026. Fuerza, Honor y Tercer Tiempo.
        </footer>
      </div>
    );
  }

  const parts = activeTeam ? activeTeam.split('_') : ['orcos', 'masculina', 'mayor'];
  const currentClub = parts[0] || 'orcos';
  const currentDivision = parts.slice(1).join('_') || 'masculina_mayor';

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

  const allClubs = getAllClubs();
  const allLabels = getAllClubsLabels();

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      <header className="glass-panel" style={{
        margin: '15px',
        padding: '15px 25px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '15px',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img
            src="/assets/orcos_logo.png"
            alt="Rugby Orcos Negros Shield"
            style={{
              width: '55px',
              height: '55px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 10px var(--color-primary-glow))',
              animation: 'pulseGlow 3s infinite ease-in-out'
            }}
          />
          <div>
            <h1 className="neon-text-primary" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '1px' }}>
              RUGBY ORCOS NEGROS
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>
              Reino Manager v4.0
              {profile && (
                <span style={{ color: 'var(--color-gold)', marginLeft: '6px' }}>
                  · {getRpgTitle(profile.system_role)} {syncStatus === 'syncing' && '· Sincronizando...'} {syncStatus === 'online' && '· ☁️'} {syncStatus === 'offline' && '· 📱'}
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Club / Equipo
            </label>
            <select
              value={currentClub}
              onChange={(e) => {
                const newClub = e.target.value;
                setActiveTeam(`${newClub}_${currentDivision}`);
              }}
              className="form-select"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--color-gold)',
                color: 'var(--color-gold)',
                fontWeight: '700',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(212, 175, 55, 0.15)'
              }}
            >
              {Object.values(allClubs).map((code) => (
                <option key={code} value={code}>
                  {allLabels[code] || code}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Division / Categoria
            </label>
            <select
              value={currentDivision}
              onChange={(e) => {
                const newDiv = e.target.value;
                setActiveTeam(`${currentClub}_${newDiv}`);
              }}
              className="form-select"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--color-primary)',
                color: 'var(--color-primary)',
                fontWeight: '700',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                boxShadow: '0 0 10px var(--color-primary-glow)'
              }}
            >
              {Object.keys(DIVISIONES).map((key) => (
                <option key={key} value={DIVISIONES[key]}>
                  {DIVISIONES_LABELS[DIVISIONES[key]]}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', height: '38px' }}>
            {hasPermission('admin_panel') && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="btn-outline"
                title="Panel de Administracion (Super Rol)"
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  borderColor: showAdminPanel ? 'var(--color-red)' : 'var(--color-gold)',
                  background: showAdminPanel ? 'rgba(255, 61, 0, 0.08)' : 'transparent'
                }}
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="btn-outline"
              title="Configuracion de Inteligencia Artificial"
              style={{
                padding: '8px 12px',
                fontSize: '0.8rem',
                borderColor: isGeminiConfigured() ? 'var(--color-primary)' : 'var(--border-glass)',
                background: isGeminiConfigured() ? 'rgba(0, 230, 118, 0.05)' : 'transparent'
              }}
            >
              {isGeminiConfigured() ? 'IA Activa' : 'IA'}
            </button>
            <button
              onClick={exportData}
              className="btn-outline"
              title="Exportar Base de Datos"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
            >
              Respaldar
            </button>
            <button
              onClick={triggerImportClick}
              className="btn-outline"
              title="Importar Base de Datos"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
            >
              Cargar
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
            <button
              onClick={handleLogout}
              className="btn-outline"
              title="Cerrar sesion"
              style={{ padding: '8px 12px', fontSize: '0.8rem', borderColor: 'var(--color-red)', color: 'var(--color-red)' }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {showAdminPanel && hasPermission('admin_panel') && (
        <div className="glass-panel animated-slide" style={{
          margin: '0 15px 10px 15px',
          padding: '20px 25px',
          borderRadius: 'var(--radius-md)',
          borderLeft: '3px solid var(--color-gold)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>
              Administracion del Reino
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => setAdminSubTab('users')} className={adminSubTab === 'users' ? 'btn-neon' : 'btn-outline'}
              style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
              Miembros
            </button>
            <button onClick={() => setAdminSubTab('clubs')} className={adminSubTab === 'clubs' ? 'btn-neon' : 'btn-outline'}
              style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
              Equipos
            </button>
          </div>

          {adminSubTab === 'users' && <UserManagement />}
          {adminSubTab === 'clubs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Crear Nuevo Equipo</h4>
                <form onSubmit={handleAddClub} style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={newClubName} onChange={(e) => setNewClubName(e.target.value)}
                    placeholder="Nombre del equipo" className="form-input" style={{ flex: 1 }} />
                  <button type="submit" className="btn-neon" style={{ padding: '8px 16px' }}>Crear</button>
                </form>
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Equipos Actuales</h4>
                {Object.keys(dynamicClubs).length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No hay equipos dinamicos.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(dynamicClubs).map(([key, code]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.85rem' }}>{allLabels[code] || code}</span>
                        <button onClick={() => { if (window.confirm(`Eliminar "${allLabels[code]}"?`)) { deleteClub(code); showToast(`"${allLabels[code]}" eliminado.`, 'info'); } }}
                          style={{ background: 'rgba(255, 61, 0, 0.1)', border: '1px solid var(--color-red)', color: 'var(--color-red)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <nav className="tabs-navigation">
        <button onClick={() => setActiveTab('dashboard')} className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}>
          Dashboard
        </button>
        <button onClick={() => setActiveTab('roster')} className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}>
          Roster
        </button>
        <button onClick={() => setActiveTab('cancha')} className={`tab-btn ${activeTab === 'cancha' ? 'active' : ''}`}>
          Pizarra Tactica
        </button>
        <button onClick={() => setActiveTab('tribunal')} className={`tab-btn ${activeTab === 'tribunal' ? 'active' : ''}`}>
          Tribunal
        </button>
        <button onClick={() => setActiveTab('awards')} className={`tab-btn ${activeTab === 'awards' ? 'active' : ''}`}>
          Salon de la Fama
        </button>
        <button onClick={() => setActiveTab('makgora')} className={`tab-btn ${activeTab === 'makgora' ? 'active' : ''}`}>
          Mak'Gora
        </button>
        <button onClick={() => setActiveTab('calendario')} className={`tab-btn ${activeTab === 'calendario' ? 'active' : ''}`}>
          Agenda
        </button>
        <button onClick={() => setActiveTab('finanzas')} className={`tab-btn ${activeTab === 'finanzas' ? 'active' : ''}`}>
          Finanzas
        </button>
        <button onClick={() => setActiveTab('entrenamientos')} className={`tab-btn ${activeTab === 'entrenamientos' ? 'active' : ''}`}>
          Entrenamientos
        </button>
        <button onClick={() => setActiveTab('ia')} className={`tab-btn ${activeTab === 'ia' ? 'active' : ''}`}>
          IA
        </button>
      </nav>

      <main style={{ flex: 1, padding: '15px 15px 40px 15px' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'roster' && <Roster />}
        {activeTab === 'cancha' && <CanchaTactica />}
        {activeTab === 'tribunal' && <Tribunal />}
        {activeTab === 'awards' && <AwardsHall />}
        {activeTab === 'makgora' && <MakgoraHub />}
        {activeTab === 'calendario' && <Calendario />}
        {activeTab === 'finanzas' && <Finanzas />}
        {activeTab === 'entrenamientos' && <TrainingHub />}
        {activeTab === 'ia' && <AIChat />}
      </main>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      <footer style={{
        textAlign: 'center',
        padding: '15px',
        fontSize: '0.75rem',
        color: 'var(--color-text-muted)',
        borderTop: '1px solid var(--border-glass)'
      }}>
        Rugby Orcos Negros 2026. Fuerza, Honor y Tercer Tiempo.
      </footer>

    </div>
  );
}

export default App;
