import React, { useContext, useEffect, useState } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { FundraisingCampaignCard } from './FundraisingCampaignCard';
import { NewCampaignModal } from './NewCampaignModal';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import TreasurerDashboard from './TreasurerDashboard';

export function FundraisingTab({ isStaff, currentPlayerId }) {
  const { campaigns, loadCampaigns, players, activeTeam, syncStatus } = useContext(ClubContext);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [activeTeam, loadCampaigns]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>
          🎟️ Campañas de Recaudación
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowHistory(true)} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
            📜 Historial General
          </button>
          {isStaff && (
            <button onClick={() => setShowApprovals(true)} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem', color: '#ffb300', borderColor: '#ffb300' }}>
              ⏳ Aprobaciones
            </button>
          )}
          {isStaff && (
            <button onClick={() => setShowNewModal(true)} className="btn-neon" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
              ➕ Nueva Campaña
            </button>
          )}
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No hay campañas de recaudación todavía.
          </p>
          {isStaff && (
            <>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                Crea una rifa, venta de comidas o postres para empezar.
              </p>
              <button onClick={() => setShowNewModal(true)} className="btn-neon" style={{ marginTop: '15px', padding: '10px 20px' }}>
                ➕ Crear Primera Campaña
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {campaigns.map(campaign => (
            <FundraisingCampaignCard
              key={campaign.id}
              campaign={campaign}
              players={players}
              isStaff={isStaff}
              currentPlayerId={currentPlayerId}
            />
          ))}
        </div>
      )}

      {showNewModal && (
        <NewCampaignModal
          onClose={() => setShowNewModal(false)}
          players={players}
        />
      )}

      {showHistory && (
        <PaymentHistoryModal
          onClose={() => setShowHistory(false)}
          scopePlayerId={isStaff ? undefined : currentPlayerId}
        />
      )}
      {showApprovals && (
        <TreasurerDashboard onClose={() => setShowApprovals(false)} />
      )}
    </div>
  );
}
