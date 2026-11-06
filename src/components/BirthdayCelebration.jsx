import React, { useEffect, useRef, useState, useContext } from 'react';
import { ClubContext } from '../context/ClubContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

function BirthdayCelebration() {
  const { players } = useContext(ClubContext);
  const { user } = useAuth();
  const [celebrating, setCelebrating] = useState(null);
  const announcedRef = useRef(new Set());
  const celebratedRef = useRef(new Set());
  const lastPlayerSnapshotRef = useRef('');

  useEffect(() => {
    if (!players?.length || !user?.id) return;

    const snapshot = players.map(p => p.id).sort().join(',');
    if (snapshot === lastPlayerSnapshotRef.current) return;
    lastPlayerSnapshotRef.current = snapshot;

    const today = new Date();
    const todayMD = `${today.getMonth() + 1}-${today.getDate()}`;

    const birthdayPlayers = players.filter(p => {
      if (!p.birth_date) return false;
      const bd = p.birth_date.split('T')[0] || p.birth_date;
      const parts = bd.split('-');
      if (parts.length < 3) return false;
      return `${parseInt(parts[1])}-${parseInt(parts[2])}` === todayMD;
    });

    if (birthdayPlayers.length === 0) return;

    const mine = birthdayPlayers.find(p => p.user_id === user.id || p.email === user.email);
    if (mine) {
      if (!celebratedRef.current.has(mine.id)) {
        setCelebrating(mine);
      }
    }

    birthdayPlayers.forEach(bp => {
      if (announcedRef.current.has(bp.id)) return;

      (async () => {
        // Ventana de 30h para evitar duplicados en zona horaria Colombia (UTC-5)
        const since = new Date(Date.now() - 30 * 60 * 60 * 1000);
        const { data: existing } = await supabase
          .from('messages')
          .select('id')
          .eq('channel', 'announcement')
          .gte('created_at', since.toISOString())
          .ilike('text', `%Feliz cumpleaños%${bp.name}%`)
          .limit(1);

        if (existing?.length > 0) {
          announcedRef.current.add(bp.id);
          return;
        }

        const age = bp._meta?.age ?? '?';
        await supabase.from('messages').insert({
          sender_id: user.id,
          text: `🎂 ¡Feliz cumpleaños a ${bp.name}! Hoy cumple ${age} años. ¡Que pases un excelente día, guerrero! 🎉`,
          channel: 'announcement',
        });

        announcedRef.current.add(bp.id);
      })();
    });
  }, [players, user?.id]);

  const handleClose = () => {
    if (celebrating) {
      celebratedRef.current.add(celebrating.id);
    }
    setCelebrating(null);
  };

  useEffect(() => {
    if (!celebrating) return;
    let frameId;
    import('canvas-confetti').then(({ default: confetti }) => {
      const duration = 4000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#2EE57A', '#E8B931', '#448aff', '#FF5C4D'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#2EE57A', '#E8B931', '#448aff', '#FF5C4D'],
        });
        if (Date.now() < end) frameId = requestAnimationFrame(frame);
      };
      frame();
    });
    return () => { if (frameId) cancelAnimationFrame(frameId); };
  }, [celebrating]);

  if (!celebrating) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '450px', textAlign: 'center', padding: '30px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎉</div>
        <h2 style={{ color: '#E8B931', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
          ¡Feliz cumpleaños!
        </h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '5px' }}>
          {celebrating.name}
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Hoy cumples {celebrating._meta?.age ?? '?'} años, guerrero! 🏉
        </p>
        <button onClick={handleClose} className="btn-neon" style={{ padding: '12px 32px', fontSize: '0.9rem', justifyContent: 'center' }}>
          🎂 Gracias, Jefe
        </button>
      </div>
    </div>
  );
}

export default BirthdayCelebration;
