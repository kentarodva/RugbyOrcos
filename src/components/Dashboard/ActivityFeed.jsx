import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, TrendingDown, Shield, Coins, Wallet, Swords, Dumbbell, Megaphone } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useDataListener } from '../../context/hooks/useDataListener';

function ActivityFeed({ players, fixtures, finances, schedule }) {
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);

  const fetchLatestAnnouncement = () => {
    supabase.from('messages').select('text, created_at').eq('channel', 'announcement').order('created_at', { ascending: false }).limit(1).single().then(({ data }) => setLatestAnnouncement(data)).catch(() => {});
  };

  useEffect(() => { fetchLatestAnnouncement(); }, []);
  useDataListener('messages', () => fetchLatestAnnouncement());

  const activities = useMemo(() => {
    const items = [];

    if (latestAnnouncement) {
      items.push({
        date: latestAnnouncement.created_at, type: 'announcement',
        icon: <Megaphone size={14} />,
        text: `📢 ${latestAnnouncement.text?.substring(0, 100)}${(latestAnnouncement.text?.length > 100) ? '...' : ''}`,
      });
    }

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
    <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 className="section-title">Actividad reciente</h3>
      <div className="glass-panel" style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {activities.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderTop: i ? '1px solid var(--border-glass)' : 'none' }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'var(--bg-elevated)', color: 'var(--color-text-soft)' }}>{a.icon}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: '0.875rem' }}>{a.text}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', flexShrink: 0 }}>{a.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ActivityFeed;
