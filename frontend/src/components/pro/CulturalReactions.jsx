import React, { useState, useRef, useCallback } from 'react';

const REACTION_CONFIG = [
  { type: 'feu', emoji: '\u{1F525}', label: 'Feu' },
  { type: 'rythme', emoji: '\u{1F941}', label: 'Rythme' },
  { type: 'racines', emoji: '\u{1F33A}', label: 'Racines' },
  { type: 'resistance', emoji: '\u270A', label: 'Résistance' },
  { type: 'lumiere', emoji: '\u{1F4AB}', label: 'Lumière' },
];

const BurstParticle = ({ emoji, style }) => (
  <span
    className="absolute pointer-events-none select-none"
    style={{
      fontSize: 18,
      ...style,
      animation: 'burstOut 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
    }}
  >
    {emoji}
  </span>
);

const CulturalReactions = ({ cardId, reactions = {}, userId, onReact }) => {
  const [bursts, setBursts] = useState([]);
  const [optimistic, setOptimistic] = useState({});
  const [animating, setAnimating] = useState({});
  const containerRef = useRef(null);

  const handleReact = useCallback(async (type, emoji, e) => {
    // Burst animation
    const rect = e.currentTarget.getBoundingClientRect();
    const burstId = Date.now() + Math.random();
    const particles = Array.from({ length: 6 }).map((_, i) => ({
      id: `${burstId}-${i}`,
      emoji,
      style: {
        left: rect.width / 2 - 9,
        top: -10,
        '--angle': `${(i * 60) - 150}deg`,
        '--dist': `${28 + Math.random() * 18}px`,
      },
    }));
    setBursts(prev => [...prev, ...particles]);
    setTimeout(() => setBursts(prev => prev.filter(p => !p.id.startsWith(String(burstId)))), 800);

    // Scale animation
    setAnimating(prev => ({ ...prev, [type]: true }));
    setTimeout(() => setAnimating(prev => ({ ...prev, [type]: false })), 400);

    // Optimistic update
    const current = (reactions[type] || 0) + (optimistic[type] || 0);
    setOptimistic(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));

    if (onReact) {
      try {
        const result = await onReact(cardId, type);
        // Reset optimistic after server response
        setOptimistic(prev => {
          const next = { ...prev };
          delete next[type];
          return next;
        });
      } catch {
        setOptimistic(prev => {
          const next = { ...prev };
          delete next[type];
          return next;
        });
      }
    }
  }, [cardId, reactions, optimistic, userId, onReact]);

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-1"
      data-testid={`cultural-reactions-${cardId}`}
    >
      {REACTION_CONFIG.map(({ type, emoji, label }) => {
        const count = (reactions[type] || 0) + (optimistic[type] || 0);
        const isAnimating = animating[type];

        return (
          <button
            key={type}
            onClick={(e) => handleReact(type, emoji, e)}
            className="relative flex items-center gap-1 px-2 py-1.5 rounded-full transition-all"
            style={{
              background: count > 0 ? 'rgba(200,168,75,0.1)' : 'transparent',
              border: `1px solid ${count > 0 ? 'rgba(200,168,75,0.3)' : '#222'}`,
              transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, border-color 0.2s',
              minHeight: 36,
              minWidth: 36,
            }}
            aria-label={`Réaction ${label}`}
            data-testid={`reaction-${type}-${cardId}`}
          >
            <span
              className="text-base select-none"
              style={{
                transform: isAnimating ? 'scale(1.4)' : 'scale(1)',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {emoji}
            </span>
            {count > 0 && (
              <span
                className="text-xs font-bold tabular-nums"
                style={{
                  color: '#C8A84B',
                  opacity: isAnimating ? 1 : 0.9,
                  transition: 'opacity 0.2s',
                }}
              >
                {count}
              </span>
            )}

            {/* Burst particles */}
            {bursts.filter(b => b.emoji === emoji).map(p => (
              <BurstParticle key={p.id} emoji={p.emoji} style={p.style} />
            ))}
          </button>
        );
      })}

      <style>{`
        @keyframes burstOut {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(
              calc(cos(var(--angle)) * var(--dist)),
              calc(sin(var(--angle)) * var(--dist))
            ) scale(0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default CulturalReactions;
