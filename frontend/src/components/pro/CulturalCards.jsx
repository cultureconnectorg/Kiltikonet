import React, { useState } from 'react';
import CulturalReactions from './CulturalReactions';
import SoutenirSheet from './SoutenirSheet';

const CARD_ICONS = {
  musique: 'music_note', artiste: 'person', lieu: 'location_on',
  evenement: 'event', patrimoine: 'account_balance',
};

const CARD_TYPE_LABELS = {
  musique: 'MUSIQUE', artiste: 'ARTISTE', lieu: 'LIEU',
  evenement: 'EVENEMENT', patrimoine: 'PATRIMOINE',
};

const DIMENSION_COLORS = {
  'Musique': '#E8D5A0',
  'Arts Visuels & Sceniques': '#C4714A',
  'Langue Creole': '#2DD4BF',
  'Patrimoine & Traditions': '#4A5D4E',
  'Gastronomie': '#E8C547',
  'Feminite & Matriarcat': '#8B5CF6',
  'Identite Diasporique': '#5B9BD5',
};

export const CardSkeleton = () => (
  <div className="rounded-xl overflow-hidden relative" style={{ height: 'calc(100vh - 180px)', background: '#141414' }} data-testid="card-skeleton">
    <div className="absolute inset-0 kn-skeleton-shimmer" />
  </div>
);

const CulturalCard = ({ card, userId, onReact, index = 0, isActive = false }) => {
  const iconName = CARD_ICONS[card.card_type] || 'account_balance';
  const typeLabel = CARD_TYPE_LABELS[card.card_type] || card.card_type;
  const dimColor = DIMENSION_COLORS[card.dimension] || '#E8D5A0';
  const meta = card.meta || {};
  const isEvent = card.card_type === 'evenement';
  const isMusic = card.card_type === 'musique';
  const [showSoutenir, setShowSoutenir] = useState(false);

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
    return diff > 0 ? diff : null;
  };
  const eventDays = isEvent ? daysUntil(meta.date) : null;

  return (
    <article
      className="relative rounded-xl overflow-hidden flex flex-col"
      style={{
        height: 'calc(100vh - 180px)',
        minHeight: 500,
        background: '#0a0a0b',
        animationDelay: `${index * 40}ms`,
      }}
      data-testid={`cultural-card-${card.id}`}
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        {card.image_url ? (
          <img src={card.image_url} alt={card.title}
            className="w-full h-full object-cover"
            loading={index < 2 ? 'eager' : 'lazy'}
            style={{ filter: isActive ? 'none' : 'brightness(0.7)' }} />
        ) : (
          <div className="absolute inset-0" style={{
            background: `linear-gradient(160deg, ${dimColor}18, #0a0a0b 35%, ${dimColor}06 70%, #0a0a0b)`,
          }}>
            <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ fontSize: 120, color: dimColor, opacity: 0.06, fontVariationSettings: "'FILL' 1" }}>{iconName}</span>
          </div>
        )}
        {/* Gradient overlays — Stitch "gradient-edge" */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(14,14,14,1) 0%, rgba(14,14,14,0.4) 50%, rgba(14,14,14,0) 100%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to right, rgba(10,10,11,0.3) 0%, transparent 30%, transparent 70%, rgba(10,10,11,0.4) 100%)',
        }} />
      </div>

      {/* Type badge - top left — Stitch glass pill */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
        <span className="material-symbols-outlined" style={{ color: '#E8D5A0', fontSize: 14 }}>{iconName}</span>
        <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#E8D5A0' }}>
          {typeLabel}
        </span>
      </div>

      {/* Duration - music only, top right */}
      {isMusic && card.duration && (
        <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(8px)' }}>
          {card.duration}
        </div>
      )}

      {/* Event countdown */}
      {isEvent && eventDays && (
        <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(232,213,160,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(232,213,160,0.3)' }}>
          <span className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 800, color: '#E8D5A0' }}>
            J-{eventDays}
          </span>
        </div>
      )}

      {/* Music play button center */}
      {isMusic && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center z-10 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#fff', fontVariationSettings: "'FILL' 1", marginLeft: 3 }}>play_arrow</span>
        </div>
      )}

      {/* ─── RIGHT-SIDE ACTION COLUMN — Stitch "aside" ─── */}
      <div className="absolute right-3 bottom-44 z-10 flex flex-col items-center gap-5" data-testid={`card-actions-${card.id}`}>
        {/* Cultural Reactions (vertical) */}
        <CulturalReactions cardId={card.id} reactions={card.reactions || {}} userId={userId} onReact={onReact} vertical />

        {/* Comment */}
        <button className="flex flex-col items-center gap-0.5 transition-transform active:scale-90"
          data-testid={`comment-btn-${card.id}`}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(31,31,31,0.6)', backdropFilter: 'blur(12px)' }}>
            <span className="material-symbols-outlined" style={{ color: '#E8D5A0', fontSize: 22 }}>chat_bubble</span>
          </div>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#E8D5A0', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {card.comments_count || 0}
          </span>
        </button>

        {/* Share / Repost */}
        <button className="flex flex-col items-center gap-0.5 transition-transform active:scale-90" data-testid={`share-btn-${card.id}`}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(31,31,31,0.6)', backdropFilter: 'blur(12px)' }}>
            <span className="material-symbols-outlined" style={{ color: '#e5e2e3', fontSize: 22 }}>share</span>
          </div>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e5e2e3', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            Partage
          </span>
        </button>

        {/* Soutenir JCC */}
        <button onClick={() => setShowSoutenir(true)}
          className="flex flex-col items-center gap-0.5 transition-transform active:scale-90"
          data-testid={`soutenir-btn-${card.id}`}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(232,213,160,0.15)', border: '1px solid rgba(232,213,160,0.3)' }}>
            <span className="material-symbols-outlined" style={{ color: '#E8D5A0', fontSize: 22 }}>bolt</span>
          </div>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#E8D5A0', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            JCC
          </span>
        </button>
      </div>

      {/* ─── BOTTOM CONTENT — Stitch "Bottom-left Content Overlay" ─── */}
      <div className="relative mt-auto z-10 px-5 pb-5">
        {/* Creator bar — Stitch style */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: '2px solid rgba(232,213,160,0.5)', padding: 2 }}>
            <div className="w-full h-full rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(232,213,160,0.2), rgba(196,113,74,0.15))' }}>
              <span className="material-symbols-outlined" style={{ color: '#E8D5A0', fontSize: 16 }}>{iconName}</span>
            </div>
          </div>
          <div className="min-w-0">
            <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, color: '#e5e2e3' }}>
              {card.created_by_name || 'Communauté CC2026'}
            </h3>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,213,160,0.8)' }}>
              {isMusic ? 'Artiste Vérifié' : isEvent ? 'Organisateur' : 'Curator Vérifié'}
            </p>
          </div>
          <button onClick={() => setShowSoutenir(true)}
            className="ml-2 px-3 py-1 rounded-full transition-all active:scale-95"
            style={{ background: '#e5c363', color: '#3a2f09', fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase' }}
            data-testid={`follow-btn-${card.id}`}>
            FOLLOW
          </button>
        </div>

        {/* Title — Stitch uses Manrope extrabold */}
        <h2 className="pr-14" style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 'clamp(20px, 4vw, 26px)',
          fontWeight: 800,
          color: '#e5e2e3',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        }}>
          {card.title}
        </h2>

        {/* Subtitle */}
        {card.subtitle && (
          <p className="mt-1 pr-14" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: 'rgba(229,226,227,0.6)', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{card.subtitle}</p>
        )}

        {/* Hashtags — Stitch style */}
        <div className="flex flex-wrap gap-2 mt-2">
          {card.dimension && (
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700, color: '#E8D5A0' }}>#{card.dimension.replace(/\s+/g, '')}</span>
          )}
          {meta.genre && (
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700, color: '#E8D5A0' }}>#{meta.genre}</span>
          )}
          {meta.origin && (
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700, color: '#E8D5A0' }}>#{meta.origin}</span>
          )}
        </div>

        {/* Event CTA */}
        {isEvent && (
          <button className="w-full mt-4 py-3 rounded-xl font-bold transition-all hover:scale-[1.01] active:scale-[0.98]"
            style={{ background: '#E8D5A0', color: '#0a0a0b', fontFamily: "'Manrope', sans-serif", fontSize: 14 }}
            data-testid={`event-join-${card.id}`}>
            Je participe
          </button>
        )}
      </div>

      {/* Soutenir Sheet */}
      {showSoutenir && (
        <SoutenirSheet
          targetName={card.created_by_name || card.title}
          targetId={card.created_by || card.id}
          userId={userId}
          onClose={() => setShowSoutenir(false)}
        />
      )}
    </article>
  );
};

export default CulturalCard;
export { CARD_TYPE_LABELS, DIMENSION_COLORS };
