import React, { useContext, useState } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useMakgoraState } from './useMakgoraState';
import { TABS } from './constants';
import { TeamsGrid } from './TeamsGrid';
import { TournamentList } from './TournamentList';
import { FixtureList } from './FixtureList';
import { TournamentShowcase } from './TournamentShowcase';
import { StandingsTable } from './StandingsTable';
import { LoanList } from './LoanList';
import { PlayoffBracket } from './PlayoffBracket';
import { TournamentStats } from './TournamentStats';
import { HeadToHead } from './HeadToHead';
import { PlayerStatsModal } from './PlayerStatsModal';
import { EditTournamentModal } from './EditTournamentModal';
import { TeamDetailModal } from './TeamDetailModal';
import { TeamManager } from './TeamManager';
import { FixtureEditor } from './FixtureEditor';
import ChampionsHistory from './ChampionsHistory';

function MakgoraHub() {
  const state = useMakgoraState();
  const { hasPermission } = useContext(ClubContext);
  const canEditTeams = !!hasPermission?.('manage_players');
  const isTournamentAdmin = !!hasPermission?.('admin_panel');
  const canManageTeam = (teamId) => canEditTeams || state.myClanIds.includes(teamId);
  const [showStats, setShowStats] = useState(false);
  const [showH2H, setShowH2H] = useState(false);
  const [statsMatch, setStatsMatch] = useState(null);
  const [editTournament, setEditTournament] = useState(null);
  const [detailTeam, setDetailTeam] = useState(null);
  const [editFixture, setEditFixture] = useState(false);

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
        {canEditTeams && (
          <button onClick={() => state.setTab('teams-manager')} className={state.tab === 'teams-manager' ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--color-gold)', borderColor: 'var(--color-gold)' }}>
            Gestión Equipos
          </button>
        )}
        <button onClick={() => state.setTab('champions')} className={state.tab === 'champions' ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--color-gold)', borderColor: 'var(--color-gold)' }}>
          Campeones
        </button>
        {state.activeTournament && (
          <>
            <button onClick={() => state.setTab('fixture')} className={state.tab === 'fixture' ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Fixture</button>
            <button onClick={() => state.setTab('standings')} className={state.tab === 'standings' ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Tabla</button>
            <button onClick={() => { setShowStats(!showStats); setShowH2H(false); }} className={showStats ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Stats</button>
            <button onClick={() => { setShowH2H(!showH2H); setShowStats(false); }} className={showH2H ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>H2H</button>
            <button onClick={() => setEditTournament(state.activeTournament)} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Editar</button>
          </>
        )}
      </div>

      {state.tab === 'teams' && (
        <TeamsGrid teams={state.teams} records={state.clanRecords} players={state.players} onTeamClick={(t) => setDetailTeam(t.id)} />
      )}

      {state.tab === 'teams-manager' && (
        <TeamManager teams={state.teams} onTeamsChanged={() => state.loadTeams()}
          players={state.players} chiefs={state.chiefs} onChiefsChanged={state.loadChiefs} canAssignChiefs={isTournamentAdmin} />
      )}

      {state.tab === 'tournaments' && (
        <TournamentList
          tournaments={state.tournaments}
          showCreate={state.showCreate}
          teams={state.teams}
          teamName={state.teamName}
          onCreateToggle={() => state.setShowCreate(!state.showCreate)}
          onCreate={state.handleCreate}
          onSelect={state.selectTournament}
          onEdit={(t) => setEditTournament(t)}
          onTeamCreated={() => state.loadTeams()}
        />
      )}

      {state.tab === 'fixture' && state.activeTournament && (
        <>
          <TournamentShowcase
            tournament={state.activeTournament}
            teams={state.teams}
            standings={state.standings}
          />
          <PlayoffBracket matches={state.matches} teams={state.teams} onUpdateMatch={state.updateMatch} />
          <FixtureList
            matches={state.matches}
            activeTournament={state.activeTournament}
            onGenerate={state.generateFixture}
            onUpdateMatch={state.updateMatch}
            onStats={(m) => setStatsMatch(m)}
            onEdit={() => setEditFixture(true)}
          />
          <StandingsTable standings={state.standings} teams={state.teams} />
        </>
      )}

      {state.tab === 'standings' && state.activeTournament && (
        <>
          <StandingsTable standings={state.standings} teams={state.teams} />
          {state.standings.length >= 2 && state.matches.filter(m => m.phase === 'regular').every(m => m.status === 'jugado') && (
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={state.generatePlayoffs} className="btn-neon" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                Generar Playoffs
              </button>
              {state.matches.some(m => m.phase === 'playoff') && (
                <button onClick={() => state.setTab('fixture')} className="btn-outline" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                  Ver Bracket
                </button>
              )}
            </div>
          )}
        </>
      )}

      {showStats && state.activeTournament && (
        <TournamentStats tournament={state.activeTournament} teams={state.teams} />
      )}

      {showH2H && (
        <HeadToHead teams={state.teams} />
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
          onCancel={(id) => state.handleUpdateLoanStatus(id, 'cancelled')}
          isStaff={canEditTeams}
          myClanIds={state.myClanIds}
        />
      )}

      {state.tab === 'champions' && (
        <ChampionsHistory
          tournaments={state.tournaments}
          teams={state.teams}
          onSelect={state.selectTournament}
        />
      )}

      {editFixture && state.activeTournament && (
        <FixtureEditor
          matches={state.matches}
          tournament={state.activeTournament}
          teams={state.teams}
          onSaved={() => state.loadMatches(state.activeTournament.id)}
          onClose={() => setEditFixture(false)}
        />
      )}

      {statsMatch && (
        <PlayerStatsModal match={statsMatch} teams={state.teams} onClose={() => setStatsMatch(null)} />
      )}

      {editTournament && (
        <EditTournamentModal
          tournament={editTournament}
          onClose={() => setEditTournament(null)}
          onSaved={() => { setEditTournament(null); state.loadTournaments(); if (state.activeTournament) { state.loadMatches(state.activeTournament.id); state.loadStandings(state.activeTournament.id); } }}
        />
      )}

      {detailTeam && (
        <TeamDetailModal
          team={state.teams.find(t => t.id === detailTeam)}
          canEdit={!!detailTeam && canManageTeam(detailTeam)}
          isChief={state.myClanIds.includes(detailTeam)}
          onChanged={state.loadTeams}
          onClose={() => setDetailTeam(null)}
        />
      )}
    </div>
  );
}

export default MakgoraHub;
