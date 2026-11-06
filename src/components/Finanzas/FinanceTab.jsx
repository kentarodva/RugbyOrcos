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
      <div className="segmented" role="tablist" aria-label="Secciones de finanzas">
        {FINANCE_SUB_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={financeSubTab === tab.id}
            onClick={() => setFinanceSubTab(tab.id)}
            className={financeSubTab === tab.id ? 'is-on' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {financeSubTab === 'caja' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
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
                    + Registrar movimiento
                  </button>
                )}
                <button onClick={() => printFinances(teamFinances, EQUIPOS_LABELS[activeTeam])} className="btn-outline">
                  Imprimir
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
          {isStaff && !hasChargeThisMonth && (
            <div style={{
              padding: '14px 18px', borderRadius: 'var(--radius-md)',
              background: 'rgba(232, 185, 49,0.06)', border: '1px solid rgba(232, 185, 49,0.2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
            }}>
              <div>
                <strong style={{ color: 'var(--color-gold)', fontSize: '0.9rem' }}>📅 Cobro mensual pendiente</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                  El cobro de <strong style={{ color: 'var(--color-gold)' }}>{chargeMonthLabel}</strong> aún no se ha aplicado.
                  {lastMonthlyCharge && <> Último cobro: {new Date(lastMonthlyCharge + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}.</>}
                </p>
              </div>
              <button onClick={() => setShowChargeModal(true)} className="btn-neon" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                📋 Generar Cobro
              </button>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)' }}>
                Membresías
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Cuota mensual: <strong style={{ color: 'var(--color-text)' }}>${mensualidadBase.toLocaleString()} COP</strong> — Se permiten abonos parciales.
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>👑 Confirmar Abono</h3>
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
