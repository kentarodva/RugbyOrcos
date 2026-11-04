import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Calendar, Dumbbell, HeartPulse, TrendingUp, Wallet, Bot } from 'lucide-react';
import { PlayerPhoto } from './PlayerPhoto';
import { getRpgRole } from '../context/ClubContext.jsx';
import { formatHeightM, formatWeightKg } from '../utils/inputFormatters';

export default function PlayerSidebar({ player, activeTab, onTabChange, onOpenAvatarPicker, collapsed, onToggleCollapse }) {
  const rpgRole = getRpgRole(player.systemRole || 'jugador');
  const attrs = player.attributes || {};
  const attrList = [
    { key: 'FUE', val: attrs.force || 0, color: '#ef4444' },
    { key: 'VEL', val: attrs.speed || 0, color: '#22c55e' },
    { key: 'RES', val: attrs.stamina || 0, color: '#3b82f6' },
    { key: 'TEC', val: attrs.technique || 0, color: '#eab308' },
  ];

  const tabs = [
    { id: 'perfil', Icon: Shield, label: 'Perfil' },
    { id: 'agenda', Icon: Calendar, label: 'Agenda' },
    { id: 'entreno', Icon: Dumbbell, label: 'Entreno' },
    { id: 'bienestar', Icon: HeartPulse, label: 'Bienestar' },
    { id: 'progreso', Icon: TrendingUp, label: 'Progreso' },
    { id: 'finanzas', Icon: Wallet, label: 'Finanzas' },
    { id: 'ia', Icon: Bot, label: 'IA' },
  ];

  return (
    <div className="flex flex-col items-center gap-3 p-4 h-full">
      <button
        onClick={onToggleCollapse}
        className="self-end text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-800/50"
        title={collapsed ? 'Expandir' : 'Colapsar'}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d={collapsed ? "M10 12L6 8l4-4" : "M6 12l4-4-4-4"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 w-full">
            <div className="cursor-pointer transition-transform hover:scale-110" onClick={() => onOpenAvatarPicker?.()}>
              <PlayerPhoto player={player} size={36} />
            </div>
            <nav className="w-full flex flex-col items-center gap-0.5">
              {tabs.map(tab => {
                const TabIcon = tab.Icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 relative group ${
                      activeTab === tab.id
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }`}
                    title={tab.label}
                  >
                    <TabIcon size={16} />
                    <div className="absolute left-10 bg-zinc-800 text-zinc-200 text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                      {tab.label}
                    </div>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        ) : (
          <motion.div key="expanded" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex flex-col items-center gap-3 w-full">
            <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => onOpenAvatarPicker?.()}>
              <PlayerPhoto player={player} size={80} editable />
            </div>

            <div className="text-center">
              <h2 className="text-sm font-bold text-zinc-100 font-display leading-tight">{player.name}</h2>
              {player.apodo && <p className="text-[11px] text-zinc-500 italic leading-tight">"{player.apodo}"</p>}
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: rpgRole.color || '#a3e635' }}>
                {rpgRole.rpg}
              </p>
              <p className="text-[10px] text-zinc-500 leading-tight">
                {player.posicion || '—'} {player.camiseta ? `#${player.camiseta}` : ''}
              </p>
            </div>

            <div className="w-full space-y-1">
              {attrList.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-500 w-7 text-right font-medium">{a.key}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${a.val}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{ background: a.color }}
                    />
                  </div>
                  <span className="text-[9px] font-bold w-5 text-right text-zinc-400">{a.val}</span>
                </div>
              ))}
            </div>

            {player.weight && (
              <div className="flex gap-2 text-[10px] text-zinc-400 font-semibold tabular-nums">
                <span className="bg-zinc-800/70 rounded-md px-2 py-0.5">{formatWeightKg(player.weight)}</span>
                <span className="bg-zinc-800/70 rounded-md px-2 py-0.5">{formatHeightM(player.height)}</span>
              </div>
            )}

            <div className="w-full h-px bg-zinc-800 my-0.5" />

            <nav className="w-full flex flex-col gap-0.5">
              {tabs.map(tab => {
                const TabIcon = tab.Icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 flex items-center gap-2.5 ${
                      activeTab === tab.id
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                    }`}
                  >
                    <TabIcon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
