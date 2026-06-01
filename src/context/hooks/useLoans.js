import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import apisupabase from '../../data/supabaseApi.js';

export function useLoans(user) {
  const [loans, setLoans] = useState(() => []);

  useEffect(() => {
    localStorage.setItem('orcos_loans', JSON.stringify(loans));
  }, [loans]);

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
              localStorage.setItem('orcos_loans', JSON.stringify(data));
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const requestLoan = useCallback(async (playerId, toTeamId, fromTeamId, tournamentId, days, reason) => {
    if (!user?.id) return { error: 'No autenticado.' };
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    try {
      const { error } = await apisupabase.createLoan({
        user_id: user.id,
        player_id: playerId,
        from_team_id: fromTeamId || null,
        to_team_id: toTeamId,
        tournament_id: tournamentId || null,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
        status: 'pending',
      });
      if (error) return { error: error.message };
      const { data } = await apisupabase.fetchLoans();
      if (data) { setLoans(data); localStorage.setItem('orcos_loans', JSON.stringify(data)); }
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }, [user]);

  const updateLoanStatus = useCallback(async (loanId, status) => {
    try {
      const { error } = await apisupabase.updateLoanStatus(loanId, status);
      if (error) return { error: error.message };
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status, updated_at: new Date().toISOString() } : l));
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }, []);

  return { loans, setLoans, requestLoan, updateLoanStatus };
}
