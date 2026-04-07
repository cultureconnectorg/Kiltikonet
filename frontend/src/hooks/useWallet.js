// useWallet.js — Hook wallet KT ou CC
// TODO: Implementer la logique reelle en iter.57
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useWallet(type: 'KT' | 'CC') -> {
 *   solde: number,
 *   transactions: Transaction[],
 *   loading: boolean,
 *   debit: (amount, description) => Promise<void>,
 *   credit: (amount, description) => Promise<void>,
 *   refresh: () => void
 * }
 */
export function useWallet(type = 'KT') {
  const [solde, setSolde] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/my-wallet/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSolde(data.balance || 0);
      }
      const txRes = await fetch(`${API}/api/my-wallet/history`, { credentials: 'include' });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [type]);

  useEffect(() => { refresh(); }, [refresh]);

  // TODO: Implementer debit/credit via endpoints
  const debit = useCallback(async (amount, description) => {
    console.log('TODO: debit', amount, description);
  }, []);

  const credit = useCallback(async (amount, description) => {
    console.log('TODO: credit', amount, description);
  }, []);

  return { solde, transactions, loading, debit, credit, refresh };
}
