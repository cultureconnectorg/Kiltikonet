// useFrek.js — Hook certification FREK-ID
// TODO: Implementer la logique reelle en iter.58
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useFrek(frekId?) -> {
 *   works: FrekWork[],
 *   loading: boolean,
 *   certify: (title, type, fileHash, metadata) => Promise<FrekWork>,
 *   refresh: () => void
 * }
 */
export function useFrek(frekId) {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!frekId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/omega/frek/works/${frekId}`);
      if (res.ok) setWorks((await res.json()).works || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [frekId]);

  useEffect(() => { refresh(); }, [refresh]);

  const certify = useCallback(async (title, type, file_hash, metadata = {}) => {
    const res = await fetch(`${API}/api/omega/frek/certify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type, file_hash, metadata }),
      credentials: 'include',
    });
    const data = await res.json();
    refresh();
    return data;
  }, [refresh]);

  return { works, loading, certify, refresh };
}
