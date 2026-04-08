import { useState, useCallback, useEffect } from "react";
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
    </div>
  );
}
