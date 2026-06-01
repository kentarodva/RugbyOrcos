import { useState, useCallback } from 'react';
import { CLUBS, CLUBS_LABELS } from '../constants';

export function useClubs(isSuperRole) {
  const [dynamicClubs, setDynamicClubs] = useState(() => {
    const saved = localStorage.getItem('orcos_dynamic_clubs');
    return saved ? JSON.parse(saved) : {};
  });

  const getAllClubs = useCallback(() => ({ ...CLUBS, ...dynamicClubs }), [dynamicClubs]);

  const getAllClubsLabels = useCallback(() => {
    const labels = { ...CLUBS_LABELS };
    Object.entries(dynamicClubs).forEach(([, code]) => {
      const label = code.charAt(0).toUpperCase() + code.slice(1);
      labels[code] = label;
    });
    return labels;
  }, [dynamicClubs]);

  const addClub = useCallback((name, clubCode) => {
    if (!isSuperRole()) return false;
    const code = clubCode || name.toLowerCase().replace(/\s+/g, '_');
    if (CLUBS[code.toUpperCase()] || dynamicClubs[code.toUpperCase()]) return false;
    const newClubs = { ...dynamicClubs, [name.toUpperCase().replace(/\s+/g, '_')]: code };
    setDynamicClubs(newClubs);
    localStorage.setItem('orcos_dynamic_clubs', JSON.stringify(newClubs));
    return true;
  }, [isSuperRole, dynamicClubs]);

  const deleteClub = useCallback((clubCode) => {
    if (!isSuperRole()) return false;
    const newClubs = { ...dynamicClubs };
    const key = Object.keys(newClubs).find(k => newClubs[k] === clubCode);
    if (key) delete newClubs[key];
    setDynamicClubs(newClubs);
    localStorage.setItem('orcos_dynamic_clubs', JSON.stringify(newClubs));
    return true;
  }, [isSuperRole, dynamicClubs]);

  return { dynamicClubs, getAllClubs, getAllClubsLabels, addClub, deleteClub };
}
