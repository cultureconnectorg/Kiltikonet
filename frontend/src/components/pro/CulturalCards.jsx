import React from 'react';
import { Music, User, MapPin, Calendar, Landmark } from 'lucide-react';
import CulturalReactions from './CulturalReactions';

const CARD_ICONS = {
  musique: Music,
  artiste: User,
  lieu: MapPin,
  evenement: Calendar,
  patrimoine: Landmark,
};

const CARD_TYPE_LABELS = {
  musique: 'Musique',
  artiste: 'Artiste',
  lieu: 'Lieu',
  evenement: 'Événement',
  patrimoine: 'Patrimoine',
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

// Skeleton card for loading state
export const CardSkeleton = () => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{ background: '#141414', border: '1px solid #1a1a1a' }}
    data-testid="card-skeleton"
  >
    {/* Image skeleton */}
    <div
      className="w-full aspect-[16/10] relative"
      style={{ background: '#1a1a1a' }}
    >
      <div className="absolute inset-0" style={{ animation: 'skeletonPulse 1.8s ease-in-out infinite' }} />
    </div>
    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full" style={{ background: '#222', animation: 'skeletonPulse 1.8s ease-in-out infinite 0.1s' }} />
        <div className="h-3 rounded-full w-16" style={{ background: '#222', animation: 'skeletonPulse 1.8s ease-in-out infinite 0.15s' }} />
      </div>
      <div className="h-5 rounded-lg w-3/4" style={{ background: '#1c1c1c', animation: 'skeletonPulse 1.8s ease-in-out infinite 0.2s' }} />
      <div className="h-3 rounded-full w-1/2" style={{ background: '#1a1a1a', animation: 'skeletonPulse 1.8s ease-in-out infinite 0.3s' }} />
      <div className="space-y-1.5">
        <div className="h-3 rounded-full w-full" style={{ background: '#181818', animation: 'skeletonPulse 1.8s ease-in-out infinite 0.4s' }} />
        <div className="h-3 rounded-full w-5/6" style={{ background: '#181818', animation: 'skeletonPulse 1.8s ease-in-out infinite 0.5s' }} />
      </div>
    </div>
    <style>{`
      @keyframes skeletonPulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.8; }
      }
    `}</style>
  </div>
);

const CulturalCard = ({ card, userId, onReact, index = 0 }) => {
  const Icon = CARD_ICONS[card.card_type] || Landmark;
  const typeLabel = CARD_TYPE_LABELS[card.card_type] || card.card_type;
  const dimColor = DIMENSION_COLORS[card.dimension] || '#C8A84B';
  const meta = card.meta || {};

  return (
    <article
      className="rounded-2xl overflow-hidden group cultural-card"
      style={{
        background: '#141414',
        border: '1px solid #1a1a1a',
        animationDelay: `${index * 60}ms`,
      }}
      data-testid={`cultural-card-${card.id}`}
    >
      {/* Image area */}
      <div
        className="w-full aspect-[16/10] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${dimColor}25, #0a0a0a 60%, ${dimColor}10)`,
        }}
      >
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon
              size={48}
              style={{ color: dimColor, opacity: 0.3 }}
            />
          </div>
        )}

        {/* Type badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(10,10,10,0.75)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${dimColor}40`,
          }}
        >
          <Icon size={12} style={{ color: dimColor }} />
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: dimColor }}>
            {typeLabel}
          </span>
        </div>

        {/* Duration if music */}
        {card.duration && (
          <div
            className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-xs font-mono font-medium"
            style={{ background: 'rgba(10,10,10,0.8)', color: '#fff' }}
          >
            {card.duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Dimension tag */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: dimColor }} />
          <span className="text-[11px] font-medium" style={{ color: dimColor }}>
            {card.dimension}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-base font-bold leading-snug"
          style={{ color: '#fff', fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        >
          {card.title}
        </h3>

        {/* Subtitle */}
        {card.subtitle && (
          <p className="text-sm mt-0.5" style={{ color: '#888' }}>
            {card.subtitle}
          </p>
        )}

        {/* Description */}
        {card.description && (
          <p
            className="text-sm mt-2 leading-relaxed line-clamp-3"
            style={{ color: '#666' }}
          >
            {card.description}
          </p>
        )}

        {/* Meta info */}
        {Object.keys(meta).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {meta.genre && (
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#1a1a1a', color: '#888' }}>
                {meta.genre}
              </span>
            )}
            {meta.origin && (
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#1a1a1a', color: '#888' }}>
                {meta.origin}
              </span>
            )}
            {meta.year && (
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#1a1a1a', color: '#888' }}>
                {meta.year}
              </span>
            )}
            {meta.commune && (
              <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#1a1a1a', color: '#888' }}>
                <MapPin size={10} /> {meta.commune}
              </span>
            )}
            {meta.date && (
              <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#1a1a1a', color: '#888' }}>
                <Calendar size={10} /> {new Date(meta.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        )}

        {/* Reactions */}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #1a1a1a' }}>
          <CulturalReactions
            cardId={card.id}
            reactions={card.reactions || {}}
            userId={userId}
            onReact={onReact}
          />
        </div>
      </div>

      <style>{`
        .cultural-card {
          animation: cardFadeIn 0.5s ease-out both;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        .cultural-card:hover {
          border-color: rgba(200, 168, 75, 0.3) !important;
          box-shadow: 0 4px 24px rgba(200, 168, 75, 0.08);
          transform: translateY(-2px);
        }
        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </article>
  );
};

export default CulturalCard;
export { CARD_TYPE_LABELS, DIMENSION_COLORS };
