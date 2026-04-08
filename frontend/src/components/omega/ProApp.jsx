import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useWallet } from "../../hooks/useWallet";
import { useAdhesion } from "../../hooks/useAdhesion";
import { motion, AnimatePresence } from "motion/react";
import Background from "./Background";
import OrbitalMenu from "./OrbitalMenu";
import ContentDisplay from "./ContentDisplay";
import BrainChat from "./BrainChat";
import WalletView from "./WalletView";
import ShopView from "./ShopView";
import CockpitView from "./CockpitView";
import AgendaView from "./AgendaView";
import AccreditationView from "./AccreditationView";
import FeedView from "./FeedView";
import InboxView from "./InboxView";
import SovereignProfileView from "./SovereignProfileView";
import BuilderView from "./BuilderView";
import { SplashScreen } from "./SplashScreen";
import { Download, X } from "lucide-react";

/**
 * ProApp — Espace Pro Omega (ITER.58 : câblé données réelles)
 * Fullscreen immersif, aucun élément de la vitrine.
 */
export default function ProApp() {
  const [currentView, setCurrentView] = useState("orbital");
  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem('kk_splash_done') === '1';
  });
  const { user, doctrine, isAuthenticated, loading: authLoading, logout, refresh: refreshAuth } = useAuth();
  const { solde, transactions, refresh: refreshWallet, debit, credit } = useWallet('CC');
  const { adhesion, levels: adhesionLevels, subscribe, cancel: cancelAdhesion, refresh: refreshAdhesion } = useAdhesion();

  const frekId = user?.frek_id || '';
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Souverain';
  const adhesionLevel = adhesion?.level || 'FREE';
  const balance = solde;

  // Expose frekId globally for hooks that need it
  useEffect(() => { window.__KILTI_FREK_ID = frekId; }, [frekId]);

  const addTransaction = useCallback((tx) => {
    refreshWallet();
  }, [refreshWallet]);

  const handleSelect = (id) => {
    switch (id) {
      case "brain": setCurrentView("brain"); break;
      case "wallet": setCurrentView("wallet"); break;
      case "shop": setCurrentView("shop"); break;
      case "feed": case "quick_feed": setCurrentView("feed"); break;
      case "inbox": setCurrentView("inbox"); break;
      case "build": case "builder": setCurrentView("builder"); break;
      case "cockpit": setCurrentView("cockpit"); break;
      case "agenda": setCurrentView("agenda"); break;
      case "accreditation": setCurrentView("accreditation"); break;
      case "frek_id": case "frek-id": setCurrentView("profile"); break;
      case "admin": setCurrentView("profile"); break;
      default: break;
    }
  };

  const handleBack = () => setCurrentView("orbital");

  // Welcome modal for first login
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cc2026_pro_session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.first_login) {
          setShowWelcome(true);
        }
      }
    } catch { /* silent */ }
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    try {
      const raw = sessionStorage.getItem('cc2026_pro_session');
      if (raw) {
        const s = JSON.parse(raw);
        s.first_login = false;
        sessionStorage.setItem('cc2026_pro_session', JSON.stringify(s));
      }
    } catch { /* silent */ }
  };

  // Auth context passed to child components
  const authCtx = { user, frekId, userName, adhesionLevel, isAuthenticated, doctrine, logout, refreshAuth };

  // PWA Install prompt
  const deferredPromptRef = useRef(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      const dismissed = localStorage.getItem('kk_pwa_dismissed');
      if (!dismissed) setShowPwaPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Push Notifications — subscribe on mount
  useEffect(() => {
    const subscribePush = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      if (Notification.permission === 'denied') return;
      if (localStorage.getItem('kk_push_asked')) return;

      try {
        const permission = await Notification.requestPermission();
        localStorage.setItem('kk_push_asked', '1');
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        // Convert VAPID key
        const padding = '='.repeat((4 - (vapidKey.length % 4)) % 4);
        const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray,
        });

        const API = process.env.REACT_APP_BACKEND_URL;
        await fetch(`${API}/api/notifications/push/subscribe`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
      } catch {}
    };
    if (isAuthenticated) subscribePush();
  }, [isAuthenticated]);

  const handleInstallPwa = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      const API = process.env.REACT_APP_BACKEND_URL;
      fetch(`${API}/api/analytics/track`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_type: 'pwa_install' }) }).catch(() => {});
    }
    deferredPromptRef.current = null;
    setShowPwaPrompt(false);
  };

  const dismissPwaPrompt = () => {
    setShowPwaPrompt(false);
    localStorage.setItem('kk_pwa_dismissed', '1');
  };

  // Get welcome data from session
  const sessionData = (() => {
    try { return JSON.parse(sessionStorage.getItem('cc2026_pro_session') || '{}'); }
    catch { return {}; }
  })();

  return (
    <div className="relative w-full h-screen overflow-hidden text-white" style={{ background: '#0e0e0e' }} data-testid="pro-app">
      {!splashDone && (
        <SplashScreen onComplete={() => { setSplashDone(true); sessionStorage.setItem('kk_splash_done', '1'); }} />
      )}

      {splashDone && currentView === "orbital" && (
        <>
          <Background />
          <OrbitalMenu onSelect={handleSelect} balance={balance} frekId={frekId} />
        </>
      )}

      {currentView === "brain" && (
        <BrainChat onBack={handleBack} onSelect={handleSelect} balance={balance} auth={authCtx} />
      )}

      {currentView === "wallet" && (
        <WalletView onBack={handleBack} onSelect={handleSelect} balance={balance} setBalance={() => refreshWallet()} transactions={transactions} addTransaction={addTransaction} auth={authCtx} adhesion={adhesion} />
      )}

      {currentView === "shop" && (
        <ShopView onBack={handleBack} onSelect={handleSelect} balance={balance} auth={authCtx} />
      )}

      {currentView === "feed" && (
        <FeedView onBack={handleBack} onNavigate={handleSelect} auth={authCtx} />
      )}

      {currentView === "inbox" && (
        <InboxView onBack={handleBack} onSelect={handleSelect} auth={authCtx} />
      )}

      {currentView === "cockpit" && (
        <CockpitView onBack={handleBack} onSelect={handleSelect} auth={authCtx} />
      )}

      {currentView === "agenda" && (
        <AgendaView onBack={handleBack} auth={authCtx} />
      )}

      {currentView === "accreditation" && (
        <AccreditationView onBack={handleBack} auth={authCtx} />
      )}

      {currentView === "builder" && (
        <BuilderView onBack={handleBack} onSelect={handleSelect} auth={authCtx} />
      )}

      {currentView === "profile" && (
        <SovereignProfileView onBack={handleBack} auth={authCtx} adhesion={adhesion} adhesionLevels={adhesionLevels} onSubscribe={subscribe} onCancelAdhesion={cancelAdhesion} />
      )}

      {currentView === "content" && (
        <ContentDisplay onBack={handleBack} onSelectBrainChat={() => setCurrentView("brain")} onNavigate={handleSelect} />
      )}

      {currentView === "orbital" && (
        <>
          <div className="fixed inset-0 pointer-events-none z-[100] mix-blend-overlay" style={{ opacity: 0.03, backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
          <div className="fixed inset-0 pointer-events-none z-[100]" style={{ backgroundImage: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%)', backgroundSize: '100% 4px', opacity: 0.2 }} />
          <div className="fixed inset-0 pointer-events-none z-[100]" style={{ border: '1px solid rgba(242,202,80,0.05)' }} />
        </>
      )}

      {/* Welcome Modal for first login */}
      <AnimatePresence>
        {showWelcome && splashDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
            data-testid="welcome-modal">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="max-w-sm w-full mx-4 rounded-3xl p-8 text-center"
              style={{ background: '#1a1a1c', border: '1px solid rgba(242,202,80,0.3)' }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(242,202,80,0.1)', border: '2px solid rgba(242,202,80,0.3)' }}>
                <span className="text-2xl" style={{ color: '#f2ca50' }}>K</span>
              </div>
              <h2 className="text-2xl italic mb-2" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>
                Bienvenue {sessionData.name?.split(' ')[0] || userName}
              </h2>
              <p className="text-sm text-gray-400 mb-6">Ton identite culturelle souveraine est prete.</p>
              <div className="rounded-2xl p-4 mb-4" style={{ background: '#0a0a0b', border: '1px solid rgba(242,202,80,0.2)' }}>
                <div className="text-[9px] uppercase tracking-[0.3em] mb-2" style={{ color: 'rgba(242,202,80,0.5)' }}>Ton FREK-ID</div>
                <div className="font-mono text-lg font-bold" style={{ color: '#f2ca50' }}>{sessionData.frek_id || frekId}</div>
              </div>
              <div className="rounded-2xl p-4 mb-6" style={{ background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-[9px] uppercase tracking-[0.3em] mb-2 text-gray-500">Credits de bienvenue</div>
                <div className="text-lg font-bold text-white">{sessionData.welcome_kt || 10} <span className="text-xs text-gray-400">KT</span></div>
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={dismissWelcome}
                className="w-full py-4 rounded-2xl font-bold tracking-widest text-sm"
                style={{ background: '#f2ca50', color: '#0a0a0b' }}
                data-testid="welcome-explore-btn">
                Explorer l'Espace Pro
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Prompt */}
      <AnimatePresence>
        {showPwaPrompt && splashDone && !showWelcome && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-[9998] max-w-md mx-auto"
            data-testid="pwa-install-prompt">
            <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: '#1a1a1c', border: '1px solid rgba(242,202,80,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: 'rgba(242,202,80,0.1)', border: '1px solid rgba(242,202,80,0.2)' }}>
                <img src="/logo-kiltikonet.png" alt="" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">Installer Kiltikonet</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Acces rapide depuis ton ecran d'accueil</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleInstallPwa}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase"
                  style={{ background: '#f2ca50', color: '#0a0a0b' }} data-testid="pwa-install-btn">
                  <Download className="w-3.5 h-3.5" />
                </motion.button>
                <button onClick={dismissPwaPrompt} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500" data-testid="pwa-dismiss-btn">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
