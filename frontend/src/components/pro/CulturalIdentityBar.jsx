import React, { useState, useEffect, useRef } from 'react';

const LEVELS = [
  { name: 'Initié', min: 0, max: 20, desc: 'Vous découvrez la culture caribéenne' },
  { name: 'Ancré', min: 21, max: 40, desc: 'Vos racines culturelles grandissent' },
  { name: 'Enraciné', min: 41, max: 60, desc: 'Votre identité culturelle est solide' },
  { name: 'Transmetteur', min: 61, max: 80, desc: 'Vous partagez et transmettez' },
  { name: 'Pilier', min: 81, max: 100, desc: 'Vous êtes un pilier de la communauté' },
];

const getLevel = (score) => {
  for (const l of LEVELS) if (score >= l.min && score <= l.max) return l;
  return LEVELS[0];
};

const CulturalIdentityBar = ({ score = 0, levelName = '', cardsPublished = 0 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const ref = useRef(null);
  const hidden = cardsPublished === 0 && score === 0;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || hidden) return;
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
  }, [score, visible, hidden]);

  const level = getLevel(hidden ? 0 : animatedScore);
  const displayLevel = levelName || level.name;
  const pct = hidden ? 0 : animatedScore;

  return (
    <div ref={ref} className="w-full" data-testid="cultural-identity-bar">
      {/* Score display */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase" style={{ color: '#C8A84B', letterSpacing: '0.12em', fontFamily: "'Inter', sans-serif" }}>
          {hidden ? 'Identité culturelle' : displayLevel}
        </span>
        <span className="text-xl font-bold tabular-nums" style={{ color: '#fff', fontFamily: "'Inter', sans-serif" }}>
          {hidden ? '--' : animatedScore}
          <span className="text-[10px] font-normal ml-0.5" style={{ color: '#444' }}>/100</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
        <div className="h-full rounded-full" style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #8B6914, #C8A84B, #E8C86B)',
          boxShadow: pct > 0 ? '0 0 8px rgba(200,168,75,0.3)' : 'none',
          transition: 'none',
        }}>
          {pct > 0 && <div className="absolute inset-0 rounded-full kn-shimmer" />}
        </div>
      </div>

      {/* Level dots connected by line */}
      <div className="relative mt-4 px-1">
        {/* Connecting line */}
        <div className="absolute top-[5px] left-3 right-3 h-px" style={{ background: '#1e1e1e' }} />
        <div className="absolute top-[5px] left-3 h-px" style={{
          background: '#C8A84B',
          width: `${Math.min(100, (pct / 100) * 100)}%`,
          maxWidth: 'calc(100% - 24px)',
          transition: 'width 0.8s ease-out',
        }} />

        {/* Dots */}
        <div className="flex justify-between relative">
          {LEVELS.map((l, i) => {
            const isActive = level.name === l.name;
            const isPast = pct >= l.min;
            return (
              <div key={l.name} className="flex flex-col items-center relative"
                onMouseEnter={() => setTooltip(i)} onMouseLeave={() => setTooltip(null)}>
                <div className="w-[10px] h-[10px] rounded-full border-2 transition-all cursor-pointer" style={{
                  background: isPast ? '#C8A84B' : '#0a0a0a',
                  borderColor: isPast ? '#C8A84B' : '#333',
                  boxShadow: isActive ? '0 0 8px rgba(200,168,75,0.4)' : 'none',
                }} />
                <span className="text-[9px] mt-1.5 whitespace-nowrap" style={{
                  color: isActive ? '#C8A84B' : isPast ? '#888' : '#333',
                  fontWeight: isActive ? 700 : 400,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {l.name}
                </span>

                {/* Tooltip */}
                {tooltip === i && (
                  <div className="absolute bottom-full mb-2 px-3 py-1.5 rounded-lg text-[10px] whitespace-nowrap z-10"
                    style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a', fontFamily: "'Inter', sans-serif" }}>
                    {l.desc}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0" style={{
                      borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #1a1a1a',
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CulturalIdentityBar;
