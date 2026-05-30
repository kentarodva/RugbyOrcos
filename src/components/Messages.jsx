import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB máximo
const MAX_IMAGE_WIDTH = 1024;
const WEBP_QUALITY = 0.80;
const ATTACHMENT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 semana

const compressToWebP = (file) => new Promise((resolve) => {
  if (!file.type.startsWith('image/')) return resolve(file);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
      resolve(compressed);
    }, 'image/webp', WEBP_QUALITY);
  };
  img.onerror = () => resolve(file);
  img.src = URL.createObjectURL(file);
});

function Messages() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState('');
  const [staffUsers, setStaffUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [announceText, setAnnounceText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    loadConversations();
    loadStaffUsers();

    const channel = supabase
      .channel('messages_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.receiver_id === user.id || payload.new.sender_id === user.id) {
          loadConversations();
          if (activeChat && (payload.new.sender_id === activeChat.id || payload.new.receiver_id === activeChat.id)) {
            setMessages(prev => [...prev, payload.new]);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, activeChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!data) return;
    const grouped = {};
    data.forEach(msg => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!partnerId) return;
      if (!grouped[partnerId]) {
        grouped[partnerId] = { id: partnerId, lastMsg: msg, unread: 0, lastTime: msg.created_at };
      }
      if (msg.receiver_id === user.id && !msg.read_at) grouped[partnerId].unread++;
      if (msg.created_at > grouped[partnerId].lastTime) {
        grouped[partnerId].lastMsg = msg;
        grouped[partnerId].lastTime = msg.created_at;
      }
    });
    setConversations(Object.values(grouped).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime)));
  };

  const loadStaffUsers = async () => {
    const { data } = await supabase.from('user_profiles').select('user_id, display_name, system_role').neq('system_role', 'jugador').eq('is_active', true);
    if (data) setStaffUsers(data);
  };

  const openChat = async (partnerId) => {
    setActiveChat({ id: partnerId });
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      setMessages(data);
      cleanOldAttachments(data);
    }

    // Marcar como leídos los mensajes recibidos
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', user.id)
      .eq('sender_id', partnerId)
      .is('read_at', null);
  };

  const cleanOldAttachments = async (msgs) => {
    const cutoff = Date.now() - ATTACHMENT_TTL_MS;
    for (const msg of msgs) {
      if (!msg.attachments?.length) continue;
      if (new Date(msg.created_at).getTime() > cutoff) continue;
      try {
        for (const att of msg.attachments) {
          const path = att.url?.split('message-attachments/')[1];
          if (path) await supabase.storage.from('message-attachments').remove([decodeURIComponent(path)]);
        }
        await supabase.from('messages').update({ attachments: [] }).eq('id', msg.id);
      } catch { /* noop */ }
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = newText.trim();
    if ((!text && !previewFile) || !user?.id || !activeChat?.id) return;

    setUploading(true);
    let attachments = [];
    if (previewFile) {
      try {
        const compressed = await compressToWebP(previewFile.file);
        const path = `${user.id}/${Date.now()}_${compressed.name}`;
        const { data, error: upErr } = await supabase.storage
          .from('message-attachments')
          .upload(path, compressed);
        if (!upErr && data) {
          const url = supabase.storage.from('message-attachments').getPublicUrl(data.path).data.publicUrl;
          attachments = [{ url, name: previewFile.name, type: previewFile.type, size: previewFile.file.size }];
        }
      } catch { /* storage error */ }
    }

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: activeChat.id,
      text: text || '',
      attachments,
    });

    setUploading(false);
    if (error) { showToast('Error al enviar: ' + error.message, 'error'); return; }
    setNewText('');
    setPreviewFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadConversations();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      showToast('El archivo excede el límite de 5MB.', 'warning');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setPreviewFile({
      name: file.name,
      type: file.type,
      size: file.size,
      file,
    });
  };

  const sendAnnouncement = async (e) => {
    e?.preventDefault();
    const text = announceText.trim();
    if (!text || !user?.id) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      text,
      channel: 'announcement',
    });

    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    showToast('Anuncio publicado para todo el Reino.', 'success');
    setAnnounceText('');
    setShowAnnounceForm(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = (staffUserId) => {
    setShowNewChat(false);
    openChat(staffUserId);
  };

  const getDisplayName = (userId) => {
    if (userId === user?.id) return 'Tú';
    if (userId === 'announcement') return '📢 Anuncios';
    const staff = staffUsers.find(s => s.user_id === userId);
    if (staff) return staff.display_name;
    return userId?.slice(0, 8) || 'Usuario';
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="animated-fade" style={{ display: 'flex', gap: '15px', height: 'calc(100vh - 280px)', minHeight: '400px' }}>
      {/* Panel de conversaciones */}
      <div className="glass-panel" style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>💬 Mensajes</h3>
          <button onClick={() => setShowNewChat(!showNewChat)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
            +
          </button>
        </div>

        {showNewChat && (
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-glass)', maxHeight: '150px', overflowY: 'auto' }}>
            {staffUsers.map(s => (
              <div key={s.user_id} onClick={() => startNewChat(s.user_id)}
                style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-text)' }}
                className="hover-row">
                {s.display_name} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>({s.system_role})</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setShowAnnounceForm(!showAnnounceForm)} className="btn-outline"
          style={{ margin: '8px 12px', padding: '8px', fontSize: '0.75rem', borderColor: 'var(--color-gold)', color: 'var(--color-gold)', justifyContent: 'center' }}>
          📢 {showAnnounceForm ? 'Cancelar' : 'Nuevo Anuncio'}
        </button>

        {showAnnounceForm && (
          <form onSubmit={sendAnnouncement} style={{ padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea value={announceText} onChange={e => setAnnounceText(e.target.value)}
              placeholder="Mensaje para todo el Reino..."
              className="form-textarea"
              rows="3" style={{ fontSize: '0.78rem', resize: 'none' }} />
            <button type="submit" disabled={!announceText.trim()} className="btn-neon"
              style={{ padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}>
              Publicar Anuncio
            </button>
          </form>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              No hay mensajes aún.
            </p>
          ) : (
            conversations.map(c => (
              <div key={c.id} onClick={() => openChat(c.id)}
                style={{
                  padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: activeChat?.id === c.id ? 'rgba(0,230,118,0.05)' : 'transparent',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)' }}>
                    {getDisplayName(c.id)}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{formatTime(c.lastTime)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                    {c.lastMsg.sender_id === user?.id ? 'Tú: ' : ''}{c.lastMsg.attachments?.length > 0 ? '📷 Foto' : c.lastMsg.text}
                  </span>
                  {c.unread > 0 && (
                    <span style={{ background: 'var(--color-primary)', color: '#000', borderRadius: '10px', padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700 }}>
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel de chat */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeChat ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Selecciona una conversación
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-gold)', fontFamily: 'Outfit' }}>
                {getDisplayName(activeChat.id)}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map(msg => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} style={{
                    alignSelf: isOwn ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: isOwn ? 'rgba(0,230,118,0.1)' : 'var(--bg-surface-solid)',
                    border: `1px solid ${isOwn ? 'rgba(0,230,118,0.2)' : 'var(--border-glass)'}`,
                    fontSize: '0.82rem',
                    color: 'var(--color-text)',
                    lineHeight: 1.4,
                  }}>
                    <div>{msg.text}</div>
                    {(msg.attachments && msg.attachments.length > 0) && (
                      <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {msg.attachments.map((att, i) => (
                          <div key={i}>
                            {att.type?.startsWith('image/') ? (
                              <img src={att.url} alt={att.name}
                                style={{ maxWidth: '180px', maxHeight: '180px', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => window.open(att.url, '_blank')} />
                            ) : (
                              <a href={att.url} target="_blank" rel="noopener noreferrer"
                                style={{ color: 'var(--color-primary)', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                📎 {att.name}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textAlign: 'right', marginTop: '3px' }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '10px', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {previewFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'rgba(0,230,118,0.05)', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', color: 'var(--color-primary)' }}>
                  <span>{previewFile.type?.startsWith('image/') ? '📷' : '📎'}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewFile.name}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>{(previewFile.size / 1024).toFixed(0)}KB</span>
                  <button onClick={() => { setPreviewFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px' }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-outline"
                  style={{ padding: '6px 10px', fontSize: '0.8rem', borderColor: 'var(--border-glass)', flexShrink: 0 }}>
                  📎
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx,.txt" />
                <input
                  type="text"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  className="form-input"
                  disabled={uploading}
                  style={{ flex: 1, fontSize: '0.82rem' }}
                />
                <button onClick={sendMessage} disabled={(!newText.trim() && !previewFile) || uploading} className="btn-neon"
                  style={{ padding: '8px 18px', fontSize: '0.8rem', justifyContent: 'center', whiteSpace: 'nowrap', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? '⏳' : 'Enviar ➤'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Messages;
