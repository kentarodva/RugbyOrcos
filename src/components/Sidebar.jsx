import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Calendar,
  Wallet,
  Dumbbell,
  Scale,
  Swords,
  Compass,
  Trophy,
  Mail,
  MessageSquare,
  Bot,
  ChevronRight,
  X,
  Shield,
} from 'lucide-react';
import { getRpgRole } from '../context/constants';

export const ALL_GROUPS = [
  {
    label: 'JUGADORES',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'roster', label: 'Guerreros', perm: 'manage_players', icon: Users },
      { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
      { id: 'mi_ficha', label: 'Mi Ficha', icon: Shield },
    ],
  },
  {
    label: 'CLUB',
    tabs: [
      { id: 'calendario', label: 'Agenda', perm: 'manage_schedule', icon: Calendar },
      { id: 'entrenamientos', label: 'Entrenos', perm: 'manage_training', icon: Dumbbell },
      { id: 'finanzas', label: 'Finanzas', perm: 'manage_finances', icon: Wallet },
      { id: 'tribunal', label: 'Tribunal', perm: 'manage_discipline', icon: Scale },
    ],
  },
  {
    label: 'COMPETICIÓN',
    tabs: [
      { id: 'makgora', label: "Mak'Gora", icon: Swords },
      { id: 'cancha', label: 'Pizarra XV', perm: 'manage_tactics', icon: Compass },
      { id: 'awards', label: 'Salón de la Fama', icon: Trophy },
    ],
  },
  {
    label: 'COMUNICACIÓN',
    tabs: [
      { id: 'invitaciones', label: 'Invitaciones', icon: Mail },
      { id: 'messages', label: 'Mensajes', icon: MessageSquare },
      { id: 'ia', label: 'Coach IA', perm: 'config_ai', icon: Bot },
    ],
  },
];

export function QuickNavBar({ activeTab, setActiveTab, hasPermission, profile, onOpenDrawer }) {
  const isStaff = profile?.system_role !== 'jugador' && profile?.system_role != null;

  const visibleGroups = useMemo(() => {
    if (!isStaff) return [];
    return ALL_GROUPS.map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => (!tab.perm ? true : hasPermission ? hasPermission(tab.perm) : true)),
    })).filter((g) => g.tabs.length > 0);
  }, [isStaff, hasPermission]);

  if (visibleGroups.length === 0) return null;

  return (
    <nav className="quick-nav-bar" aria-label="Navegación rápida de módulos">
      {visibleGroups.map((group, gIdx) => (
        <React.Fragment key={group.label}>
          {gIdx > 0 && <div className="quick-nav-divider" />}
          {group.tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`quick-nav-pill ${isActive ? 'active' : ''}`}
                title={`${group.label} · ${tab.label}`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </React.Fragment>
      ))}
      {onOpenDrawer && (
        <>
          <div style={{ flex: 1 }} />
          <button
            onClick={onOpenDrawer}
            className="quick-nav-pill"
            style={{ fontSize: '0.72rem', opacity: 0.75 }}
            title="Ver menú lateral categorizado"
          >
            <span>Menú completo</span>
            <ChevronRight size={13} />
          </button>
        </>
      )}
    </nav>
  );
}

export default function Sidebar({ open, onClose, activeTab, setActiveTab, hasPermission, profile }) {
  const isStaff = profile?.system_role !== 'jugador' && profile?.system_role != null;

  const GROUPS = useMemo(() => {
    if (!isStaff) return [];
    return ALL_GROUPS.filter((group) => {
      const required = group.requiredPermission;
      if (!required) return true;
      return hasPermission ? hasPermission(required) : true;
    })
      .map((group) => {
        const filtered = group.tabs.filter((tab) => {
          if (!tab.perm) return true;
          return hasPermission ? hasPermission(tab.perm) : true;
        });
        return { ...group, tabs: filtered };
      })
      .filter((group) => group.tabs.length > 0);
  }, [isStaff, hasPermission]);

  const [expandedGroups, setExpandedGroups] = useState(() => new Set(ALL_GROUPS.map((_, i) => i)));

  const toggleGroup = (idx) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  const roleInfo = profile?.system_role ? getRpgRole(profile.system_role) : null;

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            background: 'rgba(4, 7, 13, 0.65)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside
        className="glass-panel"
        aria-label="Menú lateral"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '280px',
          zIndex: 999,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
          borderRadius: 0,
          borderRight: '1px solid var(--border-glass)',
          overflowY: 'auto',
          padding: '18px 0',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface-solid)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '0 18px 16px',
            borderBottom: '1px solid var(--border-glass)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/assets/orcos_logo.png"
              alt="Orcos"
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)', margin: 0 }}>
                REINO MANAGER
              </h2>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-gold)', fontWeight: 700, letterSpacing: '1px' }}>
                EDICIÓN v5.0
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="btn-outline"
            style={{ padding: '6px', borderRadius: '8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Groups */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {GROUPS.map((group, idx) => {
            const isExpanded = expandedGroups.has(idx);
            const hasActive = group.tabs.some((t) => t.id === activeTab);

            return (
              <div key={group.label} style={{ marginBottom: '6px' }}>
                <button
                  onClick={() => toggleGroup(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '1.4px',
                    border: 'none',
                    background: 'transparent',
                    color: hasActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>{group.label}</span>
                  <ChevronRight
                    size={13}
                    style={{
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>

                <div
                  style={{
                    maxHeight: isExpanded ? `${group.tabs.length * 46}px` : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.25s ease-out',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === activeTab;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleSelectTab(tab.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 700 : 500,
                          border: isActive ? '1px solid rgba(0, 230, 118, 0.22)' : '1px solid transparent',
                          background: isActive ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <Icon size={17} style={{ opacity: isActive ? 1 : 0.7 }} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Footer Card */}
        {profile && (
          <div
            style={{
              margin: '12px 12px 0',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 179, 0, 0.12)',
                border: '1px solid rgba(255, 179, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gold)',
                flexShrink: 0,
              }}
            >
              <Shield size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {profile.display_name || 'Comandante'}
              </div>
              {roleInfo && (
                <div style={{ fontSize: '0.68rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                  {roleInfo.rpg} · {roleInfo.original}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
