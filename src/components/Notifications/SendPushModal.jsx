import React, { useContext, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ClubContext } from '../../context/ClubContext';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../context/ToastContext';
import { formatTeamCategory } from '../../context/constants';

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'orcos_masculina_mayor', label: 'Masculina Mayor' },
  { value: 'orcos_femenina_mayor', label: 'Femenina Mayor' },
  { value: 'orcos_juveniles_masculina', label: 'Juveniles Masculina' },
  { value: 'orcos_juveniles_femenina', label: 'Juveniles Femenina' },
];

const POSITIONS = [
  { value: '', label: 'Todas las posiciones' },
  { value: 'Pilar', label: 'Pilar' },
  { value: 'Hooker', label: 'Hooker' },
  { value: 'Segunda Linea', label: 'Segunda Línea' },
  { value: 'Ala', label: 'Ala' },
  { value: 'Numero 8', label: 'Número 8' },
  { value: 'Medio Scrum', label: 'Medio Scrum' },
  { value: 'Apertura', label: 'Apertura' },
  { value: 'Centro', label: 'Centro' },
  { value: 'Wing', label: 'Wing' },
  { value: 'Fullback', label: 'Fullback' },
];

export default function SendPushModal({ onClose }) {
  const { players, makgoraTeams } = useContext(ClubContext);
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [makgoraFilter, setMakgoraFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyTab, setHistoryTab] = useState('send'); // 'send', 'history', 'templates'

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data } = await supabase.from('notification_templates').select('*').order('created_at', { ascending: false });
    if (data) setTemplates(data);
  };

  const loadHistory = async () => {
    const { data } = await supabase.from('notification_history').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setHistory(data);
  };

  const applyTemplate = (t) => {
    setTitle(t.title);
    setBody(t.body);
  };

  const handleSaveTemplate = async () => {
    if (!title.trim() || !body.trim()) return;
    const name = prompt('Nombre para la plantilla:');
    if (!name) return;
    const { error } = await supabase.from('notification_templates').insert({
      name, title: title.trim(), body: body.trim(),
      created_by: (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) { showToast('Error al guardar: ' + error.message, 'error'); return; }
    showToast('Plantilla guardada.', 'success');
    loadTemplates();
  };

  const filteredPlayers = useMemo(() => {
    let p = players;
    if (categoryFilter) p = p.filter(x => x.teamCategory === categoryFilter);
    if (makgoraFilter) p = p.filter(x => x.makgora_team_id === makgoraFilter);
    if (positionFilter) p = p.filter(x => x.posicion === positionFilter);
    return p;
  }, [players, categoryFilter, makgoraFilter, positionFilter]);

  const togglePlayer = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredPlayers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPlayers.map(p => p.id)));
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      showToast('Título y mensaje son obligatorios.', 'warning');
      return;
    }
    if (selectedIds.size === 0) {
      showToast('Seleccioná al menos un jugador.', 'warning');
      return;
    }

    setSending(true);
    const payload = {
      title: title.trim(),
      body: body.trim(),
      filters: { player_ids: [...selectedIds] },
    };

    try {
      const { error: webError } = await supabase.functions.invoke('web-push', {
        body: payload,
      });
      if (webError) throw webError;
      await supabase.from('notification_history').insert({
        title: title.trim(), body: body.trim(),
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        recipient_count: selectedIds.size,
        filters: { categories: categoryFilter || null, makgora: makgoraFilter || null, positions: positionFilter || null },
      });
      showToast(`Notificación enviada a ${selectedIds.size} jugadores.`, 'success');
      onClose();
    } catch (err) {
      const msg = err.message || 'desconocido';
      if (msg.includes('VAPID keys not configured')) {
        showToast('Configura las llaves VAPID en Supabase → Edge Functions → Secrets.', 'error');
      } else {
        showToast('Error al enviar: ' + msg, 'error');
      }
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-primary)', marginBottom: '20px' }}>
          Enviar Notificación
        </h2>

        <div className="form-group">
          <label>Título</label>
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Entrenamiento mañana" />
        </div>

        <div className="form-group">
          <label>Mensaje</label>
          <textarea className="form-input" value={body} onChange={e => setBody(e.target.value)} placeholder="Escribí el mensaje..." rows={3} style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px', marginBottom: '16px' }}>
          <div className="form-group">
            <label>Filtrar por categoría</label>
            <select className="form-select" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setSelectedIds(new Set()); }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Filtrar por equipo Mak'Gora</label>
            <select className="form-select" value={makgoraFilter} onChange={e => { setMakgoraFilter(e.target.value); setSelectedIds(new Set()); }}>
              <option value="">Todos los equipos</option>
              {makgoraTeams?.map(t => <option key={t.id} value={t.id}>{t.rpg_name || t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Filtrar por posición</label>
            <select className="form-select" value={positionFilter} onChange={e => { setPositionFilter(e.target.value); setSelectedIds(new Set()); }}>
              {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ margin: 0 }}>Jugadores ({filteredPlayers.length})</label>
            {filteredPlayers.length > 0 && (
              <button onClick={toggleAll} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                {selectedIds.size === filteredPlayers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            )}
          </div>
          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredPlayers.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '20px', textAlign: 'center' }}>
                No hay jugadores con esos filtros.
              </div>
            ) : (
              filteredPlayers.map(p => (
                <label key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: selectedIds.has(p.id) ? 'rgba(46, 229, 122,0.08)' : 'transparent',
                  border: selectedIds.has(p.id) ? '1px solid rgba(46, 229, 122,0.2)' : '1px solid transparent',
                  fontSize: '0.85rem',
                }}>
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => togglePlayer(p.id)} style={{ accentColor: 'var(--color-primary)' }} />
                  <span style={{ fontWeight: 600, flex: 1 }}>{p.name}</span>
                  {p.posicion && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{p.posicion}</span>}
                  {p.teamCategory && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>{formatTeamCategory(p.teamCategory)}</span>}
                </label>
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
          <button onClick={handleSaveTemplate} disabled={!title.trim() || !body.trim()}
            className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>
            💾 Guardar Plantilla
          </button>
          <button onClick={() => { setHistoryTab(historyTab === 'templates' ? 'send' : 'templates'); if (historyTab !== 'templates') loadTemplates(); }}
            className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>
            {historyTab === 'templates' ? '✕ Cerrar' : '📋 Plantillas'}
          </button>
          <button onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }}
            className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>
            {showHistory ? '✕ Cerrar' : '📜 Historial'}
          </button>
        </div>

        {historyTab === 'templates' && templates.length > 0 && (
          <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Plantillas Guardadas</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
              {templates.map(t => (
                <div key={t.id} onClick={() => applyTemplate(t)}
                  style={{ padding: '6px 10px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', background: 'rgba(46, 229, 122,0.03)', border: '1px solid var(--border-glass)', fontSize: '0.75rem' }}
                  className="hover-row">
                  <strong style={{ color: 'var(--color-primary)' }}>{t.name}</strong>: {t.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {showHistory && (
          <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', maxHeight: '150px', overflowY: 'auto' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Historial de Envíos</label>
            {history.length === 0 ? (
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin envios registrados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {history.map(h => (
                  <div key={h.id} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', fontSize: '0.7rem' }}>
                    <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>{h.title}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>{h.body?.slice(0, 60)}... · {h.recipient_count} jugador(es) · {new Date(h.created_at).toLocaleDateString('es')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
            Cancelar
          </button>
          <button onClick={handleSend} disabled={sending} className="btn-neon" style={{ flex: 1, justifyContent: 'center' }}>
            {sending ? 'Enviando...' : `Enviar a ${selectedIds.size} jugador(es)`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
