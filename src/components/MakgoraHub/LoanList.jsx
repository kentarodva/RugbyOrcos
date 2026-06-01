import React from 'react';
import { LoanForm } from './LoanForm';
import { LoanCard } from './LoanCard';

export function LoanList({ loans, players, teams, showLoanForm, loanForm, setLoanForm, onToggleForm, onSubmit, onApprove, onReject, onReturn }) {
  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit' }}>
          ?? Prestamos de Guerreros
        </h3>
        <button onClick={onToggleForm} className="btn-neon" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
          {showLoanForm ? 'Cancelar' : '+ Solicitar Prestamo'}
        </button>
      </div>

      {showLoanForm && (
        <LoanForm
          players={players}
          teams={teams}
          loanForm={loanForm}
          setLoanForm={setLoanForm}
          onSubmit={onSubmit}
          onCancel={onToggleForm}
        />
      )}

      {loans.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>No hay prestamos registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loans.map(loan => (
            <LoanCard
              key={loan.id}
              loan={loan}
              teams={teams}
              onApprove={onApprove}
              onReject={onReject}
              onReturn={onReturn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
