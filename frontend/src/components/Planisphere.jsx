import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useIntersectionObserver, useCountUp } from '../hooks/useAnimations';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || '';

// Default territories with geographic coordinates
const DEFAULT_TERRITORIES = [
  { id: 'martinique', name: 'Fort-de-France', lat: 14.6, lon: -61.0, color: '#A65D47', size: 'primary', label: 'Martinique', isCenter: true, active: true },
  { id: 'paris', name: 'Paris', lat: 48.8, lon: 2.3, color: '#C8922A', size: 'large', label: 'Paris — Diaspora', active: true },
  { id: 'colombia', name: 'Bogotá', lat: 4.7, lon: -74.0, color: '#C8922A', size: 'medium', label: 'Colombie', active: true },
  { id: 'haiti', name: 'Port-au-Prince', lat: 18.9, lon: -72.3, color: '#A65D47', size: 'medium', label: 'Haïti', opacity: 0.8, active: true },
  { id: 'senegal', name: 'Dakar', lat: 14.7, lon: -17.4, color: '#C8922A', size: 'medium', label: 'Sénégal', active: true },
  { id: 'nigeria', name: 'Lagos', lat: 6.5, lon: 3.4, color: '#C8922A', size: 'small', label: 'Nigeria', active: true },
  { id: 'guadeloupe', name: 'Guadeloupe', lat: 16.2, lon: -61.5, color: '#A65D47', size: 'medium', label: 'Guadeloupe', active: true },
  { id: 'london', name: 'Londres', lat: 51.5, lon: -0.1, color: '#FFFFFF', size: 'small', label: 'UK', active: true },
  { id: 'newyork', name: 'New York', lat: 40.7, lon: -74.0, color: '#FFFFFF', size: 'small', label: 'USA', active: true },
  { id: 'brazil', name: 'Brasília', lat: -15.7, lon: -47.9, color: '#C8922A', size: 'small', label: 'Brésil', active: true },
];

// Size mapping
const SIZE_MAP = {
  primary: 12,
  large: 8,
  medium: 7,
  small: 6,
};

// Convert lat/lon to SVG coordinates (Miller projection approximation)
const geoToSvg = (lat, lon, width = 800, height = 400) => {
  // Simple equirectangular projection with bounds
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
};

// Simplified world map path (continents outline)
const WORLD_MAP_PATH = `
M 100,120 Q 120,100 150,105 L 180,95 Q 200,90 220,100 L 250,110 Q 270,105 290,115 
L 320,120 Q 340,115 360,125 L 380,135 Q 390,145 400,140 L 420,130 Q 440,125 460,135
L 480,145 Q 500,155 520,150 L 550,145 Q 580,140 600,150 L 620,160 Q 640,170 660,165
L 680,160 Q 700,155 720,165 L 740,175 Q 750,185 760,180
M 100,180 Q 120,190 140,185 L 160,180 Q 180,175 200,185 L 220,195 Q 240,205 260,200
L 280,195 Q 300,190 320,200 L 340,210 Q 360,215 380,210 L 400,205 Q 420,200 440,210
M 450,200 Q 470,210 490,205 L 520,200 Q 550,195 580,205 L 610,215 Q 640,225 670,220
L 700,215 Q 720,210 740,220 L 760,230
M 200,250 Q 220,260 240,255 L 270,250 Q 300,245 330,255 L 360,265 Q 390,275 410,270
M 500,280 Q 530,290 560,285 L 590,280 Q 620,275 650,285 L 680,295
M 580,180 Q 600,175 620,180 L 650,185 Q 680,190 700,185
`;

// Africa continent path
const AFRICA_PATH = `M 420,160 Q 430,150 450,155 L 480,160 Q 510,165 530,175 L 545,190 
Q 555,210 550,230 L 540,260 Q 530,290 515,310 L 490,330 Q 470,340 450,335 
L 430,325 Q 410,310 405,290 L 400,260 Q 395,230 405,200 L 415,175 Z`;

// South America path
const SOUTH_AMERICA_PATH = `M 230,220 Q 250,210 270,220 L 290,235 Q 305,255 300,280 
L 290,310 Q 275,340 255,360 L 235,375 Q 220,380 210,370 L 205,345 Q 200,310 210,280 
L 220,250 Z`;

// North America path  
const NORTH_AMERICA_PATH = `M 80,100 Q 120,80 160,90 L 200,100 Q 240,105 270,120 
L 290,140 Q 300,160 290,180 L 270,195 Q 250,205 230,200 L 200,190 Q 170,180 150,165 
L 130,145 Q 110,125 90,120 Z`;

// Europe path
const EUROPE_PATH = `M 420,80 Q 450,70 480,80 L 510,90 Q 540,100 560,115 
L 570,135 Q 575,155 565,170 L 545,180 Q 520,185 495,180 L 470,170 Q 450,160 440,145 
L 430,125 Q 425,105 430,90 Z`;

export const Planisphere = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.2 });
  const [territories, setTerritories] = useState(DEFAULT_TERRITORIES);
  const [lines, setLines] = useState([]);
  const [hoveredTerritory, setHoveredTerritory] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const animationCycleRef = useRef(null);
  const lineAnimationRef = useRef(null);
  
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load territories from CMS
  useEffect(() => {
    const loadTerritories = async () => {
      try {
        const res = await axios.get(`${API}/api/cms/map-territories`);
        if (res.data?.territories?.length > 0) {
          setTerritories(res.data.territories);
        }
      } catch (err) {
        console.log('Using default territories');
      }
    };
    loadTerritories();
  }, []);

  // Filter for mobile
  const visibleTerritories = useMemo(() => {
    const active = territories.filter(t => t.active);
    if (isMobile) {
      // Show only key territories on mobile
      const mobileIds = ['martinique', 'paris', 'haiti', 'senegal', 'colombia'];
      return active.filter(t => mobileIds.includes(t.id) || t.isCenter);
    }
    return active;
  }, [territories, isMobile]);

  const center = visibleTerritories.find(t => t.isCenter);
  const activeCount = territories.filter(t => t.active).length;

  // Animate lines
  useEffect(() => {
    if (!isVisible || !center || prefersReducedMotion) {
      if (prefersReducedMotion && center) {
        // Show all lines immediately
        setLines(visibleTerritories.filter(t => !t.isCenter).map(t => ({
          from: t,
          to: center,
          progress: 1
        })));
      }
      return;
    }

    const animateLines = () => {
      setLines([]);
      
      visibleTerritories.filter(t => !t.isCenter).forEach((territory, index) => {
        setTimeout(() => {
          const startTime = Date.now();
          const duration = 2500;

          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            setLines(prev => {
              const existing = prev.filter(l => l.from.id !== territory.id);
              return [...existing, { from: territory, to: center, progress }];
            });

            if (progress < 1) {
              lineAnimationRef.current = requestAnimationFrame(animate);
            }
          };

          lineAnimationRef.current = requestAnimationFrame(animate);
        }, index * 400);
      });
    };

    animateLines();

    // Loop animation
    animationCycleRef.current = setInterval(() => {
      animateLines();
    }, 10000);

    return () => {
      if (animationCycleRef.current) clearInterval(animationCycleRef.current);
      if (lineAnimationRef.current) cancelAnimationFrame(lineAnimationRef.current);
    };
  }, [isVisible, visibleTerritories, center, prefersReducedMotion]);

  // Territory counter
  const countValue = useCountUp(activeCount, 2000, isVisible);

  const svgWidth = 800;
  const svgHeight = 400;

  return (
    <section ref={ref} className="py-24 sm:py-32 bg-charcoal overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title with split animation */}
        <div className="text-center mb-12 overflow-hidden">
          <h2 className="font-serif text-3xl sm:text-4xl text-cream mb-4 flex flex-wrap justify-center gap-2">
            <span 
              className="inline-block transition-all duration-700"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
              }}
            >
              La diaspora
            </span>
            <span 
              className="inline-block transition-all duration-700"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(50px)',
              }}
            >
              se rassemble.
            </span>
          </h2>
          <p 
            className="text-cream/60 text-lg transition-all duration-600 delay-300"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            Fort-de-France, 22 Mai 2026.
          </p>
        </div>

        {/* Map Container */}
        <div 
          className="relative mx-auto transition-all duration-700 delay-500"
          style={{ 
            maxWidth: '900px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto"
            style={{ minHeight: '300px' }}
          >
            {/* Background */}
            <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#1A1A1A" />
            
            {/* World map outlines */}
            <g className="world-map" stroke="#A65D4730" strokeWidth="0.5" fill="#2A2A2A">
              {/* Africa */}
              <path d={AFRICA_PATH} />
              {/* South America */}
              <path d={SOUTH_AMERICA_PATH} />
              {/* North America */}
              <path d={NORTH_AMERICA_PATH} />
              {/* Europe */}
              <path d={EUROPE_PATH} />
              {/* General landmass outlines */}
              <path d={WORLD_MAP_PATH} fill="none" />
            </g>

            {/* Connection lines */}
            {lines.map((line, idx) => {
              if (!line.progress || !center) return null;
              const fromPos = geoToSvg(line.from.lat, line.from.lon, svgWidth, svgHeight);
              const toPos = geoToSvg(center.lat, center.lon, svgWidth, svgHeight);
              
              // Curved path
              const midX = (fromPos.x + toPos.x) / 2;
              const midY = Math.min(fromPos.y, toPos.y) - 30;
              const path = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`;
              const pathLength = 500; // Approximate
              
              return (
                <path
                  key={`line-${line.from.id}`}
                  d={path}
                  fill="none"
                  stroke={`url(#gradient-${line.from.id})`}
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                  strokeLinecap="round"
                  strokeDasharray={pathLength}
                  strokeDashoffset={pathLength * (1 - line.progress)}
                  style={{ transition: prefersReducedMotion ? 'none' : 'stroke-dashoffset 0.1s linear' }}
                />
              );
            })}

            {/* Gradient definitions */}
            <defs>
              {visibleTerritories.filter(t => !t.isCenter).map(territory => (
                <linearGradient 
                  key={`gradient-${territory.id}`}
                  id={`gradient-${territory.id}`}
                  gradientUnits="userSpaceOnUse"
                  x1={geoToSvg(territory.lat, territory.lon, svgWidth, svgHeight).x}
                  y1={geoToSvg(territory.lat, territory.lon, svgWidth, svgHeight).y}
                  x2={center ? geoToSvg(center.lat, center.lon, svgWidth, svgHeight).x : 0}
                  y2={center ? geoToSvg(center.lat, center.lon, svgWidth, svgHeight).y : 0}
                >
                  <stop offset="0%" stopColor={territory.color} />
                  <stop offset="100%" stopColor="#A65D47" />
                </linearGradient>
              ))}
            </defs>

            {/* Territory dots */}
            {visibleTerritories.map((territory) => {
              const pos = geoToSvg(territory.lat, territory.lon, svgWidth, svgHeight);
              const size = SIZE_MAP[territory.size] || 7;
              const isHovered = hoveredTerritory === territory.id;

              return (
                <g 
                  key={territory.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredTerritory(territory.id)}
                  onMouseLeave={() => setHoveredTerritory(null)}
                  style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                >
                  {/* Pulsing ring for center */}
                  {territory.isCenter && (
                    <>
                      <circle
                        cx={0}
                        cy={0}
                        r={size}
                        fill="none"
                        stroke={territory.color}
                        strokeWidth="2"
                        opacity="0.6"
                        className="animate-ping-slow"
                      />
                      <circle
                        cx={0}
                        cy={0}
                        r={size * 1.5}
                        fill="none"
                        stroke={territory.color}
                        strokeWidth="1"
                        opacity="0.3"
                        className="animate-ping-slower"
                      />
                    </>
                  )}
                  
                  {/* Main dot */}
                  <circle
                    cx={0}
                    cy={0}
                    r={isHovered ? size * 1.5 : size}
                    fill={territory.color}
                    opacity={territory.opacity || 1}
                    style={{ 
                      transition: 'r 0.3s ease-out',
                      filter: territory.isCenter ? `drop-shadow(0 0 8px ${territory.color}80)` : 'none'
                    }}
                  />

                  {/* Label - always visible for center, on hover for others */}
                  {(territory.isCenter || isHovered || !isMobile) && (
                    <text
                      x={0}
                      y={size + 12}
                      textAnchor="middle"
                      fill={territory.isCenter ? '#A65D47' : '#F4F1EA80'}
                      fontSize={territory.isCenter ? '11' : '9'}
                      fontFamily="inherit"
                      className="pointer-events-none"
                      style={{
                        opacity: territory.isCenter || isHovered ? 1 : 0.6,
                        transition: 'opacity 0.3s ease-out'
                      }}
                    >
                      {territory.name}
                    </text>
                  )}

                  {/* Tooltip on hover */}
                  {isHovered && !territory.isCenter && (
                    <g>
                      <rect
                        x={-45}
                        y={-size - 35}
                        width="90"
                        height="25"
                        rx="3"
                        fill="#1A1A1A"
                        stroke="#A65D47"
                        strokeWidth="1"
                      />
                      <text
                        x={0}
                        y={-size - 18}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontFamily="inherit"
                      >
                        {territory.name} · {territory.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Territory counter */}
        <div 
          className="text-center mt-12 transition-all duration-600 delay-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
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

      {/* CSS for animations */}
      <style>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes ping-slower {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(3); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          transform-origin: center;
        }
        .animate-ping-slower {
          animation: ping-slower 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          animation-delay: 0.5s;
          transform-origin: center;
        }
      `}</style>
    </section>
  );
};

export default Planisphere;
