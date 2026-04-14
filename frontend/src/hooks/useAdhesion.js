// useAdhesion.js — Hook adhesion câblé sur les endpoints réels
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

export function useAdhesion() {
  const [adhesion, setAdhesion] = useState({ level: 'FREE', prix_mensuel: 0, brain_quota_daily: 10, brain_quota_used_today: 0 });
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [curRes, lvlRes] = await Promise.all([
        fetch(`${API}/api/adhesion/current`, { credentials: 'include' }),
        fetch(`${API}/api/adhesion/levels`),
      ]);
      if (curRes.ok) {
        const data = await curRes.json();
        setAdhesion(data.adhesion || { level: 'FREE' });
      }
      if (lvlRes.ok) {
        const data = await lvlRes.json();
        setLevels(data.levels || []);
      }
    } catch (e) {
      // Fallback FREE
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const subscribe = useCallback(async (level) => {
    const res = await fetch(`${API}/api/adhesion/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Erreur adhesion');
    }
    const data = await res.json();
    if (data.requires_payment && data.checkout_url) {
      window.location.href = data.checkout_url;
      return data;
    }
    await refresh();
    return data;
  }, [refresh]);

  const cancel = useCallback(async () => {
    const res = await fetch(`${API}/api/adhesion/cancel`, {
      method: 'POST', credentials: 'include',
    });
    if (res.ok) await refresh();
  }, [refresh]);

  return { adhesion, levels, loading, subscribe, cancel, refresh };
}
