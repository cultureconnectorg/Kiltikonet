import { useState } from "react";
import Background from "./Background";
import OrbitalMenu from "./OrbitalMenu";

/**
 * ProApp — Espace Pro Omega (ITER.57 : coquille visuelle mockée)
 * Fullscreen immersif, aucun élément de la vitrine.
 * Étape 1 : Background + OrbitalMenu uniquement.
 */
export default function ProApp() {
  const [selectedView, setSelectedView] = useState(null);

  const handleSelect = (id) => {
    setSelectedView(id);
    // ITER.57 : mock — pas de navigation réelle, juste un log console
    console.log("[Omega] Section sélectionnée :", id);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden text-white" style={{ background: '#0e0e0e' }} data-testid="pro-app">
      <Background />
      <OrbitalMenu onSelect={handleSelect} />

      {/* Global Overlay Effects (from original Omega App.tsx) */}
      <div className="fixed inset-0 pointer-events-none z-[100] mix-blend-overlay" style={{ opacity: 0.03, backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
      <div className="fixed inset-0 pointer-events-none z-[100]" style={{ backgroundImage: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%)', backgroundSize: '100% 4px', opacity: 0.2 }} />
      <div className="fixed inset-0 pointer-events-none z-[100]" style={{ border: '1px solid rgba(242,202,80,0.05)' }} />
    </div>
  );
}
