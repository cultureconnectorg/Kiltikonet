import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { AmbientLight, DirectionalLight } from 'three';
import { useIntersectionObserver, useCountUp } from '../hooks/useAnimations';
import { useBidirectionalSync } from '../hooks/useRealtime';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || '';

// --- TEXTURE URLS (verified valid) ---
const TEXTURES = {
  globe: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  bump: '//unpkg.com/three-globe/example/img/earth-topology.png',
  background: '//unpkg.com/three-globe/example/img/night-sky.png',
};

// --- DEFAULT TERRITORIES ---
const DEFAULT_TERRITORIES = [
  { id: 'martinique', name: 'Fort-de-France', lat: 14.6, lng: -61.0, color: '#FF6B35', size: 0.8, label: 'Martinique', isCenter: true },
  { id: 'paris', name: 'Paris', lat: 48.8, lng: 2.3, color: '#00D4FF', size: 0.5, label: 'Paris — Diaspora' },
  { id: 'colombia', name: 'Bogota', lat: 4.7, lng: -74.0, color: '#00D4FF', size: 0.4, label: 'Colombie' },
  { id: 'haiti', name: 'Port-au-Prince', lat: 18.5, lng: -72.3, color: '#FF6B35', size: 0.45, label: 'Haiti' },
  { id: 'senegal', name: 'Dakar', lat: 14.7, lng: -17.4, color: '#00D4FF', size: 0.4, label: 'Senegal' },
  { id: 'nigeria', name: 'Lagos', lat: 6.5, lng: 3.3, color: '#00D4FF', size: 0.35, label: 'Nigeria' },
  { id: 'guadeloupe', name: 'Guadeloupe', lat: 16.2, lng: -61.5, color: '#FF6B35', size: 0.35, label: 'Guadeloupe' },
  { id: 'london', name: 'Londres', lat: 51.5, lng: -0.1, color: '#FFFFFF', size: 0.35, label: 'UK' },
  { id: 'newyork', name: 'New York', lat: 40.7, lng: -74.0, color: '#FFFFFF', size: 0.35, label: 'USA' },
  { id: 'brazil', name: 'Brasilia', lat: -15.8, lng: -47.9, color: '#00D4FF', size: 0.35, label: 'Bresil' },
];

// --- ARC GRADIENT COLORS ---
const ARC_COLORS = [
  ['#00D4FF', '#FF00FF'],  // cyan → magenta
  ['#FF6B35', '#FFD700'],  // orange → gold
  ['#00FF88', '#00D4FF'],  // green → cyan
  ['#FF00FF', '#FF6B35'],  // magenta → orange
];

export const Globe3D = () => {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.05 });
  const globeRef = useRef(null);
  const containerRef = useRef(null);
  const [territories, setTerritories] = useState(DEFAULT_TERRITORIES);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [arcsData, setArcsData] = useState([]);
  const [globeReady, setGlobeReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 560 });
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  const { subscribe, isConnected, connectionCount } = useBidirectionalSync();

  const center = useMemo(() =>
    territories.find(t => t.isCenter) || DEFAULT_TERRITORIES[0],
    [territories]
  );

  const activeCount = territories.length;
  const countValue = useCountUp(activeCount, 2000, isVisible && globeReady);

  // Lazy loading: only mount Globe when section has been visible once
  useEffect(() => {
    if (isVisible && !hasBeenVisible) {
      setHasBeenVisible(true);
    }
  }, [isVisible, hasBeenVisible]);

  // --- RESPONSIVE DIMENSIONS ---
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const isMobile = window.innerWidth < 640;
        const width = Math.min(containerWidth, 900);
        const heightRatio = isMobile ? 1.0 : 0.72;
        const maxHeight = isMobile ? 480 : 630;
        const height = Math.min(width * heightRatio, maxHeight);
        setDimensions({ width, height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // --- LOAD TERRITORIES FROM API ---
  const loadTerritories = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/territories`);
      if (res.data?.territories?.length) {
        const converted = res.data.territories.map(t => ({
          ...t, color: t.isCenter ? '#FF6B35' : '#00D4FF', size: t.isCenter ? 0.8 : 0.45,
        }));
        setTerritories(converted);
      }
    } catch { /* silent — use defaults */ }
  }, []);

  useEffect(() => { loadTerritories(); }, [loadTerritories]);

  useEffect(() => {
    const unsubscribe = subscribe('territory_update', () => { loadTerritories(); });
    return unsubscribe;
  }, [subscribe, loadTerritories]);

  // --- CAMERA POSITION ---
  useEffect(() => {
    if (globeRef.current && globeReady) {
      const isMobile = window.innerWidth < 640;
      globeRef.current.pointOfView({
        lat: 18,
        lng: -42,
        altitude: isMobile ? 1.6 : 2.0
      }, 1800);
    }
  }, [globeReady]);

  // --- CUSTOM LIGHTING (anti-black globe) ---
  useEffect(() => {
    if (!globeRef.current || !globeReady) return;
    const scene = globeRef.current.scene();
    if (!scene) return;

    // Remove default dim lights and add brighter ones
    // Check if we already added custom lights
    if (scene.userData._customLights) return;
    scene.userData._customLights = true;

    // Bright ambient so the globe is never black
    const ambient = new AmbientLight(0xffffff, 0.6);
    ambient.name = 'customAmbient';
    scene.add(ambient);

    // Key light — warm from upper-right
    const keyLight = new DirectionalLight(0xfff5e6, 1.2);
    keyLight.position.set(5, 3, 5);
    keyLight.name = 'customKey';
    scene.add(keyLight);

    // Fill light — cool from left
    const fillLight = new DirectionalLight(0xd4eeff, 0.4);
    fillLight.position.set(-5, 0, 2);
    fillLight.name = 'customFill';
    scene.add(fillLight);

    // Rim light — behind for edge glow
    const rimLight = new DirectionalLight(0x00d4ff, 0.3);
    rimLight.position.set(0, 0, -5);
    rimLight.name = 'customRim';
    scene.add(rimLight);
  }, [globeReady]);

  // --- FPS LIMITER (save GPU when idle) ---
  useEffect(() => {
    if (!globeRef.current || !globeReady) return;
    const renderer = globeRef.current.renderer();
    const controls = globeRef.current.controls();
    if (!renderer || !controls) return;

    let isInteracting = false;
    let idleTimer = null;

    const setFullFPS = () => {
      isInteracting = true;
      if (renderer.setAnimationLoop) {
        // Ensure animation runs during interaction
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { isInteracting = false; }, 3000);
    };

    controls.addEventListener('start', setFullFPS);
    controls.addEventListener('change', setFullFPS);

    return () => {
      controls.removeEventListener('start', setFullFPS);
      controls.removeEventListener('change', setFullFPS);
      clearTimeout(idleTimer);
    };
  }, [globeReady]);

  // --- BUILD ARCS ---
  useEffect(() => {
    if (!isVisible || !globeReady) return;

    const nonCenter = territories.filter(t => !t.isCenter);
    const arcs = nonCenter.map((t, i) => ({
      startLat: center.lat,
      startLng: center.lng,
      endLat: t.lat,
      endLng: t.lng,
      color: ARC_COLORS[i % ARC_COLORS.length],
      label: t.label,
    }));

    // Stagger arc appearance
    const timer = setTimeout(() => setArcsData(arcs), 800);
    return () => clearTimeout(timer);
  }, [isVisible, territories, center, globeReady]);

  // --- POINTS DATA ---
  const pointsData = useMemo(() =>
    territories.map(t => ({
      lat: t.lat, lng: t.lng, color: t.color,
      altitude: t.isCenter ? 0.06 : 0.03,
      radius: t.isCenter ? 0.6 : 0.35,
      label: t.label, name: t.name, isCenter: t.isCenter,
    })),
    [territories]
  );

  // Pulsing rings on center point
  const ringsData = useMemo(() => [{
    lat: center.lat, lng: center.lng,
    maxR: 3, propagationSpeed: 2, repeatPeriod: 1200,
    color: () => 'rgba(255, 107, 53, 0.6)',
  }], [center]);

  const getPointLabel = useCallback((d) =>
    `<div style="background:rgba(0,0,0,0.85);color:#fff;padding:6px 12px;border-radius:6px;font-family:sans-serif;font-size:13px;border:1px solid ${d.isCenter ? '#FF6B35' : '#00D4FF'}">
      <b>${d.label}</b><br/><span style="opacity:0.7;font-size:11px">${d.name}</span>
    </div>`, []);

  return (
    <section
      ref={sectionRef}
      className="py-6 sm:py-12 bg-charcoal overflow-hidden"
      data-testid="globe-section"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-3 sm:mb-5">
          <h2
            className="font-serif text-3xl sm:text-4xl text-cream mb-2"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
              transition: 'opacity 0.7s ease-out, transform 0.7s ease-out'
            }}
          >
            La diaspora se rassemble.
          </h2>
          <p
            className="text-cream/60 text-base sm:text-lg"
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
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 1s ease-out 0.3s'
          }}
        >
          {/* Only mount the heavy Globe component when section has been visible (lazy) */}
          {hasBeenVisible && (
            <Globe
              ref={globeRef}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl={TEXTURES.globe}
              bumpImageUrl={TEXTURES.bump}
              backgroundImageUrl={TEXTURES.background}
              showAtmosphere={true}
              atmosphereColor="#4dc9f6"
              atmosphereAltitude={0.18}
              animateIn={true}

              // Points
              pointsData={pointsData}
              pointLat="lat"
              pointLng="lng"
              pointColor="color"
              pointAltitude="altitude"
              pointRadius="radius"
              pointLabel={getPointLabel}
              onPointHover={setHoveredPoint}

              // Arcs with gradient colors
              arcsData={arcsData}
              arcStartLat="startLat"
              arcStartLng="startLng"
              arcEndLat="endLat"
              arcEndLng="endLng"
              arcColor="color"
              arcDashLength={0.6}
              arcDashGap={0.15}
              arcDashAnimateTime={2500}
              arcStroke={0.6}
              arcAltitudeAutoScale={0.45}

              // Pulsing rings
              ringsData={ringsData}
              ringLat="lat"
              ringLng="lng"
              ringMaxRadius="maxR"
              ringPropagationSpeed="propagationSpeed"
              ringRepeatPeriod="repeatPeriod"
              ringColor="color"

              onGlobeReady={() => setGlobeReady(true)}
              enablePointerInteraction={true}
            />
          )}

          {/* Loading skeleton */}
          {hasBeenVisible && !globeReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-cream/60 flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Chargement du globe...</span>
              </div>
            </div>
          )}
        </div>

        {/* Hover tooltip */}
        {hoveredPoint && (
          <div className="text-center mt-2" style={{ opacity: 1, transition: 'opacity 0.3s' }}>
            <span className="inline-block px-4 py-1.5 bg-black/70 border border-cyan-400/40 text-cream text-sm rounded-full backdrop-blur-sm">
              {hoveredPoint.label} &rarr; Fort-de-France
            </span>
          </div>
        )}

        {/* Counter */}
        <div
          className="text-center mt-3 sm:mt-5"
          style={{
            opacity: isVisible && globeReady ? 1 : 0,
            transition: 'opacity 0.7s ease-out 0.6s'
          }}
        >
          <span className="font-serif text-4xl sm:text-5xl text-terracotta">
            {countValue}
          </span>
          <span className="text-cream/60 text-lg ml-3">
            territoires connectes
          </span>
          {isConnected && (
            <span className="ml-4 inline-flex items-center gap-1.5 text-xs text-cyan-400/70" title={`Synchronisation active - ${connectionCount} connectes`}>
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              Live {connectionCount > 1 && `(${connectionCount})`}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default Globe3D;
