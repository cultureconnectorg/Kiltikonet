import { useEffect, useState } from 'react';

export function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out at 1.7s, call onComplete at 2s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1700);
    const completeTimer = setTimeout(() => onComplete(), 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

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
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
      }}
    >
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
    </div>
  );
}
