import React from 'react';
import { Music, User, MapPin, Calendar, Landmark, Play, Pause } from 'lucide-react';
import CulturalReactions from './CulturalReactions';

const CARD_ICONS = {
  musique: Music,
  artiste: User,
  lieu: MapPin,
  evenement: Calendar,
  patrimoine: Landmark,
};

const CARD_TYPE_LABELS = {
  musique: 'MUSIQUE',
  artiste: 'ARTISTE',
  lieu: 'LIEU',
  evenement: 'ÉVÉNEMENT',
  patrimoine: 'PATRIMOINE',
};

const DIMENSION_COLORS = {
  'Musique': '#C8A84B',
  'Arts Visuels & Scéniques': '#C4714A',
  'Langue Créole': '#2DD4BF',
  'Patrimoine & Traditions': '#4A5D4E',
  'Gastronomie': '#E8C547',
  'Féminité & Matriarcat': '#8B5CF6',
  'Identité Diasporique': '#5B9BD5',
};

export const CardSkeleton = () => (
  <div className="kn-card rounded-2xl overflow-hidden" data-testid="card-skeleton">
    <div className="w-full relative" style={{ height: 280, background: '#141414' }}>
      <div className="absolute inset-0 kn-skeleton-shimmer" />
    </div>
    <div className="p-4 space-y-3" style={{ background: '#111' }}>
      <div className="h-4 rounded-lg w-3/4 kn-skeleton-shimmer" />
      <div className="h-3 rounded-full w-1/2 kn-skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
      <div className="flex gap-2 mt-2">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="w-9 h-9 rounded-full kn-skeleton-shimmer" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  </div>
);

const CulturalCard = ({ card, userId, onReact, index = 0 }) => {
  const Icon = CARD_ICONS[card.card_type] || Landmark;
  const typeLabel = CARD_TYPE_LABELS[card.card_type] || card.card_type;
  const dimColor = DIMENSION_COLORS[card.dimension] || '#C8A84B';
  const meta = card.meta || {};
  const isEvent = card.card_type === 'evenement';
  const isMusic = card.card_type === 'musique';

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
    return diff > 0 ? diff : null;
  };

  const eventDays = isEvent ? daysUntil(meta.date) : null;

  return (
    <article
      className="kn-card rounded-2xl overflow-hidden group"
      style={{ animationDelay: `${index * 50}ms` }}
      data-testid={`cultural-card-${card.id}`}
    >
      {/* Full media area — TikTok style */}
      <div className="w-full relative overflow-hidden" style={{ height: isEvent ? 320 : 280 }}>
        {/* Background */}
        {card.image_url ? (
          <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0" style={{
            background: `linear-gradient(145deg, ${dimColor}20, #0a0a0a 40%, ${dimColor}08 80%, #0a0a0a)`,
          }}>
            <Icon size={64} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: dimColor, opacity: 0.12 }} />
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)',
        }} />

        {/* Type badge — top left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md"
          style={{ background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 6 }}>
          <Icon size={11} style={{ color: '#C8A84B' }} />
          <span className="text-[10px] font-semibold uppercase" style={{ color: '#C8A84B', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
            {typeLabel}
          </span>
        </div>

        {/* Duration — music only */}
        {isMusic && card.duration && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium"
            style={{ background: 'rgba(10,10,10,0.7)', color: '#fff', backdropFilter: 'blur(8px)' }}>
            {card.duration}
          </div>
        )}

        {/* Event countdown */}
        {isEvent && eventDays && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg kn-countdown-pulse"
            style={{ background: 'rgba(200,168,75,0.2)', border: '1px solid rgba(200,168,75,0.4)' }}>
            <span className="text-sm font-black tabular-nums" style={{ color: '#C8A84B', fontFamily: "'Inter', sans-serif" }}>
              J-{eventDays}
            </span>
          </div>
        )}

        {/* Music play button overlay */}
        {isMusic && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            <Play size={24} style={{ color: '#fff', marginLeft: 2 }} />
          </div>
        )}

        {/* Text overlay — bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Dimension dot */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: dimColor }} />
            <span className="text-[10px] font-semibold uppercase" style={{ color: dimColor, letterSpacing: '0.06em' }}>{card.dimension}</span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold leading-tight" style={{ color: '#fff', fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' }}>
            {card.title}
          </h3>

          {/* Subtitle */}
          {card.subtitle && (
            <p className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{card.subtitle}</p>
          )}

          {/* Meta tags — inline */}
          {(meta.genre || meta.origin) && (
            <div className="flex items-center gap-2 mt-2">
              {meta.genre && <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{meta.genre}</span>}
              {meta.origin && <span className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}><MapPin size={8} />{meta.origin}</span>}
              {meta.year && <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{meta.year}</span>}
            </div>
          )}

          {/* Event "Je participe" button */}
          {isEvent && (
            <button className="mt-3 px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.97]"
              style={{ background: '#C8A84B', color: '#000', fontFamily: "'Inter', sans-serif" }}
              data-testid={`event-join-${card.id}`}>
              Je participe
            </button>
          )}
        </div>

        {/* Reactions overlay — bottom right */}
        <div className="absolute bottom-4 right-4">
          <CulturalReactions cardId={card.id} reactions={card.reactions || {}} userId={userId} onReact={onReact} vertical />
        </div>
      </div>

      {/* Description — below image for non-event cards */}
      {!isEvent && card.description && (
        <div className="px-4 py-3" style={{ background: '#111', borderTop: '1px solid #1a1a1a' }}>
          <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: '#888', lineHeight: 1.6 }}>{card.description}</p>
        </div>
      )}
    </article>
  );
};

export default CulturalCard;
export { CARD_TYPE_LABELS, DIMENSION_COLORS };
