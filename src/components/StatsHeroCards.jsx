import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Scale, Calendar, Dumbbell } from 'lucide-react';

export function StatsHeroCards({ player, nextMatch, hasActivePlan }) {
  const attRate = player.attendance?.total > 0
    ? Math.round((player.attendance.present / player.attendance.total) * 100)
    : 0;
  const burpees = player.penalties?.burpees || 0;

  const cards = [
    {
      label: 'Asistencia',
      value: `${attRate}%`,
      sub: `${player.attendance?.present || 0}/${player.attendance?.total || 0}`,
      color: attRate >= 80 ? 'text-emerald-400' : attRate >= 50 ? 'text-amber-400' : 'text-red-400',
      Icon: ClipboardCheck,
    },
    {
      label: 'Burpees',
      value: burpees > 0 ? burpees : '0',
      sub: burpees > 0 ? 'pendientes' : '¡Al día!',
      color: burpees > 0 ? 'text-red-400' : 'text-emerald-400',
      Icon: Scale,
    },
    {
      label: 'Próximo partido',
      value: nextMatch?.date
        ? new Date(nextMatch.date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
        : '—',
      sub: nextMatch?.opponent || 'Sin rival',
      color: 'text-blue-400',
      Icon: Calendar,
    },
    {
      label: 'Plan de entreno',
      value: hasActivePlan ? 'Activo' : '—',
      sub: hasActivePlan ? 'Esta semana' : 'Sin plan',
      color: hasActivePlan ? 'text-emerald-400' : 'text-zinc-500',
      Icon: Dumbbell,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card, i) => {
        const CardIcon = card.Icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            className="relative rounded-xl p-4 bg-zinc-900/60 border border-zinc-800/50 hover:border-emerald-500/30 transition-all duration-300 group tabular-nums"
          >
            <div className="flex items-center gap-2 mb-2">
              <CardIcon size={14} className="text-emerald-400/80" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{card.label}</span>
            </div>
            <div className={`text-xl font-extrabold font-display ${card.color}`}>{card.value}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{card.sub}</div>
          </motion.div>
        );
      })}
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
