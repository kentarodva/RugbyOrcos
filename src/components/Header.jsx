import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  Shield,
  Swords,
  Sparkles,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  LogOut,
  ShieldAlert,
  Cloud,
  RefreshCw,
  WifiOff,
  ChevronDown,
} from 'lucide-react';
import { ClubContext } from '../context/ClubContext';
import { getRpgRole } from '../context/constants';
import { isAnyAIConfigured } from '../engine/multiProviderCoach';
import NavBar from './NavBar';
import NotificationsButton from './Notifications/NotificationsButton';
import { OrcosShieldSVG } from './common/OrcosEmblem';

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  profile,
  syncStatus,
  viewMode,
  setViewMode,
  divisionView,
  setDivisionView,
  makgoraTeamId,
  setMakgoraTeamId,
  makgoraTeams,
  hasPermission,
  showAdminPanel,
  setShowAdminPanel,
  _showSettings,
  setShowSettings,
  _showImportCSV,
  setShowImportCSV,
  fileInputRef,
  handleImportFileChange,
  triggerImportClick,
  handleLogout,
  exportData,
}) {
  const { teams } = useContext(ClubContext);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const dataMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dataMenuRef.current && !dataMenuRef.current.contains(e.target)) {
        setDataMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleInfo = profile?.system_role ? getRpgRole(profile.system_role) : null;
  const aiReady = isAnyAIConfigured();

  const renderSyncBadge = () => {
    if (syncStatus === 'syncing') {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(0, 176, 255, 0.1)',
            color: 'var(--color-blue)',
            border: '1px solid rgba(0, 176, 255, 0.25)',
            fontSize: '0.68rem',
            padding: '3px 8px',
          }}
          title="Sincronizando con Supabase..."
        >
          <RefreshCw size={11} className="ai-icon-spin" /> Sincronizando
        </span>
      );
    }
    if (syncStatus === 'offline') {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(255, 179, 0, 0.1)',
            color: 'var(--color-gold)',
            border: '1px solid rgba(255, 179, 0, 0.25)',
            fontSize: '0.68rem',
            padding: '3px 8px',
          }}
          title="Modo sin conexión"
        >
          <WifiOff size={11} /> Offline
        </span>
      );
    }
    return (
      <span
        className="badge"
        style={{
          background: 'rgba(0, 230, 118, 0.1)',
          color: 'var(--color-primary)',
          border: '1px solid rgba(0, 230, 118, 0.22)',
          fontSize: '0.68rem',
          padding: '3px 8px',
        }}
        title="Conectado a Supabase en tiempo real"
      >
        <Cloud size={11} /> Online
      </span>
    );
  };

  return (
    <header className="command-header">
      {/* Brand + User Rank */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <NavBar onClick={() => setSidebarOpen(!sidebarOpen)} open={sidebarOpen} />
        <img
          src="/assets/orcos_logo.png"
          alt="Rugby Orcos Negros Shield"
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 12px var(--color-primary-glow))',
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1
              className="neon-text-primary"
              style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '0.8px', lineHeight: 1.1, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>RUGBY ORCOS NEGROS</span>
              <OrcosShieldSVG size={22} />
            </h1>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                fontFamily: 'Outfit',
                padding: '2px 7px',
                borderRadius: '6px',
                background: 'rgba(255, 179, 0, 0.14)',
                color: 'var(--color-gold)',
                border: '1px solid rgba(255, 179, 0, 0.3)',
                letterSpacing: '0.8px',
              }}
            >
              v5.0
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '4px',
            }}
          >
            <span
              style={{
                fontSize: '0.73rem',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
              }}
            >
              {profile?.display_name ? (
                <>
                  <strong style={{ color: 'var(--color-text)' }}>{profile.display_name}</strong>
                  {roleInfo && (
                    <span style={{ color: 'var(--color-gold)', marginLeft: '5px' }}>
                      · {roleInfo.rpg} ({roleInfo.original})
                    </span>
                  )}
                </>
              ) : roleInfo ? (
                <span style={{ color: 'var(--color-gold)' }}>
                  {roleInfo.rpg} ({roleInfo.original})
                </span>
              ) : (
                'Reino Manager'
              )}
            </span>
            {renderSyncBadge()}
          </div>
        </div>
      </div>

      {/* Filters & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Segmented Mode Switcher: Club vs Mak'Gora */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(0, 0, 0, 0.28)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            padding: '3px',
            gap: '3px',
          }}
        >
          <button
            onClick={() => setViewMode('general')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: 'Outfit',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'general' ? 'var(--color-primary)' : 'transparent',
              color: viewMode === 'general' ? '#05080d' : 'var(--color-text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <Shield size={14} /> Club
          </button>
          <button
            onClick={() => setViewMode('makgora')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: 'Outfit',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'makgora' ? 'var(--color-gold)' : 'transparent',
              color: viewMode === 'makgora' ? '#05080d' : 'var(--color-text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <Swords size={14} /> Mak&apos;Gora
          </button>
        </div>

        {/* Division Selector */}
        <select
          value={divisionView}
          onChange={(e) => setDivisionView(e.target.value)}
          aria-label="Seleccionar división"
          className="form-select"
          style={{
            background: 'var(--bg-input)',
            border: `1px solid ${viewMode === 'makgora' ? 'rgba(255, 179, 0, 0.4)' : 'rgba(0, 230, 118, 0.35)'}`,
            color: viewMode === 'makgora' ? 'var(--color-gold)' : 'var(--color-primary)',
            fontWeight: 700,
            fontSize: '0.8rem',
            padding: '7px 12px',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          <option value="all">Todas las divisiones</option>
          {teams.map((team) => (
            <option key={team.id} value={team.division}>
              {team.label || team.category}
            </option>
          ))}
        </select>

        {/* Mak'Gora Clan Selector */}
        {viewMode === 'makgora' && makgoraTeams.length > 0 && (
          <select
            value={makgoraTeamId || ''}
            onChange={(e) => setMakgoraTeamId(e.target.value ? String(e.target.value) : null)}
            aria-label="Seleccionar clan Mak'Gora"
            className="form-select"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--color-gold)',
              color: 'var(--color-gold)',
              fontWeight: 700,
              fontSize: '0.8rem',
              padding: '7px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            {makgoraTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.rpg_name || team.name}
              </option>
            ))}
          </select>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {hasPermission('admin_panel') && (
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="btn-outline"
              title="Panel de Administración (Super Rol)"
              style={{
                padding: '7px 11px',
                fontSize: '0.78rem',
                borderRadius: '10px',
                borderColor: showAdminPanel ? 'var(--color-red)' : 'rgba(255, 179, 0, 0.35)',
                color: showAdminPanel ? 'var(--color-red)' : 'var(--color-gold)',
                background: showAdminPanel ? 'rgba(255, 61, 0, 0.1)' : 'rgba(255, 179, 0, 0.05)',
              }}
            >
              <ShieldAlert size={15} /> Admin
            </button>
          )}

          <NotificationsButton />

          <button
            onClick={() => setShowSettings(true)}
            className="btn-outline"
            title="Configuración y Proveedores de IA"
            style={{
              padding: '7px 11px',
              fontSize: '0.78rem',
              borderRadius: '10px',
              borderColor: aiReady ? 'rgba(0, 230, 118, 0.4)' : 'var(--border-glass)',
              color: aiReady ? 'var(--color-primary)' : 'var(--color-text)',
              background: aiReady ? 'rgba(0, 230, 118, 0.07)' : 'transparent',
            }}
          >
            <Sparkles size={15} /> {aiReady ? 'IA Activa' : 'IA'}
          </button>

          {/* Compact Data Dropdown (CSV / Respaldar / Cargar) */}
          <div ref={dataMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDataMenuOpen((o) => !o)}
              className="btn-outline"
              title="Importar CSV o Respaldar Base de Datos"
              style={{
                padding: '7px 11px',
                fontSize: '0.78rem',
                borderRadius: '10px',
              }}
            >
              <Database size={15} /> Datos <ChevronDown size={13} />
            </button>

            {dataMenuOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  minWidth: '190px',
                  padding: '6px',
                  zIndex: 1000,
                  background: 'var(--bg-surface-solid)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <button
                  onClick={() => {
                    setDataMenuOpen(false);
                    setShowImportCSV(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(0, 230, 118, 0.08)',
                    color: 'var(--color-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <FileSpreadsheet size={15} /> Importar CSV
                </button>
                <button
                  onClick={() => {
                    setDataMenuOpen(false);
                    exportData();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Download size={15} /> Respaldar JSON
                </button>
                <button
                  onClick={() => {
                    setDataMenuOpen(false);
                    triggerImportClick();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Upload size={15} /> Restaurar JSON
                </button>
              </div>
            )}
          </div>

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
            title="Cerrar sesión"
            style={{
              padding: '7px 11px',
              fontSize: '0.78rem',
              borderRadius: '10px',
              borderColor: 'rgba(255, 61, 0, 0.35)',
              color: 'var(--color-red)',
            }}
          >
            <LogOut size={15} /> Salir
          </button>
        </div>
      </div>
    </header>
  );
}
