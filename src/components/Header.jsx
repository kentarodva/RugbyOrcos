import React, { useContext, useState } from 'react';
import {
  Shield,
  Swords,
  Sparkles,
  Download,
  Upload,
  FileSpreadsheet,
  LogOut,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { ClubContext } from '../context/ClubContext';
import { getRpgRole } from '../context/constants';
import { isAnyAIConfigured } from '../engine/multiProviderCoach';
import NotificationsButton from './Notifications/NotificationsButton';
import Sheet, { SheetItem, SheetSection } from './shell/Sheet';

const SYNC = {
  syncing: { color: 'var(--color-blue)', label: 'Sincronizando' },
  offline: { color: 'var(--color-gold)', label: 'Sin conexión: usando datos locales' },
  online: { color: 'var(--color-primary)', label: 'En línea' },
};

function initials(name) {
  return (name || 'Orco')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Compact staff header: crest, club + division, sync dot, account menu. */
export default function Header({
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
  setShowSettings,
  setShowImportCSV,
  fileInputRef,
  handleImportFileChange,
  triggerImportClick,
  handleLogout,
  exportData,
  onOpenMyProfile,
}) {
  const { teams } = useContext(ClubContext);
  const [menuOpen, setMenuOpen] = useState(false);

  const roleInfo = profile?.system_role ? getRpgRole(profile.system_role) : null;
  const aiReady = isAnyAIConfigured();
  const sync = SYNC[syncStatus] || SYNC.online;
  const isMakgora = viewMode === 'makgora';
  const close = () => setMenuOpen(false);
  const run = (fn) => () => { close(); fn(); };

  return (
    <header className="command-header">
      <img src="/assets/orcos_crest_light.png" alt="Rugby Orcos Negros" className="header-crest" />

      <div className="header-title">
        <span className="header-club">{isMakgora ? "MAK'GORA" : 'ORCOS'}</span>
        <label className="header-division">
          <select value={divisionView} onChange={(e) => setDivisionView(e.target.value)} aria-label="Seleccionar división">
            <option value="all">Todas las divisiones</option>
            {teams.map((team) => (
              <option key={team.id} value={team.division}>
                {team.label || team.category}
              </option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </label>
      </div>

      <span className="sync-dot" role="status" title={sync.label} aria-label={sync.label} style={{ background: sync.color }} />

      <button
        type="button"
        className="avatar-btn"
        aria-label="Cuenta y ajustes"
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(true)}
      >
        {initials(profile?.display_name)}
      </button>

      <input type="file" ref={fileInputRef} onChange={handleImportFileChange} accept=".json" style={{ display: 'none' }} />

      <Sheet open={menuOpen} title="Cuenta" onClose={close}>
        <div className="account-card">
          <span className="avatar-btn is-large" aria-hidden="true">{initials(profile?.display_name)}</span>
          <div style={{ minWidth: 0 }}>
            <div className="account-name">{profile?.display_name || 'Comandante'}</div>
            {roleInfo && <div className="account-role">{roleInfo.original}</div>}
          </div>
        </div>

        <SheetSection label="Vista">
          <div className="segmented" role="group" aria-label="Modo de vista">
            <button type="button" aria-pressed={!isMakgora} className={!isMakgora ? 'is-on' : ''} onClick={() => setViewMode('general')}>
              <Shield size={16} aria-hidden="true" /> Club
            </button>
            <button type="button" aria-pressed={isMakgora} className={isMakgora ? 'is-on is-gold' : ''} onClick={() => setViewMode('makgora')}>
              <Swords size={16} aria-hidden="true" /> Mak&apos;Gora
            </button>
          </div>
          {isMakgora && makgoraTeams.length > 0 && (
            <select
              value={makgoraTeamId || ''}
              onChange={(e) => setMakgoraTeamId(e.target.value ? String(e.target.value) : null)}
              aria-label="Seleccionar clan Mak'Gora"
              className="form-select"
              style={{ width: '100%', marginTop: 8 }}
            >
              {makgoraTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.rpg_name || team.name}
                </option>
              ))}
            </select>
          )}
        </SheetSection>

        <SheetSection label="Gestión">
          {onOpenMyProfile && (
            <SheetItem icon={Shield} label="Mi ficha de jugador" onClick={run(onOpenMyProfile)} />
          )}
          {hasPermission('admin_panel') && (
            <SheetItem
              icon={ShieldAlert}
              label={showAdminPanel ? 'Cerrar panel de administración' : 'Panel de administración'}
              active={showAdminPanel}
              onClick={run(() => setShowAdminPanel(!showAdminPanel))}
            />
          )}
          <NotificationsButton variant="menu" />
          <SheetItem icon={Sparkles} label="Configuración e IA" hint={aiReady ? 'IA activa' : 'Sin proveedor de IA'} onClick={run(() => setShowSettings(true))} />
        </SheetSection>

        <SheetSection label="Datos">
          <SheetItem icon={FileSpreadsheet} label="Importar CSV" onClick={run(() => setShowImportCSV(true))} />
          <SheetItem icon={Download} label="Respaldar JSON" onClick={run(exportData)} />
          <SheetItem icon={Upload} label="Restaurar JSON" onClick={run(triggerImportClick)} />
        </SheetSection>

        <SheetSection>
          <SheetItem icon={LogOut} label="Cerrar sesión" tone="danger" onClick={run(handleLogout)} />
        </SheetSection>
      </Sheet>
    </header>
  );
}
