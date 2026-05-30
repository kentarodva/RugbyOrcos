import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';

function AnnouncementModal({ onClose }) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadUnread();
  }, [user?.id]);

  const loadUnread = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('channel', 'announcement')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!data || data.length === 0) { setLoading(false); onClose?.(); return; }

    const senderIds = [...new Set(data.map(a => a.sender_id))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, system_role')
      .in('user_id', senderIds);

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });
    data.forEach(a => { a._sender = profileMap[a.sender_id] || { display_name: 'Staff' }; });

    const { data: views } = await supabase
      .from('announcement_views')
      .select('message_id')
      .eq('user_id', user.id);

    const viewedIds = new Set((views || []).map(v => v.message_id));
    const unread = data.filter(a => !viewedIds.has(a.id));

    if (unread.length === 0) { setLoading(false); onClose?.(); return; }

    setAnnouncements(unread);
    setLoading(false);
  };

  const markAsRead = async (msgId) => {
    await supabase.from('announcement_views').upsert({
      message_id: msgId, user_id: user.id, viewed_at: new Date().toISOString()
    }, { onConflict: 'message_id,user_id' }).catch(() => {});
  };

  const handleNext = async () => {
    await markAsRead(announcements[current].id);
    if (current < announcements.length - 1) {
      setCurrent(current + 1);
    } else {
      onClose?.();
    }
  };

  const handleDismissAll = async () => {
    for (const a of announcements) {
      await markAsRead(a.id);
    }
    onClose?.();
  };

  if (loading || announcements.length === 0) return null;

  const ann = announcements[current];
  const sender = ann._sender || {};
  const total = announcements.length;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📢</div>
        <h2 style={{ color: 'var(--color-gold)', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '5px' }}>
          Anuncio del Reino
        </h2>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
          {current + 1} de {total}
        </p>

        <div style={{
          background: 'rgba(255,179,0,0.05)',
          border: '1px solid rgba(255,179,0,0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          marginBottom: '15px',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          color: 'var(--color-text)',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
        }}>
          {ann.text}
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '20px' }}>
          — {sender.display_name || 'Staff'} · {new Date(ann.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {total > 1 && (
            <button onClick={handleDismissAll} className="btn-outline" style={{ padding: '10px 20px', fontSize: '0.8rem' }}>
              Marcar todos como leídos
            </button>
          )}
          <button onClick={handleNext} className="btn-neon" style={{ padding: '10px 24px', fontSize: '0.85rem', justifyContent: 'center' }}>
            {current < total - 1 ? 'Siguiente ➤' : 'Entendido ✅'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementModal;
