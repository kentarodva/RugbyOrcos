import React, { useState } from 'react';

const GROUPS = [
  {
    label: 'JUGADORES',
    tabs: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'roster', label: 'Roster' },
      { id: 'estadisticas', label: 'Estadísticas' },
    ],
  },
  {
    label: 'CLUB',
    tabs: [
      { id: 'calendario', label: 'Agenda' },
      { id: 'finanzas', label: 'Finanzas' },
      { id: 'entrenamientos', label: 'Entrenamientos' },
      { id: 'tribunal', label: 'Tribunal' },
    ],
  },
  {
    label: 'COMPETICIÓN',
    tabs: [
      { id: 'makgora', label: "Mak'Gora" },
      { id: 'cancha', label: 'Pizarra Táctica' },
      { id: 'awards', label: 'Salón de la Fama' },
    ],
  },
  {
    label: 'COMUNICACIÓN',
    tabs: [
      { id: 'invitaciones', label: '📨 Invitaciones' },
      { id: 'messages', label: '💬 Mensajes' },
      { id: 'ia', label: 'IA' },
    ],
  },
];

export default function Sidebar({ open, onClose, activeTab, setActiveTab }) {
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(GROUPS.map((_, i) => i)));

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

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      <div
        className="glass-panel"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '270px',
          zIndex: 999,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease-out',
          borderRadius: 0,
          borderRight: '1px solid var(--border-glass)',
          overflowY: 'auto',
          padding: '16px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--border-glass)', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            ☰ Navegación
          </h2>
        </div>

        {GROUPS.map((group, idx) => {
          const isExpanded = expandedGroups.has(idx);
          const hasActive = group.tabs.some((t) => t.id === activeTab);

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '1.5px',
                  border: 'none',
                  background: 'transparent',
                  color: hasActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  ▶
                </span>
                {group.label}
              </button>

              <div
                style={{
                  maxHeight: isExpanded ? `${group.tabs.length * 44}px` : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.25s ease-out',
                }}
              >
                {group.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px 10px 36px',
                      fontSize: '0.85rem',
                      fontWeight: tab.id === activeTab ? 700 : 400,
                      border: 'none',
                      background: tab.id === activeTab ? 'rgba(0, 230, 118, 0.08)' : 'transparent',
                      color: tab.id === activeTab ? 'var(--color-primary)' : 'var(--color-text)',
                      cursor: 'pointer',
                      borderLeft: tab.id === activeTab ? '3px solid var(--color-primary)' : '3px solid transparent',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
