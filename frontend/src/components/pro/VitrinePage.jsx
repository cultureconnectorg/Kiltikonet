// ═══════════════════════════════════════════════════════════
// PAGE VITRINE DYNAMIQUE — Point 2 de l'architecture
// Landing culturelle avec actualités auto-générées + ghost posts
// Design System: Sovereign Onyx · Material Symbols Only
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

const CULTURAL_NEWS = [
  {
    id: 1,
    tag: 'Musique',
    title: 'Le Gwoka inscrit au patrimoine mondial : et maintenant ?',
    excerpt: "Trois ans après l'inscription, le Gwoka continue de rayonner à l'international. Les artistes de la diaspora réinventent la tradition.",
    image: null,
    author: 'Rédaction Kiltikonet',
    date: 'Il y a 2h',
    icon: 'music_note',
    color: '#C4714A',
  },
  {
    id: 2,
    tag: 'Événement',
    title: 'CC2026 : Les 69 artistes sélectionnés dévoilés',
    excerpt: "Le comité de sélection a retenu 69 artistes de 12 pays pour la première édition du marché culturel international.",
    image: null,
    author: 'Équipe CC2026',
    date: 'Il y a 5h',
    icon: 'celebration',
    color: G,
  },
  {
    id: 3,
    tag: 'Technologie',
    title: "L'IA au service de la mémoire culturelle caribéenne",
    excerpt: "CVL BRAIN, l'intelligence souveraine de Kiltikonet, indexe et préserve les archives orales du patrimoine créole.",
    image: null,
    author: 'CVL BRAIN Labs',
    date: 'Il y a 8h',
    icon: 'psychology',
    color: '#8B5CF6',
  },
  {
    id: 4,
    tag: 'Gastronomie',
    title: 'Les Kilti-Tokens financent le premier incubateur culinaire',
    excerpt: "50 chefs caribéens bénéficieront du programme d'accélération financé par la communauté KT.",
    image: null,
    author: 'Écosystème KT',
    date: 'Hier',
    icon: 'restaurant',
    color: '#2DD4BF',
  },
  {
    id: 5,
    tag: 'Patrimoine',
    title: 'Fort-Royal → Fort-de-France : cartographie de la mémoire',
    excerpt: "Un projet collaboratif pour documenter les lieux de mémoire oubliés de la capitale martiniquaise.",
    image: null,
    author: 'Archives Souveraines',
    date: 'Hier',
    icon: 'map',
    color: '#4A5D4E',
  },
];

const STATS = [
  { value: '12', unit: 'pays', label: 'représentés' },
  { value: '69', unit: 'artistes', label: 'sélectionnés' },
  { value: '4', unit: 'jours', label: 'de programmation' },
  { value: '10K+', unit: 'visiteurs', label: 'attendus' },
];

const VitrinePage = ({ session }) => {
  const [news] = useState(CULTURAL_NEWS);
  const [trending, setTrending] = useState([]);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Auto-rotate featured news
    intervalRef.current = setInterval(() => {
      setFeaturedIdx(prev => (prev + 1) % news.length);
    }, 6000);
    return () => clearInterval(intervalRef.current);
  }, [news.length]);

  // Load trending posts from ghost feed
  useEffect(() => {
    axios.get(`${API}/pro/feed`, { params: { limit: 3 } })
      .then(r => setTrending(r.data?.posts?.slice(0, 3) || []))
      .catch(() => {});
  }, []);

  const featured = news[featuredIdx];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-20 space-y-8" data-testid="vitrine-page">
      {/* ─── HERO — Featured News ─── */}
      <div className="rounded-2xl overflow-hidden relative" style={{ background: '#131314', minHeight: 280 }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 40%, ${featured.color}15, transparent 60%)` }} />
        <div className="relative p-8 sm:p-10 flex flex-col justify-end" style={{ minHeight: 280 }}>
          {/* Tag */}
          <span className="self-start px-3 py-1 rounded-full mb-4" style={{ background: `${featured.color}15`, color: featured.color, fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', border: `1px solid ${featured.color}25` }}>
            {featured.tag}
          </span>

          {/* Title */}
          <h1 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#e5e2e3', maxWidth: 640 }}>
            {featured.title}
          </h1>

          {/* Excerpt */}
          <p className="mt-3 max-w-lg" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: '#72727a', lineHeight: 1.7 }}>
            {featured.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-5">
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, color: '#a0a0a5' }}>{featured.author}</span>
            <span style={{ fontSize: 4, color: '#555' }}>●</span>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, color: '#555' }}>{featured.date}</span>
          </div>

          {/* Dots indicator */}
          <div className="flex gap-2 mt-6">
            {news.map((_, i) => (
              <button
                key={i}
                onClick={() => { setFeaturedIdx(i); clearInterval(intervalRef.current); }}
                className="transition-all"
                style={{ width: i === featuredIdx ? 24 : 8, height: 4, borderRadius: 2, background: i === featuredIdx ? G : '#2a2a2b' }}
                data-testid={`vitrine-dot-${i}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── STATS BAR — CC2026 ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: '#131314' }}>
            <div className="flex items-baseline justify-center gap-1">
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 400, fontStyle: 'italic', color: G }}>{s.value}</span>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, color: '#72727a' }}>{s.unit}</span>
            </div>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── NEWS GRID ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 20, color: '#e5e2e3' }}>Actualités Culturelles</h2>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(232,213,160,0.06)', color: G, fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: G }} />
            Mis à jour auto
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((item, idx) => (
            <article
              key={item.id}
              className="rounded-xl p-5 transition-all hover:bg-white/[0.02] cursor-pointer fade-slide-in group"
              style={{ background: '#131314', animationDelay: `${idx * 60}ms`, border: '1px solid rgba(75,70,59,0.08)' }}
              data-testid={`vitrine-news-${item.id}`}
            >
              {/* Icon header */}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: `${item.color}12` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: item.color, fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              </div>

              {/* Tag */}
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: item.color }}>
                {item.tag}
              </span>

              {/* Title */}
              <h3 className="mt-2 group-hover:text-[#E8D5A0] transition-colors" style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.3, color: '#e5e2e3' }}>
                {item.title}
              </h3>

              {/* Excerpt */}
              <p className="mt-2 line-clamp-2" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a', lineHeight: 1.6 }}>
                {item.excerpt}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-2 mt-4">
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, color: '#555' }}>{item.author}</span>
                <span style={{ fontSize: 3, color: '#555' }}>●</span>
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#555' }}>{item.date}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── TRENDING POSTS — from Ghost Feed ─── */}
      {trending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 20, color: '#e5e2e3' }}>Tendances du réseau</h2>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#72727a' }}>trending_up</span>
          </div>
          <div className="space-y-3">
            {trending.map((post, idx) => (
              <div key={post.id || idx} className="p-4 rounded-xl flex items-start gap-3" style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.06)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,213,160,0.08)' }}>
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, color: G }}>
                    {(post.author_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 600, color: '#e5e2e3' }}>{post.author_name}</p>
                  <p className="mt-1 line-clamp-2" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a', lineHeight: 1.5 }}>
                    {post.content?.slice(0, 120)}{post.content?.length > 120 ? '...' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: G }}>favorite</span>
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>{post.reactions_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── CTA — Join CC2026 ─── */}
      <div className="rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(232,213,160,0.06), rgba(200,168,75,0.02))', border: '1px solid rgba(232,213,160,0.1)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(232,213,160,0.08), transparent 50%)', filter: 'blur(60px)' }} />
        <div className="relative">
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: G }}>20-23 Mai 2026 · Fort-de-France</span>
          <h2 className="mt-3" style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 300, color: '#e5e2e3' }}>
            Rejoignez Culture Connect 2026
          </h2>
          <p className="mt-2 max-w-md mx-auto" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#72727a', lineHeight: 1.6 }}>
            Le premier marché culturel international de la Caraïbe. Artistes, labels, institutions — construisons ensemble.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <button className="px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: G, color: '#3a2f09', fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700 }}>
              S'accréditer
            </button>
            <button className="px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'transparent', border: `1px solid ${G}30`, color: G, fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700 }}>
              En savoir plus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitrinePage;
