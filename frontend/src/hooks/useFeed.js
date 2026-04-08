// useFeed.js — Hook feed social
// TODO: Implementer la logique reelle en iter.57
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useFeed() -> {
 *   posts: FeedPost[],
 *   loading: boolean,
 *   hasMore: boolean,
 *   loadMore: () => void,
 *   eclair: (postId) => Promise<void>,
 *   commenter: (postId, content) => Promise<void>,
 *   post: (content, media?) => Promise<void>
 * }
 */
export function useFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/pro/feed?page=${p}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        const newPosts = data.posts || [];
        setPosts(prev => p === 1 ? newPosts : [...prev, ...newPosts]);
        setHasMore(newPosts.length === 10);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    load(next);
  }, [page, load]);

  const eclair = useCallback(async (postId) => {
    try {
      const res = await fetch(`${API}/api/pro/feed/posts/${postId}/eclair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ frek_id: window.__KILTI_FREK_ID || '' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402) return { success: false, reason: 'insufficient_kt', message: err.detail || 'Solde KT insuffisant' };
        return { success: false, reason: 'error', message: err.detail || 'Erreur' };
      }
      const data = await res.json();
      // Update post locally
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, eclairs_count: data.eclairs_count, eclairs: [...(p.eclairs || []), window.__KILTI_FREK_ID] } : p));
      return { success: true, eclairs_count: data.eclairs_count, new_balance_kt: data.new_balance_kt };
    } catch {
      return { success: false, reason: 'network', message: 'Erreur reseau' };
    }
  }, []);

  const commenter = useCallback(async (postId, content) => {
    await fetch(`${API}/api/pro/feed/posts/${postId}/comment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }), credentials: 'include',
    });
    load(1);
  }, [load]);

  const post = useCallback(async (content, media) => {
    await fetch(`${API}/api/pro/feed/posts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, media }), credentials: 'include',
    });
    load(1);
  }, [load]);

  return { posts, loading, hasMore, loadMore, eclair, commenter, post };
}
