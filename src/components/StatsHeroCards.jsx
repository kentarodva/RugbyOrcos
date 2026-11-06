import React from 'react';
import { ClipboardCheck, Calendar, Dumbbell } from 'lucide-react';
import { OrcosWhistleIcon } from './common/OrcosIcons';

export function StatsHeroCards({ player, nextMatch, hasActivePlan, compact = false }) {
  const att = player.attendance || {};
  const attRate = att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
  const burpees = player.penalties?.burpees || 0;

  const cards = [
    {
      label: 'Asistencia',
      value: attRate == null ? '—' : `${attRate}%`,
      sub: att.total > 0 ? `${att.present || 0} de ${att.total} prácticas` : 'Sin prácticas aún',
      color: attRate == null ? undefined : attRate >= 80 ? 'var(--color-primary)' : attRate >= 50 ? 'var(--color-gold)' : 'var(--color-red)',
      Icon: ClipboardCheck,
    },
    {
      label: 'Disciplina',
      value: burpees > 0 ? `${burpees}` : '0',
      sub: burpees > 0 ? 'Burpees pendientes' : 'Sin sanciones',
      color: burpees > 0 ? 'var(--color-red)' : undefined,
      Icon: OrcosWhistleIcon,
    },
    {
      label: 'Próximo partido',
      value: nextMatch?.date
        ? new Date(nextMatch.date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
        : 'Por definir',
      sub: nextMatch?.opponent ? `vs ${nextMatch.opponent}` : 'Esperando fixture',
      Icon: Calendar,
    },
    {
      label: 'Plan de entreno',
      value: hasActivePlan ? 'Activo' : 'Sin plan',
      sub: hasActivePlan ? 'Rutina lista' : 'Crea tu rutina en Entreno',
      color: hasActivePlan ? 'var(--color-primary)' : undefined,
      Icon: Dumbbell,
    },
  ];

  return (
    <div className="metrics-grid" style={{ marginBottom: compact ? '16px' : '24px' }}>
      {cards.map(({ label, value, sub, color, Icon }) => (
        <div key={label} className="metric-card-v5" style={{ minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
            <Icon size={15} color="currentColor" aria-hidden="true" /> {label}
          </span>
          <span className="stat-number" style={{ fontSize: compact ? '1.75rem' : '2rem', color: color || 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{sub}</span>
        </div>
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
