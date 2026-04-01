import React, { useState, useCallback } from 'react';

const REACTION_CONFIG = [
  { type: 'feu', emoji: '\u{1F525}', label: 'Feu', color: '#ff6b35' },
  { type: 'rythme', emoji: '\u{1F941}', label: 'Rythme', color: '#8b4513' },
  { type: 'racines', emoji: '\u{1F33A}', label: 'Racines', color: '#ff69b4' },
  { type: 'resistance', emoji: '\u270A', label: 'Résistance', color: '#E8D5A0' },
  { type: 'lumiere', emoji: '\u{1F4AB}', label: 'Lumière', color: '#ffffff' },
];

const CulturalReactions = ({ cardId, reactions = {}, userId, onReact, vertical = false }) => {
  const [optimistic, setOptimistic] = useState({});
  const [animating, setAnimating] = useState({});
  const [particles, setParticles] = useState([]);

  const spawnParticles = (type, color, rect) => {
    const id = Date.now();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: `${id}-${i}`,
      type,
      x: cx,
      y: cy,
      angle: (i * 45) + (Math.random() * 20 - 10),
      dist: 20 + Math.random() * 16,
      color,
      size: 3 + Math.random() * 3,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !p.id.startsWith(String(id)))), 500);
  };

  const handleReact = useCallback(async (type, color, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    spawnParticles(type, color, { width: 36, height: 36 });

    setAnimating(prev => ({ ...prev, [type]: true }));
    setTimeout(() => setAnimating(prev => ({ ...prev, [type]: false })), 300);

    setOptimistic(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));

    if (onReact) {
      try {
        await onReact(cardId, type);
        setOptimistic(prev => { const n = { ...prev }; delete n[type]; return n; });
      } catch {
        setOptimistic(prev => { const n = { ...prev }; delete n[type]; return n; });
      }
    }
  }, [cardId, onReact]);

  return (
    <div
      className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center gap-1`}
      data-testid={`cultural-reactions-${cardId}`}
    >
      {REACTION_CONFIG.map(({ type, emoji, label, color }) => {
        const count = (reactions[type] || 0) + (optimistic[type] || 0);
        const isAnimating = animating[type];

        return (
          <button
            key={type}
            onClick={(e) => handleReact(type, color, e)}
            className="relative flex items-center justify-center rounded-full transition-all"
            style={{
              width: vertical ? 40 : 'auto',
              height: vertical ? 40 : 'auto',
              padding: vertical ? 0 : '6px 10px',
              background: count > 0 ? 'rgba(232,213,160,0.12)' : (vertical ? 'rgba(0,0,0,0.4)' : 'transparent'),
              border: vertical ? 'none' : `1px solid ${count > 0 ? 'rgba(232,213,160,0.25)' : '#1e1e1e'}`,
              backdropFilter: vertical ? 'blur(8px)' : 'none',
              transform: isAnimating ? 'scale(1.25)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s',
              minHeight: 36,
              minWidth: 36,
            }}
            aria-label={`Réaction ${label}`}
            data-testid={`reaction-${type}-${cardId}`}
          >
            <span className="select-none" style={{
              fontSize: vertical ? 18 : 16,
              transform: isAnimating ? 'scale(1.4)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              display: 'block',
            }}>
              {emoji}
            </span>

            {count > 0 && !vertical && (
              <span className="text-[11px] font-bold tabular-nums ml-1" style={{ color: '#E8D5A0' }}>{count}</span>
            )}

            {count > 0 && vertical && (
              <span className="absolute -bottom-0.5 text-[9px] font-bold tabular-nums" style={{ color: '#E8D5A0' }}>{count}</span>
            )}

            {/* Colored burst particles */}
            {particles.filter(p => p.type === type).map(p => (
              <span key={p.id} className="absolute pointer-events-none kn-burst-particle" style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: p.color,
                '--burst-angle': `${p.angle}deg`,
                '--burst-dist': `${p.dist}px`,
              }} />
            ))}
          </button>
        );
      })}
    </div>
  );
};

export default CulturalReactions;
