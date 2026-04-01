import React, { useState } from 'react';
import { Music, User, MapPin, Calendar, Landmark, Play, MessageCircle, Repeat2, Zap } from 'lucide-react';
import CulturalReactions from './CulturalReactions';
import SoutenirSheet from './SoutenirSheet';

const CARD_ICONS = {
  musique: Music, artiste: User, lieu: MapPin,
  evenement: Calendar, patrimoine: Landmark,
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
  <div className="rounded-3xl overflow-hidden" style={{ height: 'calc(100vh - 180px)', background: '#141414' }} data-testid="card-skeleton">
    <div className="absolute inset-0 kn-skeleton-shimmer" />
  </div>
);

const CulturalCard = ({ card, userId, onReact, index = 0, isActive = false }) => {
  const Icon = CARD_ICONS[card.card_type] || Landmark;
  const typeLabel = CARD_TYPE_LABELS[card.card_type] || card.card_type;
  const dimColor = DIMENSION_COLORS[card.dimension] || '#E8D5A0';
  const meta = card.meta || {};
  const isEvent = card.card_type === 'evenement';
  const isMusic = card.card_type === 'musique';
  const [showSoutenir, setShowSoutenir] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
    return diff > 0 ? diff : null;
  };
  const eventDays = isEvent ? daysUntil(meta.date) : null;
  const totalReactions = card.total_reactions || Object.values(card.reactions || {}).reduce((a, b) => a + b, 0);

  return (
    <article
      className="relative rounded-3xl overflow-hidden flex flex-col"
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
            <Icon size={120} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: dimColor, opacity: 0.06 }} />
          </div>
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.6) 35%, rgba(10,10,11,0.15) 55%, transparent 100%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to right, rgba(10,10,11,0.3) 0%, transparent 30%, transparent 70%, rgba(10,10,11,0.4) 100%)',
        }} />
      </div>

      {/* Type badge - top left */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
        <Icon size={12} style={{ color: '#E8D5A0' }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#E8D5A0', fontFamily: "'DM Sans', sans-serif" }}>
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
          <span className="text-sm font-black tabular-nums" style={{ color: '#E8D5A0', fontFamily: "'DM Sans', sans-serif" }}>
            J-{eventDays}
          </span>
        </div>
      )}

      {/* Music play button center */}
      {isMusic && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center z-10 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Play size={28} style={{ color: '#fff', marginLeft: 3 }} />
        </div>
      )}

      {/* ─── VERTICAL ACTIONS BAR — RIGHT SIDE ─── */}
      <div className="absolute right-3 bottom-44 z-10 flex flex-col items-center gap-5" data-testid={`card-actions-${card.id}`}>
        {/* Cultural Reactions (vertical) */}
        <CulturalReactions cardId={card.id} reactions={card.reactions || {}} userId={userId} onReact={onReact} vertical />

        {/* Comment */}
        <button onClick={() => setShowComments(!showComments)}
          className="flex flex-col items-center gap-0.5 transition-transform active:scale-90"
          data-testid={`comment-btn-${card.id}`}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
            <MessageCircle size={20} style={{ color: '#fff' }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: '#72727a' }}>{card.comments_count || 0}</span>
        </button>

        {/* Share / Repost */}
        <button className="flex flex-col items-center gap-0.5 transition-transform active:scale-90" data-testid={`share-btn-${card.id}`}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
            <Repeat2 size={20} style={{ color: '#fff' }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: '#72727a' }}>Partager</span>
        </button>

        {/* Soutenir JCC */}
        <button onClick={() => setShowSoutenir(true)}
          className="flex flex-col items-center gap-0.5 transition-transform active:scale-90"
          data-testid={`soutenir-btn-${card.id}`}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,213,160,0.15)', border: '1px solid rgba(232,213,160,0.3)' }}>
            <Zap size={20} style={{ color: '#E8D5A0' }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: '#E8D5A0' }}>JCC</span>
        </button>
      </div>

      {/* ─── BOTTOM CONTENT — Text + Artist Bar ─── */}
      <div className="relative mt-auto z-10 px-4 pb-4">
        {/* Dimension tag */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: dimColor }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dimColor }}>{card.dimension}</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-black leading-tight pr-16" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>
          {card.title}
        </h3>

        {/* Subtitle */}
        {card.subtitle && (
          <p className="text-sm mt-1 pr-16" style={{ color: 'rgba(255,255,255,0.6)' }}>{card.subtitle}</p>
        )}

        {/* Description - truncated */}
        {card.description && (
          <p className="text-[13px] mt-2 line-clamp-2 pr-16" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{card.description}</p>
        )}

        {/* Meta tags */}
        {(meta.genre || meta.origin) && (
          <div className="flex items-center gap-2 mt-2">
            {meta.genre && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>{meta.genre}</span>}
            {meta.origin && <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}><MapPin size={8} />{meta.origin}</span>}
          </div>
        )}

        {/* ─── SUPPORT BAR — Artist info at bottom ─── */}
        <div className="flex items-center gap-3 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} data-testid={`support-bar-${card.id}`}>
          {/* Artist avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(232,213,160,0.2), rgba(196,113,74,0.15))', border: '1px solid rgba(232,213,160,0.2)' }}>
            <Icon size={16} style={{ color: '#E8D5A0' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: '#fff' }}>{card.created_by_name || 'Communaute CC2026'}</p>
            <p className="text-[10px] truncate" style={{ color: '#72727a' }}>
              {isMusic ? 'Artiste' : isEvent ? 'Organisateur' : 'Contributeur'} {meta.origin ? `· ${meta.origin}` : ''}
            </p>
          </div>
          {/* Support button */}
          <button onClick={() => setShowSoutenir(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: 'rgba(232,213,160,0.12)', color: '#E8D5A0', border: '1px solid rgba(232,213,160,0.25)' }}
            data-testid={`support-artist-btn-${card.id}`}>
            <Zap size={12} /> Soutenir
          </button>
        </div>

        {/* Event CTA */}
        {isEvent && (
          <button className="w-full mt-3 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.98]"
            style={{ background: '#E8D5A0', color: '#0a0a0b', fontFamily: "'DM Sans', sans-serif" }}
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
