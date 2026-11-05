import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Calendar, Dumbbell } from 'lucide-react';
import { OrcosWhistleIcon } from './common/OrcosIcons';

export function StatsHeroCards({ player, nextMatch, hasActivePlan }) {
  const attRate = player.attendance?.total > 0
    ? Math.round((player.attendance.present / player.attendance.total) * 100)
    : 0;
  const burpees = player.penalties?.burpees || 0;

  const cards = [
    {
      label: 'Asistencia al Clan',
      value: `${attRate}%`,
      sub: `${player.attendance?.present || 0}/${player.attendance?.total || 0} prácticas`,
      color: attRate >= 80 ? 'var(--color-primary)' : attRate >= 50 ? 'var(--color-gold)' : 'var(--color-red)',
      borderColor: attRate >= 80 ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 215, 64, 0.35)',
      bgGlow: attRate >= 80 ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 215, 64, 0.08)',
      icon: <ClipboardCheck size={16} color={attRate >= 80 ? 'var(--color-primary)' : 'var(--color-gold)'} />,
    },
    {
      label: 'Disciplina / Sin-Bin',
      value: burpees > 0 ? `${burpees}` : '0',
      sub: burpees > 0 ? `${burpees} burpees pendientes` : '🛡️ ¡Honor al día!',
      color: burpees > 0 ? 'var(--color-red)' : 'var(--color-primary)',
      borderColor: burpees > 0 ? 'rgba(255, 23, 68, 0.35)' : 'rgba(0, 230, 118, 0.35)',
      bgGlow: burpees > 0 ? 'rgba(255, 23, 68, 0.08)' : 'rgba(0, 230, 118, 0.08)',
      icon: <OrcosWhistleIcon size={16} color={burpees > 0 ? 'var(--color-red)' : 'var(--color-primary)'} />,
    },
    {
      label: 'Próxima Batalla',
      value: nextMatch?.date
        ? new Date(nextMatch.date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
        : 'Por agendar',
      sub: nextMatch?.opponent ? `vs ${nextMatch.opponent}` : 'Esperando fixture',
      color: 'var(--color-blue, #38bdf8)',
      borderColor: 'rgba(56, 189, 248, 0.35)',
      bgGlow: 'rgba(56, 189, 248, 0.08)',
      icon: <Calendar size={16} color="var(--color-blue, #38bdf8)" />,
    },
    {
      label: 'Plan de Entrenamiento',
      value: hasActivePlan ? 'Activo' : 'En pausa',
      sub: hasActivePlan ? 'Rutina lista para la batalla' : 'Genera tu microciclo',
      color: hasActivePlan ? 'var(--color-gold)' : 'var(--color-text-muted)',
      borderColor: hasActivePlan ? 'rgba(255, 215, 64, 0.35)' : 'rgba(255, 255, 255, 0.1)',
      bgGlow: hasActivePlan ? 'rgba(255, 215, 64, 0.08)' : 'rgba(255, 255, 255, 0.02)',
      icon: <Dumbbell size={16} color={hasActivePlan ? 'var(--color-gold)' : 'var(--color-text-muted)'} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
          style={{
            background: card.bgGlow,
            border: `1px solid ${card.borderColor}`,
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
          }}
          className="hover:scale-[1.02]"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {card.icon}
            <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)' }}>
              {card.label}
            </span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, fontFamily: 'Outfit', color: card.color, lineHeight: 1.1 }}>
            {card.value}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '4px', fontWeight: 600 }}>
            {card.sub}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function Skeleton({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl p-5 bg-zinc-900/40 border border-zinc-800/30 overflow-hidden">
          <div className="animate-pulse space-y-3">
            <div className="h-3 bg-zinc-800 rounded w-2/3" />
            <div className="h-2 bg-zinc-800/50 rounded w-full" />
            <div className="h-2 bg-zinc-800/50 rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
