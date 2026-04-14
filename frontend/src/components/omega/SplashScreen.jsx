import { useRef, useEffect } from 'react';

export function SplashScreen({ onComplete }) {
  const videoRef = useRef(null);
  const completedRef = useRef(false);

  const done = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) { done(); return; }

    const tryPlay = async () => {
      try {
        v.muted = true;
        await v.play();
      } catch {
        // Video can't play on this device — logo is already visible, auto-complete after 3s
        setTimeout(done, 3000);
      }
    };

    if (v.readyState >= 2) {
      tryPlay();
    } else {
      v.addEventListener('canplay', tryPlay, { once: true });
      // If canplay never fires within 2s, show logo for 3s
      setTimeout(() => {
        if (!completedRef.current && !v.currentTime) setTimeout(done, 3000);
      }, 2000);
    }

    // Safety: max 8s then force complete
    const safety = setTimeout(() => { if (!completedRef.current) done(); }, 8000);
    return () => clearTimeout(safety);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: '#0a0a0b' }} data-testid="splash-screen">
      {/* Video layer */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover z-0" playsInline muted onEnded={done} onError={() => setTimeout(done, 3000)}>
        <source src="/videos/splash.webm" type="video/webm" />
        <source src="/videos/splash.mp4" type="video/mp4" />
      </video>

      {/* Logo fallback — always visible behind video */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <style>{`
          @keyframes kilti-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
          @keyframes kilti-glow { 0%, 100% { filter: drop-shadow(0 0 20px rgba(242,202,80,0.3)); } 50% { filter: drop-shadow(0 0 50px rgba(242,202,80,0.6)); } }
        `}</style>
        <img src="/logo-kiltikonet.png" alt="" draggable={false}
          style={{ width: 120, height: 120, objectFit: 'contain', animation: 'kilti-breathe 2s ease-in-out infinite, kilti-glow 2s ease-in-out infinite' }} />
      </div>

      {/* Skip */}
      <button onClick={done} className="absolute bottom-12 text-white/30 text-xs tracking-widest uppercase z-20" data-testid="splash-skip">
        Passer
      </button>
    </div>
  );
}
