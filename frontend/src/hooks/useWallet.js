// useWallet.js — Hook wallet KT/CC câblé sur les endpoints réels
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useWallet(type) — type = 'KT' ou 'CC'
 * Returns: { solde, transactions, loading, error, debit, credit, refresh }
 */
export function useWallet(type = 'CC') {
  const [solde, setSolde] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/my-wallet/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSolde(data.balance || 0);
      }
      // Fetch transactions
      const txRes = await fetch(`${API}/api/my-wallet/history?limit=20`, { credentials: 'include' });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const debit = useCallback(async (amount, description = '', actionType = '') => {
    const res = await fetch(`${API}/api/wallet/debit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description, action_type: actionType }),
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Debit failed');
    }
    await refresh();
    return await res.json();
  }, [refresh]);

  const credit = useCallback(async (amount, description = '') => {
    const res = await fetch(`${API}/api/wallet/credit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Credit failed');
    }
    await refresh();
    return await res.json();
  }, [refresh]);

  return { solde, transactions, loading, error, debit, credit, refresh };
}
