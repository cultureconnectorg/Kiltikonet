import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DIM_COLORS = {
  'Musique': '#E8D5A0', 'Arts Visuels & Sceniques': '#C4714A',
  'Gastronomie': '#E8C547', 'Patrimoine & Traditions': '#4A5D4E',
  'Langue Creole': '#2DD4BF',
};
const DIM_ICONS = {
  'Musique': 'music_note', 'Arts Visuels & Sceniques': 'palette',
  'Gastronomie': 'restaurant', 'Patrimoine & Traditions': 'account_balance',
  'Langue Creole': 'translate',
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const d = (Date.now() - new Date(iso)) / 1000;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}j`;
};

const ReelsFeed = ({ session, onOpenInbox }) => {
  const [reels, setReels] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/pro/feed/reels`, { params: { limit: 20 } });
        setReels(res.data.reels || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleScroll = useCallback((e) => {
    const container = e.target;
    const idx = Math.round(container.scrollTop / container.clientHeight);
    setCurrentIdx(idx);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="w-12 h-12 rounded-full animate-pulse" style={{ background: 'linear-gradient(135deg, #E8D5A0, #c8a84b)' }} />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ height: 'calc(100vh - 140px)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#2a2a2b' }}>play_circle</span>
        <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: '#555' }}>Aucun reel disponible</p>
      </div>
    );
  }

  return (
    <div className="relative" data-testid="reels-feed"
      style={{ height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
      {/* Snap scroll container */}
      <div className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
        onScroll={handleScroll}>
        {reels.map((reel, idx) => {
          const dimColor = DIM_COLORS[reel.dimension] || '#E8D5A0';
          const dimIcon = DIM_ICONS[reel.dimension] || 'play_circle';
          const isActive = idx === currentIdx;

          return (
            <div key={reel.id} className="snap-start relative flex flex-col justify-end"
              style={{ height: 'calc(100vh - 140px)', minHeight: 500 }}
              data-testid={`reel-${reel.id}`}>
              {/* Background */}
              <div className="absolute inset-0" style={{
                background: `linear-gradient(${45 + idx * 30}deg, ${dimColor}08, #0a0a0b 30%, ${dimColor}04 70%, #0a0a0b)`,
              }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: 120, color: dimColor, opacity: 0.04, fontVariationSettings: "'FILL' 1" }}>{dimIcon}</span>
                </div>
                {/* Gradient overlays */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,11,0.95) 0%, transparent 40%, transparent 60%, rgba(10,10,11,0.4) 100%)' }} />
              </div>

              {/* Dimension badge — top */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
                <span className="material-symbols-outlined" style={{ color: dimColor, fontSize: 12 }}>{dimIcon}</span>
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: dimColor }}>
                  {reel.dimension}
                </span>
              </div>

              {/* Duration */}
              {reel.duration && (
                <div className="absolute top-4 right-4 z-10 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, color: '#fff' }}>{reel.duration}</span>
                </div>
              )}

              {/* Play indicator center */}
              {isActive && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center z-10 opacity-60"
                  style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#fff', fontVariationSettings: "'FILL' 1", marginLeft: 3 }}>play_arrow</span>
                </div>
              )}

              {/* ─── Right Actions Column ─── */}
              <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-5">
                {[
                  { icon: 'favorite', count: reel.likes_count, color: '#f87171' },
                  { icon: 'chat_bubble', count: reel.comments_count, color: '#e5e2e3' },
                  { icon: 'share', count: reel.shares_count, color: '#e5e2e3' },
                  { icon: 'bolt', count: '', color: '#E8D5A0', special: true },
                ].map(action => (
                  <button key={action.icon} className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: action.special ? 'rgba(232,213,160,0.15)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
                      <span className="material-symbols-outlined" style={{ color: action.color, fontSize: 20, fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
                    </div>
                    {action.count !== '' && (
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, color: '#e5e2e3' }}>{action.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* ─── Bottom Content ─── */}
              <div className="relative z-10 px-5 pb-5">
                {/* Author */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: '2px solid rgba(232,213,160,0.4)', padding: 2 }}>
                    <div className="w-full h-full rounded-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${dimColor}20, ${dimColor}08)` }}>
                      <span className="material-symbols-outlined" style={{ color: dimColor, fontSize: 14 }}>person</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>{reel.author_name}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#E8D5A0', fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 500, color: '#72727a' }}>{reel.author_country}</span>
                  </div>
                  <button className="px-3 py-1 rounded-full active:scale-95 transition-transform"
                    style={{ background: '#E8D5A0', color: '#3a2f09', fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700 }}>
                    Follow
                  </button>
                </div>

                {/* Title */}
                <h2 className="pr-14" style={{
                  fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(16px, 3.5vw, 22px)',
                  fontWeight: 800, color: '#e5e2e3', lineHeight: 1.3,
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                }}>
                  {reel.content}
                </h2>

                {/* Hashtags */}
                <div className="flex gap-2 mt-2">
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, color: dimColor }}>#{reel.dimension?.replace(/\s+/g, '')}</span>
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, color: dimColor }}>#CC2026</span>
                </div>

                {/* Views */}
                <div className="mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#555' }}>visibility</span>
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#555' }}>{(reel.views_count || 0).toLocaleString()} vues</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll Progress */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-0.5">
        {reels.slice(0, 8).map((_, i) => (
          <div key={i} className="w-0.5 rounded-full transition-all"
            style={{ height: i === currentIdx ? 16 : 6, background: i === currentIdx ? '#E8D5A0' : 'rgba(255,255,255,0.15)' }} />
        ))}
      </div>
    </div>
  );
};

export default ReelsFeed;
