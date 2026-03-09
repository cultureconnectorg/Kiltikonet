/**
 * useDeviceDetect Hook - CC2026
 * Détecte le type d'appareil (Mobile vs Desktop)
 */

import { useState, useEffect } from 'react';

export const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      
      // Mobile: < 768px
      // Tablet: 768px - 1024px
      // Desktop: > 1024px
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width <= 1024);
      setIsDesktop(width > 1024);
    };

    // Initial check
    checkDevice();

    // Listen for resize
    window.addEventListener('resize', checkDevice);
    
    // Orientation change for mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(checkDevice, 100);
    });

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Also check user agent for touch devices
  const isTouchDevice = typeof window !== 'undefined' && (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    screenWidth,
    // Breakpoint helpers
    isSmall: screenWidth < 640,
    isMedium: screenWidth >= 640 && screenWidth < 1024,
    isLarge: screenWidth >= 1024,
  };
};

export default useDeviceDetect;
