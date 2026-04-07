// useSettings.js — Hook parametres utilisateur
// TODO: Implementer la logique reelle en iter.58
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useSettings() -> {
 *   settings: UserSettings | null,
 *   loading: boolean,
 *   update: (section, data) => Promise<void>,
 *   refresh: () => void
 * }
 */
export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/omega/user/settings`, { credentials: 'include' });
      if (res.ok) setSettings(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = useCallback(async (section, data) => {
    await fetch(`${API}/api/omega/user/settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [section]: data }), credentials: 'include',
    });
    refresh();
  }, [refresh]);

  return { settings, loading, update, refresh };
}
