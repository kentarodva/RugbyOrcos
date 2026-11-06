import React, { useState, useContext } from 'react';
import { Ticket, Utensils, Shirt, Bookmark, Plus, Check, X, ArrowLeft, Sparkles, Search, Trophy } from 'lucide-react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { CopInput } from '../common/FormattedInputs';

const CAMPAIGN_TYPES = [
  { value: 'raffle', label: 'Rifa Numerada', desc: 'Boletas numeradas y premios', icon: Ticket, color: 'var(--color-gold)' },
  { value: 'food', label: 'Venta / Actividad', desc: 'Tamales, lechona, postres por unidad', icon: Utensils, color: 'var(--color-primary)' },
  { value: 'uniform', label: 'Uniforme / Kit', desc: 'Tallas, abonos y entrega de indumentaria', icon: Shirt, color: 'var(--color-blue)' },
  { value: 'general', label: 'Cuota / Torneo', desc: 'Viajes, inscripción u otro cobro', icon: Bookmark, color: '#a855f7' },
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
  const [unitPrice, setUnitPrice] = useState(15000);
  const [unitsPerPlayer, setUnitsPerPlayer] = useState(5);
  const [uniformPrice, setUniformPrice] = useState(120000);
  const [generalValue, setGeneralValue] = useState(20000);
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

  const computedFoodTotal = Math.max(0, Number(unitPrice || 0) * Number(unitsPerPlayer || 1));

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast('Ingresa un nombre para la campaña.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const validPrizes = prizes.filter(p => p.name?.trim());
      const dbType = type === 'uniform' ? 'general' : type;
      const campaign = {
        name: name.trim(),
        type: dbType,
        subtype: type,
        description: description.trim(),
        deadline: deadline || null,
        ticket_price: type === 'raffle' ? Number(ticketPrice) : null,
        total_tickets: type === 'raffle' ? Number(totalTickets) : null,
        unit_price: type === 'food' ? Number(unitPrice) : type === 'uniform' ? Number(uniformPrice) : null,
        units_per_player: type === 'food' ? Number(unitsPerPlayer) : 1,
        prizes: validPrizes.length > 0 ? validPrizes.map(p => ({ name: p.name.trim(), value: Number(p.value) || 0 })) : [],
      };

      const newCampaign = await addCampaign(campaign);
      const targetPlayers = assignAll ? players : players.filter(p => selectedPlayers.includes(p.id));

      if (type === 'raffle') {
        const perPlayer = Math.floor(Number(totalTickets) / Math.max(1, targetPlayers.length));
        const remainder = Number(totalTickets) % Math.max(1, targetPlayers.length);
        let current = 1;
        const assignments = targetPlayers.map((p, i) => {
          const count = perPlayer + (i < remainder ? 1 : 0);
          const start = current;
          const end = current + count - 1;
          current = end + 1;
          return { playerId: p.id, playerName: p.name, ticketStart: start, ticketEnd: end, price: Number(ticketPrice) };
        });
        await bulkAssignTickets(newCampaign.id, assignments);
      } else if (type === 'food') {
        await bulkAssignFood(newCampaign.id, targetPlayers.map(p => p.id), computedFoodTotal, {
          units_assigned: Number(unitsPerPlayer) || 1,
          units_sold: 0,
        });
      } else if (type === 'uniform') {
        await bulkAssignFood(newCampaign.id, targetPlayers.map(p => p.id), Number(uniformPrice), {
          units_assigned: 1,
          units_sold: 0,
          delivery_status: 'pending',
        });
      } else {
        await bulkAssignFood(newCampaign.id, targetPlayers.map(p => p.id), Number(generalValue));
      }

      showToast(`Campaña "${name.trim()}" creada exitosamente.`, 'success');
      onClose();
    } catch {
      showToast('Error al crear la campaña. Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '600px', padding: '26px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {step === 1 ? 'Nueva Actividad / Campaña del Club' : 'Asignar Guerreros Participantes'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {step === 1 ? 'Controla rifas, ventas por unidad, compra de uniformes o cuotas.' : 'Selecciona a quiénes se les cargará esta actividad.'}
            </p>
          </div>
          <button onClick={onClose} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
            <X size={15} />
          </button>
        </div>

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Tipo de Control</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                {CAMPAIGN_TYPES.map(t => {
                  const Icon = t.icon;
                  const active = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '11px 12px',
                        textAlign: 'left',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: active ? 'rgba(46, 229, 122, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${active ? t.color : 'var(--border-glass)'}`,
                        color: 'var(--color-text)',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: active ? t.color : 'rgba(255,255,255,0.05)',
                        color: active ? '#06210F' : t.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: active ? t.color : 'var(--color-text)' }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                          {t.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nombre de la Campaña / Actividad</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={
                    type === 'raffle' ? 'Ej. Gran Rifa Pro-Torneo'
                      : type === 'food' ? 'Ej. Venta de Tamales Sábado'
                        : type === 'uniform' ? 'Ej. Uniforme Oficial 2026 (Kit Completo)'
                          : 'Ej. Inscripción Torneo Nacional'
                  }
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Fecha Límite</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="form-input" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Descripción / Instrucciones (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej. Entregar dinero a tesorería antes del viernes..."
                className="form-input"
              />
            </div>

            {type === 'raffle' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Valor por Boleta ($ COP)</label>
                    <CopInput value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} placeholder="2.000" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Total Boletas de la Rifa</label>
                    <input type="number" value={totalTickets} onChange={e => setTotalTickets(e.target.value)} min="1" className="form-input tabular-nums" />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trophy size={14} color="var(--color-gold)" /> Premios de la Rifa (opcional)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {prizes.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', minWidth: '28px', color: 'var(--color-gold)', fontWeight: 800 }}>
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
                          placeholder="Ej. Bono $200.000 / Balón Oficial"
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
                          placeholder="Costo $"
                          className="form-input tabular-nums"
                          style={{ width: '110px', padding: '6px 10px', fontSize: '0.8rem' }}
                          min="0"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPrizes(prev => [...prev, { name: '', value: '' }])}
                      className="btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.72rem', alignSelf: 'flex-start' }}
                    >
                      <Plus size={13} /> Agregar premio
                    </button>
                  </div>
                </div>
              </>
            )}

            {type === 'food' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '10px', padding: '12px', background: 'rgba(46, 229, 122,0.04)', borderRadius: '10px', border: '1px solid rgba(46, 229, 122,0.18)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Precio por Unidad ($ COP)</label>
                  <CopInput value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="15.000" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Unidades por Jugador</label>
                  <input type="number" value={unitsPerPlayer} onChange={e => setUnitsPerPlayer(e.target.value)} min="1" className="form-input tabular-nums" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Meta por Jugador</label>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.35)', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                    ${computedFoodTotal.toLocaleString()} COP
                  </div>
                </div>
              </div>
            )}

            {type === 'uniform' && (
              <div style={{ padding: '14px', background: 'rgba(90, 169, 255, 0.06)', borderRadius: '10px', border: '1px solid rgba(90, 169, 255, 0.22)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Valor del Uniforme / Kit por Jugador ($ COP)</label>
                  <CopInput value={uniformPrice} onChange={e => setUniformPrice(e.target.value)} placeholder="120.000" />
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--color-blue)', lineHeight: 1.4 }}>
                  Al crear este control, la tabla mostrará automáticamente las <strong>tallas de Camiseta, Pantaloneta y Medias</strong> de cada jugador, el consolidado para enviar al fabricante y el estado de entrega.
                </p>
              </div>
            )}

            {type === 'general' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Valor de la Cuota por Jugador ($ COP)</label>
                <CopInput value={generalValue} onChange={e => setGeneralValue(e.target.value)} placeholder="20.000" />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button onClick={onClose} className="btn-outline">Cancelar</button>
              <button onClick={() => setStep(2)} className="btn-neon">Siguiente: Participantes</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0 }}>Seleccionar Participantes</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {assignAll ? `Todos los ${players.length}` : `${selectedPlayers.length} de ${players.length}`} seleccionados
                </span>
              </div>

              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
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
                  placeholder="Buscar por nombre o apodo..."
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px 8px 34px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setAssignAll(true); setSelectedPlayers(filteredPlayers.map(p => p.id)); }}
                  className="btn-outline"
                  style={{ padding: '5px 12px', fontSize: '0.72rem', background: assignAll ? 'var(--color-primary)' : 'transparent', color: assignAll ? '#000' : 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                >
                  <Check size={13} /> Seleccionar todos
                </button>
                <button
                  type="button"
                  onClick={() => { setAssignAll(false); setSelectedPlayers([]); }}
                  className="btn-outline"
                  style={{ padding: '5px 12px', fontSize: '0.72rem', color: 'var(--color-red)', borderColor: 'rgba(255, 92, 77,0.3)' }}
                >
                  <X size={13} /> Deseleccionar todos
                </button>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredPlayers.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px', fontSize: '0.85rem' }}>
                    Ningún jugador coincide con la búsqueda.
                  </p>
                ) : filteredPlayers.map(p => {
                  const isSelected = assignAll || selectedPlayers.includes(p.id);
                  const cloth = p.clothingSizes || p.clothing || {};
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (assignAll) {
                          setAssignAll(false);
                          setSelectedPlayers(players.filter(x => x.id !== p.id).map(x => x.id));
                        } else {
                          setSelectedPlayers(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', cursor: 'pointer', borderRadius: '8px',
                        background: isSelected ? 'rgba(46, 229, 122, 0.06)' : 'rgba(255,255,255,0.01)',
                        border: '1px solid ' + (isSelected ? 'rgba(46, 229, 122, 0.18)' : 'var(--border-glass)'),
                        transition: 'all 0.15s ease', fontSize: '0.84rem',
                      }}
                    >
                      <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }} />
                      <span style={{ fontWeight: 700, minWidth: '34px', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        #{p.camiseta ?? '—'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <strong>{p.name}</strong>
                        {p.apodo && <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', marginLeft: '6px' }}>&ldquo;{p.apodo}&rdquo;</span>}
                      </div>
                      {type === 'uniform' && (
                        <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '5px', background: 'rgba(90, 169, 255,0.1)', color: 'var(--color-blue)', border: '1px solid rgba(90, 169, 255,0.25)' }}>
                          C:{cloth.jersey || 'M'} · P:{cloth.shorts || 'M'} · M:{cloth.socks || '40-42'}
                        </span>
                      )}
                      {p.posicion && (
                        <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '5px', background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-muted)', border: '1px solid var(--border-glass)' }}>
                          {p.posicion}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button onClick={() => setStep(1)} className="btn-outline"><ArrowLeft size={14} /> Atrás</button>
              <button onClick={handleCreate} className="btn-neon" disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
                <Sparkles size={15} /> Crear Campaña
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
