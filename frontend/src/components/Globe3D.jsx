import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { useIntersectionObserver, useCountUp } from '../hooks/useAnimations';
import { useBidirectionalSync } from '../hooks/useRealtime';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || '';

// Default territories with lat/lng coordinates
const DEFAULT_TERRITORIES = [
  { id: 'martinique', name: 'Fort-de-France', lat: 14.6, lng: -61.0, color: '#A65D47', size: 0.8, label: 'Martinique', isCenter: true },
  { id: 'paris', name: 'Paris', lat: 48.8, lng: 2.3, color: '#C8922A', size: 0.5, label: 'Paris — Diaspora' },
  { id: 'colombia', name: 'Bogotá', lat: 4.7, lng: -74.0, color: '#C8922A', size: 0.4, label: 'Colombie' },
  { id: 'haiti', name: 'Port-au-Prince', lat: 18.5, lng: -72.3, color: '#A65D47', size: 0.45, label: 'Haïti' },
  { id: 'senegal', name: 'Dakar', lat: 14.7, lng: -17.4, color: '#C8922A', size: 0.4, label: 'Sénégal' },
  { id: 'nigeria', name: 'Lagos', lat: 6.5, lng: 3.3, color: '#C8922A', size: 0.35, label: 'Nigeria' },
  { id: 'guadeloupe', name: 'Guadeloupe', lat: 16.2, lng: -61.5, color: '#A65D47', size: 0.35, label: 'Guadeloupe' },
  { id: 'london', name: 'Londres', lat: 51.5, lng: -0.1, color: '#FFFFFF', size: 0.35, label: 'UK' },
  { id: 'newyork', name: 'New York', lat: 40.7, lng: -74.0, color: '#FFFFFF', size: 0.35, label: 'USA' },
  { id: 'brazil', name: 'Brasília', lat: -15.8, lng: -47.9, color: '#C8922A', size: 0.35, label: 'Brésil' },
];

export const Globe3D = () => {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  const globeRef = useRef(null);
  const containerRef = useRef(null);
  const [territories, setTerritories] = useState(DEFAULT_TERRITORIES);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [arcsData, setArcsData] = useState([]);
  const [globeReady, setGlobeReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  
  // 🔄 Real-time sync
  const { subscribe, isConnected } = useRealtime();

  // Martinique center point
  const center = useMemo(() => 
    territories.find(t => t.isCenter) || DEFAULT_TERRITORIES[0],
    [territories]
  );

  // Count for animated counter
  const activeCount = territories.length;
  const countValue = useCountUp(activeCount, 2000, isVisible && globeReady);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.offsetWidth, 900);
        const height = Math.min(width * 0.65, 550);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Load territories function
  const loadTerritories = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/cms/map-territories`);
      if (res.data?.territories?.length > 0) {
        const converted = res.data.territories
          .filter(t => t.active !== false)
          .map(t => ({
            id: t.id || t.name.toLowerCase().replace(/\s/g, '-'),
            name: t.name,
            lat: parseFloat(t.lat) || 0,
            lng: parseFloat(t.lon || t.lng) || 0,
            color: t.color || '#C8922A',
            size: convertSize(t.size),
            label: t.label || t.name,
            isCenter: t.isCenter || t.name === 'Fort-de-France' || t.name === 'Martinique'
          }));
        if (converted.length > 0) {
          setTerritories(converted);
          console.log('🌍 Globe territories loaded:', converted.length);
        }
      }
    } catch (err) {
      console.log('Using default territories');
    }
  }, []);

  // Convert size string to numeric value
  const convertSize = (size) => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'primary': return 0.8;
      case 'large': return 0.6;
      case 'medium': return 0.45;
      case 'small': return 0.35;
      default: return 0.4;
    }
  };

  // Load territories on mount
  useEffect(() => {
    loadTerritories();
  }, [loadTerritories]);

  // 🔄 Subscribe to real-time territory updates
  useEffect(() => {
    const unsubscribe = subscribe('territories_updated', (data) => {
      console.log('🔄 Real-time: Territories updated, reloading...', data);
      loadTerritories();
    });
    return unsubscribe;
  }, [subscribe, loadTerritories]);

  // Initialize globe position focused on Atlantic (Martinique region)
  useEffect(() => {
    if (globeRef.current && globeReady) {
      // Focus on Martinique with a good view of both Americas and Africa
      globeRef.current.pointOfView({
        lat: 20,
        lng: -40,
        altitude: 2.2
      }, 1500);
    }
  }, [globeReady]);

  // Create arcs when visible
  useEffect(() => {
    if (!isVisible || !globeReady) return;

    // Create arcs from each territory to center (Martinique)
    const newArcs = territories
      .filter(t => !t.isCenter)
      .map((territory, index) => ({
        startLat: territory.lat,
        startLng: territory.lng,
        endLat: center.lat,
        endLng: center.lng,
        color: [territory.color, center.color],
        delay: index * 300,
        id: territory.id
      }));

    // Animate arcs appearing one by one
    setArcsData([]);
    newArcs.forEach((arc, i) => {
      setTimeout(() => {
        setArcsData(prev => [...prev, arc]);
      }, arc.delay);
    });

  }, [isVisible, territories, center, globeReady]);

  // Points data for the globe
  const pointsData = useMemo(() => 
    territories.map(t => ({
      ...t,
      altitude: t.isCenter ? 0.15 : 0.08,
      radius: t.isCenter ? t.size * 1.5 : t.size
    })),
    [territories]
  );

  // Custom point label
  const getPointLabel = useCallback((point) => {
    return `
      <div style="
        background: rgba(26, 26, 26, 0.9);
        padding: 8px 12px;
        border-radius: 4px;
        border: 1px solid ${point.color};
        font-family: 'Syne', sans-serif;
        color: #F4F1EA;
        font-size: 12px;
        text-align: center;
        backdrop-filter: blur(4px);
      ">
        <div style="font-weight: bold; margin-bottom: 2px;">${point.name}</div>
        <div style="color: ${point.color}; font-size: 10px;">${point.label}</div>
      </div>
    `;
  }, []);

  // Ring data for center pulse effect
  const ringsData = useMemo(() => {
    if (!center) return [];
    return [{
      lat: center.lat,
      lng: center.lng,
      maxR: 8,
      propagationSpeed: 2,
      repeatPeriod: 1500,
      color: () => center.color
    }];
  }, [center]);

  return (
    <section 
      ref={sectionRef} 
      className="py-16 sm:py-24 bg-charcoal overflow-hidden" 
      data-testid="globe-section"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 
            className="font-serif text-3xl sm:text-4xl text-cream mb-4"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
              transition: 'opacity 0.7s ease-out, transform 0.7s ease-out'
            }}
          >
            La diaspora se rassemble.
          </h2>
          <p 
            className="text-cream/60 text-lg"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.7s ease-out 0.2s, transform 0.7s ease-out 0.2s'
            }}
          >
            Fort-de-France, 22 Mai 2026.
          </p>
        </div>

        {/* Globe Container */}
        <div 
          ref={containerRef}
          className="relative mx-auto flex justify-center items-center"
          style={{ 
            maxWidth: '900px',
            minHeight: '400px',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.8s ease-out 0.4s'
          }}
        >
          {isVisible && (
            <Globe
              ref={globeRef}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              showAtmosphere={true}
              atmosphereColor="#A65D47"
              atmosphereAltitude={0.15}
              
              // Points (territories)
              pointsData={pointsData}
              pointLat="lat"
              pointLng="lng"
              pointColor="color"
              pointAltitude="altitude"
              pointRadius="radius"
              pointLabel={getPointLabel}
              onPointHover={setHoveredPoint}
              
              // Arcs (connection lines)
              arcsData={arcsData}
              arcStartLat="startLat"
              arcStartLng="startLng"
              arcEndLat="endLat"
              arcEndLng="endLng"
              arcColor="color"
              arcDashLength={0.5}
              arcDashGap={0.2}
              arcDashAnimateTime={2000}
              arcStroke={0.5}
              arcAltitudeAutoScale={0.4}
              
              // Rings (pulse effect on center)
              ringsData={ringsData}
              ringLat="lat"
              ringLng="lng"
              ringMaxRadius="maxR"
              ringPropagationSpeed="propagationSpeed"
              ringRepeatPeriod="repeatPeriod"
              ringColor="color"
              
              // Globe ready callback
              onGlobeReady={() => setGlobeReady(true)}
              
              // Auto-rotate (slow)
              enablePointerInteraction={true}
            />
          )}
          
          {/* Loading state */}
          {isVisible && !globeReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-cream/60 flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full animate-spin"></div>
                <span>Chargement du globe...</span>
              </div>
            </div>
          )}
        </div>

        {/* Legend / Hovered territory info */}
        {hoveredPoint && (
          <div 
            className="text-center mt-4"
            style={{
              opacity: hoveredPoint ? 1 : 0,
              transition: 'opacity 0.3s ease-out'
            }}
          >
            <span className="px-4 py-2 bg-charcoal/80 border border-terracotta/30 text-cream text-sm">
              {hoveredPoint.label} → Fort-de-France
            </span>
          </div>
        )}

        {/* Counter */}
        <div 
          className="text-center mt-8"
          style={{
            opacity: isVisible && globeReady ? 1 : 0,
            transition: 'opacity 0.7s ease-out 0.6s'
          }}
        >
          <span className="font-serif text-4xl sm:text-5xl text-terracotta">
            {countValue}
          </span>
          <span className="text-cream/60 text-lg ml-3">
            territoires connectés
          </span>
          {/* Real-time indicator */}
          {isConnected && (
            <span className="ml-4 inline-flex items-center gap-1.5 text-xs text-sage/70" title="Synchronisation temps réel active">
              <span className="w-2 h-2 bg-sage rounded-full animate-pulse"></span>
              Live
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default Globe3D;
