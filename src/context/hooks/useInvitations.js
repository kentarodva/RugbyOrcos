import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { handleError } from '../../utils/errorHandler';
import apisupabase from '../../data/supabaseApi.js';

export function useInvitations(user, userTier, profile) {
  const [matchInvitations, setMatchInvitations] = useState(() => []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('invitations_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'guest_players' },
        () => {
          apisupabase.fetchInvitations(user.id, userTier, profile?.club_scope).then(invitationsData => {
            if (!invitationsData) return;
            const invMapped = invitationsData.map(inv => ({
              id: inv.id,
              futureFixtureId: inv.future_fixture_id,
              token: inv.token,
              rivalName: inv.rival_name,
              rivalId: inv.rival_id,
              status: inv.status,
              expiresAt: inv.expires_at,
              guestCount: inv.guest_count || 0,
              response: inv.response || 'pending',
              responseNotes: inv.response_notes,
              respondedAt: inv.responded_at,
              createdAt: inv.created_at,
              futureFixture: inv.future_fixtures ? {
                id: inv.future_fixtures.id,
                opponent: inv.future_fixtures.opponent,
                date: inv.future_fixtures.date,
                time: inv.future_fixtures.time,
                location: inv.future_fixtures.location,
                rivalId: inv.future_fixtures.rival_id,
              } : null,
              guests: (inv.guest_players || []).map(g => ({
                id: g.id, name: g.name, number: g.number,
                position: g.position, notes: g.notes,
              })),
            }));
            setMatchInvitations(invMapped);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.system_role, userTier, profile?.club_scope]);

  const cancelInvitation = useCallback(async (invitationId) => {
    if (!user?.id) return;
    try {
      await apisupabase.updateInvitation(invitationId, { status: 'expired' });
      setMatchInvitations(prev => prev.map(inv =>
        inv.id === invitationId ? { ...inv, status: 'expired' } : inv
      ));
    } catch (err) {
      handleError(err, 'useInvitations.cancel', { silent: true });
    }
  }, [user?.id]);

  const deleteInvitation = useCallback(async (invitationId) => {
    if (!user?.id) return;
    try {
      await apisupabase.deleteInvitation(invitationId);
      setMatchInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err) {
      handleError(err, 'useInvitations.delete', { silent: true });
    }
  }, [user?.id]);

  const updateInvitationResponse = useCallback(async (invitationId, response, notes = '') => {
    try {
      const payload = {
        response,
        response_notes: notes || null,
        responded_at: new Date().toISOString(),
      };
      if (response === 'accepted' || response === 'declined') {
        payload.status = response === 'accepted' ? 'active' : 'expired';
      }
      await apisupabase.updateInvitation(invitationId, payload);
      setMatchInvitations(prev => prev.map(inv =>
        inv.id === invitationId ? { ...inv, response, responseNotes: notes, respondedAt: new Date().toISOString(), status: payload.status || inv.status } : inv
      ));
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }, []);

  const createInvitation = useCallback(async ({ futureFixtureId, rivalName, rivalId }) => {
    if (!user?.id) return { error: 'No autenticado' };
    const token = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').substring(0, 16)
      : Math.random().toString(36).substring(2, 18);
    const record = {
      user_id: user.id,
      future_fixture_id: futureFixtureId,
      token,
      rival_name: rivalName,
      rival_id: rivalId || null,
      status: 'active',
      expires_at: null,
    };
    const { data, error } = await apisupabase.createInvitation(record);
    if (error) return { error: error.message };
    if (data) {
      const invMapped = {
        id: data.id,
        futureFixtureId: data.future_fixture_id,
        token: data.token,
        rivalName: data.rival_name,
        rivalId: data.rival_id,
        status: data.status,
        expiresAt: data.expires_at,
        guestCount: data.guest_count || 0,
        response: data.response || 'pending',
        responseNotes: data.response_notes,
        respondedAt: data.responded_at,
        createdAt: data.created_at,
        guests: [],
      };
      setMatchInvitations(prev => [invMapped, ...prev]);
      return { success: true, token, data: invMapped };
    }
    return { error: 'No se pudo crear la invitación' };
  }, [user?.id]);

  return { matchInvitations, setMatchInvitations, cancelInvitation, deleteInvitation, updateInvitationResponse, createInvitation };
}
