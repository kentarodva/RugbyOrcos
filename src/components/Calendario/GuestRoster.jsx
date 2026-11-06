import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';

function GuestRoster({ fixture }) {
  const [guests, setGuests] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!fixture || !fixture.id) return;
    let cancelled = false;
    (async () => {
      const { data: inv } = await supabase.from('match_invitations')
        .select('id').eq('future_fixture_id', fixture.id).maybeSingle();
      if (!inv || cancelled) return;
      const { data: g } = await supabase.from('guest_players')
        .select('*').eq('invitation_id', inv.id).order('created_at');
      if (!cancelled) { setGuests(g || []); setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [fixture]);

  if (!loaded) return null;
  if (guests.length === 0) return null;

  return (
    <div style={{ marginBottom: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-glass)' }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-gold)', marginBottom: '10px' }}>
        Jugadores de {fixture?.opponent || 'Rival'}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {guests.map(g => (
          <div key={g.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '6px 10px', background: 'rgba(232, 185, 49,0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--color-gold)', fontWeight: 700, minWidth: '30px' }}>
              {g.number ? `#${g.number}` : '—'}
            </span>
            <span style={{ color: 'var(--color-text)' }}>{g.name}</span>
            {g.position && (
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.04)', padding: '1px 7px', borderRadius: '8px' }}>
                {g.position}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GuestRoster;
