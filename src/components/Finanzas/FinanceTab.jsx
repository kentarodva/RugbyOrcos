import React from 'react';
import { printFinances } from '../../utils/exportPdf.js';
import { FINANCE_SUB_TABS } from './constants';
import { SummaryCards } from './SummaryCards';
import { FinanceForm } from './FinanceForm';
import { FinanceLedger } from './FinanceLedger';
import { CategorySummary } from './CategorySummary';
import { MembershipList } from './MembershipList';

export function FinanceTab({
  financeSubTab, setFinanceSubTab,
  showAddForm, setShowAddForm,
  finDesc, setFinDesc,
  finAmount, setFinAmount,
  finType, setFinType,
  finCategory, setFinCategory,
  finDate, setFinDate,
  totalIncomes, totalExpenses, netBalance,
  teamFinances, teamPlayers,
  handleSaveMovement, getMembershipStatus,
  handlePayMembership, handleCustomAbono,
  activeTeam, EQUIPOS_LABELS
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {FINANCE_SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFinanceSubTab(tab.id)}
            className="btn-outline"
            style={{
              background: financeSubTab === tab.id ? (tab.id === 'caja' ? 'var(--color-primary)' : 'var(--color-gold)') : 'transparent',
              color: financeSubTab === tab.id ? '#000' : '#fff',
              padding: '6px 14px', fontSize: '0.8rem',
              borderColor: financeSubTab === tab.id ? (tab.id === 'caja' ? 'var(--color-primary)' : 'var(--color-gold)') : 'var(--border-glass)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {financeSubTab === 'caja' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SummaryCards totalIncomes={totalIncomes} totalExpenses={totalExpenses} netBalance={netBalance} />

            {showAddForm ? (
              <FinanceForm
                finDesc={finDesc} setFinDesc={setFinDesc}
                finAmount={finAmount} setFinAmount={setFinAmount}
                finType={finType} setFinType={setFinType}
                finCategory={finCategory} setFinCategory={setFinCategory}
                finDate={finDate} setFinDate={setFinDate}
                onSave={handleSaveMovement}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowAddForm(true)} className="btn-neon" style={{ justifyContent: 'center', flex: 1 }}>
                  ?? Registrar Gasto o Ingreso
                </button>
                <button onClick={() => printFinances(teamFinances, EQUIPOS_LABELS[activeTeam])} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                  ??? Imprimir
                </button>
              </div>
            )}

            <FinanceLedger teamFinances={teamFinances} />
          </div>

          <CategorySummary teamFinances={teamFinances} />
        </div>
      )}

      {financeSubTab === 'membresias' && (
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>
                ?? Control de Membresias
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Membresia mensual: <strong style={{ color: 'var(--color-gold)' }}>10,000 COP</strong> � Se permiten abonos parciales.
              </p>
            </div>
          </div>

          <MembershipList
            teamPlayers={teamPlayers}
            getMembershipStatus={getMembershipStatus}
            onPayMembership={handlePayMembership}
            onCustomAbono={handleCustomAbono}
          />
        </div>
      )}
    </div>
  );
}
