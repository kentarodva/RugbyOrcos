import React, { useContext } from 'react';
import { ClubContext, EQUIPOS_LABELS } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { useFinanzasState } from './useFinanzasState';
import { MAIN_SUB_TABS } from './constants';
import { FinanceTab } from './FinanceTab';
import { InventoryTab } from './InventoryTab';

import FinanzasSkeleton from '../Skeletons/FinanzasSkeleton';

function Finanzas() {
  const { finances, addFinanceRecord, players, activeTeam, inventory, addInventoryItem, updateInventoryItem, recordMembershipPayment, viewMode, divisionView, makgoraTeamId, syncStatus } = useContext(ClubContext);
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
      <div style={{ display: 'flex', gap: '10px', width: '100%', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', flexWrap: 'wrap' }}>
        {MAIN_SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => state.setActiveSubTab(tab.id)}
            className="btn-outline"
            style={{
              background: state.activeSubTab === tab.id ? tab.activeColor : 'transparent',
              color: state.activeSubTab === tab.id ? '#000' : '#fff',
              borderColor: state.activeSubTab === tab.id ? tab.activeColor : 'var(--border-glass)',
              fontWeight: state.activeSubTab === tab.id ? 800 : 500,
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
          >
            {tab.label}
          </button>
        ))}
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
          handleCustomAbono={state.handleCustomAbono}
          activeTeam={activeTeam}
          EQUIPOS_LABELS={EQUIPOS_LABELS}
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
