// useTerminal.js — Hook console terminal / deploiement HTML
// TODO: Implementer la logique reelle en iter.58
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useTerminal() -> {
 *   deploys: TerminalDeploy[],
 *   loading: boolean,
 *   deploy: (slug, html, title) => Promise<{deploy_id, url}>,
 *   rollback: (deployId) => Promise<void>,
 *   refresh: () => void
 * }
 */
export function useTerminal() {
  const [deploys, setDeploys] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/omega/terminal/deploys`, { credentials: 'include' });
      if (res.ok) setDeploys((await res.json()).deploys || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const deploy = useCallback(async (slug, html, title) => {
    const res = await fetch(`${API}/api/omega/terminal/deploy`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, html, title }), credentials: 'include',
    });
    const data = await res.json();
    refresh();
    return data;
  }, [refresh]);

  const rollback = useCallback(async (deployId) => {
    await fetch(`${API}/api/omega/terminal/rollback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deploy_id: deployId }), credentials: 'include',
    });
    refresh();
  }, [refresh]);

  return { deploys, loading, deploy, rollback, refresh };
}
