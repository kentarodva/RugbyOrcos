import { useState, useEffect, useCallback } from 'react';
import { CLUBS, CLUBS_LABELS } from '../constants';
import { supabase } from '../../supabaseClient.js';

export function useClubs(isSuperRole, user) {
  const [dynamicClubs, setDynamicClubs] = useState({});

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('clubs').select('name, code').then(({ data }) => {
      if (data?.length) {
        const map = {};
        data.forEach(c => { map[c.name.toUpperCase().replace(/\s+/g, '_')] = c.code; });
        setDynamicClubs(map);
      }
    }).catch(() => {});
  }, [user?.id]);

  const getAllClubs = useCallback(() => ({ ...CLUBS, ...dynamicClubs }), [dynamicClubs]);

  const getAllClubsLabels = useCallback(() => {
    const labels = { ...CLUBS_LABELS };
    Object.entries(dynamicClubs).forEach(([, code]) => {
      const label = code.charAt(0).toUpperCase() + code.slice(1).replace(/_/g, ' ');
      labels[code] = label;
    });
    return labels;
  }, [dynamicClubs]);

  const addClub = useCallback(async (name, clubCode) => {
    if (!isSuperRole() || !user?.id) return false;
    const code = clubCode || name.toLowerCase().replace(/\s+/g, '_');
    const key = name.toUpperCase().replace(/\s+/g, '_');
    if (CLUBS[key] || dynamicClubs[key]) return false;

    const { error } = await supabase.from('clubs').insert({
      name, code, created_by: user.id
    });
    if (error) return false;

    setDynamicClubs(prev => ({ ...prev, [key]: code }));
    return true;
  }, [isSuperRole, user?.id, dynamicClubs]);

  const deleteClub = useCallback(async (clubCode) => {
    if (!isSuperRole() || !user?.id) return false;
    const { error } = await supabase.from('clubs').delete().eq('code', clubCode);
    if (error) return false;

    setDynamicClubs(prev => {
      const next = { ...prev };
      const key = Object.keys(next).find(k => next[k] === clubCode);
      if (key) delete next[key];
      return next;
    });
    return true;
  }, [isSuperRole, user?.id]);

  return { dynamicClubs, getAllClubs, getAllClubsLabels, addClub, deleteClub };
}
