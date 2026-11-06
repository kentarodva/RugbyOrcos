import { useCallback, useEffect, useState } from 'react';
import { fetchTacticalPlays, createTacticalPlay, deleteTacticalPlay } from '../../data/supabaseApi';

const LOCAL_KEY = (scope) => `pizarra_plays_${scope}`;

function readLocal(scope) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY(scope)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(scope, plays) {
  try {
    if (plays.length) window.localStorage.setItem(LOCAL_KEY(scope), JSON.stringify(plays));
    else window.localStorage.removeItem(LOCAL_KEY(scope));
  } catch { /* storage unavailable */ }
}

/**
 * The staff's own plays for a board.
 * Saved for the whole club in Supabase (table tactical_plays). Until that table exists,
 * plays are kept on this device and uploaded automatically once it does.
 */
export function usePlayLibrary(scope, canSave = false) {
  const [plays, setPlays] = useState([]);
  const [where, setWhere] = useState('loading'); // 'club' | 'device' | 'loading'

  const load = useCallback(async () => {
    const local = readLocal(scope);
    let remote;
    try {
      remote = await fetchTacticalPlays(scope);
    } catch {
      remote = { plays: [], available: false };
    }
    if (!remote.available) {
      setPlays(local);
      setWhere('device');
      return;
    }
    // Table is live: move any device-only plays up to the club, once (staff only).
    const uploaded = [];
    const pending = [];
    for (const p of canSave ? local : []) {
      const saved = await createTacticalPlay({ name: p.name, scope, phases: p.phases });
      if (saved) uploaded.push(saved);
      else pending.push(p);
    }
    if (canSave) writeLocal(scope, pending);
    else pending.push(...local);
    setPlays([...pending, ...uploaded, ...remote.plays]);
    setWhere('club');
  }, [scope, canSave]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (name, phases) => {
    const clean = { name: name.trim().slice(0, 80), scope, phases };
    if (where === 'club') {
      const saved = await createTacticalPlay(clean);
      if (saved) setPlays(prev => [saved, ...prev]);
      return saved;
    }
    const local = { ...clean, id: `local_${Date.now()}`, local: true };
    setPlays(prev => {
      const next = [local, ...prev];
      writeLocal(scope, next);
      return next;
    });
    return local;
  }, [scope, where]);

  const remove = useCallback(async (id) => {
    if (String(id).startsWith('local_')) {
      setPlays(prev => {
        const next = prev.filter(p => p.id !== id);
        writeLocal(scope, next.filter(p => p.local));
        return next;
      });
      return true;
    }
    const ok = await deleteTacticalPlay(id);
    if (ok) setPlays(prev => prev.filter(p => p.id !== id));
    return ok;
  }, [scope]);

  return { plays, where, save, remove };
}
