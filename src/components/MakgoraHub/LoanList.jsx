import React from 'react';
import { LoanForm } from './LoanForm';
import { LoanCard } from './LoanCard';

export function LoanList({ loans, players, teams, showLoanForm, loanForm, setLoanForm, onToggleForm, onSubmit, onApprove, onReject, onReturn, onCancel, isStaff = false, myClanIds = [] }) {
  const canRequest = isStaff || myClanIds.length > 0;
  // A chief requests players from OTHER clans, for one of their own clans.
  const formTeams = isStaff ? teams : teams.filter(t => myClanIds.includes(t.id));
  const formPlayers = isStaff ? players : players.filter(p => !myClanIds.includes(p.makgora_team_id));
  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit' }}>
          Préstamos de Guerreros
        </h3>
        {canRequest && (
          <button onClick={onToggleForm} className="btn-neon" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
            {showLoanForm ? 'Cancelar' : '+ Solicitar préstamo'}
          </button>
        )}
      </div>

      {showLoanForm && canRequest && (
        <LoanForm
          players={formPlayers}
          teams={formTeams}
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
              onCancel={onCancel}
              canRespond={isStaff || myClanIds.includes(loan.from_team_id)}
              canReturn={isStaff || myClanIds.includes(loan.from_team_id) || myClanIds.includes(loan.to_team_id)}
              canCancel={isStaff || myClanIds.includes(loan.to_team_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
