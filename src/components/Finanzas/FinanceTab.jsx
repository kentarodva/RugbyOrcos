import React, { useState } from 'react';
import { printFinances } from '../../utils/exportPdf.js';
import { FINANCE_SUB_TABS } from './constants';
import { SummaryCards } from './SummaryCards';
import { FinanceForm } from './FinanceForm';
import { FinanceLedger } from './FinanceLedger';
import { CategorySummary } from './CategorySummary';
import { MembershipList } from './MembershipList';
import { MonthlyChargeModal } from './MonthlyChargeModal';
import { PaymentHistoryModal } from './PaymentHistoryModal';

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
  handlePayMembership,
  onDeleteFinanceRecord,
  isStaff, isSuperRole,
  activeTeam, EQUIPOS_LABELS,
  mensualidadBase, lastMonthlyCharge, onMonthlyCharge
}) {
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [historyPlayerId, setHistoryPlayerId] = useState(null);

  const hasChargeThisMonth = lastMonthlyCharge
    ? new Date(lastMonthlyCharge).getMonth() === new Date().getMonth()
      && new Date(lastMonthlyCharge).getFullYear() === new Date().getFullYear()
    : false;
  const chargeMonthLabel = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  const handleConfirmCharge = async (playerIds) => {
    await onMonthlyCharge(playerIds);
    setShowChargeModal(false);
  };

  const handleRequestConfirm = (player, amount) => {
    setConfirmState({ player, amount });
  };

  const handleConfirmPayment = async () => {
    if (!confirmState) return;
    await handlePayMembership(confirmState.player, confirmState.amount);
    setConfirmState(null);
  };

  const handleCancelConfirm = () => {
    setConfirmState(null);
  };

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
                {isStaff && (
                  <button onClick={() => setShowAddForm(true)} className="btn-neon" style={{ justifyContent: 'center', flex: 1 }}>
                    💰 Registrar Gasto o Ingreso
                  </button>
                )}
                <button onClick={() => printFinances(teamFinances, EQUIPOS_LABELS[activeTeam])} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                   🖨️ Imprimir
                </button>
              </div>
            )}

            <FinanceLedger teamFinances={teamFinances} onDeleteFinanceRecord={onDeleteFinanceRecord} isSuperRole={isSuperRole} />
          </div>

          <CategorySummary teamFinances={teamFinances} />
        </div>
      )}

      {financeSubTab === 'membresias' && (
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>
                👑 Control de Membresías
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Membresia mensual: <strong style={{ color: 'var(--color-gold)' }}>${mensualidadBase.toLocaleString()} COP</strong> — Se permiten abonos parciales.
              </p>
            </div>
            {isStaff && (
              <button
                onClick={() => setShowChargeModal(true)}
                className="btn-neon"
                disabled={hasChargeThisMonth}
                style={{
                  padding: '8px 16px', fontSize: '0.8rem',
                  opacity: hasChargeThisMonth ? 0.4 : 1,
                  background: hasChargeThisMonth ? 'var(--color-primary)' : undefined,
                  borderColor: hasChargeThisMonth ? 'var(--color-primary)' : undefined,
                }}
                title={hasChargeThisMonth ? `Ya se generó el cobro de ${chargeMonthLabel}` : 'Generar cobro mensual a jugadores'}
              >
                {hasChargeThisMonth ? `✅ Cobrado ${chargeMonthLabel}` : '📋 Generar Cobro Mensual'}
              </button>
            )}
          </div>

          <MembershipList
            teamPlayers={teamPlayers}
            getMembershipStatus={getMembershipStatus}
            onRequestConfirm={handleRequestConfirm}
            onRequestHistory={setHistoryPlayerId}
            isStaff={isStaff}
          />

          {showChargeModal && (
            <MonthlyChargeModal
              players={teamPlayers}
              mensualidadBase={mensualidadBase}
              lastMonthlyCharge={lastMonthlyCharge}
              onConfirm={handleConfirmCharge}
              onClose={() => setShowChargeModal(false)}
            />
          )}
        </div>
      )}

      {confirmState && (
        <div className="modal-overlay" onClick={handleCancelConfirm}>
          <div className="modal-content animated-slide" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>👑 Confirmar Abono</h3>
              <button onClick={handleCancelConfirm} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }}>
              ¿Registrar abono de <strong style={{ color: 'var(--color-gold)' }}>${Number(confirmState.amount).toLocaleString()}</strong> para <strong>{confirmState.player.name}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={handleCancelConfirm} className="btn-outline">Cancelar</button>
              <button onClick={handleConfirmPayment} className="btn-neon">✅ Confirmar Abono</button>
            </div>
          </div>
        </div>
      )}

      {historyPlayerId && (
        <PaymentHistoryModal
          onClose={() => setHistoryPlayerId(null)}
          playerId={historyPlayerId}
        />
      )}
    </div>
  );
}
