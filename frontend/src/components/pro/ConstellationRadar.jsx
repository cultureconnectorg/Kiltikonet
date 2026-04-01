import React, { useState, useEffect, useRef } from 'react';

const DIMENSIONS = [
  'Musique',
  'Arts Visuels & Scéniques',
  'Langue Créole',
  'Patrimoine & Traditions',
  'Gastronomie',
  'Féminité & Matriarcat',
  'Identité Diasporique',
];

const SHORT_LABELS = [
  'Musique',
  'Arts',
  'Créole',
  'Patrimoine',
  'Gastro',
  'Féminité',
  'Diaspora',
];

const ConstellationRadar = ({ dimensions = {}, compact = false }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const size = compact ? 200 : 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) - (compact ? 30 : 40);
  const rings = 5;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const duration = 1400;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const animate = (now) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(ease(p));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [visible]);

  const values = DIMENSIONS.map(d => Math.min(100, Math.max(0, dimensions[d] || 0)));
  const angleStep = (2 * Math.PI) / 7;
  const startAngle = -Math.PI / 2;

  const getPoint = (index, value) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * radius * progress;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const getAxisEnd = (index) => {
    const angle = startAngle + index * angleStep;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const getLabelPos = (index) => {
    const angle = startAngle + index * angleStep;
    const r = radius + (compact ? 18 : 26);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const dataPoints = values.map((v, i) => getPoint(i, v));
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  const labels = compact ? SHORT_LABELS : DIMENSIONS;

  return (
    <div ref={ref} className="flex justify-center" data-testid="constellation-radar">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(200,168,75,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="gold-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background glow */}
        <circle cx={cx} cy={cy} r={radius} fill="url(#radar-glow)" />

        {/* Concentric rings */}
        {Array.from({ length: rings }).map((_, i) => {
          const r = (radius / rings) * (i + 1);
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={i === rings - 1 ? '#333' : '#1f1f1f'}
              strokeWidth={i === rings - 1 ? 1 : 0.5}
            />
          );
        })}

        {/* Axis lines */}
        {DIMENSIONS.map((_, i) => {
          const end = getAxisEnd(i);
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={end.x} y2={end.y}
              stroke="#222"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Data polygon fill */}
        {progress > 0 && (
          <polygon
            points={polygon}
            fill="rgba(200,168,75,0.12)"
            stroke="#C8A84B"
            strokeWidth="1.5"
            filter="url(#gold-glow)"
            style={{ transition: 'all 0.1s ease-out' }}
          />
        )}

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r={compact ? 3 : 4}
            fill="#C8A84B"
            stroke="#0a0a0a"
            strokeWidth="2"
          />
        ))}

        {/* Labels */}
        {labels.map((label, i) => {
          const pos = getLabelPos(i);
          return (
            <text
              key={i}
              x={pos.x} y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={values[i] > 0 ? '#C8A84B' : '#555'}
              fontSize={compact ? 8 : 10}
              fontWeight={values[i] > 0 ? 600 : 400}
              fontFamily="'DM Sans', 'Inter', sans-serif"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default ConstellationRadar;
