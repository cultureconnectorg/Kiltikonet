// useGouvernance.js — Hook gouvernance / votes
// TODO: Implementer la logique reelle en iter.58
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useGouvernance() -> {
 *   proposals: GovernanceProposal[],
 *   loading: boolean,
 *   vote: (proposalId, vote) => Promise<void>,
 *   createProposal: (title, description, category) => Promise<void>,
 *   refresh: () => void
 * }
 */
export function useGouvernance() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/omega/gouvernance/proposals`);
      if (res.ok) setProposals((await res.json()).proposals || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const vote = useCallback(async (proposalId, voteValue) => {
    await fetch(`${API}/api/omega/gouvernance/vote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: proposalId, vote: voteValue }),
      credentials: 'include',
    });
    refresh();
  }, [refresh]);

  const createProposal = useCallback(async (title, description, category) => {
    await fetch(`${API}/api/omega/gouvernance/proposals`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category }),
      credentials: 'include',
    });
    refresh();
  }, [refresh]);

  return { proposals, loading, vote, createProposal, refresh };
}
