import React from 'react';
import { DIVISIONES, DIVISIONES_LABELS } from '../context/ClubContext';
import { isGeminiConfigured } from '../engine/multiProviderCoach';
import { useAuth } from '../context/AuthContext';
import NavBar from './NavBar';
import NotificationsButton from './Notifications/NotificationsButton';

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

export default function Header({
  sidebarOpen, setSidebarOpen,
  profile, syncStatus,
  viewMode, setViewMode,
  divisionView, setDivisionView,
  makgoraTeamId, setMakgoraTeamId, makgoraTeams,
  hasPermission,
  showAdminPanel, setShowAdminPanel,
  _showSettings, setShowSettings,
  _showImportCSV, setShowImportCSV,
  fileInputRef,
  handleImportFileChange, triggerImportClick, handleLogout,
  exportData,
}) {
  const { forceAdmin } = useAuth();
  return (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <NavBar onClick={() => setSidebarOpen(!sidebarOpen)} open={sidebarOpen} />
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
              <span style={{ color: 'var(--color-gold)', marginLeft: '6px' }}>
                {profile?.display_name ? (
                  <> · <span style={{ fontWeight: 700 }}>{profile.display_name}</span> ({getRpgTitle(profile.system_role)})</>
                ) : profile?.system_role ? (
                  <> · {getRpgTitle(profile.system_role)}</>
                ) : (
                  <> · (Sin rango)</>
                )}
                {/* ⚠️ RESPALDO: cambiar false por (!profile || (profile.system_role !== 'desarrollador' && profile.system_role !== 'presidente')) para reactivar */}
                {false && (
                  <button
                    onClick={async () => {
                      const ok = await forceAdmin();
                      if (ok) window.location.reload();
                    }}
                    title="Reparar permisos de administrador"
                    style={{
                      marginLeft: '6px',
                      background: 'rgba(255,179,0,0.12)',
                      border: '1px solid rgba(255,179,0,0.4)',
                      color: '#ffb300',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                    }}
                  >⚠️ Reparar Admin</button>
                )}
                {syncStatus === 'idle' && (
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }} title="Conectando al Reino...">· ⏳ Conectando...</span>
                )}
                {syncStatus === 'syncing' && (
                  <span style={{ color: 'var(--color-blue)', marginLeft: '6px' }} title="Sincronizando con Supabase...">· 🔄 Sincronizando...</span>
                )}
                {syncStatus === 'online' && (
                  <span style={{ color: 'var(--color-primary)', marginLeft: '6px' }} title="Conectado a Supabase">· ☁️ Online</span>
                )}
                {syncStatus === 'offline' && (
                  <span style={{ color: 'var(--color-gold)', marginLeft: '6px' }} title="Trabajando sin conexión. Los cambios se guardan localmente.">· 📱 Offline</span>
                )}
              </span>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        {/* View Mode Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Vista
          </label>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
            <button
              onClick={() => setViewMode('general')}
              className={viewMode === 'general' ? 'btn-neon' : 'btn-outline'}
              style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}
            >
              General
            </button>
            <button
              onClick={() => setViewMode('makgora')}
              className={viewMode === 'makgora' ? 'btn-neon' : 'btn-outline'}
              style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Mak'Gora
            </button>
          </div>
        </div>

        {/* Division selector (both modes) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Division / Categoria
          </label>
          <select
            value={divisionView}
            onChange={(e) => setDivisionView(e.target.value)}
            className="form-select"
            style={{
              background: 'var(--bg-input)',
              border: `1px solid ${viewMode === 'makgora' ? 'var(--color-gold)' : 'var(--color-primary)'}`,
              color: viewMode === 'makgora' ? 'var(--color-gold)' : 'var(--color-primary)',
              fontWeight: '700',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: viewMode === 'makgora' ? '0 0 10px rgba(255,179,0,0.2)' : '0 0 10px var(--color-primary-glow)'
            }}
          >
            <option value="all">🌐 Todas las divisiones</option>
            {Object.keys(DIVISIONES).map((key) => (
              <option key={key} value={DIVISIONES[key]}>
                {DIVISIONES_LABELS[DIVISIONES[key]]}
              </option>
            ))}
          </select>
        </div>

        {/* Mak'Gora mode: Team selector */}
        {viewMode === 'makgora' && makgoraTeams.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Equipo Mak'Gora
            </label>
            <select
              value={makgoraTeamId || ''}
              onChange={(e) => setMakgoraTeamId(e.target.value)}
              className="form-select"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--color-purple)',
                color: 'var(--color-purple)',
                fontWeight: '700',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(156, 39, 176, 0.15)'
              }}
            >
              {makgoraTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.rpg_name || team.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
          <NotificationsButton />
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
            onClick={() => setShowImportCSV(true)}
            className="btn-neon"
            title="Importar jugadores desde CSV"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            + CSV
          </button>
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
  );
}
