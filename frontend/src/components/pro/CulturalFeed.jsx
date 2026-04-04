import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import CulturalCard, { CardSkeleton } from './CulturalCards';
import CreateCulturalCard from './CreateCulturalCard';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

const FILTER_TABS = [
  { key: '', label: 'Tout' },
  { key: 'musique', label: 'Musique' },
  { key: 'artiste', label: 'Artistes' },
  { key: 'lieu', label: 'Lieux' },
  { key: 'evenement', label: 'Events' },
  { key: 'patrimoine', label: 'Patrimoine' },
];

const CulturalFeed = ({ userId }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const feedRef = useRef(null);
  const skipRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadCards = useCallback(async (reset = false) => {
    const skip = reset ? 0 : skipRef.current;
    if (reset) { setLoading(true); setCards([]); } else { setLoadingMore(true); }

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

  useEffect(() => { skipRef.current = 0; loadCards(true); }, [activeFilter, loadCards]);

  // Scroll-snap observer: detect current card in view
  useEffect(() => {
    const container = feedRef.current;
    if (!container || cards.length === 0) return;

    const handleScroll = () => {
      const children = container.children;
      const containerRect = container.getBoundingClientRect();
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child.dataset.cardIndex) continue;
        const rect = child.getBoundingClientRect();
        const overlap = Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top);
        if (overlap > containerRect.height * 0.5) {
          setCurrentIndex(parseInt(child.dataset.cardIndex));
          break;
        }
      }
      // Load more when near bottom
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 300 && hasMore && !loadingMore && !loading) {
        loadCards(false);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [cards.length, hasMore, loadingMore, loading, loadCards]);

  const handleReact = useCallback(async (cardId, reactionType) => {
    const res = await axios.post(`${API}/cultural-reactions`, {
      user_id: userId, card_id: cardId, reaction_type: reactionType,
    });
    setCards(prev => prev.map(c => {
      if (c.id === cardId && res.data.counts) {
        return { ...c, reactions: res.data.counts, total_reactions: res.data.total };
      }
      return c;
    }));
    return res.data;
  }, [userId]);

  return (
    <div className="relative" data-testid="cultural-feed">
      {/* Filter tabs - overlay on top */}
      <div className="sticky top-14 z-30 pb-2 pt-2" style={{ background: 'linear-gradient(to bottom, #0a0a0b 70%, transparent)' }}>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-1" data-testid="feed-filters">
          {FILTER_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap active:scale-[0.97]"
              style={{
                background: activeFilter === tab.key ? G : 'rgba(255,255,255,0.04)',
                color: activeFilter === tab.key ? '#0a0a0b' : '#72727a',
                fontFamily: "'Manrope', sans-serif",
                letterSpacing: '0.04em',
              }}
              data-testid={`filter-${tab.key || 'all'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TikTok-style scroll-snap feed */}
      {loading ? (
        <div className="space-y-4 px-1">
          {Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={`skeleton-${i}`} />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#141414' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#2a2a2b' }}>explore</span>
          <p className="mt-3" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: '#555' }}>Aucun contenu pour ce filtre</p>
          <p className="mt-1" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#333' }}>Soyez le premier à publier</p>
        </div>
      ) : (
        <div ref={feedRef} className="kn-snap-feed" data-testid="snap-feed-container">
          {cards.map((card, i) => (
            <div key={card.id} data-card-index={i} className="kn-snap-item">
              <CulturalCard
                card={card}
                userId={userId}
                onReact={handleReact}
                index={i}
                isActive={currentIndex === i}
              />
            </div>
          ))}
          {/* Load more sentinel */}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: G }} />
            </div>
          )}
        </div>
      )}

      {/* Floating create button */}
      <button onClick={() => setShowCreate(true)} data-testid="create-card-fab"
        className="fixed bottom-24 md:bottom-8 right-4 w-14 h-14 rounded-full flex items-center justify-center z-40 transition-transform hover:scale-105 active:scale-95"
        style={{ background: G, boxShadow: `0 4px 24px ${G}40` }}
        aria-label="Creer une carte culturelle">
        <span className="material-symbols-outlined" style={{ color: '#0a0a0b', fontSize: 26 }}>add</span>
      </button>

      {/* Card index indicator */}
      {cards.length > 1 && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5" data-testid="feed-progress">
          {cards.slice(0, Math.min(cards.length, 8)).map((c, i) => (
            <div key={c.id || `dot-${i}`} className="w-1 rounded-full transition-all duration-200" style={{
              height: currentIndex === i ? 16 : 6,
              background: currentIndex === i ? G : 'rgba(255,255,255,0.15)',
            }} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateCulturalCard
          userId={userId}
          onClose={() => setShowCreate(false)}
          onPublished={() => {
            toast.success('Ta carte enrichit la memoire caribeenne');
            skipRef.current = 0;
            loadCards(true);
          }}
        />
      )}

      <style>{`
        .kn-snap-feed {
          scroll-snap-type: y mandatory;
          overflow-y: auto;
          height: calc(100vh - 140px);
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .kn-snap-item {
          scroll-snap-align: start;
          scroll-snap-stop: always;
          min-height: calc(100vh - 160px);
          display: flex;
          align-items: stretch;
          padding: 4px 0;
        }
        .kn-snap-item > * { width: 100%; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .kn-snap-feed::-webkit-scrollbar { display: none; }
        .kn-snap-feed { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CulturalFeed;
