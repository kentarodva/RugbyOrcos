import React, { useContext, useEffect, useState } from 'react';
import { Ticket, History, Clock, Plus } from 'lucide-react';
import { ClubContext } from '../../context/ClubContext';
import { useDataListener } from '../../context/hooks/useDataListener';
import { FundraisingCampaignCard } from './FundraisingCampaignCard';
import { NewCampaignModal } from './NewCampaignModal';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import TreasurerDashboard from './TreasurerDashboard';

export function FundraisingTab({ isStaff, currentPlayerId }) {
  const { campaigns, loadCampaigns, players, activeTeam } = useContext(ClubContext);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [activeTeam, loadCampaigns]);

  useDataListener('fundraising_campaigns', () => loadCampaigns());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="pro-section-header">
        <div className="pro-section-title">
          <Ticket size={20} color="var(--color-gold)" />
          <span>Campañas, Rifas, Actividades y Uniformes</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowHistory(true)} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <History size={15} /> Historial General
          </button>
          {isStaff && (
            <button onClick={() => setShowApprovals(true)} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem', color: '#ffb300', borderColor: '#ffb300', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} /> Aprobaciones
            </button>
          )}
          {isStaff && (
            <button onClick={() => setShowNewModal(true)} className="btn-neon" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} /> Nueva Campaña
            </button>
          )}
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No hay campañas de recaudación ni uniformes todavía.
          </p>
          {isStaff && (
            <>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                Crea una rifa, actividad por unidades o compra de uniforme para empezar.
              </p>
              <button onClick={() => setShowNewModal(true)} className="btn-neon" style={{ marginTop: '15px', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Crear Primera Campaña
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
