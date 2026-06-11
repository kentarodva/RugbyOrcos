import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { formatLocalDate, parseLocalDate } from '../utils/dates';

const TicketRow = React.memo(({ ticket, reports, setReports, handleReport, reporting }) => {
  const campaign = ticket.campaign || {};
  const r = reports[ticket.id] || {};
  const isPendingFiado = ticket.sale_status === 'fiado' && !ticket.reviewed_by;
  const isPendingPaid = ticket.sale_status === 'paid' && !ticket.reviewed_by;
  const isApproved = ticket.sale_status === 'paid' && ticket.reviewed_by;
  const isRejected = ticket.sale_status === 'rejected';
  const isAvailable = ticket.sale_status === 'available' || (!ticket.sale_status && !ticket.is_sold);

  const updateReport = useCallback((field, value) => {
    setReports(prev => ({ ...prev, [ticket.id]: { ...(prev[ticket.id] || {}), [field]: value } }));
  }, [ticket.id, setReports]);

  return (
    <div className="glass-panel" style={{
      padding: '10px 14px', marginBottom: '6px',
      opacity: isApproved ? 0.6 : 1,
      borderLeft: `3px solid ${isApproved ? '#00e676' : isRejected ? '#ff3d00' : isPendingFiado ? '#ffb300' : isPendingPaid ? '#00b0ff' : 'var(--border-glass)'}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            #{ticket.ticket_number}
            <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '8px' }}>
              {campaign.name} ({campaign.type})
            </span>
          </div>
          {isApproved && <div style={{ fontSize: '0.68rem', color: '#00e676' }}>✅ Aprobado por tesorero</div>}
          {isRejected && <div style={{ fontSize: '0.68rem', color: '#ff3d00' }}>❌ Rechazado{ticket.review_note ? ': ' + ticket.review_note : ''}</div>}
          {isPendingFiado && <div style={{ fontSize: '0.68rem', color: '#ffb300' }}>⏳ Fiado — esperando confirmación</div>}
          {isPendingPaid && <div style={{ fontSize: '0.68rem', color: '#00b0ff' }}>⏳ Pagado — esperando confirmación</div>}
          {isPendingFiado && ticket.fiado_until && (
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
              Fiado hasta: {formatLocalDate(parseLocalDate(ticket.fiado_until))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(isAvailable) && (
            <>
              <input type="text" placeholder="Comprador"
                value={r.buyer_name || ''}
                onChange={e => updateReport('buyer_name', e.target.value)}
                style={{ width: '120px', padding: '4px 6px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--color-text)' }} />
              <input type="date" placeholder="Fiado hasta"
                value={r.fiado_until || ''}
                onChange={e => updateReport('fiado_until', e.target.value)}
                style={{ width: '130px', padding: '4px 6px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--color-text)' }} />
              <button onClick={() => handleReport(ticket, 'fiado')}
                disabled={reporting[ticket.id] || !r.buyer_name}
                className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
                Fiado
              </button>
              <button onClick={() => handleReport(ticket, 'paid')}
                disabled={reporting[ticket.id] || !r.buyer_name}
                className="btn-neon" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
                Pagado
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

function PlayerSaleTicketModal({ playerId, onClose }) {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState({});
  const [reports, setReports] = useState({});

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    supabase.from('raffle_tickets').select(`
      id, ticket_number, sale_status, buyer_name, fiado_until, reported_price, reported_at, reviewed_by, review_note,
      campaign:campaign_id(id, name, type, ticket_price)
    `).eq('assigned_to', playerId).order('ticket_number', { ascending: true }).then(({ data, error }) => {
      if (!error && data) setTickets(data);
      setLoading(false);
    });
  }, [playerId]);

  const pendingReports = tickets.filter(t => t.sale_status === 'fiado' && !t.reviewed_by);
  const pendingPaidReports = tickets.filter(t => t.sale_status === 'paid' && !t.reviewed_by);
  const availableTickets = tickets.filter(t => t.sale_status === 'available' || (!t.sale_status && !t.is_sold));
  const approvedTickets = tickets.filter(t => t.sale_status === 'paid' && t.reviewed_by);
  const rejectedTickets = tickets.filter(t => t.sale_status === 'rejected');

  const handleReport = async (ticket, saleStatus) => {
    const report = reports[ticket.id] || {};
    if (!report.buyer_name) {
      showToast('Escribe el nombre del comprador.', 'warning');
      return;
    }
    setReporting(prev => ({ ...prev, [ticket.id]: true }));
    try {
      const { data, error } = await supabase.rpc('player_report_ticket_sale', {
        p_ticket_id: ticket.id,
        p_sale_status: saleStatus,
        p_buyer_name: report.buyer_name || '',
        p_fiado_until: report.fiado_until || null,
        p_reported_price: report.reported_price ? Number(report.reported_price) : null,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      showToast(saleStatus === 'fiado' ? 'Venta reportada como fiado.' : 'Venta reportada como pagada.', 'success');
      setReports(prev => { const r = { ...prev }; delete r[ticket.id]; return r; });
      const { data: refreshed } = await supabase.from('raffle_tickets').select(`
        id, ticket_number, sale_status, buyer_name, fiado_until, reported_price, reported_at, reviewed_by, review_note,
        campaign:campaign_id(id, name, type, ticket_price)
      `).eq('assigned_to', playerId).order('ticket_number');
      if (refreshed) setTickets(refreshed);
    } catch (err) {
      showToast('Error al reportar venta: ' + err.message, 'error');
    } finally {
      setReporting(prev => ({ ...prev, [ticket.id]: false }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '650px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>Mis Tickets</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>Cargando tickets...</p>
        ) : tickets.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>No tienes tickets asignados.</p>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableTickets.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Disponibles ({availableTickets.length})
                </h4>
                {availableTickets.map(t => <TicketRow key={t.id} ticket={t} reports={reports} setReports={setReports} handleReport={handleReport} reporting={reporting} />)}
              </div>
            )}

            {pendingReports.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffb300', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Pendientes (Fiado) ({pendingReports.length})
                </h4>
                {pendingReports.map(t => <TicketRow key={t.id} ticket={t} reports={reports} setReports={setReports} handleReport={handleReport} reporting={reporting} />)}
              </div>
            )}

            {pendingPaidReports.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00b0ff', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Pendientes (Pagado) ({pendingPaidReports.length})
                </h4>
                {pendingPaidReports.map(t => <TicketRow key={t.id} ticket={t} reports={reports} setReports={setReports} handleReport={handleReport} reporting={reporting} />)}
              </div>
            )}

            {rejectedTickets.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ff3d00', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Rechazados ({rejectedTickets.length})
                </h4>
                {rejectedTickets.map(t => <TicketRow key={t.id} ticket={t} reports={reports} setReports={setReports} handleReport={handleReport} reporting={reporting} />)}
              </div>
            )}

            {approvedTickets.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00e676', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Aprobados ({approvedTickets.length})
                </h4>
                {approvedTickets.slice(0, 10).map(t => <TicketRow key={t.id} ticket={t} reports={reports} setReports={setReports} handleReport={handleReport} reporting={reporting} />)}
                {approvedTickets.length > 10 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '4px' }}>
                    +{approvedTickets.length - 10} más...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerSaleTicketModal;
