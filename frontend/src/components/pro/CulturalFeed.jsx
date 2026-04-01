import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import CulturalCard, { CardSkeleton, CARD_TYPE_LABELS } from './CulturalCards';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FILTER_TABS = [
  { key: '', label: 'Tout' },
  { key: 'musique', label: 'Musique' },
  { key: 'artiste', label: 'Artistes' },
  { key: 'lieu', label: 'Lieux' },
  { key: 'evenement', label: 'Événements' },
  { key: 'patrimoine', label: 'Patrimoine' },
];

const CulturalFeed = ({ userId }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const sentinelRef = useRef(null);
  const feedRef = useRef(null);
  const skipRef = useRef(0);
  const touchStartY = useRef(0);
  const pullRef = useRef(null);

  const loadCards = useCallback(async (reset = false) => {
    const skip = reset ? 0 : skipRef.current;
    if (reset) {
      setLoading(true);
      setCards([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = { limit: 10, skip };
      if (userId) params.user_id = userId;
      if (activeFilter) params.card_type = activeFilter;

      const res = await axios.get(`${API}/cultural-feed`, { params });
      const newCards = res.data.cards || [];

      if (reset) {
        setCards(newCards);
        skipRef.current = newCards.length;
      } else {
        setCards(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const unique = newCards.filter(c => !existingIds.has(c.id));
          return [...prev, ...unique];
        });
        skipRef.current = skip + newCards.length;
      }
      setHasMore(res.data.has_more);
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, activeFilter]);

  // Initial load + filter change
  useEffect(() => {
    skipRef.current = 0;
    loadCards(true);
  }, [activeFilter, loadCards]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          loadCards(false);
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, loadCards]);

  // Pull to refresh (mobile)
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (el.scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e) => {
      if (touchStartY.current === 0) return;
      const diff = e.touches[0].clientY - touchStartY.current;
      if (diff > 0 && el.scrollTop <= 0 && pullRef.current) {
        const clamped = Math.min(diff * 0.4, 60);
        pullRef.current.style.height = `${clamped}px`;
        pullRef.current.style.opacity = clamped / 60;
      }
    };
    const onTouchEnd = async () => {
      if (pullRef.current) {
        const h = parseFloat(pullRef.current.style.height || '0');
        if (h > 40) {
          setRefreshing(true);
          skipRef.current = 0;
          await loadCards(true);
          setRefreshing(false);
        }
        pullRef.current.style.height = '0px';
        pullRef.current.style.opacity = '0';
      }
      touchStartY.current = 0;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [loadCards]);

  const handleReact = useCallback(async (cardId, reactionType) => {
    const res = await axios.post(`${API}/cultural-reactions`, {
      user_id: userId,
      card_id: cardId,
      reaction_type: reactionType,
    });
    // Update card reactions in state
    setCards(prev => prev.map(c => {
      if (c.id === cardId && res.data.counts) {
        return { ...c, reactions: res.data.counts, total_reactions: res.data.total };
      }
      return c;
    }));
    return res.data;
  }, [userId]);

  return (
    <div ref={feedRef} data-testid="cultural-feed">
      {/* Pull to refresh indicator */}
      <div
        ref={pullRef}
        className="flex items-center justify-center overflow-hidden"
        style={{ height: 0, opacity: 0, transition: 'height 0.2s, opacity 0.2s' }}
      >
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full"
          style={{
            borderColor: '#C8A84B',
            animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
          }}
        />
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 overflow-x-auto pb-3 mb-4 no-scrollbar"
        data-testid="feed-filters"
      >
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: activeFilter === tab.key ? '#C8A84B' : '#141414',
              color: activeFilter === tab.key ? '#0a0a0a' : '#888',
              border: `1px solid ${activeFilter === tab.key ? '#C8A84B' : '#222'}`,
              minHeight: 36,
            }}
            data-testid={`filter-${tab.key || 'all'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: '#141414', border: '1px solid #1a1a1a' }}
        >
          <p className="text-base" style={{ color: '#555' }}>
            Aucun contenu pour ce filtre
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card, i) => (
            <CulturalCard
              key={card.id}
              card={card}
              userId={userId}
              onReact={handleReact}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="py-6 flex justify-center">
          <div
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#C8A84B' }}
          />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default CulturalFeed;
