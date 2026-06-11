import React, { useState, useEffect, useContext } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { RaffleAssignmentModal } from './RaffleAssignmentModal';
import { RaffleTicketModal } from './RaffleTicketModal';
import { RegisterPaymentModal } from './RegisterPaymentModal';
import { EditCampaignModal } from './EditCampaignModal';
import { SellTicketsModal } from './SellTicketsModal';

const TYPE_ICONS = { raffle: '🎟️', food: '🍲', general: '📌' };
const TYPE_LABELS = { raffle: 'Rifa', food: 'Comida/Postre', general: 'General' };

function getStatusInfo(deadline, amountPaid, amountDue) {
  if (amountPaid >= amountDue) return { label: 'Pagado', color: 'var(--color-primary)', bg: 'rgba(0, 230, 118, 0.08)' };
  if (deadline && new Date(deadline) < new Date()) return { label: 'VENCIDO', color: 'var(--color-red)', bg: 'rgba(255, 61, 0, 0.1)' };
  if (amountPaid > 0) return { label: 'Pago Parcial', color: 'var(--color-gold)', bg: 'rgba(255, 179, 0, 0.08)' };
  return { label: 'Pendiente', color: 'var(--color-red)', bg: 'rgba(255, 61, 0, 0.06)' };
}

export function FundraisingCampaignCard({ campaign, players, isStaff, currentPlayerId }) {
  const { updateCampaign, deleteCampaign, getAssignments, getRaffleTickets, registerPayment } = useContext(ClubContext);
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

  const loadData = (expandedToo) => {
    setLoadingAssignments(true);
    getAssignments(campaign.id).then(data => {
      setAssignments(data);
      setLoadingAssignments(false);
    });
    if (campaign.type === 'raffle') {
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

  const totalDue = assignments.reduce((s, a) => s + Number(a.amount_due), 0);
  const totalPaid = assignments.reduce((s, a) => s + Number(a.amount_paid), 0);
  const progress = totalDue > 0 ? Math.min(100, (totalPaid / totalDue) * 100) : 0;

  const prizes = Array.isArray(campaign.prizes) ? campaign.prizes : [];
  const estimatedRevenue = campaign.type === 'raffle' && campaign.total_tickets && campaign.ticket_price
    ? Number(campaign.total_tickets) * Number(campaign.ticket_price)
    : totalDue;
  const totalPrizeCost = prizes.reduce((sum, p) => sum + Number(p.value || 0), 0);
  const estimatedNet = Math.max(0, estimatedRevenue - totalPrizeCost);
  const soldTickets = tickets.filter(t => t.is_sold).length;
  const totalTicketsNum = Number(campaign.total_tickets) || 0;
  const ticketProgress = totalTicketsNum > 0 ? Math.round((soldTickets / totalTicketsNum) * 100) : 0;

  const playerMap = {};
  players.forEach(p => { playerMap[p.id] = p; });

  const filteredAssignments = searchQuery.trim()
    ? assignments.filter(a => {
        const p = playerMap[a.player_id];
        if (!p) return false;
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.apodo || '').toLowerCase().includes(q);
      })
    : assignments;

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

  return (
    <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>{TYPE_ICONS[campaign.type]}</span>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Outfit' }}>{campaign.name}</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              {TYPE_LABELS[campaign.type]}
              {campaign.total_tickets && ` · ${campaign.total_tickets} boletas`}
              {campaign.ticket_price && ` · $${Number(campaign.ticket_price).toLocaleString()} c/u`}
              {campaign.deadline && ` · Vence: ${campaign.deadline}`}
            </span>
            {prizes.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                {prizes.map((p, i) => (
                  <span key={i} style={{
                    fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px',
                    background: i === 0 ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid ' + (i === 0 ? 'rgba(255,179,0,0.3)' : 'var(--border-glass)'),
                    color: i === 0 ? 'var(--color-gold)' : 'var(--color-text-muted)',
                  }}>
                    {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}° `}
                    {p.name}{p.value ? ` · $${Number(p.value).toLocaleString()}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {campaign.deadline && new Date(campaign.deadline) < new Date() && campaign.status === 'active' && (
            <span className="badge" style={{ background: 'rgba(255,61,0,0.15)', color: 'var(--color-red)', border: '1px solid var(--color-red)', padding: '3px 8px', fontSize: '0.65rem' }}>🔴 VENCIDA</span>
          )}
          {campaign.status === 'closed' && (
            <span className="badge" style={{ background: 'rgba(100,100,100,0.15)', color: 'var(--color-text-muted)', border: '1px solid var(--border-glass)', padding: '3px 8px', fontSize: '0.65rem' }}>CERRADA</span>
          )}
          <>
            {isStaff && (
              <button onClick={() => setShowEditModal(true)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>✏️</button>
            )}
            {isStaff && campaign.status === 'active' && (
              <button onClick={handleCloseCampaign} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.65rem', color: 'var(--color-red)' }}>Cerrar</button>
            )}
            {isStaff && (
              <button onClick={() => setShowDeleteConfirm(true)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.65rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.3)' }}>🗑️</button>
            )}
            <button onClick={() => setExpanded(!expanded)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              {expanded ? '▲' : '▼'}
            </button>
          </>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)' }}>Estimado</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold)', marginTop: '2px' }}>${estimatedRevenue.toLocaleString()}</div>
          {prizes.length > 0 && (
            <div style={{ fontSize: '0.65rem', color: 'var(--color-red)', marginTop: '2px' }}>− Premios: $ {Number(totalPrizeCost).toLocaleString()}</div>
          )}
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px', borderTop: '1px solid var(--border-glass)', paddingTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {prizes.length > 0 ? 'Rentabilidad:' : 'Rentabilidad = Estimado'} <span>${estimatedNet.toLocaleString()}</span>
            {estimatedNet > 0 && (
              <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(0, 230, 118, 0.12)', color: 'var(--color-primary)' }}>
                {Math.round((estimatedNet / estimatedRevenue) * 100)}%
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)' }}>Recaudado</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>${totalPaid.toLocaleString()}</div>
        </div>
        {assignments.length > 0 && (
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)' }}>Participantes</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>{assignments.length}</div>
          </div>
        )}
        {campaign.type === 'raffle' && totalTicketsNum > 0 && (
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)' }}>Boletas</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>{soldTickets}/{totalTicketsNum}</div>
            {ticketProgress > 0 && (
              <div style={{ background: 'var(--bg-dark)', borderRadius: '4px', height: '4px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ width: `${ticketProgress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg-dark)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? 'var(--color-primary)' : 'var(--color-gold)', transition: 'width 0.3s ease' }} />
      </div>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
          {loadingAssignments ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Cargando datos...
            </div>
          ) : (<>
          {isStaff && campaign.type === 'raffle' && assignments.length === 0 && (
            <button onClick={() => setShowRaffleModal(true)} className="btn-neon" style={{ padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}>
              🎟️ Asignar Números de Rifa
            </button>
          )}

          {assignments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: campaign.type === 'raffle' ? '2fr 1fr 1fr 1fr 85px' : '2fr 1fr 1fr 60px', gap: '6px', padding: '6px 8px', fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-glass)' }}>
                <span>Jugador</span>
                {campaign.type === 'raffle' && <span>Números</span>}
                <span>Debe</span>
                <span>Pagado</span>
                <span></span>
              </div>
              {isStaff && assignments.length > 1 && (
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 Buscar jugador..."
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                />
              )}
              {(!isStaff ? assignments.filter(a => a.player_id === currentPlayerId) : filteredAssignments).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  {!isStaff ? 'No tienes asignaciones en esta campaña.' : (searchQuery.trim() ? 'Ningún jugador coincide con la búsqueda.' : 'Sin participantes asignados.')}
                </div>
              ) : (!isStaff ? assignments.filter(a => a.player_id === currentPlayerId) : filteredAssignments).map(a => {
                const p = playerMap[a.player_id];
                const s = getStatusInfo(campaign.deadline, Number(a.amount_paid), Number(a.amount_due));
                const playerTickets = campaign.type === 'raffle' ? tickets.filter(t => t.assigned_to === a.player_id) : [];
                return (
                  <div key={a.id} style={{ display: 'grid', gridTemplateColumns: campaign.type === 'raffle' ? '2fr 1fr 1fr 1fr 85px' : '2fr 1fr 1fr 60px', gap: '6px', padding: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div>
                      <strong>{p?.name || '—'}</strong>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>"{p?.apodo || ''}"</span>
                    </div>
                    {campaign.type === 'raffle' && (
                      <span style={{ fontSize: '0.75rem' }}>
                        {a.ticket_start}–{a.ticket_end}
                        {playerTickets.length > 0 && (
                          <button onClick={() => setShowTicketModal(a)} className="btn-outline" style={{ padding: '2px 6px', fontSize: '0.6rem', marginLeft: '6px' }}>
                            {playerTickets.filter(t => t.is_sold).length}/{playerTickets.length}
                          </button>
          )}
                      </span>
                    )}
                    <span style={{ color: 'var(--color-text-muted)' }}>${Number(a.amount_due).toLocaleString()}</span>
                    <span style={{ color: s.color }}>${Number(a.amount_paid).toLocaleString()}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {isStaff && campaign.type === 'raffle' && Number(a.amount_paid) < Number(a.amount_due) && playerTickets.some(t => !t.is_sold) && (
                        <button onClick={() => setShowSellModal(a)} className="btn-outline" style={{ padding: '3px 6px', fontSize: '0.6rem', color: 'var(--color-primary)' }}>
                          🎟️
                        </button>
                      )}
                      {isStaff && (
                        <button onClick={() => setShowPaymentModal(a)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.65rem' }}>
                          {Number(a.amount_paid) >= Number(a.amount_due) ? '✅' : '💰'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isStaff && campaign.type === 'raffle' && assignments.length > 0 && (
            <button onClick={() => setShowRaffleModal(true)} className="btn-outline" style={{ padding: '6px', fontSize: '0.75rem', justifyContent: 'center', alignSelf: 'flex-start' }}>
              🎟️ Re-asignar Números
            </button>
          )}

          </>)}
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '15px' }}>🗑️ Eliminar Campaña</h3>
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
