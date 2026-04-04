// ═══════════════════════════════════════════════════════════
// SOVEREIGN SECTIONS — Archives, Governance, Vault, Console, Messages
// Design System: Sovereign Onyx (Newsreader + Manrope + Material Symbols)
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

// ─── ARCHIVES SOUVERAINES ───────────────────────────────
export const ArchivesSection = () => {
  const curations = [
    { id: 1, tag: 'Série Originelle', title: 'Les Gardiens du Nok', frekId: '8820-X' },
    { id: 2, tag: 'Patrimoine Textile', title: 'Sagesse des Trames', frekId: '4109-M' },
    { id: 3, tag: 'Tradition Orale', title: "L'Héritage du Madras", frekId: '5523-K' },
    { id: 4, tag: 'Musique Souveraine', title: 'Rythmes du Gwoka', frekId: '7712-G' },
  ];
  const documents = [
    { icon: 'encrypted', title: "Pacte de l'Union Noire (1920)", level: 'Maxima' },
    { icon: 'folder_zip', title: "Correspondances de l'Exil", count: '340 Documents' },
    { icon: 'history_edu', title: 'Manuscrits de Fort-Royal', count: '128 Pages' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16" data-testid="archives-section">
      {/* Header */}
      <header className="pt-4 space-y-2">
        <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: G }}>Sanctuaire de la Mémoire</span>
        <div className="flex justify-between items-end">
          <h1 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 300, letterSpacing: '-0.02em', color: '#e5e2e3', lineHeight: 1 }}>Bibliothèque Souveraine</h1>
          <div className="text-right">
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#72727a' }}>Actifs Archivés</p>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 14, color: G }}>14,208 ITEMS</p>
          </div>
        </div>
      </header>

      {/* Curations Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 20, color: '#e5e2e3' }}>Curations Passées</h3>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#72727a' }}>Voir Tout</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {curations.map((c, idx) => (
            <div key={c.id} className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer fade-slide-in" style={{ background: '#201f20', animationDelay: `${idx * 80}ms` }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'rgba(232,213,160,0.06)', fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
              </div>
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <span className="self-start px-2 py-1 rounded-full" style={{ background: G, fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3a2f09' }}>FREK-ID: {c.frekId}</span>
                <div>
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: G, marginBottom: 4 }}>{c.tag}</p>
                  <h4 style={{ fontFamily: "'Newsreader', serif", fontSize: 18, color: '#e5e2e3', lineHeight: 1.2 }}>{c.title}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Documents Scellés */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 20, color: '#e5e2e3' }}>Documents Scellés</h3>
          <span className="material-symbols-outlined" style={{ color: '#d8c591', fontSize: 18 }}>lock</span>
        </div>
        <div className="space-y-2">
          {documents.map((d, idx) => (
            <div key={idx} className="py-3 px-4 flex items-center gap-3 rounded-lg transition-colors hover:bg-white/[0.02]" style={{ background: '#1c1b1c' }}>
              <span className="material-symbols-outlined" style={{ color: '#72727a', fontSize: 20 }}>{d.icon}</span>
              <div>
                <p style={{ fontFamily: "'Newsreader', serif", fontSize: 14, color: '#e5e2e3' }}>{d.title}</p>
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#72727a' }}>{d.level || d.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Héritage Diaspora */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 20, color: '#e5e2e3' }}>Héritage Diaspora</h3>
          <div className="flex -space-x-1.5">
            {['MQ', 'GP', 'GF', 'HT'].map(c => (
              <div key={c} className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background: '#353436', border: '1px solid #131314', color: G }}>{c}</div>
            ))}
          </div>
        </div>
        <div className="p-6 rounded-xl relative overflow-hidden" style={{ background: 'rgba(32,31,32,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(75,70,59,0.1)' }}>
          <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: G, marginBottom: 8 }}>Focus: Caraïbes</p>
          <p style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.6, color: 'rgba(229,226,227,0.9)' }}>
            "Les archives du silence ne sont plus muettes. La transmission est souveraine."
          </p>
        </div>
      </section>
    </div>
  );
};

// ─── GOUVERNANCE ────────────────────────────────────────
export const GovernanceSection = () => {
  const [activeTab, setActiveTab] = useState('proposals');
  const proposals = [
    { id: 1, title: 'Extension du Vault de Trésorerie', status: 'Actif', time: '3j', quorum: 72, target: 80 },
    { id: 2, title: 'Nouvelle taxe culturelle 1.5%', status: 'Actif', time: '12h', quorum: 45, target: 60 },
    { id: 3, title: 'Fonds de réserve artistique', status: 'Terminé', time: '', quorum: 92, target: 80 },
  ];
  const stats = [
    { label: 'Trésorerie', value: '247,500', unit: 'JCC', icon: 'account_balance' },
    { label: 'Votants Actifs', value: '1,247', unit: '', icon: 'how_to_vote' },
    { label: 'Propositions', value: '24', unit: 'totales', icon: 'gavel' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16" data-testid="governance-section">
      {/* Header */}
      <header className="pt-4 space-y-3">
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]" style={{ background: 'rgba(232,213,160,0.08)', color: '#d8c591', border: '1px solid rgba(232,213,160,0.1)' }}>Gouvernance Souveraine</span>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.03em', color: '#e5e2e3' }}>
          Assemblée <span style={{ fontStyle: 'italic', color: G }}>Culturelle</span>
        </h1>
      </header>

      {/* Stats Bento */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="p-5 rounded-xl" style={{ background: '#1c1b1c' }}>
            <span className="material-symbols-outlined" style={{ color: '#d8c591', fontSize: 20 }}>{s.icon}</span>
            <div className="mt-3">
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 22, color: '#e5e2e3' }}>{s.value}</span>
              <span className="ml-1" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>{s.unit}</span>
            </div>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#72727a', marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Proposals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 20, color: '#e5e2e3' }}>Propositions Actives</h3>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d8c591' }}>{proposals.filter(p => p.status === 'Actif').length} en cours</span>
        </div>
        <div className="space-y-4">
          {proposals.map((p, idx) => (
            <div key={p.id} className="p-5 rounded-xl fade-slide-in" style={{ background: '#2a2a2b', borderLeft: p.status === 'Actif' ? `2px solid ${G}` : '2px solid #353436', animationDelay: `${idx * 80}ms` }}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  {p.status === 'Actif' && <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase" style={{ background: 'rgba(232,213,160,0.1)', color: G }}>Actif · {p.time}</span>}
                  {p.status === 'Terminé' && <span className="flex items-center gap-1 text-[10px]" style={{ color: '#4A5D4E' }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>Terminé</span>}
                  <h4 className="mt-2" style={{ fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 700, color: '#e5e2e3' }}>{p.title}</h4>
                </div>
                {p.status === 'Actif' && (
                  <button className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95" style={{ background: 'rgba(232,213,160,0.1)', color: G, border: '1px solid rgba(232,213,160,0.2)' }}>Voter</button>
                )}
              </div>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  <span style={{ color: '#e5e2e3' }}>Quorum {p.quorum}%</span>
                  <span style={{ color: G }}>Objectif {p.target}%</span>
                </div>
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#353436' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.quorum}%`, background: `linear-gradient(90deg, #c8a84b, ${G})` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// ─── CONSOLE DE PILOTAGE ────────────────────────────────
export const ConsoleSection = ({ session }) => {
  const [metrics, setMetrics] = useState(null);
  useEffect(() => {
    axios.get(`${API}/analytics/dashboard`).then(r => setMetrics(r.data)).catch(() => {});
  }, []);

  const tiles = [
    { icon: 'visibility', label: 'Pages vues', value: metrics?.total_page_views || '—' },
    { icon: 'people', label: 'Utilisateurs', value: metrics?.total_unique_visitors || '—' },
    { icon: 'trending_up', label: 'Sessions', value: metrics?.total_sessions || '—' },
    { icon: 'devices', label: 'Appareils', value: metrics?.device_breakdown ? Object.keys(metrics.device_breakdown).length : '—' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16" data-testid="console-section">
      <header className="pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined" style={{ color: G, fontSize: 20 }}>fingerprint</span>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: G }}>Console de Pilotage</span>
        </div>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.03em', color: '#e5e2e3' }}>
          Tableau de <span style={{ fontStyle: 'italic', color: G }}>Bord</span>
        </h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(t => (
          <div key={t.label} className="p-6 rounded-xl flex flex-col justify-between aspect-square" style={{ background: '#1c1b1c' }}>
            <span className="material-symbols-outlined" style={{ color: G, fontSize: 24 }}>{t.icon}</span>
            <div>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: 28, color: '#e5e2e3' }}>{t.value}</div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#72727a' }}>{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="p-6 rounded-xl" style={{ background: 'rgba(32,31,32,0.7)', backdropFilter: 'blur(24px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4A5D4E' }} />
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5D4E' }}>Système Opérationnel</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['API Backend', 'Base de Données', 'CVL BRAIN', 'Service Email'].map(s => (
            <div key={s} className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: '#4A5D4E', fontSize: 16 }}>check_circle</span>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── PARAMÈTRES ─────────────────────────────────────────
export const SettingsSovereign = ({ session, onLogout }) => {
  const sections = [
    { title: 'Compte', items: [
      { icon: 'person', label: 'Profil Public', desc: 'Modifier votre nom, bio et photo' },
      { icon: 'security', label: 'Sécurité', desc: 'Mot de passe, sessions actives' },
      { icon: 'notifications', label: 'Notifications', desc: 'Gérer les alertes et emails' },
    ]},
    { title: 'Préférences', items: [
      { icon: 'language', label: 'Langue', desc: 'Français · Créole' },
      { icon: 'dark_mode', label: 'Apparence', desc: 'Thème Sovereign Onyx' },
      { icon: 'tune', label: 'Confidentialité', desc: 'Visibilité du profil et données' },
    ]},
    { title: 'Écosystème', items: [
      { icon: 'account_balance_wallet', label: 'Kilti-Tokens', desc: 'Historique des transactions' },
      { icon: 'link', label: 'FREK-ID', desc: session?.frek_id || 'Non lié' },
      { icon: 'info', label: 'À propos', desc: 'Kiltikonet v2.4 · Sovereign Onyx' },
    ]},
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16" data-testid="settings-sovereign">
      <header className="pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined" style={{ color: G, fontSize: 20 }}>fingerprint</span>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: G }}>Centre de Commande</span>
        </div>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, lineHeight: 0.95, color: '#e5e2e3' }}>
          Paramètres
        </h1>
      </header>

      {sections.map(sec => (
        <section key={sec.title}>
          <h3 className="mb-3" style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 18, color: '#e5e2e3' }}>{sec.title}</h3>
          <div className="rounded-xl overflow-hidden" style={{ background: '#1c1b1c' }}>
            {sec.items.map((item, idx) => (
              <button key={item.label} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                style={{ borderBottom: idx < sec.items.length - 1 ? '1px solid rgba(75,70,59,0.1)' : 'none' }}>
                <span className="material-symbols-outlined" style={{ color: '#d8c591', fontSize: 22 }}>{item.icon}</span>
                <div className="flex-1">
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600, color: '#e5e2e3' }}>{item.label}</p>
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a' }}>{item.desc}</p>
                </div>
                <span className="material-symbols-outlined" style={{ color: '#555', fontSize: 18 }}>chevron_right</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Logout */}
      <button onClick={onLogout} data-testid="settings-logout-btn"
        className="w-full py-4 rounded-xl text-center transition-all hover:bg-red-500/10"
        style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, color: '#ffb4ab', background: 'rgba(255,180,171,0.05)' }}>
        Se déconnecter
      </button>
    </div>
  );
};

// ─── MESSAGES / DISCUSSION DIRECTE ──────────────────────
export const MessagesSection = ({ session }) => {
  const [conversations, setConversations] = useState([]);
  useEffect(() => {
    axios.get(`${API}/pro/social/messages/conversations`, { params: { user_id: session?.id } })
      .then(r => setConversations(r.data.conversations || []))
      .catch(() => {});
  }, [session?.id]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16" data-testid="messages-section">
      <header className="pt-4 space-y-3">
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]" style={{ background: 'rgba(232,213,160,0.08)', color: '#d8c591' }}>Messagerie Souveraine</span>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, lineHeight: 0.95, color: '#e5e2e3' }}>
          Boîte de <span style={{ fontStyle: 'italic', color: G }}>Réception</span>
        </h1>
      </header>

      {conversations.length === 0 ? (
        <div className="py-20 text-center">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: '#2a2a2b' }}>chat_bubble</span>
          <p className="mt-4" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: '#555' }}>Aucune conversation</p>
          <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a', marginTop: 4 }}>Connectez-vous avec des professionnels pour démarrer une discussion</p>
        </div>
      ) : conversations.map(c => (
        <div key={c.id} className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ background: '#1c1b1c' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#2a2a2b', color: G, fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 16 }}>
            {(c.name || '?')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 15, color: '#e5e2e3' }}>{c.name}</p>
            <p className="truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a' }}>{c.last_message || 'Commencer la discussion...'}</p>
          </div>
          {c.unread > 0 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: G, color: '#3a2f09' }}>{c.unread}</span>}
        </div>
      ))}
    </div>
  );
};
