import { useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { wrapCatch } from '../../utils/errorHandler';
import { ClubContext } from '../../context/ClubContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export function useMakgoraState() {
  const { showToast } = useToast();
  const { players, loans, requestLoan, updateLoanStatus } = useContext(ClubContext);
  const [tab, setTab] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', status: 'proximo' });
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanForm, setLoanForm] = useState({ playerId: '', toTeamId: '', reason: '', days: 7 });

  useEffect(() => {
    loadTeams();
    loadTournaments();
  }, []);

  const loadTeams = useCallback(async () => {
    const { data } = await supabase.from('makgora_teams').select('*').order('sort_order');
    if (data) setTeams(data);
  }, []);

  const loadTournaments = useCallback(async () => {
    const { data } = await supabase.from('tournaments').select('*').order('start_date', { ascending: false });
    if (data) setTournaments(data);
  }, []);

  const loadStandings = useCallback(async (tournamentId) => {
    const { data } = await supabase.from('tournament_standings').select('*, makgora_teams!inner(name, rpg_name)').eq('tournament_id', tournamentId).order('total_points', { ascending: false });
    if (data) setStandings(data);
  }, []);

  const loadMatches = useCallback(async (tournamentId) => {
    const { data } = await supabase
      .from('tournament_matches')
      .select('*, home:makhome(name, rpg_name), away:makaway(name, rpg_name)')
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

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) return;

    const { data, error } = await supabase.from('tournaments').insert({
      name: form.name,
      start_date: form.startDate,
      end_date: form.endDate,
      status: 'proximo',
      created_by: (await supabase.auth.getUser()).data.user?.id,
    }).select().single();

    if (error) { showToast(error.message, 'error'); return; }

    const teamsToAdd = teams.filter(t => t.is_active);
    const { data: tt, error: ttError } = await supabase.from('tournament_teams').insert(
      teamsToAdd.map(t => ({ tournament_id: data.id, team_id: t.id })),
      { onConflict: '(tournament_id, team_id)', ignoreDuplicates: true }
    );

    if (ttError) { showToast(ttError.message, 'error'); return; }

    if (tt) {
      for (const t of teamsToAdd) {
        await supabase.from('tournament_standings').insert({
          tournament_id: data.id, team_id: t.id,
          played: 0, won: 0, drawn: 0, lost: 0,
          points_for: 0, points_against: 0, total_points: 0
        });
      }
    }

    showToast('Torneo MakGora creado!', 'success');
    setShowCreate(false);
    setForm({ name: '', startDate: '', endDate: '', status: 'proximo' });
    loadTournaments();
  }, [form, teams, showToast, loadTournaments]);

  const generateFixture = useCallback(async () => {
    if (!activeTournament) return;
    const { data: tms } = await supabase.from('tournament_teams').select('team_id').eq('tournament_id', activeTournament.id);
    if (!tms || tms.length < 2) { showToast('Necesitas al menos 2 equipos', 'error'); return; }

    const teamIds = tms.map(t => t.team_id);
    let round = 1;
    const newMatches = [];

    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        newMatches.push({
          tournament_id: activeTournament.id,
          round,
          phase: 'regular',
          home_team_id: teamIds[i],
          away_team_id: teamIds[j],
          status: 'pendiente',
        });
        round++;
      }
    }

    const { error } = await supabase.from('tournament_matches').insert(newMatches);
    if (error) { showToast(error.message, 'error'); return; }

    showToast('Fixture generado: ' + newMatches.length + ' partidos', 'success');
    loadMatches(activeTournament.id);
  }, [activeTournament, showToast, loadMatches]);

  const updateMatch = useCallback(async (matchId, homeScore, awayScore) => {
    const { error } = await supabase.from('tournament_matches')
      .update({ home_score: homeScore, away_score: awayScore, status: 'jugado' })
      .eq('id', matchId);

    if (error) { showToast(error.message, 'error'); return; }

    loadMatches(activeTournament.id);

    const m = matches.find(x => x.id === matchId);
    if (m) {
      const hs = parseInt(homeScore) || 0;
      const as = parseInt(awayScore) || 0;

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

      const { data: freshData, error: freshError } = await supabase.from('tournament_matches').select('status').eq('tournament_id', activeTournament.id);
      if (freshError) { showToast(freshError.message, 'error'); return; }
      if (freshData && freshData.every(m => m.status === 'jugado')) {
        const topTeam = await supabase.from('tournament_standings')
          .select('team_id, makgora_teams!inner(name)')
          .eq('tournament_id', activeTournament.id)
          .order('total_points', { ascending: false })
          .limit(1).maybeSingle();

        if (topTeam.data) {
          await supabase.from('tournaments')
            .update({ status: 'finalizado', winner_team_id: topTeam.data.team_id })
            .eq('id', activeTournament.id);
        }

        await supabase.from('player_loans')
          .update({ status: 'returned', updated_at: new Date().toISOString() })
          .eq('tournament_id', activeTournament.id)
          .eq('status', 'approved');

        loadTournaments();
      }

      loadStandings(activeTournament.id);
    }
  }, [activeTournament, matches, showToast, loadMatches, loadStandings, loadTournaments]);

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

  const teamName = useCallback((id) => teams.find(t => t.id === id)?.rpg_name || teams.find(t => t.id === id)?.name || '�', [teams]);

  return {
    tab, setTab,
    teams,
    tournaments,
    activeTournament, setActiveTournament,
    showCreate, setShowCreate,
    form, setForm,
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
    teamName
  };
}
