import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useIntersectionObserver, useCountUp } from '../hooks/useAnimations';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || '';

// Size mapping from string to pixel values
const SIZE_MAP = {
  primary: 14,
  large: 9,
  medium: 8,
  small: 7,
};

// Helper to get numeric size
const getSize = (size) => {
  if (typeof size === 'number') return size;
  return SIZE_MAP[size] || 8;
};

// Default territories with fixed SVG positions - adjusted to match continent shapes
const DEFAULT_TERRITORIES = [
  { id: 'martinique', name: 'Fort-de-France', x: 280, y: 195, color: '#A65D47', size: 14, label: 'Martinique', isCenter: true, active: true },
  { id: 'paris', name: 'Paris', x: 485, y: 95, color: '#C8922A', size: 9, label: 'Paris — Diaspora', active: true },
  { id: 'colombia', name: 'Bogotá', x: 260, y: 245, color: '#C8922A', size: 8, label: 'Colombie', active: true },
  { id: 'haiti', name: 'Port-au-Prince', x: 270, y: 185, color: '#A65D47', size: 8, label: 'Haïti', active: true },
  { id: 'senegal', name: 'Dakar', x: 430, y: 190, color: '#C8922A', size: 8, label: 'Sénégal', active: true },
  { id: 'nigeria', name: 'Lagos', x: 480, y: 225, color: '#C8922A', size: 7, label: 'Nigeria', active: true },
  { id: 'guadeloupe', name: 'Guadeloupe', x: 285, y: 180, color: '#A65D47', size: 7, label: 'Guadeloupe', active: true },
  { id: 'london', name: 'Londres', x: 465, y: 80, color: '#FFFFFF', size: 7, label: 'UK', active: true },
  { id: 'newyork', name: 'New York', x: 225, y: 125, color: '#FFFFFF', size: 7, label: 'USA', active: true },
  { id: 'brazil', name: 'Brasília', x: 320, y: 295, color: '#C8922A', size: 7, label: 'Brésil', active: true },
];

// Simplified world map - just outlines for visual effect
const WorldMapSVG = () => (
  <g className="world-outline" fill="#2A2A2A" stroke="#A65D4720" strokeWidth="0.8">
    {/* North America */}
    <path d="M 80,60 Q 150,40 200,70 L 250,90 Q 280,100 290,130 L 280,160 Q 260,180 230,180 L 180,170 Q 140,160 100,140 L 70,110 Q 60,80 80,60 Z" />
    {/* South America */}
    <path d="M 220,200 Q 260,190 290,210 L 340,250 Q 360,300 340,350 L 300,380 Q 260,390 240,370 L 220,320 Q 200,270 210,230 Z" />
    {/* Europe */}
    <path d="M 440,55 Q 490,45 530,60 L 570,80 Q 590,100 580,120 L 550,130 Q 510,140 470,130 L 450,110 Q 430,80 440,55 Z" />
    {/* Africa */}
    <path d="M 430,140 Q 480,130 520,150 L 550,180 Q 560,220 550,270 L 530,310 Q 500,340 460,340 L 430,320 Q 400,280 410,230 L 420,180 Q 420,160 430,140 Z" />
    {/* Australia hint */}
    <ellipse cx="720" cy="300" rx="50" ry="35" />
  </g>
);

export const Planisphere = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.15 });
  const [territories, setTerritories] = useState(DEFAULT_TERRITORIES);
  const [lines, setLines] = useState([]);
  const [hoveredTerritory, setHoveredTerritory] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const animationCycleRef = useRef(null);
  
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load territories from CMS (if available)
  useEffect(() => {
    const loadTerritories = async () => {
      try {
        const res = await axios.get(`${API}/api/cms/map-territories`);
        if (res.data?.territories?.length > 0) {
          // Check if data has x/y coordinates (SVG format)
          const firstTerritory = res.data.territories[0];
          if (typeof firstTerritory.x === 'number' && typeof firstTerritory.y === 'number') {
            // Data is in SVG format, use it
            const converted = res.data.territories.map(t => ({
              ...t,
              size: getSize(t.size),
              active: t.active !== false
            }));
            setTerritories(converted);
          }
          // Otherwise keep the default territories with x/y positions
        }
      } catch (err) {
        // Keep defaults
      }
    };
    loadTerritories();
  }, []);

  // Filter for mobile
  const visibleTerritories = useMemo(() => {
    const active = territories.filter(t => t.active !== false);
    if (isMobile) {
      const mobileIds = ['martinique', 'paris', 'haiti', 'senegal', 'colombia'];
      return active.filter(t => mobileIds.includes(t.id) || t.isCenter);
    }
    return active;
  }, [territories, isMobile]);

  const center = visibleTerritories.find(t => t.isCenter);
  const activeCount = territories.filter(t => t.active !== false).length;

  // Animate lines when visible
  useEffect(() => {
    if (!isVisible || !center) return;

    if (prefersReducedMotion) {
      setLines(visibleTerritories.filter(t => !t.isCenter).map(t => ({
        from: t, to: center, progress: 1
      })));
      return;
    }

    const animateLines = () => {
      setLines([]);
      
      visibleTerritories.filter(t => !t.isCenter).forEach((territory, index) => {
        setTimeout(() => {
          let progress = 0;
          const duration = 2500;
          const startTime = Date.now();

          const animate = () => {
            progress = Math.min((Date.now() - startTime) / duration, 1);
            setLines(prev => {
              const others = prev.filter(l => l.from.id !== territory.id);
              return [...others, { from: territory, to: center, progress }];
            });
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }, index * 400);
      });
    };

    animateLines();
    animationCycleRef.current = setInterval(animateLines, 10000);

    return () => {
      if (animationCycleRef.current) clearInterval(animationCycleRef.current);
    };
  }, [isVisible, visibleTerritories, center, prefersReducedMotion]);

  const countValue = useCountUp(activeCount, 2000, isVisible);

  const svgWidth = 800;
  const svgHeight = 400;

  return (
    <section ref={ref} className="py-24 sm:py-32 bg-charcoal overflow-hidden" data-testid="planisphere-section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 
            className="font-serif text-3xl sm:text-4xl text-cream mb-4"
            style={{
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.7s ease-out'
            }}
          >
            La diaspora se rassemble.
          </h2>
          <p 
            className="text-cream/60 text-lg"
            style={{
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.7s ease-out 0.2s'
            }}
          >
            Fort-de-France, 22 Mai 2026.
          </p>
        </div>

        {/* Map */}
        <div 
          className="relative mx-auto"
          style={{ maxWidth: '900px' }}
        >
          <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto"
            style={{ minHeight: '280px', border: '2px solid red' }}
          >
            {/* Background */}
            <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#1A1A1A" />
            
            {/* World map outlines */}
            <WorldMapSVG />

            {/* Gradient definitions for lines */}
            <defs>
              {visibleTerritories.filter(t => !t.isCenter).map(territory => (
                <linearGradient 
                  key={`grad-${territory.id}`}
                  id={`grad-${territory.id}`}
                  x1={territory.x} y1={territory.y}
                  x2={center?.x || 280} y2={center?.y || 180}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor={territory.color} stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#A65D47" stopOpacity="0.7" />
                </linearGradient>
              ))}
            </defs>

            {/* Connection lines */}
            {lines.map((line) => {
              if (!line.progress || !center) return null;
              
              const fromX = line.from.x;
              const fromY = line.from.y;
              const toX = center.x;
              const toY = center.y;
              
              // Curved line
              const midX = (fromX + toX) / 2;
              const midY = Math.min(fromY, toY) - 40;
              const path = `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`;
              const pathLength = 400;
              
              return (
                <path
                  key={`line-${line.from.id}`}
                  d={path}
                  fill="none"
                  stroke={`url(#grad-${line.from.id})`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={pathLength}
                  strokeDashoffset={pathLength * (1 - line.progress)}
                />
              );
            })}

            {/* Territory dots - rendered last to appear on top */}
            {visibleTerritories.map((territory) => {
              const size = getSize(territory.size);
              const isHovered = hoveredTerritory === territory.id;
              const isCenter = territory.isCenter;

              return (
                <g 
                  key={territory.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredTerritory(territory.id)}
                  onMouseLeave={() => setHoveredTerritory(null)}
                  data-testid={`territory-${territory.id}`}
                >
                  {/* Pulsing rings for center */}
                  {isCenter && (
                    <circle
                      cx={territory.x}
                      cy={territory.y}
                      r={size + 6}
                      fill="none"
                      stroke={territory.color}
                      strokeWidth="2"
                      opacity="0.5"
                    >
                      <animate 
                        attributeName="r" 
                        values={`${size + 6};${size + 30};${size + 6}`}
                        dur="2.5s" 
                        repeatCount="indefinite"
                      />
                      <animate 
                        attributeName="opacity" 
                        values="0.5;0;0.5"
                        dur="2.5s" 
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  
                  {/* Main dot with glow */}
                  <circle
                    cx={territory.x}
                    cy={territory.y}
                    r={isHovered ? size * 1.4 : size}
                    fill={territory.color}
                    style={{ 
                      filter: `drop-shadow(0 0 ${isCenter ? '12px' : '6px'} ${territory.color})`
                    }}
                  />

                  {/* Territory label */}
                  <text
                    x={territory.x}
                    y={territory.y + size + 14}
                    textAnchor="middle"
                    fill={isCenter ? '#F4F1EA' : '#F4F1EA'}
                    fontSize={isCenter ? '12' : '10'}
                    fontWeight={isCenter ? 'bold' : 'normal'}
                    opacity={isHovered || isCenter ? 1 : 0.65}
                    className="pointer-events-none select-none"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                  >
                    {territory.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Counter */}
        <div 
          className="text-center mt-10"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.7s ease-out 0.6s'
          }}
        >
          <span className="font-serif text-4xl sm:text-5xl text-terracotta">
            {countValue}
          </span>
          <span className="text-cream/60 text-lg ml-3">
            territoires connectés
          </span>
        </div>
      </div>
    </section>
  );
};

export default Planisphere;
