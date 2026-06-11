import React, { useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useToast } from '../../context/ToastContext.jsx';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function RaffleAssignmentModal({ campaign, players, onClose }) {
  const totalTickets = Number(campaign.total_tickets);

  const buildAssignments = () => {
    const perPlayer = Math.floor(totalTickets / players.length);
    const remainder = totalTickets % players.length;
    let current = 1;
    return players.map((p, i) => {
      const count = perPlayer + (i < remainder ? 1 : 0);
      const start = current;
      const end = current + count - 1;
      current = end + 1;
      return { playerId: p.id, playerName: p.name, ticketStart: start, ticketEnd: end, price: Number(campaign.ticket_price) };
    });
  };

  const [assignments, setAssignments] = useState(() => buildAssignments());
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleManualChange = (index, field, value) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    setAssignments(updated);
  };

  const handleSave = async () => {
    if (assignments.length === 0 || saving) return;
    setSaving(true);
    try {
    const tickets = [];
    const assignmentRecords = [];
    for (const a of assignments) {
      const assignmentId = generateId();
      const count = (a.ticketEnd - a.ticketStart + 1);
      for (let n = a.ticketStart; n <= a.ticketEnd; n++) {
        tickets.push({
          campaign_id: campaign.id,
          ticket_number: n,
          assigned_to: a.playerId,
          is_sold: false,
          sold_to_name: '',
        });
      }
      assignmentRecords.push({
        id: assignmentId,
        campaign_id: campaign.id,
        player_id: a.playerId,
        amount_due: count * a.price,
        amount_paid: 0,
        ticket_start: a.ticketStart,
        ticket_end: a.ticketEnd,
        notes: '',
      });
    }

    // Delete existing assignments and tickets to avoid UNIQUE constraint violations on re-assign
    await supabase.from('raffle_tickets').delete().eq('campaign_id', campaign.id);
    await supabase.from('fundraising_assignments').delete().eq('campaign_id', campaign.id);

    if (tickets.length > 0) {
      const { error: tErr } = await supabase.from('raffle_tickets').insert(tickets);
      if (tErr) throw tErr;
    }
    if (assignmentRecords.length > 0) {
      const { error: aErr } = await supabase.from('fundraising_assignments').insert(assignmentRecords);
      if (aErr) throw aErr;
    }
    showToast('Números asignados correctamente.', 'success');
    onClose();
    } catch (err) {
      showToast('Error al guardar. Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit' }}>🎟️ Asignar Números — {campaign.name}</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
          {totalTickets} boletas · ${Number(campaign.ticket_price).toLocaleString()} c/u · {players.length} jugadores
        </p>

        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          Asignación secuencial. Puedes ajustar los rangos manualmente antes de guardar.
        </p>

        <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '15px' }}>
          {assignments.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ flex: 1, fontSize: '0.85rem' }}>{a.playerName}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Desde:</span>
              <input type="number" value={a.ticketStart} onChange={e => handleManualChange(i, 'ticketStart', Number(e.target.value))} className="form-input" style={{ width: '70px', padding: '4px', fontSize: '0.75rem' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Hasta:</span>
              <input type="number" value={a.ticketEnd} onChange={e => handleManualChange(i, 'ticketEnd', Number(e.target.value))} className="form-input" style={{ width: '70px', padding: '4px', fontSize: '0.75rem' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                ${((a.ticketEnd - a.ticketStart + 1) * Number(campaign.ticket_price)).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-outline">Cancelar</button>
          <button onClick={handleSave} className="btn-neon" disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
            {saving ? '💾 Guardando...' : '💾 Guardar Asignación'}
          </button>
        </div>
      </div>
    </div>
  );
}
