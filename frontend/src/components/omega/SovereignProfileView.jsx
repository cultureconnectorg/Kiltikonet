import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, ArrowLeft, Fingerprint, Database, Globe, Cpu, ChevronRight, QrCode, Share2, Download, User, Scale, Award, History, Settings, Shield, Bell, Eye, LogOut, Moon, Volume2 } from "lucide-react";

export default function SovereignProfileView({ onBack }) {
  const [showSettings, setShowSettings] = useState(false);
  const [activeSection, setActiveSection] = useState("account");

  const securityLayers = [
    { label: "Signature Luciole", status: "Active", value: "0x88...f2a1" },
    { label: "Empreinte Culturelle", status: "Verified", value: "2.47 KB" },
    { label: "Protocole Omega", status: "Encrypted", value: "AES-256" },
    { label: "Souveraineté", status: "Absolute", value: "Mainnet" },
  ];
  const governanceStats = [
    { label: "Pouvoir de Vote", value: "12.5%", icon: Scale },
    { label: "Réputation", value: "98/100", icon: Award },
    { label: "Propositions", value: "14", icon: History },
  ];
  const sections = [
    { id: "account", label: "Compte", icon: User, description: "Gérez vos informations personnelles et votre identité FREK." },
    { id: "security", label: "Sécurité", icon: Shield, description: "Protocoles de protection et clés d'accès souveraines." },
    { id: "notifications", label: "Notifications", icon: Bell, description: "Alertes système et mises à jour de la communauté." },
    { id: "privacy", label: "Confidentialité", icon: Eye, description: "Contrôlez la visibilité de vos données sur le réseau." },
    { id: "network", label: "Réseau", icon: Globe, description: "Configuration des nœuds et état de la connexion Mainnet." },
    { id: "system", label: "Système", icon: Settings, description: "Préférences d'interface et performances du Core." },
  ];

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden" style={{ background: '#050505' }} data-testid="profile-view">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'rgba(242,202,80,0.05)', filter: 'blur(120px)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, transparent 0%, #050505 70%)' }} />
      </div>

      <header className="relative h-20 flex items-center justify-between px-6 z-50 shrink-0 backdrop-blur-md" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={showSettings ? () => setShowSettings(false) : onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50] transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex flex-col items-center">
          <span className="italic text-lg tracking-[0.2em] uppercase" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>{showSettings ? "Paramètres" : "Sovereign Identity"}</span>
          <span className="font-mono text-[7px] text-gray-500 tracking-[0.4em] uppercase">{showSettings ? "Configuration du Core Système" : "FREK-ID Protocol v2.4"}</span>
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={showSettings ? { background: '#f2ca50', color: 'black', border: '1px solid #f2ca50' } : { background: 'rgba(255,255,255,0.05)', color: 'rgb(156,163,175)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Settings className="w-5 h-5" />
        </motion.button>
      </header>

      <main className="flex-1 relative z-10 overflow-hidden flex">
        <AnimatePresence mode="wait">
          {!showSettings ? (
            <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 overflow-y-auto p-6 pb-24">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-32 h-32">
                    <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(242,202,80,0.2)', animation: 'spin 20s linear infinite' }} />
                    <div className="absolute inset-2 rounded-full" style={{ border: '1px solid rgba(242,202,80,0.1)', animation: 'spin 15s linear infinite reverse' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full omega-glass flex items-center justify-center overflow-hidden" style={{ border: '1px solid rgba(242,202,80,0.4)', boxShadow: '0 0 30px rgba(242,202,80,0.1)' }}>
                        <Fingerprint className="w-10 h-10 opacity-80" style={{ color: '#f2ca50' }} />
                      </div>
                    </div>
                  </motion.div>
                  <div className="space-y-1">
                    <h1 className="text-2xl italic text-white tracking-wide" style={{ fontFamily: "'Noto Serif', serif" }}>Souverain #99421</h1>
                    <div className="flex items-center justify-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Identité Certifiée Mainnet</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {governanceStats.map((stat, i) => { const Icon = stat.icon; return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="p-4 rounded-2xl bg-white/5 flex flex-col items-center gap-2 text-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Icon className="w-4 h-4" style={{ color: '#f2ca50' }} />
                      <div className="flex flex-col"><span className="text-xs font-bold text-white tracking-tight">{stat.value}</span><span className="text-[7px] text-gray-500 uppercase tracking-widest font-bold">{stat.label}</span></div>
                    </motion.div>
                  ); })}
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-bold px-2">Protocol Layers</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {securityLayers.map((layer, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="p-4 rounded-2xl bg-white/5 flex flex-col gap-1 hover:border-[rgba(242,202,80,0.3)] transition-all cursor-default" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest">{layer.label}</span>
                        <div className="flex items-center justify-between"><span className="text-xs font-bold text-white">{layer.value}</span><div className="w-1 h-1 rounded-full bg-green-500" style={{ boxShadow: '0 0 5px rgba(34,197,94,0.5)' }} /></div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 rounded-2xl font-bold tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 uppercase" style={{ background: '#f2ca50', color: 'black' }}>
                    <QrCode className="w-4 h-4" />Signature Souveraine
                  </motion.button>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 bg-white/5 rounded-xl text-[9px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}><Download className="w-3.5 h-3.5" />Export ID</button>
                    <button className="py-3 bg-white/5 rounded-xl text-[9px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}><Share2 className="w-3.5 h-3.5" />Attestation</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex overflow-hidden">
              <aside className="w-full lg:w-72 flex flex-col bg-black/20" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {sections.map((section) => { const Icon = section.icon; return (
                    <motion.button key={section.id} whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveSection(section.id)}
                      className="w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all"
                      style={activeSection === section.id ? { background: 'rgba(242,202,80,0.05)', borderLeft: '2px solid #f2ca50', color: '#f2ca50' } : { borderLeft: '2px solid transparent', color: 'rgb(107,114,128)' }}>
                      <Icon className="w-5 h-5" style={activeSection === section.id ? { color: '#f2ca50' } : { color: 'rgb(75,85,99)' }} />
                      <div className="flex flex-col"><span className="text-xs font-bold uppercase tracking-widest">{section.label}</span><span className="text-[9px] opacity-60 truncate max-w-[150px]">{section.description}</span></div>
                    </motion.button>
                  ); })}
                </div>
                <div className="p-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button className="w-full py-3 rounded-xl font-bold tracking-widest text-[10px] flex items-center justify-center gap-2 text-red-500 hover:bg-red-500 hover:text-white transition-all" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <LogOut className="w-4 h-4" />DÉCONNEXION
                  </button>
                </div>
              </aside>
              <div className="hidden lg:block flex-1 overflow-y-auto p-8">
                <div className="max-w-2xl mx-auto">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                      <div className="space-y-2">
                        <h2 className="text-2xl italic text-white uppercase tracking-tight" style={{ fontFamily: "'Noto Serif', serif" }}>{sections.find(s => s.id === activeSection)?.label}</h2>
                        <p className="text-xs text-gray-500 max-w-xl">{sections.find(s => s.id === activeSection)?.description}</p>
                      </div>
                      {activeSection === "account" && (
                        <div className="p-6 rounded-3xl bg-white/5 space-y-6" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid rgba(242,202,80,0.3)' }}>
                              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex flex-col"><span className="text-base font-bold text-white uppercase">Souverain #99421</span><span className="text-[10px] text-gray-500">Membre depuis Avril 2026</span></div>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2"><label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold ml-1">Nom d'affichage</label><input type="text" defaultValue="Souverain #99421" className="w-full bg-black/40 rounded-xl py-3 px-4 text-xs outline-none transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }} /></div>
                            <div className="space-y-2"><label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold ml-1">Email</label><input type="email" defaultValue="core@kiltikonet.io" className="w-full bg-black/40 rounded-xl py-3 px-4 text-xs outline-none transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }} /></div>
                          </div>
                        </div>
                      )}
                      {activeSection === "system" && (
                        <div className="p-6 rounded-3xl bg-white/5 space-y-6" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }}><Moon className="w-5 h-5 text-gray-400" /></div>
                              <div className="flex flex-col"><span className="text-sm font-bold text-white">Mode Sombre</span><span className="text-[10px] text-gray-500 uppercase tracking-widest">Interface OLED optimisée</span></div>
                            </div>
                            <div className="w-10 h-5 rounded-full relative cursor-pointer" style={{ background: '#f2ca50' }}><div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full" /></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }}><Volume2 className="w-5 h-5 text-gray-400" /></div>
                              <div className="flex flex-col"><span className="text-sm font-bold text-white">Effets Sonores</span><span className="text-[10px] text-gray-500 uppercase tracking-widest">Feedback audio du Core</span></div>
                            </div>
                            <div className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-3 h-3 bg-gray-500 rounded-full" /></div>
                          </div>
                        </div>
                      )}
                      {activeSection !== "account" && activeSection !== "system" && (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center"><Database className="w-8 h-8 text-gray-700" /></div>
                          <div className="space-y-1"><h3 className="text-base italic text-white uppercase" style={{ fontFamily: "'Noto Serif', serif" }}>Module en cours d'optimisation</h3><p className="text-[10px] text-gray-500 max-w-xs mx-auto">Cette section des paramètres sera disponible lors de la prochaine mise à jour du protocole.</p></div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="relative z-10 py-4 text-center bg-black/20" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
          <Cpu className="w-3 h-3 text-gray-600" /><span className="font-mono text-[7px] text-gray-600 uppercase tracking-widest">Core Engine v2.4.0-stable</span>
        </div>
      </div>
    </div>
  );
}
