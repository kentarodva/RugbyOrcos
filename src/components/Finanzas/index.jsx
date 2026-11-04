import React, { useContext } from 'react';
import { Wallet, Ticket, Package } from 'lucide-react';
import { ClubContext, EQUIPOS_LABELS } from '../../context/ClubContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFinanzasState } from './useFinanzasState';
import { MAIN_SUB_TABS } from './constants';
import { FinanceTab } from './FinanceTab';
import { FundraisingTab } from './FundraisingTab';
import { InventoryTab } from './InventoryTab';

import FinanzasSkeleton from '../Skeletons/FinanzasSkeleton';

const SUB_TAB_ICONS = {
  finances: Wallet,
  fundraising: Ticket,
  inventory: Package,
};

function Finanzas() {
  const { profile, user } = useAuth();
  const { finances, addFinanceRecord, deleteFinanceRecord, players, activeTeam, inventory, addInventoryItem, updateInventoryItem, recordMembershipPayment, viewMode, divisionView, makgoraTeamId, syncStatus, userTier, isSuperRole, clubConfig, mensualidadBase, handleMonthlyCharge } = useContext(ClubContext);
  const isStaff = userTier <= 3;
  const currentPlayer = players.find(p => {
    if (profile?.display_name && p.name.toLowerCase() === profile.display_name.toLowerCase()) return true;
    if (user?.email && p.contacto?.email === user.email) return true;
    return false;
  });
  const currentPlayerId = currentPlayer?.id;
  const { showToast } = useToast();

  const state = useFinanzasState({
    finances, addFinanceRecord, players, activeTeam,
    viewMode, divisionView, makgoraTeamId,
    recordMembershipPayment, updateInventoryItem, showToast
  });

  if (syncStatus === 'idle' || syncStatus === 'syncing') {
    return <FinanzasSkeleton activeSubTab={state.activeSubTab} />;
  }

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
        <div className="pro-subtabs">
          {MAIN_SUB_TABS.map(tab => {
            const Icon = SUB_TAB_ICONS[tab.id] || Wallet;
            const isActive = state.activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => state.setActiveSubTab(tab.id)}
                className={`pro-subtab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {state.activeSubTab === 'finances' && (
        <FinanceTab
          financeSubTab={state.financeSubTab}
          setFinanceSubTab={state.setFinanceSubTab}
          showAddForm={state.showAddForm}
          setShowAddForm={state.setShowAddForm}
          finDesc={state.finDesc}
          setFinDesc={state.setFinDesc}
          finAmount={state.finAmount}
          setFinAmount={state.setFinAmount}
          finType={state.finType}
          setFinType={state.setFinType}
          finCategory={state.finCategory}
          setFinCategory={state.setFinCategory}
          finDate={state.finDate}
          setFinDate={state.setFinDate}
          totalIncomes={state.totalIncomes}
          totalExpenses={state.totalExpenses}
          netBalance={state.netBalance}
          teamFinances={state.teamFinances}
          teamPlayers={state.teamPlayers}
          handleSaveMovement={state.handleSaveMovement}
          getMembershipStatus={state.getMembershipStatus}
          handlePayMembership={state.handlePayMembership}
          onDeleteFinanceRecord={deleteFinanceRecord}
          isStaff={isStaff}
          isSuperRole={isSuperRole}
          activeTeam={activeTeam}
          EQUIPOS_LABELS={EQUIPOS_LABELS}
          mensualidadBase={mensualidadBase}
          lastMonthlyCharge={clubConfig?.last_monthly_charge}
          onMonthlyCharge={handleMonthlyCharge}
        />
      )}

      {state.activeSubTab === 'fundraising' && (
        <FundraisingTab
          isStaff={isStaff}
          currentPlayerId={currentPlayerId}
        />
      )}

      {state.activeSubTab === 'inventory' && (
        <InventoryTab
          inventory={inventory}
          players={players}
          onStockChange={state.handleStockChange}
          onCustodianChange={state.handleCustodianChange}
          onStatusChange={state.handleStatusChange}
          onAddItem={addInventoryItem}
        />
      )}
    </div>
  );
}

export default Finanzas;
