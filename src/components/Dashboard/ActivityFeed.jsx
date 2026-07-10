import React, { useMemo } from 'react';
import { Trophy, TrendingDown, Shield, Coins, Wallet, Swords, Dumbbell, ScrollText } from 'lucide-react';

function ActivityFeed({ players, fixtures, finances, schedule }) {
  const activities = useMemo(() => {
    const items = [];

    (fixtures || []).forEach(f => {
      if (f.orcosScore !== undefined) {
        const won = Number(f.orcosScore) > Number(f.opponentScore);
        items.push({
          date: f.date, type: 'match',
          icon: won ? <Trophy size={14} /> : <TrendingDown size={14} />,
          text: `${won ? 'Victoria' : 'Derrota'} vs ${f.opponent} (${f.orcosScore || 0}-${f.opponentScore || 0})`,
        });
      }
    });

    (players || []).forEach(p => {
      if (p.createdAt || p.created_at) {
        const d = p.createdAt || p.created_at;
        items.push({ date: d, type: 'player', icon: <Shield size={14} />, text: `${p.name} se unió al club` });
      }
    });

    (finances || []).forEach(f => {
      items.push({
        date: f.date, type: 'finance',
        icon: f.type === 'ingreso' ? <Coins size={14} /> : <Wallet size={14} />,
        text: `${f.type === 'ingreso' ? '+' : '-'}$${Number(f.amount || 0).toLocaleString()} — ${f.desc || ''}`,
      });
    });

    (schedule || []).forEach(e => {
      const eventDate = new Date(e.date + 'T' + (e.time || '00:00'));
      const now = new Date();
      const diffDays = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 7) {
        items.push({
          date: e.date, type: 'event',
          icon: e.type === 'partido' ? <Swords size={14} /> : <Dumbbell size={14} />,
          text: `${e.type === 'partido' ? 'Partido' : 'Entreno'}: ${e.title} — ${e.date}`,
        });
      }
    });

    return items
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [fixtures, players, finances, schedule]);

  if (activities.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit' }}><ScrollText size={20} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Actividad Reciente</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
        {activities.map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 10px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)',
            fontSize: '0.72rem'
          }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>{a.icon}</span>
            <div style={{ flex: 1 }}>
              <span>{a.text}</span>
              <span style={{ marginLeft: '8px', fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{a.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;
