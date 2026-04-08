import { useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useWallet } from "../../hooks/useWallet";
import { useAdhesion } from "../../hooks/useAdhesion";
import Background from "./Background";
import OrbitalMenu from "./OrbitalMenu";
import ContentDisplay from "./ContentDisplay";
import BrainChat from "./BrainChat";
import WalletView from "./WalletView";
import ShopView from "./ShopView";
import CockpitView from "./CockpitView";
import FeedView from "./FeedView";
import InboxView from "./InboxView";
import SovereignProfileView from "./SovereignProfileView";
import BuilderView from "./BuilderView";

/**
 * ProApp — Espace Pro Omega (ITER.58 : câblé données réelles)
 * Fullscreen immersif, aucun élément de la vitrine.
 */
export default function ProApp() {
  const [currentView, setCurrentView] = useState("orbital");
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
      case "frek_id": case "frek-id": setCurrentView("profile"); break;
      case "admin": setCurrentView("profile"); break;
      default: break;
    }
  };

  const handleBack = () => setCurrentView("orbital");

  // Auth context passed to child components
  const authCtx = { user, frekId, userName, adhesionLevel, isAuthenticated, doctrine, logout, refreshAuth };

  return (
    <div className="relative w-full h-screen overflow-hidden text-white" style={{ background: '#0e0e0e' }} data-testid="pro-app">
      {currentView === "orbital" && (
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
    </div>
  );
}
