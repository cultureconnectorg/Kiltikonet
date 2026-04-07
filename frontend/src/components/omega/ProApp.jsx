import { useState, useCallback } from "react";
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
 * ProApp — Espace Pro Omega (ITER.57 : coquille visuelle mockée)
 * Fullscreen immersif, aucun élément de la vitrine.
 * Toutes les données sont MOCKÉES (zéro API, réservé ITER.58).
 */
export default function ProApp() {
  const [currentView, setCurrentView] = useState("orbital");
  const [balance, setBalance] = useState(24);
  const [transactions, setTransactions] = useState([
    { id: "t1", type: "receive", label: "Bonus Inscription", amount: "+10 JCC", date: "Aujourd'hui", status: "confirmé" },
    { id: "t2", type: "receive", label: "Récompense Brain", amount: "+5 JCC", date: "Hier", status: "confirmé" },
    { id: "t3", type: "send", label: "Achat Shop", amount: "-3 JCC", date: "Hier", status: "confirmé" },
  ]);

  const addTransaction = useCallback((tx) => {
    setTransactions(prev => [{ ...tx, id: Date.now().toString(), date: "À l'instant", status: "confirmé" }, ...prev]);
  }, []);

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
      default: console.log("[Omega] Section:", id);
    }
  };

  const handleBack = () => setCurrentView("orbital");

  return (
    <div className="relative w-full h-screen overflow-hidden text-white" style={{ background: '#0e0e0e' }} data-testid="pro-app">
      {currentView === "orbital" && (
        <>
          <Background />
          <OrbitalMenu onSelect={handleSelect} />
        </>
      )}

      {currentView === "brain" && (
        <BrainChat onBack={handleBack} onSelect={handleSelect} balance={balance} />
      )}

      {currentView === "wallet" && (
        <WalletView onBack={handleBack} onSelect={handleSelect} balance={balance} setBalance={setBalance} transactions={transactions} addTransaction={addTransaction} />
      )}

      {currentView === "shop" && (
        <ShopView onBack={handleBack} onSelect={handleSelect} balance={balance} />
      )}

      {currentView === "feed" && (
        <FeedView onBack={handleBack} onNavigate={handleSelect} />
      )}

      {currentView === "inbox" && (
        <InboxView onBack={handleBack} onSelect={handleSelect} />
      )}

      {currentView === "cockpit" && (
        <CockpitView onBack={handleBack} onSelect={handleSelect} />
      )}

      {currentView === "builder" && (
        <BuilderView onBack={handleBack} onSelect={handleSelect} />
      )}

      {currentView === "profile" && (
        <SovereignProfileView onBack={handleBack} />
      )}

      {currentView === "content" && (
        <ContentDisplay onBack={handleBack} onSelectBrainChat={() => setCurrentView("brain")} onNavigate={handleSelect} />
      )}

      {/* Global Overlay Effects */}
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
