import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../context/ToastContext';
import { formatLocalDate, parseLocalDate } from '../../utils/dates';

function TreasurerApprovalQueue({ onClose }) {
  const { showToast } = useToast();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const loadPending = () => {
    setLoading(true);
    supabase.rpc('get_pending_treasurer_approvals').then(({ data, error }) => {
      if (!error && data) setPending(data);
      setLoading(false);
    });
  };

  useEffect(() => { loadPending(); }, []);

  const handleConfirm = async (ticketId, status) => {
    setProcessing(prev => ({ ...prev, [ticketId]: true }));
    try {
      const { data, error } = await supabase.rpc('treasurer_confirm_sale', {
        p_ticket_id: ticketId,
        p_confirm_status: status,
        p_note: '',
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      showToast(status === 'paid' ? 'Venta confirmada.' : 'Venta rechazada.', 'success');
      loadPending();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setProcessing(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const fiadoItems = pending.filter(p => p.sale_status === 'fiado');
  const paidItems = pending.filter(p => p.sale_status === 'paid');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Aprobaciones Pendientes ({pending.length})
          </h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>Cargando pendientes...</p>
        ) : pending.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>No hay ventas pendientes de aprobación.</p>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {fiadoItems.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E8B931', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Fiado ({fiadoItems.length})
                </h4>
                {fiadoItems.map(item => (
                  <div key={item.ticket_id} className="glass-panel" style={{
                    padding: '12px', marginBottom: '6px', borderLeft: '3px solid #E8B931'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {item.player_name} ({item.player_apodo || '—'})
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          #{item.ticket_number} · {item.campaign_name} · Reportó: {item.reported_by_name || '—'}
                        </div>
                        {item.buyer_name && <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>Comprador: {item.buyer_name}</div>}
                        {item.fiado_until && <div style={{ fontSize: '0.68rem', color: 'var(--color-gold)' }}>Fiado hasta: {formatLocalDate(parseLocalDate(item.fiado_until))}</div>}
                        {item.reported_price && <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Valor reportado: ${Number(item.reported_price).toLocaleString()}</div>}
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                          Reportado: {item.reported_at ? new Date(item.reported_at).toLocaleString() : '—'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <button onClick={() => handleConfirm(item.ticket_id, 'paid')}
                          disabled={processing[item.ticket_id]}
                          className="btn-neon" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                          ✅ Confirmar Pago
                        </button>
                        <button onClick={() => handleConfirm(item.ticket_id, 'rejected')}
                          disabled={processing[item.ticket_id]}
                          className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.75rem', color: '#FF5C4D', borderColor: '#FF5C4D' }}>
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {paidItems.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5AA9FF', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Pagado ({paidItems.length})
                </h4>
                {paidItems.map(item => (
                  <div key={item.ticket_id} className="glass-panel" style={{
                    padding: '12px', marginBottom: '6px', borderLeft: '3px solid #5AA9FF'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {item.player_name} ({item.player_apodo || '—'})
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          #{item.ticket_number} · {item.campaign_name} · Reportó: {item.reported_by_name || '—'}
                        </div>
                        {item.buyer_name && <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>Comprador: {item.buyer_name}</div>}
                        {item.reported_price && <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Valor: ${Number(item.reported_price).toLocaleString()}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <button onClick={() => handleConfirm(item.ticket_id, 'paid')}
                          disabled={processing[item.ticket_id]}
                          className="btn-neon" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                          ✅ Confirmar
                        </button>
                        <button onClick={() => handleConfirm(item.ticket_id, 'rejected')}
                          disabled={processing[item.ticket_id]}
                          className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.75rem', color: '#FF5C4D', borderColor: '#FF5C4D' }}>
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TreasurerApprovalQueue;
