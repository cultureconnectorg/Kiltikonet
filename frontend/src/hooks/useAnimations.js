import React, { useEffect, useRef, useState, useCallback } from 'react';

// ================== INTERSECTION OBSERVER HOOK ==================
export const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold: options.threshold || 0.15, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, options]);

  return [ref, isVisible];
};

// ================== COUNTING NUMBER ANIMATION ==================
export const useCountUp = (target, duration = 2000, shouldStart = false) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);

  useEffect(() => {
    if (!shouldStart) return;

    const startTime = Date.now();
    const startValue = 0;
    const endValue = parseInt(target) || 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (endValue - startValue) * eased);
      
      setCount(current);

      if (progress < 1) {
        countRef.current = requestAnimationFrame(animate);
      }
    };

    countRef.current = requestAnimationFrame(animate);

    return () => {
      if (countRef.current) {
        cancelAnimationFrame(countRef.current);
      }
    };
  }, [target, duration, shouldStart]);

  return count;
};

// ================== COUNTDOWN TIMER ==================
export const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

// ================== PARALLAX HOOK ==================
export const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        const elementTop = rect.top + scrollY;
        const viewportHeight = window.innerHeight;
        
        // Only calculate when element is in view
        if (scrollY + viewportHeight > elementTop && scrollY < elementTop + rect.height) {
          const relativeScroll = scrollY - elementTop + viewportHeight;
          setOffset(relativeScroll * speed);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return [ref, offset];
};

// ================== STAGGER CHILDREN ANIMATION ==================
export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1, 
  baseDelay = 0,
  className = '',
  threshold = 0.15 
}) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold });

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        return React.cloneElement(child, {
          style: {
            ...child.props.style,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'none' : 'translateY(20px)',
            transition: `opacity 0.6s ease-out ${baseDelay + index * staggerDelay}s, transform 0.6s ease-out ${baseDelay + index * staggerDelay}s`,
          }
        });
      })}
    </div>
  );
};

// ================== REVEAL ANIMATION WRAPPER ==================
export const Reveal = ({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 0.6,
  distance = 40,
  className = '' 
}) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.15 });
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getTransform = () => {
    if (prefersReducedMotion) return 'none';
    if (!isVisible) {
      switch (direction) {
        case 'left': return `translateX(-${distance}px)`;
        case 'right': return `translateX(${distance}px)`;
        case 'down': return `translateY(-${distance}px)`;
        case 'up':
        default: return `translateY(${distance}px)`;
      }
    }
    return 'translateX(0) translateY(0)';
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: prefersReducedMotion 
          ? 'opacity 0.3s ease-out' 
          : `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

// ================== ANIMATED NUMBER ==================
export const AnimatedNumber = ({ 
  value, 
  duration = 2000, 
  prefix = '', 
  suffix = '',
  className = '' 
}) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.5 });
  const count = useCountUp(value, duration, isVisible);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
};

// ================== FLIP SECONDS COMPONENT ==================
export const FlipSeconds = ({ value, className = '' }) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevValue = useRef(value);
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (value !== prevValue.current) {
      if (!prefersReducedMotion) {
        setIsFlipping(true);
        setTimeout(() => {
          setCurrentValue(value);
          setIsFlipping(false);
        }, 150);
      } else {
        setCurrentValue(value);
      }
      prevValue.current = value;
    }
  }, [value, prefersReducedMotion]);

  const padded = String(currentValue).padStart(2, '0');

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <span 
        className={`block transition-transform duration-300 ${
          isFlipping ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        {padded}
      </span>
    </div>
  );
};

export default {
  useIntersectionObserver,
  useCountUp,
  useCountdown,
  useParallax,
  StaggerContainer,
  Reveal,
  AnimatedNumber,
  FlipSeconds
};
