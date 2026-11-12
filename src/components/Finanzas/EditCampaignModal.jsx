import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

export function EditCampaignModal({ campaign, onSave, onClose }) {
  const { showToast } = useToast();
  const prizes = Array.isArray(campaign.prizes) ? campaign.prizes : [];

  const [name, setName] = useState(campaign.name || '');
  const [description, setDescription] = useState(campaign.description || '');
  const [deadline, setDeadline] = useState(campaign.deadline || '');
  const [editPrizes, setEditPrizes] = useState(
    prizes.length > 0
      ? prizes.map(p => ({ name: p.name, value: String(p.value || '') }))
      : [{ name: '', value: '' }, { name: '', value: '' }, { name: '', value: '' }]
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('El nombre de la campaña es obligatorio.', 'warning');
      return;
    }
    setSaving(true);

    const validPrizes = editPrizes.filter(p => p.name?.trim());
    const updates = {
      name: name.trim(),
      description: description.trim(),
      deadline: deadline || null,
      prizes: validPrizes.length > 0
        ? validPrizes.map(p => ({ name: p.name.trim(), value: Number(p.value) || 0 }))
        : [],
    };

    try {
      await onSave(campaign.id, updates);
      showToast('Campaña actualizada correctamente.', 'success');
      onClose();
    } catch (err) {
      showToast('Error al guardar. Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isRaffle = campaign.type === 'raffle';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>✏️ Editar Campaña</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label>Nombre de la Campaña</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" required />
          </div>

          <div className="form-group">
            <label>Descripción (opcional)</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles..." className="form-input" />
          </div>

          <div className="form-group">
            <label>Fecha Límite (opcional)</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="form-input" />
          </div>

          {isRaffle && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
                <div className="form-group">
                  <label>Valor por Boleto</label>
                  <input type="number" value={campaign.ticket_price || ''} className="form-input" disabled style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>No editable (protege asignaciones)</span>
                </div>
                <div className="form-group">
                  <label>Total Boletas</label>
                  <input type="number" value={campaign.total_tickets || ''} className="form-input" disabled style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>No editable</span>
                </div>
              </div>

              <div className="form-group">
                <label style={{ marginBottom: '8px' }}>🎁 Premios</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {editPrizes.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', minWidth: '36px', color: 'var(--color-gold)', fontWeight: 700 }}>
                        {i + 1}°
                      </span>
                      <input
                        type="text"
                        value={p.name}
                        onChange={e => {
                          const next = [...editPrizes];
                          next[i] = { ...next[i], name: e.target.value };
                          setEditPrizes(next);
                        }}
                        placeholder="Nombre del premio"
                        className="form-input"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                      />
                      <input
                        type="number"
                        value={p.value}
                        onChange={e => {
                          const next = [...editPrizes];
                          next[i] = { ...next[i], value: e.target.value };
                          setEditPrizes(next);
                        }}
                        placeholder="Valor $"
                        className="form-input"
                        style={{ width: '100px', padding: '6px 10px', fontSize: '0.8rem' }}
                        min="0"
                      />
                      {editPrizes.length > 1 && (
                        <button
                          onClick={() => setEditPrizes(prev => prev.filter((_, idx) => idx !== i))}
                          className="btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.65rem', color: 'var(--color-red)', borderColor: 'rgba(255, 92, 77,0.3)' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setEditPrizes(prev => [...prev, { name: '', value: '' }])}
                    className="btn-outline"
                    style={{ padding: '4px 10px', fontSize: '0.7rem', alignSelf: 'flex-start' }}
                  >
                    ➕ Agregar otro premio
                  </button>
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button onClick={onClose} className="btn-outline">Cancelar</button>
            <button onClick={handleSave} className="btn-neon" disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
              {saving ? '💾 Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
