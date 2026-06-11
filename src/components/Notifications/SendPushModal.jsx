import React, { useContext, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ClubContext } from '../../context/ClubContext';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'orcos_masculina_mayor', label: 'Masculina Mayor' },
  { value: 'orcos_femenina_mayor', label: 'Femenina Mayor' },
  { value: 'orcos_juveniles_masculina', label: 'Juvenil Masculino' },
  { value: 'orcos_juveniles_femenina', label: 'Juvenil Femenino' },
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
    try {
      const { error } = await supabase.functions.invoke('send-push', {
        body: {
          title: title.trim(),
          body: body.trim(),
          filters: { player_ids: [...selectedIds] },
        },
      });

      if (error) throw error;
      showToast(`Notificación enviada a ${selectedIds.size} jugadores.`, 'success');
      onClose();
    } catch (err) {
      showToast('Error al enviar: ' + (err.message || 'desconocido'), 'error');
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)', marginBottom: '20px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
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
                  background: selectedIds.has(p.id) ? 'rgba(0,230,118,0.08)' : 'transparent',
                  border: selectedIds.has(p.id) ? '1px solid rgba(0,230,118,0.2)' : '1px solid transparent',
                  fontSize: '0.85rem',
                }}>
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => togglePlayer(p.id)} style={{ accentColor: 'var(--color-primary)' }} />
                  <span style={{ fontWeight: 600, flex: 1 }}>{p.name}</span>
                  {p.posicion && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{p.posicion}</span>}
                  {p.teamCategory && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>{p.teamCategory.replace('orcos_', '')}</span>}
                </label>
              ))
            )}
          </div>
        </div>

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
