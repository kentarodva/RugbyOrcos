import React, { useEffect, useState, useContext } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const PAYMENTS_PAGE_SIZE = 50;

export function PaymentHistoryModal({ onClose, playerId, scopePlayerId }) {
  const { allPayments, loadAllPayments, players, campaigns, deleteMembershipPayment, userTier } = useContext(ClubContext);
  const canDeletePayments = userTier <= 1;
  const { showToast } = useToast();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [paymentsOffset, setPaymentsOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const playerFilter = players.find(p => p.id === playerId);
  useEffect(() => {
    if (playerFilter) {
      setSearch(playerFilter.name);
    }
  }, [playerFilter?.name]);

  useEffect(() => {
    if (scopePlayerId) {
      const p = players.find(x => x.id === scopePlayerId);
      if (p) setSearch(p.name);
    }
  }, [scopePlayerId, players]);

  useEffect(() => {
    loadAllPayments({ limit: PAYMENTS_PAGE_SIZE });
    setPaymentsOffset(PAYMENTS_PAGE_SIZE);
  }, [loadAllPayments]);

  const handleLoadMore = async () => {
    const prevLength = allPayments.length;
    await loadAllPayments({ offset: paymentsOffset, limit: PAYMENTS_PAGE_SIZE, append: true });
    const newLength = allPayments.length + PAYMENTS_PAGE_SIZE;
    setPaymentsOffset(prev => prev + PAYMENTS_PAGE_SIZE);
    setHasMore(prevLength > 0);
  };

  const playerMap = {};
  players.forEach(p => { playerMap[p.id] = p; });

  const campaignMap = {};
  campaigns.forEach(c => { campaignMap[c.id] = c; });

  const filtered = allPayments
    .filter(p => filter === 'all' || p.source === filter)
    .filter(p => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const player = playerMap[p.player_id];
      return (player?.name || '').toLowerCase().includes(q) || (player?.apodo || '').toLowerCase().includes(q);
    });

  const totalAmount = filtered.reduce((s, p) => s + Number(p.amount), 0);
  const totalMembership = filtered.filter(p => p.source === 'membership').reduce((s, p) => s + Number(p.amount), 0);
  const totalFundraising = filtered.filter(p => p.source === 'fundraising').reduce((s, p) => s + Number(p.amount), 0);

  const handleDeletePayment = async (payment) => {
    await deleteMembershipPayment(payment.id);
    await loadAllPayments();
    showToast('Pago eliminado correctamente.', 'success');
    setDeleteConfirm(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '700px', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit' }}>📜 Historial General de Pagos</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por jugador..."
            className="form-input"
            style={{ flex: 1, minWidth: '150px', padding: '8px 12px', fontSize: '0.85rem' }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { value: 'all', label: 'Todos' },
              { value: 'membership', label: '👑 Membresías' },
              { value: 'fundraising', label: '🎟️ Recaudación' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="btn-outline"
                style={{
                  padding: '6px 12px', fontSize: '0.75rem',
                  background: filter === f.value ? 'var(--color-gold)' : 'transparent',
                  color: filter === f.value ? '#000' : '#fff',
                  borderColor: filter === f.value ? 'var(--color-gold)' : 'var(--border-glass)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
          <span>Total filtrado: <strong style={{ color: 'var(--color-primary)' }}>${totalAmount.toLocaleString()}</strong></span>
          {filter === 'all' && (
            <>
              <span>👑 Membresías: <strong>${totalMembership.toLocaleString()}</strong></span>
              <span>🎟️ Recaudación: <strong>${totalFundraising.toLocaleString()}</strong></span>
            </>
          )}
          <span style={{ color: 'var(--color-text-muted)' }}>{filtered.length} transacciones</span>
        </div>

        <div style={{ maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
              No hay pagos registrados.
            </p>
          ) : (
            filtered.map(p => {
              const player = playerMap[p.player_id];
              const campaign = p.campaign_id ? campaignMap[p.campaign_id] : null;
              return (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <strong>{player?.name || '—'}</strong>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                      {p.source === 'membership' ? `👑 Membresía` : `🎟️ ${campaign?.name || 'Recaudación'}`}
                      {p.notes && ` · ${p.notes}`}
                      {' · '}{formatDate(p.payment_date)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: 'var(--color-primary)' }}>${Number(p.amount).toLocaleString()}</strong>
                    {canDeletePayments && (
                      <button
                        onClick={() => setDeleteConfirm(p)}
                        className="btn-outline"
                        style={{ padding: '3px 6px', fontSize: '0.65rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.3)' }}
                        title="Eliminar pago"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {hasMore && filtered.length >= PAYMENTS_PAGE_SIZE && (
            <button onClick={handleLoadMore} className="btn-outline" style={{ width: '100%', padding: '8px', fontSize: '0.78rem', marginTop: '8px' }}>
              Cargar más pagos...
            </button>
          )}
        </div>

        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)} style={{ zIndex: 1000 }}>
            <div className="modal-content animated-slide" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>⚠️ Eliminar Pago</h3>
                <button onClick={() => setDeleteConfirm(null)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
              </div>
              <p style={{ fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }}>
                ¿Eliminar pago de <strong style={{ color: 'var(--color-gold)' }}>${Number(deleteConfirm.amount).toLocaleString()}</strong> de <strong>{playerMap[deleteConfirm.player_id]?.name || '—'}</strong>?
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
                Esta acción no se puede deshacer. El saldo del jugador se recalculará automáticamente.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteConfirm(null)} className="btn-outline">Cancelar</button>
                <button onClick={() => handleDeletePayment(deleteConfirm)} className="btn-neon" style={{ background: 'var(--color-red)', borderColor: 'var(--color-red)' }}>
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
