// useAuth.js — Hook d'authentification et doctrine
// TODO: Implementer la logique reelle en iter.57
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useAuth() -> {
 *   user: { email, name, profile_id, profile_type, frek_id, is_admin } | null,
 *   doctrine: { actor_role, label_fr, can[], receives[], governance_weight } | null,
 *   isAuthenticated: boolean,
 *   loading: boolean,
 *   login: (email) => Promise<void>,
 *   verifyCode: (email, code) => Promise<boolean>,
 *   logout: () => void,
 *   refresh: () => void
 * }
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [doctrine, setDoctrine] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.session || null);
        // Fetch doctrine
        const docRes = await fetch(`${API}/api/doctrine/my-permissions`, { credentials: 'include' });
        if (docRes.ok) {
          setDoctrine(await docRes.json());
        }
      } else {
        setUser(null);
        setDoctrine(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email) => {
    await fetch(`${API}/api/pro/request-access`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }), credentials: 'include',
    });
  }, []);

  const verifyCode = useCallback(async (email, code) => {
    const res = await fetch(`${API}/api/pro/verify-code`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }), credentials: 'include',
    });
    const data = await res.json();
    if (data.success) {
      await refresh();
      return true;
    }
    return false;
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    setDoctrine(null);
  }, []);

  return {
    user, doctrine, isAuthenticated: !!user, loading,
    login, verifyCode, logout, refresh,
  };
}
