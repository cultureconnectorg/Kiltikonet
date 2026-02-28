import React, { useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from '../hooks/useAnimations';

// Territory data with positions (relative to container)
const TERRITORIES = [
  { id: 'martinique', name: 'Martinique', x: 50, y: 50, size: 16, color: '#A65D47', isCenter: true },
  { id: 'paris', name: 'Paris', x: 70, y: 20, size: 8, color: '#C8922A' },
  { id: 'colombia', name: 'Colombie', x: 20, y: 45, size: 8, color: '#F4F1EA' },
  { id: 'haiti', name: 'Haïti', x: 40, y: 40, size: 8, color: '#A65D47', opacity: 0.7 },
  { id: 'senegal', name: 'Sénégal', x: 10, y: 35, size: 7, color: '#C8922A', opacity: 0.7 },
  { id: 'london', name: 'Londres', x: 60, y: 12, size: 7, color: '#F4F1EA' },
  { id: 'newyork', name: 'New York', x: 25, y: 18, size: 8, color: '#F4F1EA' },
  { id: 'lagos', name: 'Lagos', x: 15, y: 60, size: 7, color: '#C8922A', opacity: 0.7 },
];

// Mobile simplified version
const TERRITORIES_MOBILE = [
  { id: 'martinique', name: 'Martinique', x: 50, y: 50, size: 20, color: '#A65D47', isCenter: true },
  { id: 'paris', name: 'Paris', x: 75, y: 25, size: 12, color: '#C8922A' },
  { id: 'colombia', name: 'Colombie', x: 25, y: 35, size: 12, color: '#F4F1EA' },
];

export const ConvergenceMap = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.3 });
  const [lines, setLines] = useState([]);
  const [showNames, setShowNames] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const animationRef = useRef(null);
  const cycleRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const territories = isMobile ? TERRITORIES_MOBILE : TERRITORIES;
  const center = territories.find(t => t.isCenter);

  useEffect(() => {
    if (!isVisible || !center) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Show all lines immediately without animation
      const allLines = territories.filter(t => !t.isCenter).map(t => ({
        from: t,
        to: center,
        progress: 1
      }));
      setLines(allLines);
      const names = {};
      territories.forEach(t => names[t.id] = true);
      setShowNames(names);
      return;
    }

    const animateLines = () => {
      // Reset
      setLines([]);
      setShowNames({});

      territories.filter(t => !t.isCenter).forEach((territory, index) => {
        // Start line after stagger delay
        setTimeout(() => {
          setLines(prev => [...prev, {
            from: territory,
            to: center,
            progress: 0,
            id: territory.id
          }]);

          // Animate line progress
          let progress = 0;
          const duration = 2000;
          const startTime = Date.now();

          const animate = () => {
            const elapsed = Date.now() - startTime;
            progress = Math.min(elapsed / duration, 1);
            
            setLines(prev => prev.map(line => 
              line.id === territory.id 
                ? { ...line, progress } 
                : line
            ));

            // Show name when line is halfway
            if (progress > 0.5) {
              setShowNames(prev => ({ ...prev, [territory.id]: true }));
            }

            if (progress < 1) {
              animationRef.current = requestAnimationFrame(animate);
            }
          };

          animationRef.current = requestAnimationFrame(animate);
        }, index * 300);
      });
    };

    // Initial animation
    animateLines();

    // Loop every 8 seconds
    cycleRef.current = setInterval(() => {
      animateLines();
    }, 8000);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [isVisible, isMobile]);

  return (
    <section className="py-24 sm:py-32 bg-charcoal overflow-hidden" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl text-cream mb-4">
            La diaspora se rassemble.
          </h2>
          <p className="text-cream/60 text-lg">
            Fort-de-France, 22 Mai 2026.
          </p>
        </div>

        {/* Map Container */}
        <div className="relative w-full aspect-[16/9] max-w-4xl mx-auto">
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Connection Lines */}
            {lines.map((line, idx) => {
              if (!line.progress) return null;
              const dx = line.to.x - line.from.x;
              const dy = line.to.y - line.from.y;
              const currentX = line.from.x + dx * line.progress;
              const currentY = line.from.y + dy * line.progress;
              
              return (
                <line
                  key={`line-${idx}`}
                  x1={line.from.x}
                  y1={line.from.y}
                  x2={currentX}
                  y2={currentY}
                  stroke="#A65D47"
                  strokeWidth="0.3"
                  strokeOpacity="0.6"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Territory Dots */}
          {territories.map((territory) => (
            <div
              key={territory.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
              style={{
                left: `${territory.x}%`,
                top: `${territory.y}%`,
                opacity: isVisible ? (territory.opacity || 1) : 0,
                transitionDelay: territory.isCenter ? '0s' : '0.5s'
              }}
            >
              {/* Dot */}
              <div
                className={`rounded-full ${territory.isCenter ? 'animate-pulse' : ''}`}
                style={{
                  width: territory.size,
                  height: territory.size,
                  backgroundColor: territory.color,
                  boxShadow: territory.isCenter 
                    ? `0 0 20px ${territory.color}60, 0 0 40px ${territory.color}30` 
                    : `0 0 10px ${territory.color}40`
                }}
              />
              
              {/* Name */}
              <span
                className={`absolute whitespace-nowrap text-xs font-body transition-opacity duration-500 ${
                  territory.isCenter 
                    ? 'text-terracotta font-medium -bottom-6 left-1/2 -translate-x-1/2' 
                    : 'text-cream/50 -bottom-5 left-1/2 -translate-x-1/2'
                }`}
                style={{
                  opacity: showNames[territory.id] || territory.isCenter ? 1 : 0
                }}
              >
                {territory.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ================== PARTICLE BACKGROUND ==================
export const ParticleBackground = ({ className = '' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 10 : 25;

    const initParticles = () => {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedY: -(Math.random() * 0.3 + 0.1), // Moving upward
        opacity: Math.random() * 0.2 + 0.1
      }));
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(particle => {
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(166, 93, 71, ${particle.opacity})`; // Terracotta
        ctx.fill();

        // Move particle
        particle.y += particle.speedY;

        // Reset if off screen
        if (particle.y < -10) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
};

// ================== COUNTDOWN COMPONENT ==================
export const Countdown = ({ targetDate = '2026-05-22T00:00:00' }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [prevSeconds, setPrevSeconds] = useState(0);
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.3 });
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const newTimeLeft = {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      };

      setPrevSeconds(timeLeft.seconds);
      setTimeLeft(newTimeLeft);
    };

    calculate();
    const interval = setInterval(calculate, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const TimeBlock = ({ value, label, isSeconds = false }) => {
    const [isFlipping, setIsFlipping] = useState(false);
    const prevValueRef = useRef(value);

    useEffect(() => {
      if (isSeconds && value !== prevValueRef.current && !prefersReducedMotion) {
        setIsFlipping(true);
        setTimeout(() => setIsFlipping(false), 300);
        prevValueRef.current = value;
      }
    }, [value, isSeconds]);

    return (
      <div className="text-center">
        <div 
          className={`relative overflow-hidden ${
            isSeconds ? 'bg-terracotta/20' : 'bg-charcoal/50'
          } rounded-lg p-4 sm:p-6`}
        >
          <span 
            className={`font-serif text-3xl sm:text-5xl lg:text-6xl text-cream block transition-transform duration-300 ${
              isFlipping && isSeconds ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            {String(value).padStart(2, '0')}
          </span>
        </div>
        <span className="text-cream/50 text-xs sm:text-sm mt-2 block uppercase tracking-wider">
          {label}
        </span>
      </div>
    );
  };

  return (
    <section ref={ref} className="py-16 sm:py-20 bg-charcoal border-y border-cream/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Label */}
        <p className="text-center text-terracotta font-syne text-sm tracking-widest uppercase mb-8">
          Jusqu'au 22 Mai 2026
        </p>

        {/* Countdown Grid */}
        <div 
          className="grid grid-cols-4 gap-3 sm:gap-6"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
          }}
        >
          <TimeBlock value={timeLeft.days} label="Jours" />
          <TimeBlock value={timeLeft.hours} label="Heures" />
          <TimeBlock value={timeLeft.minutes} label="Minutes" />
          <TimeBlock value={timeLeft.seconds} label="Secondes" isSeconds />
        </div>
      </div>
    </section>
  );
};

export default { ConvergenceMap, ParticleBackground, Countdown };
