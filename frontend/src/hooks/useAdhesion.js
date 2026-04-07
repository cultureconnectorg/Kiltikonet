// useAdhesion.js — Hook niveaux d'adhesion
// TODO: Implementer la logique reelle en iter.58
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useAdhesion() -> {
 *   levels: AdhesionLevel[],
 *   mySubscription: AdhesionSubscription | null,
 *   loading: boolean,
 *   subscribe: (levelId) => Promise<void>,
 *   cancel: () => Promise<void>,
 *   refresh: () => void
 * }
 */
export function useAdhesion() {
  const [levels, setLevels] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/omega/adhesion/levels`);
      if (res.ok) setLevels((await res.json()).levels || []);
      const subRes = await fetch(`${API}/api/omega/adhesion/my-subscription`, { credentials: 'include' });
      if (subRes.ok) setMySubscription((await subRes.json()).subscription || null);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const subscribe = useCallback(async (levelId) => {
    await fetch(`${API}/api/omega/adhesion/subscribe`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level_id: levelId }), credentials: 'include',
    });
    refresh();
  }, [refresh]);

  const cancel = useCallback(async () => {
    await fetch(`${API}/api/omega/adhesion/cancel`, {
      method: 'POST', credentials: 'include',
    });
    refresh();
  }, [refresh]);

  return { levels, mySubscription, loading, subscribe, cancel, refresh };
}
