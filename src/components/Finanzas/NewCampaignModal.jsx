import React, { useState, useContext } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';

const CAMPAIGN_TYPES = [
  { value: 'raffle', label: '🎟️ Rifa (con números)' },
  { value: 'food', label: '🍲 Comida / Postre / Sopa' },
  { value: 'general', label: '📌 General (otro)' },
];

export function NewCampaignModal({ onClose, players }) {
  const { addCampaign, bulkAssignTickets, bulkAssignFood } = useContext(ClubContext);
  const { showToast } = useToast();

  const [type, setType] = useState('raffle');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [ticketPrice, setTicketPrice] = useState(2000);
  const [totalTickets, setTotalTickets] = useState(50);
  const [foodValue, setFoodValue] = useState(15000);
  const [generalValue, setGeneralValue] = useState(10000);
  const [prizes, setPrizes] = useState([
    { name: '', value: '' },
    { name: '', value: '' },
    { name: '', value: '' },
  ]);
  const [assignAll, setAssignAll] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const filteredPlayers = searchQuery.trim()
    ? players.filter(p => {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.apodo || '').toLowerCase().includes(q);
      })
    : players;

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast('Ingresa un nombre para la campaña.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const validPrizes = prizes.filter(p => p.name?.trim());
      const campaign = {
        name: name.trim(),
        type,
        description: description.trim(),
        deadline: deadline || null,
        ticket_price: type === 'raffle' ? Number(ticketPrice) : null,
        total_tickets: type === 'raffle' ? Number(totalTickets) : null,
        prizes: validPrizes.length > 0 ? validPrizes.map(p => ({ name: p.name.trim(), value: Number(p.value) || 0 })) : [],
      };

      const newCampaign = await addCampaign(campaign);

      const targetPlayers = assignAll ? players : players.filter(p => selectedPlayers.includes(p.id));

      if (type === 'raffle') {
        const perPlayer = Math.floor(Number(totalTickets) / targetPlayers.length);
        const remainder = Number(totalTickets) % targetPlayers.length;
        let current = 1;
        const assignments = targetPlayers.map((p, i) => {
          const count = perPlayer + (i < remainder ? 1 : 0);
          const start = current;
          const end = current + count - 1;
          current = end + 1;
          return { playerId: p.id, playerName: p.name, ticketStart: start, ticketEnd: end, price: Number(ticketPrice) };
        });
        await bulkAssignTickets(newCampaign.id, assignments);
      } else {
        const value = type === 'food' ? Number(foodValue) : Number(generalValue);
        await bulkAssignFood(newCampaign.id, targetPlayers.map(p => p.id), value);
      }

      showToast(`Campaña "${name.trim()}" creada exitosamente.`, 'success');
      onClose();
    } catch (err) {
      showToast('Error al crear la campaña. Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit' }}>
            {step === 1 ? '➕ Nueva Campaña de Recaudación' : '📋 Participantes'}
          </h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Tipo de Campaña</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CAMPAIGN_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className="btn-outline"
                    style={{
                      flex: 1, padding: '10px', fontSize: '0.8rem',
                      background: type === t.value ? 'var(--color-gold)' : 'transparent',
                      color: type === t.value ? '#000' : '#fff',
                      borderColor: type === t.value ? 'var(--color-gold)' : 'var(--border-glass)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Nombre de la Campaña</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Rifa Navidad 2026, Sopa del Jueves" className="form-input" required />
            </div>

            <div className="form-group">
              <label>Descripción (opcional)</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles..." className="form-input" />
            </div>

            <div className="form-group">
              <label>Fecha Límite (opcional)</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="form-input" />
            </div>

            {type === 'raffle' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Valor por Boleto ($)</label>
                    <input type="number" value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} min="500" step="500" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Total Boletas</label>
                    <input type="number" value={totalTickets} onChange={e => setTotalTickets(e.target.value)} min="1" className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ marginBottom: '8px' }}>🎁 Premios (opcional)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {prizes.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', minWidth: '36px', color: 'var(--color-gold)', fontWeight: 700 }}>
                          {i + 1}°
                        </span>
                        <input
                          type="text"
                          value={p.name}
                          onChange={e => {
                            const next = [...prizes];
                            next[i] = { ...next[i], name: e.target.value };
                            setPrizes(next);
                          }}
                          placeholder={`Ej. TV 55" Smart`}
                          className="form-input"
                          style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                        />
                        <input
                          type="number"
                          value={p.value}
                          onChange={e => {
                            const next = [...prizes];
                            next[i] = { ...next[i], value: e.target.value };
                            setPrizes(next);
                          }}
                          placeholder="Valor $"
                          className="form-input"
                          style={{ width: '100px', padding: '6px 10px', fontSize: '0.8rem' }}
                          min="0"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => setPrizes(prev => [...prev, { name: '', value: '' }])}
                      className="btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.7rem', alignSelf: 'flex-start' }}
                    >
                      ➕ Agregar otro premio
                    </button>
                  </div>
                </div>
              </>
            )}

            {type === 'food' && (
              <div className="form-group">
                <label>Valor por Persona ($)</label>
                <input type="number" value={foodValue} onChange={e => setFoodValue(e.target.value)} min="1000" step="1000" className="form-input" />
              </div>
            )}

            {type === 'general' && (
              <div className="form-group">
                <label>Valor por Persona ($)</label>
                <input type="number" value={generalValue} onChange={e => setGeneralValue(e.target.value)} min="1000" step="1000" className="form-input" />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={onClose} className="btn-outline">Cancelar</button>
              <button onClick={() => setStep(2)} className="btn-neon">Siguiente: Participantes</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0 }}>Seleccionar Participantes</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {assignAll ? `Todos los ${players.length}` : `${selectedPlayers.length} de ${players.length}`} seleccionados
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (assignAll) {
                      setSelectedPlayers(players.filter(p =>
                        p.name.toLowerCase().includes(val.toLowerCase()) ||
                        (p.apodo || '').toLowerCase().includes(val.toLowerCase())
                      ).map(p => p.id));
                    }
                  }}
                  placeholder="🔍 Buscar por nombre o apodo..."
                  className="form-input"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setAssignAll(true); setSelectedPlayers(filteredPlayers.map(p => p.id)); }}
                  className="btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.7rem', background: assignAll ? 'var(--color-primary)' : 'transparent', color: assignAll ? '#000' : 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                >
                  ✓ Seleccionar todos
                </button>
                <button
                  onClick={() => { setAssignAll(false); setSelectedPlayers([]); }}
                  className="btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.7rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.3)' }}
                >
                  ✕ Deseleccionar todos
                </button>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {filteredPlayers.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px', fontSize: '0.85rem' }}>
                    Ningún jugador coincide con la búsqueda.
                  </p>
                ) : filteredPlayers.map(p => {
                  const isSelected = selectedPlayers.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setAssignAll(false);
                        setSelectedPlayers(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 10px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(0, 230, 118, 0.06)' : 'rgba(255,255,255,0.01)',
                        border: '1px solid ' + (isSelected ? 'rgba(0, 230, 118, 0.15)' : 'var(--border-glass)'),
                        transition: 'all 0.15s ease', fontSize: '0.85rem',
                      }}
                    >
                      <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }} />
                      <span style={{ fontWeight: 600, minWidth: '36px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        #{p.camiseta ?? '—'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <strong>{p.name}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: '4px' }}>"{p.apodo || ''}"</span>
                      </div>
                      {p.posicion && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', border: '1px solid var(--border-glass)' }}>
                          {p.posicion}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={() => setStep(1)} className="btn-outline">← Atrás</button>
              <button onClick={handleCreate} className="btn-neon" disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>✨ Crear Campaña</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
