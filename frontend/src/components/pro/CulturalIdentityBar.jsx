import React, { useState, useEffect, useRef } from 'react';

const LEVELS = [
  { name: 'Initié', min: 0, max: 20 },
  { name: 'Ancré', min: 21, max: 40 },
  { name: 'Enraciné', min: 41, max: 60 },
  { name: 'Transmetteur', min: 61, max: 80 },
  { name: 'Pilier', min: 81, max: 100 },
];

const getLevel = (score) => {
  for (const l of LEVELS) {
    if (score >= l.min && score <= l.max) return l;
  }
  return LEVELS[0];
};

const CulturalIdentityBar = ({ score = 0, levelName = '' }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const target = Math.min(100, Math.max(0, score));
    const duration = 1200;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedScore(Math.round(ease(progress) * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score, visible]);

  const level = getLevel(animatedScore);
  const displayLevel = levelName || level.name;
  const pct = animatedScore;

  return (
    <div ref={ref} className="w-full" data-testid="cultural-identity-bar">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: '#C8A84B', letterSpacing: '0.15em' }}
        >
          {displayLevel}
        </span>
        <span
          className="text-2xl font-black tabular-nums"
          style={{ color: '#fff', fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        >
          {animatedScore}
          <span className="text-xs font-medium ml-0.5" style={{ color: '#888' }}>/100</span>
        </span>
      </div>

      {/* Track */}
      <div
        className="relative w-full h-2 rounded-full overflow-hidden"
        style={{ background: '#1a1a1a' }}
      >
        {/* Glow behind bar */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(200,168,75,0.15) ${pct}%, transparent ${pct + 1}%)`,
          }}
        />
        {/* Animated fill */}
        <div
          className="h-full rounded-full relative"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #8B6914, #C8A84B, #E8D48B)',
            transition: visible ? 'none' : 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: '0 0 12px rgba(200,168,75,0.4)',
          }}
        >
          {/* Shimmer */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              animation: 'shimmer 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Level markers */}
      <div className="flex justify-between mt-1.5">
        {LEVELS.map((l, i) => (
          <span
            key={l.name}
            className="text-[10px]"
            style={{
              color: animatedScore >= l.min ? '#C8A84B' : '#444',
              fontWeight: level.name === l.name ? 700 : 400,
            }}
          >
            {l.name}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default CulturalIdentityBar;
