import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Ticket, Utensils, Shirt, Bookmark, Edit3, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, Package, Plus, Minus, Wallet, Search, Trophy
} from 'lucide-react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { RaffleAssignmentModal } from './RaffleAssignmentModal';
import { RaffleTicketModal } from './RaffleTicketModal';
import { RegisterPaymentModal } from './RegisterPaymentModal';
import { EditCampaignModal } from './EditCampaignModal';
import { SellTicketsModal } from './SellTicketsModal';

function getCampaignMeta(campaign) {
  if (campaign.subtype === 'uniform') {
    return { Icon: Shirt, label: 'Uniforme / Kit', color: '#40c4ff' };
  }
  if (campaign.type === 'raffle') {
    return { Icon: Ticket, label: 'Rifa', color: 'var(--color-gold)' };
  }
  if (campaign.type === 'food') {
    return { Icon: Utensils, label: 'Actividad / Unidades', color: 'var(--color-primary)' };
  }
  return { Icon: Bookmark, label: 'Cuota / General', color: '#b388ff' };
}

function getStatusInfo(deadline, amountPaid, amountDue) {
  if (amountPaid >= amountDue && amountDue > 0) return { label: 'Pagado', chip: 'pro-chip-success', color: 'var(--color-primary)' };
  if (deadline && new Date(deadline) < new Date()) return { label: 'Vencido', chip: 'pro-chip-danger', color: 'var(--color-red)' };
  if (amountPaid > 0) return { label: 'Parcial', chip: 'pro-chip-warning', color: 'var(--color-gold)' };
  return { label: 'Pendiente', chip: 'pro-chip-danger', color: 'var(--color-red)' };
}

const DELIVERY_LABELS = {
  pending: { label: 'Por pedir', chip: 'pro-chip-muted' },
  ordered: { label: 'En confección', chip: 'pro-chip-info' },
  delivered: { label: 'Entregado', chip: 'pro-chip-success' },
};

export function FundraisingCampaignCard({ campaign, players, isStaff, currentPlayerId }) {
  const {
    updateCampaign, deleteCampaign, getAssignments, getRaffleTickets,
    registerPayment, updateAssignment
  } = useContext(ClubContext);
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showSellModal, setShowSellModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isUniform = campaign.subtype === 'uniform';
  const isFood = campaign.type === 'food';
  const isRaffle = campaign.type === 'raffle';
  const { Icon: TypeIcon, label: typeLabel, color: typeColor } = getCampaignMeta(campaign);

  const loadData = () => {
    setLoadingAssignments(true);
    getAssignments(campaign.id).then(data => {
      setAssignments(data || []);
      setLoadingAssignments(false);
    });
    if (isRaffle) {
      getRaffleTickets(campaign.id).then(setTickets);
    }
  };

  useEffect(() => {
    loadData();
  }, [campaign.id, campaign.type, getAssignments, getRaffleTickets]);

  useEffect(() => {
    if (expanded) {
      loadData();
    }
  }, [expanded, campaign.id, campaign.type, getAssignments, getRaffleTickets]);

  const totalDue = assignments.reduce((s, a) => s + Number(a.amount_due || 0), 0);
  const totalPaid = assignments.reduce((s, a) => s + Number(a.amount_paid || 0), 0);
  const progress = totalDue > 0 ? Math.min(100, (totalPaid / totalDue) * 100) : 0;

  const prizes = Array.isArray(campaign.prizes) ? campaign.prizes : [];
  const estimatedRevenue = isRaffle && campaign.total_tickets && campaign.ticket_price
    ? Number(campaign.total_tickets) * Number(campaign.ticket_price)
    : totalDue;
  const totalPrizeCost = prizes.reduce((sum, p) => sum + Number(p.value || 0), 0);
  const estimatedNet = Math.max(0, estimatedRevenue - totalPrizeCost);
  const soldTickets = tickets.filter(t => t.is_sold).length;
  const totalTicketsNum = Number(campaign.total_tickets) || 0;
  const ticketProgress = totalTicketsNum > 0 ? Math.round((soldTickets / totalTicketsNum) * 100) : 0;

  const totalUnitsAssigned = isFood
    ? assignments.reduce((s, a) => s + Number(a.units_assigned || campaign.units_per_player || 0), 0)
    : 0;
  const totalUnitsSold = isFood
    ? assignments.reduce((s, a) => s + Number(a.units_sold || 0), 0)
    : 0;

  const playerMap = useMemo(() => {
    const map = {};
    (players || []).forEach(p => { map[p.id] = p; });
    return map;
  }, [players]);

  const uniformSummary = useMemo(() => {
    if (!isUniform) return null;
    const jersey = {};
    const shorts = {};
    const socks = {};
    let deliveredCount = 0;
    assignments.forEach(a => {
      const p = playerMap[a.player_id];
      const cloth = p?.clothingSizes || p?.clothing;
      const j = cloth?.jersey || 'Sin talla';
      const s = cloth?.shorts || 'Sin talla';
      const k = cloth?.socks || 'Sin talla';
      jersey[j] = (jersey[j] || 0) + 1;
      shorts[s] = (shorts[s] || 0) + 1;
      socks[k] = (socks[k] || 0) + 1;
      if (a.delivery_status === 'delivered') deliveredCount++;
    });
    return { jersey, shorts, socks, deliveredCount };
  }, [isUniform, assignments, playerMap]);

  const filteredAssignments = searchQuery.trim()
    ? assignments.filter(a => {
        const p = playerMap[a.player_id];
        if (!p) return false;
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.apodo || '').toLowerCase().includes(q);
      })
    : assignments;

  const visibleAssignments = !isStaff
    ? assignments.filter(a => a.player_id === currentPlayerId)
    : filteredAssignments;

  const handleEditSave = async (campaignId, updates) => {
    return updateCampaign(campaignId, updates);
  };

  const handleRaffleModalClose = () => {
    setShowRaffleModal(false);
    setExpanded(true);
    loadData();
  };

  const handleCloseCampaign = () => {
    updateCampaign(campaign.id, { status: 'closed' });
    showToast('Campaña cerrada.', 'success');
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(null);
    loadData();
  };

  const handleSellModalClose = () => {
    setShowSellModal(null);
    setExpanded(true);
    loadData();
  };

  const handleTicketModalClose = () => {
    setShowTicketModal(null);
    loadData();
  };

  const handleStepUnits = async (assignment, delta) => {
    if (!updateAssignment) return;
    const current = Number(assignment.units_sold || 0);
    const next = Math.max(0, current + delta);
    try {
      await updateAssignment(assignment.id, { units_sold: next });
      setAssignments(prev => prev.map(item => item.id === assignment.id ? { ...item, units_sold: next } : item));
    } catch {
      showToast('Error al actualizar unidades.', 'error');
    }
  };

  const handleDeliveryChange = async (assignment, nextStatus) => {
    if (!updateAssignment) return;
    try {
      await updateAssignment(assignment.id, { delivery_status: nextStatus });
      setAssignments(prev => prev.map(item => item.id === assignment.id ? { ...item, delivery_status: nextStatus } : item));
      showToast('Estado de entrega actualizado.', 'success');
    } catch {
      showToast('Error al actualizar estado de entrega.', 'error');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            color: typeColor
          }}>
            <TypeIcon size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h4 style={{ fontSize: '1.02rem', fontWeight: 800, fontFamily: 'Outfit', margin: 0 }}>{campaign.name}</h4>
              <span className="pro-chip pro-chip-muted">{typeLabel}</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '2px' }} className="tabular-nums">
              {campaign.total_tickets && `${campaign.total_tickets} boletas`}
              {campaign.ticket_price && ` · $${Number(campaign.ticket_price).toLocaleString()} c/u`}
              {isFood && campaign.unit_price && `${campaign.units_per_player || 1} uds/jugador · $${Number(campaign.unit_price).toLocaleString()} c/u`}
              {campaign.deadline && ` · Vence: ${campaign.deadline}`}
            </div>
            {prizes.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {prizes.map((p, i) => (
                  <span key={i} className={`pro-chip ${i === 0 ? 'pro-chip-warning' : 'pro-chip-muted'} tabular-nums`}>
                    <Trophy size={11} />
                    {i + 1}° {p.name}{p.value ? ` · $${Number(p.value).toLocaleString()}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {campaign.deadline && new Date(campaign.deadline) < new Date() && campaign.status === 'active' && (
            <span className="pro-chip pro-chip-danger">VENCIDA</span>
          )}
          {campaign.status === 'closed' && (
            <span className="pro-chip pro-chip-muted">CERRADA</span>
          )}
          {isStaff && (
            <button onClick={() => setShowEditModal(true)} className="btn-outline" style={{ padding: '6px 9px', fontSize: '0.72rem' }} title="Editar campaña">
              <Edit3 size={14} />
            </button>
          )}
          {isStaff && campaign.status === 'active' && (
            <button onClick={handleCloseCampaign} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.72rem', color: 'var(--color-red)' }}>
              Cerrar
            </button>
          )}
          {isStaff && (
            <button onClick={() => setShowDeleteConfirm(true)} className="btn-outline" style={{ padding: '6px 9px', fontSize: '0.72rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.3)' }} title="Eliminar campaña">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            <span style={{ fontSize: '0.7rem' }}>{expanded ? 'Ocultar' : 'Detalle'}</span>
          </button>
        </div>
      </div>

      <div className="pro-kpi-grid">
        <div className="pro-kpi-card">
          <div className="pro-kpi-label">Meta Estimada</div>
          <div className="pro-kpi-value" style={{ color: 'var(--color-gold)' }}>${estimatedRevenue.toLocaleString()}</div>
          {prizes.length > 0 && (
            <div style={{ fontSize: '0.68rem', color: 'var(--color-red)' }} className="tabular-nums">− Premios: ${Number(totalPrizeCost).toLocaleString()}</div>
          )}
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }} className="tabular-nums">
            <span>Neto: ${estimatedNet.toLocaleString()}</span>
            {estimatedNet > 0 && estimatedRevenue > 0 && (
              <span className="pro-chip pro-chip-success" style={{ padding: '1px 6px' }}>
                {Math.round((estimatedNet / estimatedRevenue) * 100)}%
              </span>
            )}
          </div>
        </div>
        <div className="pro-kpi-card">
          <div className="pro-kpi-label">Recaudado Real</div>
          <div className="pro-kpi-value" style={{ color: 'var(--color-primary)' }}>${totalPaid.toLocaleString()}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }} className="tabular-nums">
            Faltan ${Math.max(0, totalDue - totalPaid).toLocaleString()} ({Math.round(progress)}%)
          </div>
        </div>
        {assignments.length > 0 && (
          <div className="pro-kpi-card">
            <div className="pro-kpi-label">Guerreros Asignados</div>
            <div className="pro-kpi-value">{assignments.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }} className="tabular-nums">
              {assignments.filter(a => Number(a.amount_paid) >= Number(a.amount_due) && Number(a.amount_due) > 0).length} al día
            </div>
          </div>
        )}
        {isRaffle && totalTicketsNum > 0 && (
          <div className="pro-kpi-card">
            <div className="pro-kpi-label">Boletas Vendidas</div>
            <div className="pro-kpi-value" style={{ color: 'var(--color-primary)' }}>{soldTickets}/{totalTicketsNum}</div>
            {ticketProgress > 0 && (
              <div style={{ background: 'var(--bg-dark)', borderRadius: '4px', height: '4px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ width: `${ticketProgress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
              </div>
            )}
          </div>
        )}
        {isFood && totalUnitsAssigned > 0 && (
          <div className="pro-kpi-card">
            <div className="pro-kpi-label">Unidades Vendidas</div>
            <div className="pro-kpi-value" style={{ color: 'var(--color-primary)' }}>{totalUnitsSold}/{totalUnitsAssigned}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }} className="tabular-nums">
              {Math.round((totalUnitsSold / totalUnitsAssigned) * 100)}% entregadas
            </div>
          </div>
        )}
        {isUniform && uniformSummary && (
          <div className="pro-kpi-card">
            <div className="pro-kpi-label">Kits Entregados</div>
            <div className="pro-kpi-value" style={{ color: '#40c4ff' }}>{uniformSummary.deliveredCount}/{assignments.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }} className="tabular-nums">
              Control de indumentaria
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg-dark)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? 'var(--color-primary)' : 'var(--color-gold)', transition: 'width 0.3s ease' }} />
      </div>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
          {loadingAssignments ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Cargando asignaciones...
            </div>
          ) : (
            <>
              {isStaff && isRaffle && assignments.length === 0 && (
                <button onClick={() => setShowRaffleModal(true)} className="btn-neon" style={{ padding: '10px', fontSize: '0.82rem', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Ticket size={16} /> Asignar Números de Rifa
                </button>
              )}

              {isStaff && isUniform && uniformSummary && assignments.length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(64, 196, 255, 0.05)', border: '1px solid rgba(64, 196, 255, 0.2)' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#40c4ff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shirt size={14} /> Consolidado de Tallas para Confección ({assignments.length} kits)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.76rem' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>Camisetas: </span>
                      {Object.entries(uniformSummary.jersey).map(([size, count]) => (
                        <span key={size} className="pro-chip pro-chip-info tabular-nums" style={{ marginRight: '4px', marginBottom: '3px' }}>{size}: {count}</span>
                      ))}
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>Pantalonetas: </span>
                      {Object.entries(uniformSummary.shorts).map(([size, count]) => (
                        <span key={size} className="pro-chip pro-chip-muted tabular-nums" style={{ marginRight: '4px', marginBottom: '3px' }}>{size}: {count}</span>
                      ))}
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>Medias: </span>
                      {Object.entries(uniformSummary.socks).map(([size, count]) => (
                        <span key={size} className="pro-chip pro-chip-muted tabular-nums" style={{ marginRight: '4px', marginBottom: '3px' }}>{size}: {count}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {assignments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {isStaff && assignments.length > 1 && (
                    <div style={{ position: 'relative', maxWidth: '320px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar guerrero por nombre o apodo..."
                        className="form-input"
                        style={{ padding: '7px 10px 7px 32px', fontSize: '0.78rem', width: '100%' }}
                      />
                    </div>
                  )}

                  {visibleAssignments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                      {!isStaff ? 'No tienes asignaciones en esta campaña.' : (searchQuery.trim() ? 'Ningún jugador coincide con la búsqueda.' : 'Sin participantes asignados.')}
                    </div>
                  ) : (
                    <div className="pro-table-wrap">
                      <table className="pro-table">
                        <thead>
                          <tr>
                            <th>Guerrero</th>
                            {isRaffle && <th>Boletas</th>}
                            {isFood && <th>Unidades Vendidas</th>}
                            {isUniform && <th>Tallas (C / P / M)</th>}
                            <th className="num">Meta ($)</th>
                            <th className="num">Abonado ($)</th>
                            <th>Estado</th>
                            {isUniform && <th>Entrega</th>}
                            <th className="num">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleAssignments.map(a => {
                            const p = playerMap[a.player_id];
                            const s = getStatusInfo(campaign.deadline, Number(a.amount_paid), Number(a.amount_due));
                            const playerTickets = isRaffle ? tickets.filter(t => t.assigned_to === a.player_id) : [];
                            const assignedUnits = Number(a.units_assigned || campaign.units_per_player || 1);
                            const soldUnits = Number(a.units_sold || 0);
                            const deliveryKey = a.delivery_status || 'pending';
                            const deliveryInfo = DELIVERY_LABELS[deliveryKey] || DELIVERY_LABELS.pending;

                            return (
                              <tr key={a.id}>
                                <td>
                                  <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{p?.name || '—'}</div>
                                  {p?.apodo && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>"{p.apodo}"</div>
                                  )}
                                </td>

                                {isRaffle && (
                                  <td className="tabular-nums">
                                    <span>{a.ticket_start}–{a.ticket_end}</span>
                                    {playerTickets.length > 0 && (
                                      <button
                                        onClick={() => setShowTicketModal(a)}
                                        className="btn-outline"
                                        style={{ padding: '2px 7px', fontSize: '0.68rem', marginLeft: '8px' }}
                                      >
                                        {playerTickets.filter(t => t.is_sold).length}/{playerTickets.length} vendidas
                                      </button>
                                    )}
                                  </td>
                                )}

                                {isFood && (
                                  <td className="tabular-nums">
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      {isStaff && (
                                        <button
                                          type="button"
                                          onClick={() => handleStepUnits(a, -1)}
                                          className="btn-outline"
                                          style={{ padding: '2px 5px' }}
                                          title="Restar unidad"
                                        >
                                          <Minus size={12} />
                                        </button>
                                      )}
                                      <span style={{ fontWeight: 800, color: soldUnits >= assignedUnits ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                                        {soldUnits} / {assignedUnits}
                                      </span>
                                      {isStaff && (
                                        <button
                                          type="button"
                                          onClick={() => handleStepUnits(a, 1)}
                                          className="btn-outline"
                                          style={{ padding: '2px 5px' }}
                                          title="Sumar unidad vendida"
                                        >
                                          <Plus size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                )}

                                {isUniform && (
                                  <td className="tabular-nums">
                                    <span className="pro-chip pro-chip-info">
                                      {(p?.clothingSizes || p?.clothing)?.jersey || '—'} / {(p?.clothingSizes || p?.clothing)?.shorts || '—'} / {(p?.clothingSizes || p?.clothing)?.socks || '—'}
                                    </span>
                                  </td>
                                )}

                                <td className="num">${Number(a.amount_due || 0).toLocaleString()}</td>
                                <td className="num" style={{ fontWeight: 700, color: s.color }}>
                                  ${Number(a.amount_paid || 0).toLocaleString()}
                                </td>
                                <td>
                                  <span className={`pro-chip ${s.chip}`}>{s.label}</span>
                                </td>

                                {isUniform && (
                                  <td>
                                    {isStaff ? (
                                      <select
                                        value={deliveryKey}
                                        onChange={e => handleDeliveryChange(a, e.target.value)}
                                        className="form-input"
                                        style={{ padding: '4px 8px', fontSize: '0.72rem', width: 'auto' }}
                                      >
                                        <option value="pending">Por pedir</option>
                                        <option value="ordered">En confección</option>
                                        <option value="delivered">Entregado</option>
                                      </select>
                                    ) : (
                                      <span className={`pro-chip ${deliveryInfo.chip}`}>
                                        <Package size={11} /> {deliveryInfo.label}
                                      </span>
                                    )}
                                  </td>
                                )}

                                <td className="num">
                                  <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                                    {isStaff && isRaffle && Number(a.amount_paid) < Number(a.amount_due) && playerTickets.some(t => !t.is_sold) && (
                                      <button
                                        onClick={() => setShowSellModal(a)}
                                        className="btn-outline"
                                        style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        title="Registrar venta de boletas"
                                      >
                                        <Ticket size={13} /> Vender
                                      </button>
                                    )}
                                    {isStaff && (
                                      <button
                                        onClick={() => setShowPaymentModal(a)}
                                        className="btn-outline"
                                        style={{ padding: '4px 9px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        title="Registrar abono o ver pagos"
                                      >
                                        {Number(a.amount_paid) >= Number(a.amount_due) ? <CheckCircle2 size={13} color="var(--color-primary)" /> : <Wallet size={13} color="var(--color-gold)" />}
                                        <span>Abonar</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {isStaff && isRaffle && assignments.length > 0 && (
                <button onClick={() => setShowRaffleModal(true)} className="btn-outline" style={{ padding: '7px 12px', fontSize: '0.75rem', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Ticket size={14} /> Re-asignar Números
                </button>
              )}
            </>
          )}
        </div>
      )}

      {showEditModal && (
        <EditCampaignModal
          campaign={campaign}
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showRaffleModal && (
        <RaffleAssignmentModal
          campaign={campaign}
          players={players}
          onClose={handleRaffleModalClose}
        />
      )}

      {showTicketModal && (
        <RaffleTicketModal
          campaign={campaign}
          assignment={showTicketModal}
          tickets={tickets.filter(t => t.assigned_to === showTicketModal.player_id)}
          onClose={handleTicketModalClose}
          readOnly={!isStaff}
        />
      )}

      {showPaymentModal && (
        <RegisterPaymentModal
          assignment={showPaymentModal}
          campaign={campaign}
          players={players}
          onClose={handlePaymentModalClose}
          registerPayment={registerPayment}
          readOnly={!isStaff}
        />
      )}

      {showSellModal && (
        <SellTicketsModal
          campaign={campaign}
          assignment={showSellModal}
          tickets={tickets.filter(t => t.assigned_to === showSellModal.player_id)}
          onClose={handleSellModalClose}
          readOnly={!isStaff}
        />
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content animated-slide" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={18} color="var(--color-red)" /> Eliminar Campaña
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
              ¿Estás seguro de eliminar <strong>"{campaign.name}"</strong>?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-red)', marginBottom: '20px' }}>
              Se borrarán todas las asignaciones, tickets y pagos asociados.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-outline">Cancelar</button>
              <button onClick={() => { deleteCampaign(campaign.id); setShowDeleteConfirm(false); showToast('Campaña eliminada.', 'success'); }} className="btn-neon" style={{ background: 'var(--color-red)', borderColor: 'var(--color-red)' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
