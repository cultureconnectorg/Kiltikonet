// useAuth.js — Hook auth câblé pour Omega (lit cc2026_pro_session + cookie)
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

export function useAuth() {
  const [user, setUser] = useState(null);
  const [doctrine, setDoctrine] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Check pro session in sessionStorage (fast path)
      const proRaw = sessionStorage.getItem('cc2026_pro_session');
      if (proRaw) {
        try {
          const proSession = JSON.parse(proRaw);
          if (proSession && proSession.email) {
            setUser({
              id: proSession.id || '',
              email: proSession.email,
              name: proSession.name || proSession.email.split('@')[0],
              full_name: proSession.name,
              frek_id: proSession.frek_id || '',
              image: proSession.image || '',
              profile_type: proSession.type || 'consumer',
              language: proSession.language || 'fr',
              role: proSession.type === 'admin' ? 'ADMIN' : 'USER',
            });
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        } catch {}
      }

      // 2. Fallback: verify via httpOnly cookie
      const res = await fetch(`${API}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.session) {
          const s = data.session;
          setUser({
            id: s.profile_id || s.frek_id || '',
            email: s.email || '',
            name: s.name || s.email?.split('@')[0] || '',
            full_name: s.name || '',
            frek_id: s.frek_id || '',
            role: s.role || 'USER',
            profile_type: s.profile_type || '',
          });
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // Not authenticated
    }
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email) => {
    const res = await fetch(`${API}/api/pro/request-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  }, []);

  const verifyCode = useCallback(async (email, code) => {
    const res = await fetch(`${API}/api/pro/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
      credentials: 'include',
    });
    const data = await res.json();
    if (data.success && data.profile) {
      sessionStorage.setItem('cc2026_pro_session', JSON.stringify({
        id: data.profile.id, email: data.profile.email, name: data.profile.full_name,
        image: data.profile.image, type: data.profile.profile_type,
        frek_id: data.profile.frek_id, language: data.profile.language || 'fr',
        verified: true, createdAt: Date.now(),
      }));
      await refresh();
    }
    return data;
  }, [refresh]);

  const logout = useCallback(async () => {
    sessionStorage.removeItem('cc2026_pro_session');
    try { await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' }); } catch {}
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/espace-pro/connexion';
  }, []);

  return { user, doctrine, isAuthenticated, loading, login, verifyCode, logout, refresh };
}
