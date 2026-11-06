import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Dumbbell, HeartPulse, TrendingUp, Wallet, Bot, LogOut } from 'lucide-react';
import { PlayerPhoto } from './PlayerPhoto';
import { getRpgRole } from '../context/ClubContext.jsx';
import { formatHeightM, formatWeightKg } from '../utils/inputFormatters';
import { OrcosTackleShieldIcon } from './common/OrcosIcons';

export default function PlayerSidebar({ player, activeTab, onTabChange, onOpenAvatarPicker, collapsed, onToggleCollapse, onSignOut }) {
  const rpgRole = getRpgRole(player.systemRole || 'jugador');
  const attrs = player.attributes || {};
  const attrList = [
    { key: 'FUE', val: attrs.force || 0, color: '#FF5C4D' },
    { key: 'VEL', val: attrs.speed || 0, color: '#2EE57A' },
    { key: 'RES', val: attrs.stamina || 0, color: '#5AA9FF' },
    { key: 'TEC', val: attrs.technique || 0, color: '#E8B931' },
  ];

  const tabs = [
    { id: 'perfil', Icon: OrcosTackleShieldIcon, label: 'Ficha & Perfil' },
    { id: 'agenda', Icon: Calendar, label: 'Agenda & Partidos' },
    { id: 'entreno', Icon: Dumbbell, label: 'Entrenamiento' },
    { id: 'bienestar', Icon: HeartPulse, label: 'Estado Físico & Fatiga' },
    { id: 'progreso', Icon: TrendingUp, label: 'Fuerza & Rendimiento' },
    { id: 'finanzas', Icon: Wallet, label: 'Membresía & Cuotas' },
    { id: 'ia', Icon: Bot, label: 'Coach Táctico IA' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 12px',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(17, 20, 18, 0.95) 0%, rgba(9, 12, 10, 0.98) 100%)',
        borderRight: '1px solid rgba(46, 229, 122, 0.2)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)',
      }}
    >
      <button
        onClick={onToggleCollapse}
        style={{
          alignSelf: 'flex-end',
          color: 'var(--color-text-muted)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '6px',
          padding: '4px 6px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d={collapsed ? "M10 12L6 8l4-4" : "M6 12l4-4-4-4"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
            <div className="cursor-pointer transition-transform hover:scale-110" onClick={() => onOpenAvatarPicker?.()} title="Cambiar avatar o foto">
              <PlayerPhoto player={player} size={38} />
            </div>
            <nav style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              {tabs.map(tab => {
                const TabIcon = tab.Icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(46, 229, 122, 0.15)' : 'transparent',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      border: `1px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title={tab.label}
                  >
                    <TabIcon size={18} color={isActive ? 'var(--color-primary)' : 'currentColor'} />
                  </button>
                );
              })}
            </nav>

            {onSignOut && (
              <button
                onClick={onSignOut}
                style={{
                  marginTop: '16px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#FF5C4D',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="expanded" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
            {/* Avatar & Photo with Glowing Ring */}
            <div
              style={{
                position: 'relative',
                cursor: 'pointer',
                borderRadius: '50%',
                padding: '4px',
                background: 'linear-gradient(135deg, rgba(46, 229, 122, 0.6) 0%, rgba(255, 215, 64, 0.4) 100%)',
                boxShadow: '0 0 20px rgba(46, 229, 122, 0.25)',
                transition: 'transform 0.2s',
              }}
              onClick={() => onOpenAvatarPicker?.()}
              title="Clic para cambiar avatar mítico o subir foto 4K"
            >
              <PlayerPhoto player={player} size={84} editable />
            </div>

            {/* Name, Jersey and Position */}
            <div style={{ textAlign: 'center', width: '100%' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1.2, margin: 0 }}>
                {player.name}
              </h2>
              {player.apodo && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontStyle: 'italic', margin: '2px 0 0', fontWeight: 700 }}>
                  "{player.apodo}"
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(46, 229, 122, 0.12)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(46, 229, 122, 0.3)',
                  }}
                >
                  {rpgRole.rpg}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 215, 64, 0.12)',
                    color: 'var(--color-gold)',
                    border: '1px solid rgba(255, 215, 64, 0.3)',
                  }}
                >
                  {(player.camiseta ?? player.position_id) != null ? `#${player.camiseta ?? player.position_id} · ` : ""}{player.posicion || "Sin posición"}
                </span>
              </div>
            </div>

            {/* Quick Metrics (Height & Weight) */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '6px 8px',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Peso</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff' }}>{formatWeightKg(player.weight) || '—'}</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Estatura</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff' }}>{formatHeightM(player.height) || '—'}</div>
              </div>
            </div>

            {/* RPG Battle Gauges (FUE, VEL, RES, TEC) */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {attrList.map(a => (
                <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', width: '28px', textAlign: 'right' }}>{a.key}</span>
                  <div style={{ flex: 1, height: '6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                    <motion.div
                      style={{ height: '100%', borderRadius: '4px', background: a.color, boxShadow: `0 0 8px ${a.color}80` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${a.val}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 900, color: a.color, width: '22px', textAlign: 'right' }}>{a.val}</span>
                </div>
              ))}
            </div>

            {/* Navigation Tabs List */}
            <nav style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              {tabs.map(tab => {
                const TabIcon = tab.Icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: isActive ? 'linear-gradient(90deg, rgba(46, 229, 122, 0.16) 0%, rgba(46, 229, 122, 0.04) 100%)' : 'transparent',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      border: `1px solid ${isActive ? 'rgba(46, 229, 122, 0.4)' : 'transparent'}`,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 800 : 600,
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <TabIcon size={16} color={isActive ? 'var(--color-primary)' : 'currentColor'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {onSignOut && (
              <button
                onClick={onSignOut}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#FF5C4D',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                }}
                title="Cerrar Sesión de Guerrero"
              >
                <LogOut size={15} />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
