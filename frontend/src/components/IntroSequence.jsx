import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || '';

// Territory to message mapping (defaults)
const DEFAULT_TERRITORY_MESSAGES = {
  'Martinique': 'Ou ka vini.',
  'MQ': 'Ou ka vini.',
  'Guadeloupe': 'An nou.',
  'GP': 'An nou.',
  'Haiti': 'Nou la.',
  'HT': 'Nou la.',
  'Colombia': 'Aquí estamos.',
  'CO': 'Aquí estamos.',
  'Senegal': 'Dëkk bi.',
  'SN': 'Dëkk bi.',
  'France': 'La diaspora rentre.',
  'FR': 'La diaspora rentre.',
  // Africa countries
  'NG': 'Les racines appellent.',
  'GH': 'Les racines appellent.',
  'CI': 'Les racines appellent.',
  'CM': 'Les racines appellent.',
  'SN': 'Dëkk bi.',
  'ML': 'Les racines appellent.',
  'BJ': 'Les racines appellent.',
  'TG': 'Les racines appellent.',
  'BF': 'Les racines appellent.',
  'GN': 'Les racines appellent.',
};

// Identity mapping (no emojis)
const IDENTITIES = [
  { id: 'artist', icon: 'voice', label: 'Une voix', value: 'artist' },
  { id: 'label', icon: 'catalog', label: 'Un catalogue', value: 'label' },
  { id: 'agent', icon: 'network', label: 'Un reseau', value: 'agent' },
  { id: 'institution', icon: 'history', label: 'Une histoire', value: 'institution' },
  { id: 'producer', icon: 'vision', label: 'Une vision', value: 'producer' },
];

const RETURN_MESSAGES = {
  artist: 'Bon retour.',
  label: 'Bon retour.',
  agent: 'Bon retour.',
  institution: 'Bon retour.',
  producer: 'Bon retour.',
};

// Icon components for identities
const IdentityIcon = ({ type, color }) => {
  const icons = {
    voice: (
      <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    catalog: (
      <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    network: (
      <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    history: (
      <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    vision: (
      <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  };
  return icons[type] || null;
};

// Default sounds (embedded as base64 for reliability - short tones)
const DEFAULT_DRUM_SOUND = null; // Will be loaded from CMS or fallback

const IntroSequence = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [intention, setIntention] = useState(null);
  const [territory, setTerritory] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [visibleIdentities, setVisibleIdentities] = useState([]);
  const [hoveredIdentity, setHoveredIdentity] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  
  const audioRef = useRef(null);
  const identitySoundsRef = useRef({});
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Load annual intention from CMS
  useEffect(() => {
    const loadIntention = async () => {
      try {
        const res = await axios.get(`${API}/api/annual-intention`);
        if (res.data) {
          setIntention(res.data);
        }
      } catch (err) {
        console.log('Using default intention');
        // Default intention
        setIntention({
          mot_annee: 'NOU.',
          phrase_ligne_1: 'Pendant des siècles on nous a séparés.',
          phrase_ligne_2: 'Le 22 Mai 2026 — nous nous retrouvons.',
          mot_cle_phrase_2: 'nous',
          couleur_annee: '#A65D47',
          image_annee_url: null,
          territoire_messages: DEFAULT_TERRITORY_MESSAGES,
        });
      }
      setLoading(false);
    };
    loadIntention();
  }, []);

  // Detect territory
  useEffect(() => {
    const detectTerritory = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        setTerritory({
          country: data.country_name,
          country_code: data.country_code,
          region: data.region,
        });
        // Store in localStorage
        localStorage.setItem('kk_territory', JSON.stringify({
          country: data.country_name,
          country_code: data.country_code,
        }));
      } catch (err) {
        console.log('Territory detection failed');
      }
    };
    detectTerritory();
  }, []);

  // Preload audio
  useEffect(() => {
    if (intention?.son_tambour_url) {
      const audio = new Audio(intention.son_tambour_url);
      audio.preload = 'auto';
      audioRef.current = audio;
    }
  }, [intention]);

  // Show skip button after 3 seconds in step 6
  useEffect(() => {
    if (step === 6) {
      const timer = setTimeout(() => setShowSkip(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Stagger identity appearance
  useEffect(() => {
    if (step === 6) {
      IDENTITIES.forEach((_, index) => {
        setTimeout(() => {
          setVisibleIdentities(prev => [...prev, index]);
        }, index * 300);
      });
    }
  }, [step]);

  // Step progression with reduced motion check
  useEffect(() => {
    if (loading || !intention) return;

    // Skip to step 6 if reduced motion preferred
    if (prefersReducedMotion.current && step === 0) {
      setStep(6);
      return;
    }

    const timings = {
      0: 100,    // Start immediately
      1: 1000,   // Step 1: Le souffle (1s)
      2: 800,    // Step 2: Le tambour (0.8s + reverb)
      3: 3000,   // Step 3: Le mot (3s)
      4: 5500,   // Step 4: L'image et la vérité (5.5s)
      5: 1500,   // Step 5: Le silence (1.5s)
    };

    if (step < 6 && timings[step] !== undefined) {
      const timer = setTimeout(() => {
        // Play drum sound at step 2
        if (step === 1 && soundEnabled && audioRef.current) {
          audioRef.current.volume = 0.4;
          audioRef.current.play().catch(() => {});
          
          // Mobile vibration
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        }
        setStep(step + 1);
      }, timings[step]);
      return () => clearTimeout(timer);
    }
  }, [step, loading, intention, soundEnabled]);

  // Get territory message
  const getTerritoryMessage = useCallback(() => {
    if (!territory) return null;
    
    const messages = intention?.territoire_messages || DEFAULT_TERRITORY_MESSAGES;
    
    // Check country name first, then code
    return messages[territory.country] || 
           messages[territory.country_code] || 
           messages[territory.region] ||
           null;
  }, [territory, intention]);

  // Handle identity selection
  const handleIdentitySelect = (identity) => {
    localStorage.setItem('kk_visited', 'true');
    localStorage.setItem('kk_identity', identity.value);
    
    // Flash effect
    setFadeOut(true);
    
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 800);
  };

  // Handle skip
  const handleSkip = () => {
    localStorage.setItem('kk_visited', 'true');
    setFadeOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 300);
  };

  // Play identity hover sound
  const playIdentitySound = (identityId) => {
    if (!soundEnabled) return;
    // Sound would be loaded from CMS - simplified for now
  };

  // Highlight keyword in phrase
  const highlightKeyword = (phrase, keyword, color) => {
    if (!keyword) return phrase;
    
    const parts = phrase.split(new RegExp(`(${keyword})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === keyword.toLowerCase() 
        ? <span key={i} style={{ color }}>{part}</span>
        : part
    );
  };

  if (loading) return null;

  const accentColor = intention?.couleur_annee || '#A65D47';

  return (
    <div 
      className={`fixed inset-0 z-[9999] transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#1A1A1A' }}
      data-testid="intro-sequence"
    >
      {/* Sound toggle - top right */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-6 right-6 z-50 p-2 rounded-full transition-colors"
        style={{ 
          backgroundColor: soundEnabled ? `${accentColor}30` : 'transparent',
          color: soundEnabled ? accentColor : '#888888' 
        }}
        aria-label={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
      >
        {soundEnabled ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </button>

      {/* STEP 1: Le Souffle */}
      {step === 1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="rounded-full animate-pulse-once"
            style={{
              width: '120px',
              height: '120px',
              backgroundColor: accentColor,
              animation: 'breathe 1s ease-in-out',
            }}
          />
        </div>
      )}

      {/* STEP 2: Le Tambour */}
      {step === 2 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="rounded-full"
            style={{
              width: '150px',
              height: '150px',
              backgroundColor: accentColor,
              animation: 'drumPulse 0.8s ease-out',
            }}
          />
        </div>
      )}

      {/* STEP 3: Le Mot */}
      {step === 3 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <h1 
            className="text-white text-center animate-fade-in-out"
            style={{ 
              fontSize: 'clamp(48px, 15vw, 96px)',
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
            }}
          >
            {intention?.mot_annee || 'NOU.'}
          </h1>
          {getTerritoryMessage() && (
            <p 
              className="text-gray-400 text-base mt-4 animate-fade-in-out"
              style={{ animationDelay: '0.2s' }}
            >
              {getTerritoryMessage()}
            </p>
          )}
        </div>
      )}

      {/* STEP 4 & 5: L'Image et la Vérité + Silence */}
      {(step === 4 || step === 5) && (
        <div className="absolute inset-0">
          {/* Background image with Ken Burns */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: intention?.image_annee_url 
                ? `url(${intention.image_annee_url})`
                : 'linear-gradient(135deg, #2A2420 0%, #1A1A1A 100%)',
              animation: 'kenBurns 25s ease-out forwards',
            }}
          />
          {/* Overlay */}
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: 'rgba(26, 26, 26, 0.55)' }}
          />
          
          {/* Text content */}
          {step === 4 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p 
                className="text-white text-lg sm:text-2xl md:text-[28px] max-w-2xl leading-relaxed animate-fade-in"
                style={{ animationDuration: '0.8s' }}
              >
                {intention?.phrase_ligne_1 || 'Pendant des siècles on nous a séparés.'}
              </p>
              <p 
                className="text-white text-lg sm:text-2xl md:text-[28px] max-w-2xl leading-relaxed mt-8 animate-fade-in"
                style={{ animationDuration: '0.8s', animationDelay: '2s', animationFillMode: 'both' }}
              >
                {highlightKeyword(
                  intention?.phrase_ligne_2 || 'Le 22 Mai 2026 — nous nous retrouvons.',
                  intention?.mot_cle_phrase_2 || 'nous',
                  accentColor
                )}
              </p>
            </div>
          )}
          
          {/* Step 5: Silence - text fades out */}
          {step === 5 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p 
                className="text-white text-lg sm:text-2xl md:text-[28px] max-w-2xl leading-relaxed animate-fade-out"
              >
                {intention?.phrase_ligne_1 || 'Pendant des siècles on nous a séparés.'}
              </p>
              <p 
                className="text-white text-lg sm:text-2xl md:text-[28px] max-w-2xl leading-relaxed mt-8 animate-fade-out"
              >
                {highlightKeyword(
                  intention?.phrase_ligne_2 || 'Le 22 Mai 2026 — nous nous retrouvons.',
                  intention?.mot_cle_phrase_2 || 'nous',
                  accentColor
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP 6: La Question */}
      {step === 6 && (
        <div className="absolute inset-0">
          {/* Keep background from previous step */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: intention?.image_annee_url 
                ? `url(${intention.image_annee_url})`
                : 'linear-gradient(135deg, #2A2420 0%, #1A1A1A 100%)',
              transform: 'scale(1.05)',
            }}
          />
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: 'rgba(26, 26, 26, 0.65)' }}
          />
          
          {/* Question content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <h2 
              className="text-white text-xl sm:text-2xl md:text-[28px] mb-12 animate-fade-in"
            >
              Qu'est-ce que vous portez ?
            </h2>
            
            {/* Identity options */}
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {IDENTITIES.map((identity, index) => (
                <button
                  key={identity.id}
                  onClick={() => handleIdentitySelect(identity)}
                  onMouseEnter={() => {
                    setHoveredIdentity(identity.id);
                    playIdentitySound(identity.id);
                  }}
                  onMouseLeave={() => setHoveredIdentity(null)}
                  className={`
                    flex items-center gap-4 px-5 py-4 rounded-lg text-left
                    transition-all duration-200 ease-out
                    ${visibleIdentities.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  `}
                  style={{
                    backgroundColor: hoveredIdentity === identity.id ? `${accentColor}15` : 'transparent',
                    borderLeft: hoveredIdentity === identity.id ? `3px solid ${accentColor}` : '3px solid transparent',
                    transitionDelay: `${index * 0.3}s`,
                  }}
                  data-testid={`identity-${identity.id}`}
                >
                  <span className="text-2xl">{identity.emoji}</span>
                  <span className="text-white text-lg sm:text-xl">{identity.label}</span>
                </button>
              ))}
            </div>
            
            {/* Skip button */}
            {showSkip && (
              <button
                onClick={handleSkip}
                className="absolute bottom-8 right-8 text-sm text-gray-500 hover:text-gray-400 transition-colors animate-fade-in"
                data-testid="skip-intro"
              >
                Passer →
              </button>
            )}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes breathe {
          0% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }
        
        @keyframes drumPulse {
          0% { opacity: 0.8; transform: scale(0.9); }
          30% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.3); }
        }
        
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes fade-in-out {
          0% { opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-fade-out {
          animation: fade-out 0.8s ease-out forwards;
        }
        
        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out forwards;
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

// Return visitor welcome message component
export const ReturnWelcome = () => {
  const [show, setShow] = useState(false);
  const [identity, setIdentity] = useState(null);

  useEffect(() => {
    const visited = localStorage.getItem('kk_visited');
    const storedIdentity = localStorage.getItem('kk_identity');
    
    if (visited && storedIdentity) {
      setIdentity(storedIdentity);
      
      // Fade in after 1s, stay 3s, fade out
      setTimeout(() => setShow(true), 1000);
      setTimeout(() => setShow(false), 4000);
    }
  }, []);

  if (!identity || !RETURN_MESSAGES[identity]) return null;

  return (
    <div 
      className={`
        fixed top-20 left-6 z-40 text-sm text-gray-400
        transition-opacity duration-1000
        ${show ? 'opacity-100' : 'opacity-0'}
      `}
      style={{ pointerEvents: 'none' }}
    >
      {RETURN_MESSAGES[identity]}
    </div>
  );
};

export default IntroSequence;
