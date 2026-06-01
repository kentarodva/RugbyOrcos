import React from 'react';
import { useMakgoraState } from './useMakgoraState';
import { TABS } from './constants';
import { TeamsGrid } from './TeamsGrid';
import { TournamentList } from './TournamentList';
import { FixtureList } from './FixtureList';
import { StandingsTable } from './StandingsTable';
import { LoanList } from './LoanList';

function MakgoraHub() {
  const state = useMakgoraState();

  return (
    <div style={{ padding: '15px' }}>
      <div className="glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-gold)', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit' }}>
          Torneo MAK'GORA
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '5px' }}>
          El torneo interno del Reino Orco
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { state.setTab(t.id); state.setActiveTournament(null); }} className={state.tab === t.id ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>{t.label}</button>
        ))}
        {state.activeTournament && (
          <>
            <button onClick={() => state.setTab('fixture')} className={state.tab === 'fixture' ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Fixture</button>
            <button onClick={() => state.setTab('standings')} className={state.tab === 'standings' ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Tabla</button>
          </>
        )}
      </div>

      {state.tab === 'teams' && <TeamsGrid teams={state.teams} />}

      {state.tab === 'tournaments' && (
        <TournamentList
          tournaments={state.tournaments}
          showCreate={state.showCreate}
          teamName={state.teamName}
          onCreateToggle={() => state.setShowCreate(!state.showCreate)}
          onCreate={state.handleCreate}
          onSelect={state.selectTournament}
        />
      )}

      {state.tab === 'fixture' && state.activeTournament && (
        <FixtureList
          matches={state.matches}
          activeTournament={state.activeTournament}
          onGenerate={state.generateFixture}
          onUpdateMatch={state.updateMatch}
        />
      )}

      {state.tab === 'standings' && state.activeTournament && (
        <StandingsTable standings={state.standings} />
      )}

      {state.tab === 'loans' && (
        <LoanList
          loans={state.loans}
          players={state.players}
          teams={state.teams}
          showLoanForm={state.showLoanForm}
          loanForm={state.loanForm}
          setLoanForm={state.setLoanForm}
          onToggleForm={() => state.setShowLoanForm(!state.showLoanForm)}
          onSubmit={state.handleCreateLoan}
          onApprove={(id) => state.handleUpdateLoanStatus(id, 'approved')}
          onReject={(id) => state.handleUpdateLoanStatus(id, 'rejected')}
          onReturn={(id) => state.handleUpdateLoanStatus(id, 'returned')}
        />
      )}
    </div>
  );
}

export default MakgoraHub;
