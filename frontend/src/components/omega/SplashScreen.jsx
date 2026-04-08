import { useState, useRef, useEffect } from 'react';

export function SplashScreen({ onComplete }) {
  const [ended, setEnded] = useState(false);
  const [fallback, setFallback] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Fallback: if video doesn't start within 3s, skip
    timerRef.current = setTimeout(() => {
      if (!ended) {
        setFallback(true);
        setEnded(true);
        onComplete();
      }
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, [ended, onComplete]);

  const handleEnded = () => {
    clearTimeout(timerRef.current);
    setEnded(true);
    onComplete();
  };

  const handleCanPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        setFallback(true);
        setEnded(true);
        onComplete();
      });
    }
  };

  if (ended) return null;

  return (
    <div
      data-testid="splash-screen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!fallback ? (
        <video
          ref={videoRef}
          onEnded={handleEnded}
          onCanPlay={handleCanPlay}
          playsInline
          muted
          preload="auto"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/media/splash.webm" type="video/webm" />
          <source src="/media/splash.mp4" type="video/mp4" />
        </video>
      ) : (
        <img
          src="/logo.png"
          alt="Kiltikonet"
          style={{ maxWidth: 200, opacity: 0.8 }}
        />
      )}
    </div>
  );
}
