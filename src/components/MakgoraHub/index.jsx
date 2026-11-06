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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span className="page-eyebrow">Torneo interno del club</span>
        <h1 className="page-title">Mak&apos;Gora</h1>
      </header>

      <nav className="pro-subtabs chip-row" aria-label="Secciones de Mak'Gora">
        {[
          ...TABS.map((t) => ({ id: t.id, label: t.label, on: state.tab === t.id, go: () => { state.setTab(t.id); state.setActiveTournament(null); } })),
          ...(canEditTeams ? [{ id: 'teams-manager', label: 'Gestión de equipos', on: state.tab === 'teams-manager', go: () => state.setTab('teams-manager') }] : []),
          ...(state.activeTournament ? [
            { id: 'fixture', label: 'Fixture', on: state.tab === 'fixture', go: () => state.setTab('fixture') },
            { id: 'standings', label: 'Tabla', on: state.tab === 'standings', go: () => state.setTab('standings') },
            { id: 'stats', label: 'Stats', on: showStats, go: () => { setShowStats(!showStats); setShowH2H(false); } },
            { id: 'h2h', label: 'H2H', on: showH2H, go: () => { setShowH2H(!showH2H); setShowStats(false); } },
            { id: 'edit', label: 'Editar torneo', on: false, go: () => setEditTournament(state.activeTournament) },
          ] : []),
        ].map((t) => (
          <button key={t.id} type="button" onClick={t.go} aria-pressed={t.on} className={`pro-subtab-btn${t.on ? ' active' : ''}`}>
            {t.label}
          </button>
        ))}
      </nav>

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
      {state.tab === 'tournaments' && (
        <ChampionsHistory
          tournaments={state.tournaments}
          teams={state.teams}
          onSelect={state.selectTournament}
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
