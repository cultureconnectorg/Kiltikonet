import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Layers, Zap, Send, Sparkles, Code, Rocket, FolderOpen, SquarePen, ShieldCheck, BarChart3, PlusCircle, Utensils, Music, FileText, Save, Video, Wand2, Crop, Languages, Keyboard, Briefcase, Store, CheckCircle, ChevronRight, Clapperboard } from "lucide-react";

export default function BuilderView({ onBack, onSelect }) {
  const [subView, setSubView] = useState("projects");
  const [activeTool, setActiveTool] = useState(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  const navItems = [
    { id: "projects", label: "Projets", icon: FolderOpen },
    { id: "studio", label: "Studio", icon: SquarePen },
    { id: "frek", label: "FREK", icon: ShieldCheck },
    { id: "publish", label: "Publier", icon: Rocket },
    { id: "analytics", label: "Stats", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden text-white flex-col" style={{ background: '#050505' }} data-testid="builder-view">
      <header className="h-16 flex items-center justify-between px-6 backdrop-blur-md z-50 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-4">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242,202,80,0.1)', color: '#f2ca50', border: '1px solid rgba(242,202,80,0.2)' }}>
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div className="italic text-xl tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>
            Builder <span className="font-sans text-[10px] tracking-[0.2em] text-gray-500 uppercase ml-2" style={{ fontStyle: 'normal' }}>STAGING</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSelect("wallet")} className="flex items-center gap-1.5 rounded-full px-3 py-1 cursor-pointer transition-all" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
            <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#f2ca50', boxShadow: '0 0 8px #f2ca50' }} />
            <span className="font-mono text-[9px] tracking-widest font-bold" style={{ color: 'rgba(242,202,80,0.8)' }}>24 JCC</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSelect("frek_id")} className="flex items-center gap-1.5 rounded-full px-3 py-1 cursor-pointer transition-all" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
            <span className="font-mono text-[9px] tracking-widest font-bold uppercase" style={{ color: 'rgba(242,202,80,0.8)' }}>FREK-ID: 99421</span>
          </motion.div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setSubView("publish")} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#f2ca50] hover:text-black transition-all" style={{ background: 'rgba(242,202,80,0.1)', border: '1px solid rgba(242,202,80,0.2)', color: '#f2ca50' }}>
            <Rocket className="w-4 h-4" />
          </motion.button>
        </div>
      </header>

      <main className="flex-1 relative overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {subView === "projects" && (
            <motion.div key="projects" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[{ label: "Projets actifs", value: "3", delta: "↑ 1 cette semaine" }, { label: "Vues totales", value: "16.8K", delta: "↑ 12% J-7" }, { label: "JCC solde", value: "24", delta: "↑ 5 bonus" }, { label: "FREK étapes", value: "2/5", delta: "Workshop en cours" }].map((stat, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="text-2xl font-bold" style={{ color: '#f2ca50' }}>{stat.value}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{stat.label}</div>
                    <div className="text-[9px] text-green-500 mt-2">{stat.delta}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setSubView("studio")} className="w-full py-4 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all" style={{ background: '#f2ca50', color: 'black' }}>
                <PlusCircle className="w-5 h-5" />NOUVEAU PROJET
              </button>
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-[10px] tracking-[0.4em] text-gray-500 uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Mes Projets</h3>
                  <button className="text-[10px] tracking-widest uppercase" style={{ color: '#f2ca50' }}>Filtrer</button>
                </div>
                {[{ title: "Ti' Punch & Identité Créole", cat: "Gastronomie", views: "3,312", status: "Publié", icon: Utensils, color: "text-[#f2ca50]" }, { title: "Session Studio — Beat Zouk", cat: "Musique", views: "1,242", status: "Staging", icon: Music, color: "text-purple-500" }, { title: "Untitled — Court métrage", cat: "Vidéo", views: "0", status: "Brouillon", icon: FileText, color: "text-gray-500" }].map((proj, i) => {
                  const Icon = proj.icon;
                  return (
                    <motion.div key={i} whileHover={{ scale: 1.01 }} className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 cursor-pointer" style={{ border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => setSubView("studio")}>
                      <div className="w-16 h-16 rounded-xl bg-black/40 flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.05)' }}><Icon className={`w-8 h-8 ${proj.color}`} /></div>
                      <div className="flex-1">
                        <h4 className="italic text-lg" style={{ fontFamily: "'Noto Serif', serif" }}>{proj.title}</h4>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{proj.cat} · {proj.views} vues</div>
                        <div className="mt-2 inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/5 text-[8px] uppercase tracking-widest text-gray-400" style={{ border: '1px solid rgba(255,255,255,0.1)' }}><CheckCircle className="w-2 h-2" />{proj.status}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {subView === "studio" && (
            <motion.div key="studio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setSubView("projects")} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
                <input className="bg-transparent border-none outline-none italic text-2xl flex-1" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }} defaultValue="Ti' Punch & Identité Créole" />
                <button className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242,202,80,0.1)', color: '#f2ca50', border: '1px solid rgba(242,202,80,0.2)' }}><Save className="w-4 h-4" /></button>
              </div>
              <div className={`aspect-video rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${mediaLoaded ? 'bg-black' : 'bg-white/5 hover:bg-white/10'}`} style={{ border: mediaLoaded ? '2px solid rgba(255,255,255,0.1)' : '2px dashed rgba(255,255,255,0.1)' }} onClick={() => setMediaLoaded(true)}>
                {!mediaLoaded ? (<><Video className="w-12 h-12" style={{ color: 'rgba(242,202,80,0.4)' }} /><div className="text-center"><div className="text-[10px] tracking-widest text-gray-500 uppercase">Tapez pour importer</div><div className="text-[8px] text-gray-600 uppercase mt-1">MP4 · MOV · WAV · MP3</div></div></>) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8">
                    <div className="flex items-end gap-1 h-12 mb-4">
                      {[0.4, 0.8, 0.5, 1, 0.7, 0.3, 0.9, 0.6].map((h, i) => (<motion.div key={i} animate={{ height: [`${h * 100}%`, `${(1 - h) * 100}%`, `${h * 100}%`] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }} className="w-1.5 rounded-full" style={{ background: '#f2ca50' }} />))}
                    </div>
                    <div className="font-mono text-[10px]" style={{ color: '#f2ca50' }}>ti_punch_session.mp4 · 02:34</div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[{ id: "audio", label: "Audio", icon: Music }, { id: "captions", label: "Subtitles", icon: Languages }, { id: "text", label: "Text", icon: Keyboard }, { id: "effects", label: "Effects", icon: Wand2 }, { id: "crop", label: "Format", icon: Crop }].map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button key={tool.id} onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)} className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all"
                      style={activeTool === tool.id ? { background: 'rgba(242,202,80,0.1)', border: '1px solid #f2ca50', color: '#f2ca50' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgb(107,114,128)' }}>
                      <Icon className="w-5 h-5" /><span className="text-[8px] uppercase tracking-widest">{tool.label}</span>
                    </button>
                  );
                })}
              </div>
              {activeTool && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-white/5 rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="text-[10px] uppercase tracking-widest mb-4" style={{ color: '#f2ca50' }}>{activeTool} Settings</div>
                  <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => (<div key={i} className="h-10 bg-black/40 rounded-xl flex items-center px-4 text-[10px] text-gray-400" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>Option {i}</div>))}</div>
                </motion.div>
              )}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-2">Description</div>
                  <textarea className="w-full bg-transparent border-none outline-none text-sm text-gray-300 resize-none h-20" placeholder="Décris ton contenu..." defaultValue="La canne à sucre comme mémoire vivante. Un récit de résistance et de saveurs." />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSubView("frek")} className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-bold tracking-widest flex items-center justify-center gap-2" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#f2ca50' }}><ShieldCheck className="w-4 h-4" />CERTIFIER FREK-ID</button>
                  <button onClick={() => setSubView("publish")} className="flex-1 py-3 rounded-xl text-[10px] font-bold tracking-widest flex items-center justify-center gap-2" style={{ background: '#f2ca50', color: 'black' }}><Rocket className="w-4 h-4" />PUBLIER</button>
                </div>
              </div>
            </motion.div>
          )}

          {subView === "frek" && (
            <motion.div key="frek" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="p-6 space-y-8">
              <div className="space-y-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Architecture Luciole · FREK v2</div>
                <h2 className="italic text-3xl" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Certification FREK-ID</h2>
                <p className="text-xs text-gray-400 leading-relaxed">Identité culturelle souveraine. ~2.5KB/œuvre. 3% visible, 97% invisible.</p>
              </div>
              <div className="space-y-3">
                {[{ id: 1, title: "GENESIS", sub: "Création identité · email unique", status: "Complété", done: true }, { id: 2, title: "WORKSHOP", sub: "Soumission de l'œuvre · Analyse CVL", status: "En cours", active: true }, { id: 3, title: "MÉTAMORPHOSE", sub: "Validation communautaire", status: "Verrouillé", locked: true }, { id: 4, title: "ÉMISSION", sub: "Certification officielle · JCC", status: "Verrouillé", locked: true }].map((step) => (
                  <div key={step.id} className={`p-4 rounded-2xl flex items-center gap-4 transition-all ${step.locked ? 'opacity-40' : ''}`}
                    style={{ background: step.active ? 'rgba(242,202,80,0.05)' : 'rgba(255,255,255,0.05)', border: step.active ? '1px solid rgba(242,202,80,0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs`}
                      style={step.done ? { background: 'rgba(34,197,94,0.2)', color: '#22c55e' } : step.active ? { background: '#f2ca50', color: 'black' } : { background: 'rgba(255,255,255,0.1)', color: 'rgb(107,114,128)' }}>
                      {step.done ? <CheckCircle className="w-4 h-4" /> : step.id}
                    </div>
                    <div className="flex-1"><div className="text-sm font-bold">{step.title}</div><div className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">{step.sub}</div></div>
                    <div className={`text-[8px] uppercase tracking-widest font-bold`} style={{ color: step.done ? '#22c55e' : step.active ? '#f2ca50' : 'rgb(75,85,99)' }}>{step.status}</div>
                  </div>
                ))}
              </div>
              <button className="w-full py-4 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-2" style={{ background: '#f2ca50', color: 'black' }}><Send className="w-5 h-5" />SOUMETTRE AU WORKSHOP</button>
            </motion.div>
          )}

          {subView === "publish" && (
            <motion.div key="publish" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-6 space-y-8">
              <div className="space-y-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Étape finale</div>
                <h2 className="italic text-3xl" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Publication</h2>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 space-y-6" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Canal de diffusion</div>
                {[{ id: "feed", title: "Feed Public", desc: "Visible par tous · SPA1 Feed User", icon: Clapperboard, color: "text-[#f2ca50]" }, { id: "pro", title: "Espace Pro", desc: "Réservé aux membres Pro · Premium", icon: Briefcase, color: "text-purple-500" }, { id: "shop", title: "Shop + Jeton CC", desc: "Contenu payant · Prix en JCC", icon: Store, color: "text-green-500" }].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <div key={opt.id} className="flex items-center gap-4 p-4 rounded-xl bg-black/40 cursor-pointer hover:border-[rgba(242,202,80,0.3)] transition-all" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><Icon className={`w-5 h-5 ${opt.color}`} /></div>
                      <div className="flex-1"><div className="text-sm font-bold">{opt.title}</div><div className="text-[9px] text-gray-500 mt-0.5">{opt.desc}</div></div>
                      <div className="w-4 h-4 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.2)' }} />
                    </div>
                  );
                })}
              </div>
              <button className="w-full py-4 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-2" style={{ background: '#f2ca50', color: 'black' }}><Rocket className="w-5 h-5" />PUBLIER MAINTENANT</button>
            </motion.div>
          )}

          {subView === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-8">
              <h2 className="italic text-3xl" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Analytics</h2>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: "Vues totales", value: "16.8K", delta: "+12%" }, { label: "Taux complétion", value: "89%", delta: "+4%" }, { label: "Likes Feed", value: "8.4K", delta: "+22%" }, { label: "Revenus Shop", value: "36 JCC", delta: "54 €" }].map((stat, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="text-2xl font-bold" style={{ color: '#f2ca50' }}>{stat.value}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{stat.label}</div>
                    <div className="text-[9px] text-green-500 mt-2">{stat.delta}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="h-20 flex items-center justify-around px-4 shrink-0 z-50 backdrop-blur-xl" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
        {navItems.map((item) => { const Icon = item.icon; return (
          <button key={item.id} onClick={() => setSubView(item.id)} className={`flex flex-col items-center gap-1.5 transition-all ${subView === item.id ? '' : 'text-gray-500'}`} style={subView === item.id ? { color: '#f2ca50' } : {}}>
            <Icon className="w-5 h-5" /><span className="text-[8px] uppercase tracking-[0.2em] font-bold">{item.label}</span>
          </button>
        ); })}
      </nav>
    </div>
  );
}
