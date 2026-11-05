import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import apisupabase from '../../data/supabaseApi.js';

export function useLoans(user) {
  const [loans, setLoans] = useState(() => []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('loans_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'player_loans' },
        () => {
          apisupabase.fetchLoans().then(({ data }) => {
            if (data) {
              setLoans(data);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Loans go through SECURITY DEFINER RPCs (migration 75): the server checks staff / clan chief.
  const refresh = useCallback(async () => {
    const { data } = await apisupabase.fetchLoans();
    if (data) setLoans(data);
  }, []);

  const requestLoan = useCallback(async (playerId, toTeamId, _fromTeamId, tournamentId, days, reason) => {
    if (!user?.id) return { error: 'No autenticado.' };
    const { error } = await supabase.rpc('makgora_request_loan', {
      p_player: playerId, p_to_team: toTeamId, p_days: Number(days), p_reason: reason || null, p_tournament: tournamentId || null,
    });
    if (error) return { error: error.message };
    await refresh();
    return { success: true };
  }, [user, refresh]);

  const updateLoanStatus = useCallback(async (loanId, status) => {
    const { error } = await supabase.rpc('makgora_respond_loan', { p_loan: loanId, p_status: status });
    if (error) return { error: error.message };
    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status, updated_at: new Date().toISOString() } : l));
    return { success: true };
  }, []);

  return { loans, setLoans, requestLoan, updateLoanStatus };
}
