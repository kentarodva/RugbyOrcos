import { useState, useEffect, useContext } from 'react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../context/ToastContext';
import { ClubContext } from '../../context/ClubContext';
import { formatLocalDate, parseLocalDate } from '../../utils/dates';
import { getCampaigns, getTreasurerDeliveries } from '../../services/dataService';

function TreasurerDashboard({ onClose }) {
  const { showToast } = useToast();
  const clubCtx = useContext(ClubContext);
  const [tab, setTab] = useState('pending');
  const [data, setData] = useState({ pending: [], campaigns: [], players: [], deliveries: [] });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const loadAll = async () => {
    setLoading(true);
    const [pendingRes, campaigns, deliveries] = await Promise.all([
      supabase.rpc('get_pending_treasurer_approvals'),
      getCampaigns(),
      getTreasurerDeliveries(),
    ]);
    setData({
      pending: pendingRes.data || [],
      campaigns,
      deliveries,
    });
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const handleConfirm = async (ticketId, status) => {
    setProcessing(prev => ({ ...prev, [ticketId]: true }));
    try {
      const { data: d, error } = await supabase.rpc('treasurer_confirm_sale', {
        p_ticket_id: ticketId,
        p_confirm_status: status,
        p_note: '',
      });
      if (error) throw error;
      if (d?.error) throw new Error(d.error);
      showToast(status === 'paid' ? 'Venta confirmada y registrada en asignación.' : 'Venta rechazada.', 'success');
      loadAll();
      clubCtx?.loadCampaigns?.();
      clubCtx?.loadAllPayments?.();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setProcessing(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const pendingFiado = data.pending.filter(p => p.sale_status === 'fiado');
  const pendingPaid = data.pending.filter(p => p.sale_status === 'paid');
  const _totalRaised = data.campaigns.reduce((s, c) => {
    if (c.type === 'raffle') return s + (c.ticket_price || 0) * (c.total_tickets || 0);
    return s;
  }, 0);
  const pendingAmount = data.pending.reduce((s, p) => s + Number(p.reported_price || 0), 0);
  const fiadoAmount = pendingFiado.reduce((s, p) => s + Number(p.reported_price || 0), 0);

  const summaryCards = [
    { label: 'Aprobaciones Pendientes', val: data.pending.length, color: '#E8B931', icon: '⏳' },
    { label: 'Fiado Pendiente', val: `$${fiadoAmount.toLocaleString()}`, color: '#FF5C4D', icon: '📝' },
    { label: 'Por Confirmar (Pagado)', val: `$${(pendingAmount - fiadoAmount).toLocaleString()}`, color: '#5AA9FF', icon: '💵' },
    { label: 'Total Campañas', val: data.campaigns.length, color: 'var(--color-primary)', icon: '🎟️' },
  ];

  const PlayerRow = ({ item }) => (
    <div className="glass-panel" style={{ padding: '12px', marginBottom: '6px', borderLeft: `3px solid ${item.sale_status === 'fiado' ? '#E8B931' : '#5AA9FF'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            {item.player_name} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>({item.player_apodo || '—'})</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            #{item.ticket_number} · {item.campaign_name}
            {item.sale_status === 'fiado' ? ' · Fiado' : ' · Pagado'}
          </div>
          {item.buyer_name && <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>Comprador: {item.buyer_name}</div>}
           {item.fiado_until && <div style={{ fontSize: '0.68rem', color: 'var(--color-gold)' }}>Fiado hasta: {formatLocalDate(parseLocalDate(item.fiado_until))}</div>}
          {item.reported_price && <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>Valor: ${Number(item.reported_price).toLocaleString()}</div>}
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Reportó: {item.reported_by_name || item.player_name || '—'} · {(item.reported_at || item.created_at) ? new Date(item.reported_at || item.created_at).toLocaleString() : '—'}
          </div>
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
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide"
        style={{ maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
            Panel de Tesorero
          </h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '40px', textAlign: 'center' }}>Cargando datos...</p>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '10px' }}>
              {summaryCards.map(c => (
                <div key={c.label} className="glass-panel" style={{ padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color }}>{c.val}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
                    {c.icon} {c.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setTab('pending')}
                className={`tab-btn ${tab === 'pending' ? 'active' : ''}`}>
                ⏳ Pendientes ({data.pending.length})
              </button>
              <button onClick={() => setTab('campaigns')}
                className={`tab-btn ${tab === 'campaigns' ? 'active' : ''}`}>
                🎯 Campañas
              </button>
              <button onClick={() => setTab('history')}
                className={`tab-btn ${tab === 'history' ? 'active' : ''}`}>
                📋 Entregas
              </button>
            </div>

            {tab === 'pending' && (
              <div>
                {data.pending.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>No hay ventas pendientes. Todo al día.</p>
                ) : (
                  <>
                    {pendingFiado.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E8B931', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Fiado ({pendingFiado.length}) — ${fiadoAmount.toLocaleString()}
                        </h4>
                        {pendingFiado.map(item => <PlayerRow key={item.ticket_id} item={item} />)}
                      </div>
                    )}
                    {pendingPaid.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5AA9FF', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Pagado ({pendingPaid.length}) — ${(pendingAmount - fiadoAmount).toLocaleString()}
                        </h4>
                        {pendingPaid.map(item => <PlayerRow key={item.ticket_id} item={item} />)}
                      </div>
                    )}
                  </>
                )}
                {data.pending.length > 0 && (
                  <button onClick={loadAll} className="btn-outline" style={{ alignSelf: 'center', marginTop: '8px', padding: '6px 14px', fontSize: '0.75rem' }}>
                    🔄 Refrescar
                  </button>
                )}
              </div>
            )}

            {tab === 'campaigns' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.campaigns.map(c => (
                  <div key={c.id} className="glass-panel" style={{ padding: '14px', borderLeft: `3px solid ${c.status === 'activa' || c.status === 'active' ? 'var(--color-primary)' : 'var(--border-glass)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          Tipo: {c.type} · Estado: {c.status} · Tickets: {c.total_tickets || '—'}
                          {c.ticket_price ? ` · $${Number(c.ticket_price).toLocaleString()} c/u` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'history' && (
              <div>
                {data.deliveries.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>No hay entregas registradas.</p>
                ) : (
                  data.deliveries.map(d => (
                    <div key={d.id} className="glass-panel" style={{
                      padding: '10px', marginBottom: '6px',
                      borderLeft: `3px solid ${d.status === 'confirmed' ? '#2EE57A' : d.status === 'rejected' ? '#FF5C4D' : '#E8B931'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <div>
                          <strong>{d.player?.nombre || '—'}</strong> en {d.campaign?.name || '—'}
                        </div>
                        <span style={{ fontWeight: 700, color: d.status === 'confirmed' ? '#2EE57A' : d.status === 'rejected' ? '#FF5C4D' : '#E8B931' }}>
                          ${Number(d.amount).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {d.status === 'confirmed' ? '✅ Confirmado' : d.status === 'rejected' ? '❌ Rechazado' : '⏳ Pendiente'} · {new Date(d.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TreasurerDashboard;
