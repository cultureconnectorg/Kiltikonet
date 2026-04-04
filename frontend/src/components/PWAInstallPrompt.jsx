import React, { useState, useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa_prompt_shown') === 'true') return;

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setVisible(false); });

    // Show after 30s
    const timer = setTimeout(() => {
      if (isIOSDevice || window.__pwa_deferred) setVisible(true);
    }, 30000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  // When deferredPrompt is captured, mark it
  useEffect(() => {
    if (deferredPrompt) {
      window.__pwa_deferred = true;
      const timer = setTimeout(() => {
        if (!localStorage.getItem('pwa_prompt_shown')) setVisible(true);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        // Track
        try { await axios.post(`${API}/api/analytics/batch`, { events: [{ event_type: 'pwa_install', page: window.location.pathname, timestamp: new Date().toISOString() }] }); } catch {}
      }
      setDeferredPrompt(null);
    }
    handleDismiss();
  }, [deferredPrompt]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa_prompt_shown', 'true');
  };

  if (!visible || installed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] animate-slide-up" data-testid="pwa-install-prompt"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mx-auto max-w-lg px-4 pb-4">
        <div className="rounded-2xl p-5 relative"
          style={{ background: '#0a0a0b', borderTop: '1px solid rgba(232,213,160,0.2)', border: '1px solid rgba(232,213,160,0.12)', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}>
          
          {/* Close */}
          <button onClick={handleDismiss} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/5 transition-colors" data-testid="pwa-close-btn">
            <X size={16} style={{ color: '#72727a' }} />
          </button>

          <div className="flex items-start gap-4">
            {/* App Icon */}
            <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(232,213,160,0.15), rgba(232,213,160,0.05))', border: '1px solid rgba(232,213,160,0.2)' }}>
              <span className="text-lg font-bold" style={{ color: '#E8D5A0' }}>KK</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white leading-tight">Ajoute Kiltikonet sur ton ecran</h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#72727a' }}>
                Acces instantane · Fonctionne hors-ligne · Notifications CC2026
              </p>
            </div>
          </div>

          {isIOS ? (
            /* iOS instructions */
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(232,213,160,0.06)' }}>
                <span className="text-lg flex-shrink-0">1.</span>
                <div>
                  <p className="text-sm text-white">Appuie sur <span style={{ color: '#E8D5A0' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  </span> (Partager)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(232,213,160,0.06)' }}>
                <span className="text-lg flex-shrink-0">2.</span>
                <p className="text-sm text-white">Puis <span style={{ color: '#E8D5A0' }}>"Sur l'ecran d'accueil"</span></p>
              </div>
              <button onClick={handleDismiss} className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97]"
                style={{ background: '#E8D5A0', color: '#0a0a0b' }} data-testid="pwa-ios-understood-btn">
                Compris
              </button>
            </div>
          ) : (
            /* Android / Desktop */
            <div className="mt-4 space-y-2">
              <button onClick={handleInstall} className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.97]"
                style={{ background: '#E8D5A0', color: '#0a0a0b' }} data-testid="pwa-install-btn">
                <Download size={16} />Installer l'app
              </button>
              <button onClick={handleDismiss} className="w-full py-2 text-center text-xs transition-colors"
                style={{ color: '#72727a' }} data-testid="pwa-later-btn">
                Plus tard
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 300ms ease-out; }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;
