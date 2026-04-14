import { useRef, useEffect, useState } from 'react';

export function SplashScreen({ onComplete }) {
  const videoRef = useRef(null);
  const [showFallback, setShowFallback] = useState(false);
  const completedRef = useRef(false);

  const done = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    // Fallback: if video doesn't start within 3s, show logo animation
    const fallbackTimer = setTimeout(() => {
      if (!completedRef.current && !videoRef.current?.currentTime) {
        setShowFallback(true);
      }
    }, 3000);
    return () => clearTimeout(fallbackTimer);
  }, []);

  // Fallback: logo animation for 4s then complete
  useEffect(() => {
    if (showFallback) {
      const timer = setTimeout(done, 4000);
      return () => clearTimeout(timer);
    }
  }, [showFallback]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = async () => {
      try {
        // Try with sound first
        v.muted = false;
        await v.play();
      } catch {
        try {
          // Fallback: play muted
          v.muted = true;
          await v.play();
        } catch {
          setShowFallback(true);
        }
      }
    };

    if (v.readyState >= 2) {
      tryPlay();
    } else {
      v.addEventListener('canplay', tryPlay, { once: true });
    }
  }, []);

  return (
    <div
      data-testid="splash-screen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#0a0a0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!showFallback ? (
        <video
          ref={videoRef}
          onEnded={done}
          onError={() => setShowFallback(true)}
          playsInline
          preload="auto"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/videos/splash.webm" type="video/webm" />
          <source src="/videos/splash.mp4" type="video/mp4" />
        </video>
      ) : (
        <>
          <style>{`
            @keyframes kilti-breathe {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.03); }
            }
            @keyframes kilti-glow {
              0%, 100% { filter: drop-shadow(0 0 18px rgba(242, 202, 80, 0.25)); }
              50% { filter: drop-shadow(0 0 38px rgba(242, 202, 80, 0.55)); }
            }
          `}</style>
          <img
            src="/logo-kiltikonet.png"
            alt=""
            draggable={false}
            style={{
              width: 120,
              height: 120,
              objectFit: 'contain',
              animation: 'kilti-breathe 2s ease-in-out infinite, kilti-glow 2s ease-in-out infinite',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </>
      )}
    </div>
  );
}
