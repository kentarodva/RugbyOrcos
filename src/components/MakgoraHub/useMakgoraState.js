import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient.js';
import { aggregateClanRecords } from '../../utils/crests';
import { wrapCatch } from '../../utils/errorHandler';
import { ClubContext } from '../../context/ClubContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDataListener } from '../../context/hooks/useDataListener.js';

const emitChange = (table, action, payload = {}) => {
  window.dispatchEvent(new CustomEvent('data:changed', {
    detail: { table, action, payload, timestamp: Date.now() }
  }));
};

export function useMakgoraState() {
  const { showToast } = useToast();
  const { players, loans, requestLoan, updateLoanStatus, refreshMakgoraTeams } = useContext(ClubContext);
  const [tab, setTab] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', status: 'proximo' });
  const [standings, setStandings] = useState([]);
  const [clanRecords, setClanRecords] = useState({});
  const [matches, setMatches] = useState([]);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanForm, setLoanForm] = useState({ playerId: '', toTeamId: '', reason: '', days: 7 });
  const matchesRef = useRef(matches);
  useEffect(() => { matchesRef.current = matches; }, [matches]);
  const activeTournamentRef = useRef(activeTournament);
  useEffect(() => { activeTournamentRef.current = activeTournament; }, [activeTournament]);

  const checkExpiredLoans = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: expired } = await supabase.from('player_loans')
      .select('id, players(first_name, last_name)')
      .eq('status', 'approved')
      .lt('end_date', today);
    if (expired && expired.length > 0) {
      const ids = expired.map(l => l.id);
      await supabase.from('player_loans')
        .update({ status: 'returned', updated_at: new Date().toISOString() })
        .in('id', ids);
      showToast(`${expired.length} préstamo(s) vencido(s) auto-devuelto(s)`, 'info');
    }
  }, [showToast]);

  const loadTeams = useCallback(async () => {
    const { data } = await supabase.from('makgora_teams').select('*').order('sort_order');
    if (data) {
      setTeams(data);
      refreshMakgoraTeams?.();
    }
    // All-time record for clan banners (W-D-L, tries). Non-blocking: banners show 0-0-0 if it fails.
    const { data: allStandings } = await supabase
      .from('tournament_standings').select('team_id, played, won, drawn, lost, tries_for');
    setClanRecords(aggregateClanRecords(allStandings || []));
  }, [refreshMakgoraTeams]);

  const loadTournaments = useCallback(async () => {
    const { data } = await supabase.from('tournaments').select('*').order('start_date', { ascending: false });
    if (data) setTournaments(data);
  }, []);

  useEffect(() => {
    loadTeams();
    loadTournaments();
    checkExpiredLoans();
  }, [loadTeams, loadTournaments, checkExpiredLoans]);

  useDataListener('tournaments', () => loadTournaments());
  useDataListener('tournament_matches', () => {
    if (activeTournamentRef.current?.id) loadMatches(activeTournamentRef.current.id);
  });
  useDataListener('player_loans', () => { loadTeams(); loadTournaments(); });

  const loadStandings = useCallback(async (tournamentId) => {
    const { data } = await supabase.from('tournament_standings').select('*, makgora_teams!inner(name, rpg_name, is_external)').eq('tournament_id', tournamentId).order('total_points', { ascending: false });
    if (data) setStandings(data);
  }, []);

  const loadMatches = useCallback(async (tournamentId) => {
    const { data } = await supabase
      .from('tournament_matches')
      .select('*, home:fk_match_home(name, rpg_name, is_external), away:fk_match_away(name, rpg_name, is_external)')
      .eq('tournament_id', tournamentId)
      .order('round');
    if (data) setMatches(data);
  }, []);

  const selectTournament = useCallback((t) => {
    setActiveTournament(t);
    setTab('fixture');
    loadStandings(t.id);
    loadMatches(t.id);
  }, [loadStandings, loadMatches]);

  const handleCreate = useCallback(async (formData) => {
    const dataToUse = formData || form;
    if (!dataToUse.name || !dataToUse.startDate || !dataToUse.endDate) return;

    const { data, error } = await supabase.from('tournaments').insert({
      name: dataToUse.name,
      start_date: dataToUse.startDate,
      end_date: dataToUse.endDate,
      status: 'proximo',
      created_by: (await supabase.auth.getUser()).data.user?.id,
    }).select().single();

    if (error) { showToast(error.message, 'error'); return; }

    const teamIds = dataToUse.teamIds || teams.filter(t => t.is_active).map(t => t.id);
    const { error: ttError } = await supabase.from('tournament_teams').insert(
      teamIds.map(tid => ({ tournament_id: data.id, team_id: tid })),
      { ignoreDuplicates: true }
    );

    if (ttError) { showToast(ttError.message, 'error'); return; }

    for (const tid of teamIds) {
      await supabase.from('tournament_standings').insert({
        tournament_id: data.id, team_id: tid,
        played: 0, won: 0, drawn: 0, lost: 0,
        points_for: 0, points_against: 0, total_points: 0
      });
    }

    showToast('Torneo MakGora creado!', 'success');
    setShowCreate(false);
    setForm({ name: '', startDate: '', endDate: '', status: 'proximo' });
    loadTournaments();
    emitChange('tournaments', 'create', { tournamentId: data.id, name: data.name });
  }, [form, teams, showToast, loadTournaments]);

  const generateFixture = useCallback(async () => {
    if (!activeTournament) return;
    const { data: tms } = await supabase.from('tournament_teams').select('team_id').eq('tournament_id', activeTournament.id);
    if (!tms || tms.length < 2) { showToast('Necesitas al menos 2 equipos', 'error'); return; }

    const { data: existing } = await supabase.from('tournament_matches').select('id').eq('tournament_id', activeTournament.id).limit(1);
    if (existing && existing.length > 0) { showToast('Ya existe un fixture para este torneo', 'warning'); return; }

    const teamIds = tms.map(t => t.team_id);
    const n = teamIds.length;
    const isOdd = n % 2 !== 0;
    const teamsInRound = isOdd ? [...teamIds, null] : [...teamIds];
    const totalRounds = teamsInRound.length - 1;
    const matchesPerRound = Math.floor(teamsInRound.length / 2);

    const newMatches = [];

    for (let r = 0; r < totalRounds; r++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const home = teamsInRound[m];
        const away = teamsInRound[teamsInRound.length - 1 - m];
        if (home !== null && away !== null) {
          const isHomeFirst = (r + m) % 2 === 0;
          newMatches.push({
            tournament_id: activeTournament.id,
            round: r + 1,
            phase: 'regular',
            home_team_id: isHomeFirst ? home : away,
            away_team_id: isHomeFirst ? away : home,
            status: 'pendiente',
          });
        }
      }
      const last = teamsInRound.pop();
      teamsInRound.splice(1, 0, last);
    }

    const { error } = await supabase.from('tournament_matches').insert(newMatches);
    if (error) { showToast(error.message, 'error'); return; }

    showToast('Fixture generado: ' + newMatches.length + ' partidos en ' + totalRounds + ' rondas', 'success');
    loadMatches(activeTournament.id);
    emitChange('tournament_matches', 'create', { tournamentId: activeTournament.id, count: newMatches.length });
  }, [activeTournament, showToast, loadMatches]);

  const generatePlayoffs = useCallback(async () => {
    if (!activeTournament) return;

    const existingPlayoff = matchesRef.current.filter(m => m.phase === 'playoff');
    if (existingPlayoff.length > 0) {
      showToast('Los playoffs ya fueron generados', 'warning');
      return;
    }

    const sorted = [...standings].sort((a, b) => b.total_points - a.total_points);
    const numTeams = sorted.length;
    if (numTeams < 2) { showToast('Necesitas al menos 2 equipos para playoffs', 'warning'); return; }

    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
    const topTeams = sorted.slice(0, Math.min(bracketSize, numTeams));
    const totalRounds = Math.ceil(Math.log2(bracketSize));

    const firstRound = [];
    for (let i = 0; i < bracketSize / 2; i++) {
      const home = topTeams[i] || topTeams[0];
      const away = topTeams[bracketSize - 1 - i] || topTeams[topTeams.length - 1];
      firstRound.push({
        tournament_id: activeTournament.id,
        round: 1,
        phase: 'playoff',
        home_team_id: home.team_id,
        away_team_id: away.team_id,
        status: 'pendiente',
      });
    }

    const { error } = await supabase.from('tournament_matches').insert(firstRound).select();
    if (error) { showToast(error.message, 'error'); return; }

    showToast(`Playoffs generados: Ronda 1 (${firstRound.length} partidos, ${totalRounds} rondas totales)`, 'success');
    loadMatches(activeTournament.id);
  }, [activeTournament, standings, showToast, loadMatches]);

  const generateNextPlayoffRound = useCallback(async () => {
    const playoffMatches = matchesRef.current.filter(m => m.phase === 'playoff');
    if (playoffMatches.length === 0) return;

    const maxRound = Math.max(...playoffMatches.map(m => m.round));
    const currentRound = playoffMatches.filter(m => m.round === maxRound);
    const allPlayed = currentRound.every(m => m.status === 'jugado');
    if (!allPlayed) return;

    const winners = currentRound.map(m => {
      const hs = parseInt(m.home_score) || 0;
      const as = parseInt(m.away_score) || 0;
      return hs >= as ? m.home_team_id : m.away_team_id;
    });

    if (winners.length <= 1) {
      const winnerId = winners[0];
      if (winnerId) {
        const winner = teams.find(t => t.id === winnerId);
        await supabase.from('tournaments')
          .update({ status: 'finalizado', winner_team_id: winnerId })
          .eq('id', activeTournament.id);

        await supabase.from('player_loans')
          .update({ status: 'returned', updated_at: new Date().toISOString() })
          .eq('tournament_id', activeTournament.id)
          .eq('status', 'approved');

        showToast(`🏆 ${winner?.rpg_name || winner?.name || 'Equipo'} campeón del torneo!`, 'success');
        loadTournaments();
      }
      return;
    }

    const nextRound = maxRound + 1;
    const nextMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        nextMatches.push({
          tournament_id: activeTournament.id,
          round: nextRound,
          phase: 'playoff',
          home_team_id: winners[i],
          away_team_id: winners[i + 1],
          status: 'pendiente',
        });
      }
    }

    const { error } = await supabase.from('tournament_matches').insert(nextMatches);
    if (error) { showToast(error.message, 'error'); return; }

    showToast(`Ronda ${nextRound} de playoffs generada (${nextMatches.length} partidos)`, 'success');
    loadMatches(activeTournament.id);
  }, [activeTournament, teams, showToast, loadMatches, loadTournaments]);

  const updateMatch = useCallback(async (matchId, homeScore, awayScore) => {
    const { error } = await supabase.from('tournament_matches')
      .update({ home_score: homeScore, away_score: awayScore, status: 'jugado' })
      .eq('id', matchId);

    if (error) { showToast(error.message, 'error'); return; }

    const m = matchesRef.current.find(x => x.id === matchId);
    if (!m) { loadMatches(activeTournament.id); loadStandings(activeTournament.id); return; }

    const hs = parseInt(homeScore) || 0;
    const as = parseInt(awayScore) || 0;

    if (m.phase === 'regular') {
      for (const { team_id, points_for, points_against } of [
        { team_id: m.home_team_id, points_for: hs, points_against: as },
        { team_id: m.away_team_id, points_for: as, points_against: hs }
      ]) {
        const won = points_for > points_against ? 1 : 0;
        const drawn = points_for === points_against ? 1 : 0;
        const lost = points_for < points_against ? 1 : 0;
        const bonus = (points_for >= points_against + 4);
        const pts = won * 4 + drawn * 2 + (bonus ? 1 : 0);

        await supabase.rpc('update_standing', {
          p_tournament_id: activeTournament.id,
          p_team_id: team_id,
          p_played: 1, p_won: won, p_drawn: drawn, p_lost: lost,
          p_points_for: points_for, p_points_against: points_against,
          p_total_points: pts, p_bonus: bonus ? 1 : 0
        }).catch(wrapCatch('useMakgoraState.updateStanding', { notifyUser: true }));
      }

      const { data: freshData } = await supabase.from('tournament_matches').select('status').eq('tournament_id', activeTournament.id);
      if (freshData && freshData.every(ma => ma.status === 'jugado')) {
        await supabase.from('tournaments')
          .update({ status: 'finalizado' })
          .eq('id', activeTournament.id);

        await supabase.from('player_loans')
          .update({ status: 'returned', updated_at: new Date().toISOString() })
          .eq('tournament_id', activeTournament.id)
          .eq('status', 'approved');

        loadTournaments();
      }
    }

    loadMatches(activeTournament.id);
    loadStandings(activeTournament.id);

    if (m.phase === 'playoff') {
      await generateNextPlayoffRound();
    }
  }, [activeTournament, showToast, loadMatches, loadStandings, loadTournaments, generateNextPlayoffRound]);

  const handleCreateLoan = useCallback(async (e) => {
    e.preventDefault();
    if (!loanForm.playerId || !loanForm.toTeamId) { showToast('Selecciona jugador y equipo destino.', 'warning'); return; }
    const player = players.find(p => p.id === loanForm.playerId);
    if (!player) { showToast('Jugador no encontrado.', 'error'); return; }

    const fromTeamId = player.makgora_team_id;
    if (!fromTeamId) { showToast('El jugador no pertenece a ningun equipo MakGora.', 'warning'); return; }
    if (fromTeamId === loanForm.toTeamId) { showToast('No puedes prestar al mismo equipo.', 'warning'); return; }

    const result = await requestLoan(
      loanForm.playerId,
      loanForm.toTeamId,
      fromTeamId,
      activeTournament?.id || null,
      loanForm.days,
      loanForm.reason || null
    );

    if (result.error) { showToast(result.error, 'error'); return; }
    showToast('Prestamo solicitado.', 'success');
    setShowLoanForm(false);
    setLoanForm({ playerId: '', toTeamId: '', reason: '', days: 7 });
  }, [loanForm, players, activeTournament, requestLoan, showToast]);

  const handleUpdateLoanStatus = useCallback(async (loanId, status) => {
    const result = await updateLoanStatus(loanId, status);
    if (result.error) { showToast(result.error, 'error'); return; }
    showToast('Prestamo ' + (status === 'approved' ? 'aprobado' : status === 'rejected' ? 'rechazado' : 'devuelto') + '.', 'success');
  }, [updateLoanStatus, showToast]);

  const handleStartTournament = useCallback(async (tournamentId) => {
    const { error } = await supabase.from('tournaments')
      .update({ status: 'en_curso', updated_at: new Date().toISOString() })
      .eq('id', tournamentId);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Torneo iniciado!', 'success');
    loadTournaments();
  }, [showToast, loadTournaments]);

  const handleCancelTournament = useCallback(async (tournamentId) => {
    const { error } = await supabase.from('tournaments')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', tournamentId);
    if (error) { showToast(error.message, 'error'); return; }
    await supabase.from('tournament_standings').delete().eq('tournament_id', tournamentId);
    showToast('Torneo cancelado', 'success');
    loadTournaments();
  }, [showToast, loadTournaments]);

  const handleDeleteTournament = useCallback(async (tournamentId) => {
    await supabase.from('tournament_player_stats').delete().eq('tournament_id', tournamentId);
    await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId);
    await supabase.from('tournament_standings').delete().eq('tournament_id', tournamentId);
    await supabase.from('tournament_teams').delete().eq('tournament_id', tournamentId);
    const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Torneo eliminado', 'success');
    if (activeTournament?.id === tournamentId) setActiveTournament(null);
    loadTournaments();
    emitChange('tournaments', 'delete', { tournamentId });
  }, [showToast, loadTournaments, activeTournament]);

  const teamName = useCallback((id) => {
    const t = teams.find(t => t.id === id);
    return t?.rpg_name || t?.name || '—';
  }, [teams]);

  return {
    tab, setTab,
    teams,
    loadTeams,
    clanRecords,
    tournaments,
    activeTournament, setActiveTournament,
    showCreate, setShowCreate,
    standings,
    matches,
    showLoanForm, setShowLoanForm,
    loanForm, setLoanForm,
    players,
    loans,
    selectTournament,
    handleCreate,
    generateFixture,
    updateMatch,
    handleCreateLoan,
    handleUpdateLoanStatus,
    handleStartTournament,
    handleCancelTournament,
    handleDeleteTournament,
    generatePlayoffs,
    generateNextPlayoffRound,
    loadTournaments,
    loadMatches,
    loadStandings,
    teamName
  };
}
