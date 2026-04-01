// ═══════════════════════════════════════════════════════════════
// ESPACE PRO CC2026 — LinkedIn Culturel Afro-Caribéen
// MOBILE-FIRST · WCAG AA · Avatars Dégradés · Jetons Animés
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Users, MessageSquare, Briefcase, Calendar, Search,
  LogOut, ChevronRight, Plus, Send, Heart, Star, MapPin, Globe,
  Building2, Mic2, Mail, Phone, Link2, Edit2, Save, X, Check,
  Sparkles, Clock, Eye, MessageCircle, Handshake, Newspaper, Tag,
  ChevronDown, ChevronUp, Shield, Award, Image, Home, Zap, Menu
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import ProOnboarding from './ProOnboarding';
import CvlBrainFloat from './CvlBrainFloat';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ─── Design Tokens ─────────────────────────────────────
const C = {
  bg: '#0F0F0F', surface: '#1A1A1A', card: '#222222', border: '#333',
  text: '#F0EDE5', muted: '#A8A8A8', dim: '#777', gold: '#D4A84B',
  accent: '#C4714A', forest: '#4A5D4E', blue: '#5B9BD5', red: '#E85A4F',
  purple: '#8B5CF6', turquoise: '#2DD4BF', input: '#2A2A2A',
};

const TYPE_COLORS = {
  artist: C.accent, label: C.gold, booking_agency: C.turquoise,
  institution: C.forest, press: C.blue, other: C.purple,
};
const AVATAR_GRADS = {
  artist: `linear-gradient(135deg, #C4714A, #D4A84B)`,
  label: `linear-gradient(135deg, #D4A84B, #E8C547)`,
  booking_agency: `linear-gradient(135deg, #2DD4BF, #5B9BD5)`,
  institution: `linear-gradient(135deg, #4A5D4E, #6B9080)`,
  press: `linear-gradient(135deg, #5B9BD5, #7EC8E3)`,
  other: `linear-gradient(135deg, #8B5CF6, #C4714A)`,
};
const PROFILE_LABELS = {
  artist: 'Artiste', label: 'Label / Producteur', booking_agency: 'Agence Booking',
  institution: 'Institution', press: 'Presse / Média', other: 'Professionnel',
};

// ─── Countdown to CC2026 ───────────────────────────────
const CC2026_DATE = new Date('2026-05-20T09:00:00');
const getDaysUntil = () => Math.max(0, Math.ceil((CC2026_DATE - Date.now()) / 86400000));

// ─── Session Hook ──────────────────────────────────────
const useProSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem('cc2026_pro_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.createdAt && (Date.now() - parsed.createdAt) < 7 * 24 * 60 * 60 * 1000) setSession(parsed);
        else localStorage.removeItem('cc2026_pro_session');
      } catch { localStorage.removeItem('cc2026_pro_session'); }
    }
    setLoading(false);
  }, []);
  const logout = () => { localStorage.removeItem('cc2026_pro_session'); setSession(null); };
  return { session, loading, logout, isAuthenticated: !!session };
};

// ─── Avatar — Dégradés Chauds Caribéens ────────────────
const Avatar = ({ src, name, type, size = 48, className = '', style = {} }) => {
  if (src && !src.includes('ui-avatars.com')) {
    return <img src={src} alt={name || ''} className={`rounded-full object-cover flex-shrink-0 ${className}`} style={{ width: size, height: size, ...style }} />;
  }
  const grad = AVATAR_GRADS[type] || AVATAR_GRADS.other;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const fs = size < 36 ? 11 : size < 56 ? 14 : 18;
  return (
    <div className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: grad, ...style }} aria-hidden="true">
      <span style={{ fontSize: fs, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>{initials}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
const ProSpaceDashboard = () => {
  const navigate = useNavigate();
  const { session, loading, logout, isAuthenticated } = useProSession();
  const [activeSection, setActiveSection] = useState('feed');
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [jetonsBalance, setJetonsBalance] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => { if (!loading && !isAuthenticated) navigate('/espace-pro/connexion'); }, [loading, isAuthenticated, navigate]);
  useEffect(() => { if (session?.id) loadAll(); }, [session?.id]);

  useEffect(() => {
    if (session?.id) {
      const done = localStorage.getItem(`cc2026_onboarding_${session.id}`);
      if (!done) {
        axios.get(`${API}/pro/profile/${session.id}`).then(r => {
          if (r.data && !r.data.onboarding_completed) setShowOnboarding(true);
        }).catch(() => setShowOnboarding(true));
      }
    }
  }, [session?.id]);

  useEffect(() => {
    if (session?.id) axios.get(`${API}/ghost/jetons/${session.id}`).then(r => setJetonsBalance(r.data.jetons_solde || 0)).catch(() => {});
  }, [session?.id]);

  useEffect(() => { axios.post(`${API}/ghost/seed`).catch(() => {}); }, []);

  const loadAll = async () => {
    try {
      const [p, co, m, o, e] = await Promise.all([
        axios.get(`${API}/pro/profile/${session.id}`).catch(() => ({ data: null })),
        axios.get(`${API}/pro/connections/${session.id}`).catch(() => ({ data: { connections: [] } })),
        axios.get(`${API}/pro/messages/${session.id}`).catch(() => ({ data: { messages: [] } })),
        axios.get(`${API}/pro/opportunities`).catch(() => ({ data: { opportunities: [] } })),
        axios.get(`${API}/pro/events`).catch(() => ({ data: { events: [] } })),
      ]);
      setProfile(p.data); setConnections(co.data.connections || []); setMessages(m.data.messages || []);
      setOpportunities(o.data.opportunities || []); setEvents(e.data.events || []);
    } catch {}
  };

  const handleLogout = () => { logout(); toast.success('Déconnexion'); navigate('/espace-pro/connexion'); };
  const handleOnboardingComplete = (result) => {
    setShowOnboarding(false);
    if (result) { setJetonsBalance(prev => prev + (result.jetons_awarded || 10)); toast.success(`${result.jetons_awarded || 10} Jetons CC offerts !`); }
    loadAll();
  };

  if (loading || !session) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.gold }} />
    </div>
  );

  const unreadCount = messages.filter(m => !m.read && m.to === session.id).length;
  const navItems = [
    { id: 'feed', label: 'Accueil', icon: Home },
    { id: 'network', label: 'Réseau', icon: Users },
    { id: 'opportunities', label: 'Emplois', icon: Briefcase },
    { id: 'events', label: 'Agenda', icon: Calendar },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Syne', sans-serif" }} data-testid="pro-space-dashboard">
      {showOnboarding && <ProOnboarding session={session} onComplete={handleOnboardingComplete} />}

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b" style={{ background: C.surface, borderColor: C.border }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <button onClick={() => setActiveSection('feed')} className="flex-shrink-0" aria-label="Accueil Espace Pro" data-testid="logo-home">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.gold }}>
              <span className="font-black text-sm" style={{ color: '#000' }}>CC</span>
            </div>
          </button>

          {/* Search — desktop */}
          <div className="hidden sm:flex flex-1 max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: C.dim }} />
            <input placeholder="Rechercher..." aria-label="Rechercher dans le réseau"
              className="w-full h-11 pl-10 pr-4 rounded-lg text-base"
              style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, outline: 'none', minHeight: 44 }} />
          </div>

          <div className="flex-1 sm:hidden" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5" role="navigation" aria-label="Navigation principale">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)} data-testid={`nav-${item.id}`}
                className="flex flex-col items-center px-4 py-1 transition-colors relative"
                style={{ color: activeSection === item.id ? C.text : C.dim, minHeight: 44 }}
                aria-current={activeSection === item.id ? 'page' : undefined}>
                <item.icon size={20} />
                <span className="text-xs mt-0.5">{item.label}</span>
                {activeSection === item.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded" style={{ background: C.gold }} />}
              </button>
            ))}
            <button onClick={() => setShowMessages(!showMessages)} data-testid="nav-messages"
              className="flex flex-col items-center px-4 py-1 relative" style={{ color: showMessages ? C.text : C.dim, minHeight: 44 }}>
              <MessageSquare size={20} />
              <span className="text-xs mt-0.5">Messages</span>
              {unreadCount > 0 && <span className="absolute top-0 right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: C.red, color: '#fff' }}>{unreadCount}</span>}
            </button>
          </nav>

          {/* Jetons Badge — animated */}
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all hover:scale-105" data-testid="jetons-badge"
            style={{ background: `${C.gold}18`, border: `1.5px solid ${C.gold}50`, minHeight: 44, animation: 'jetonsPulse 3s ease-in-out infinite' }}
            title="1 Jeton CC = 1.50€" aria-label={`${jetonsBalance} Jetons CC`}>
            <Zap size={16} style={{ color: C.gold }} />
            <span className="text-base font-bold" style={{ color: C.gold }}>{jetonsBalance}</span>
            <span className="text-xs hidden sm:inline font-medium" style={{ color: C.gold }}>JCC</span>
          </button>

          {/* Profile */}
          <button onClick={() => setActiveSection('profile')} data-testid="nav-profile"
            className="flex items-center gap-1.5 ml-1" style={{ minHeight: 44 }} aria-label="Mon profil">
            <Avatar src={session.image} name={session.name} type={session.type} size={32} />
            <ChevronDown size={14} style={{ color: C.dim }} />
          </button>

          {/* Logout */}
          <button onClick={handleLogout} aria-label="Se déconnecter" data-testid="logout-btn"
            className="p-2 rounded-lg hover:bg-white/5 hidden sm:flex" style={{ color: C.dim, minHeight: 44 }}>
            <LogOut size={18} />
          </button>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg" style={{ color: C.dim, minHeight: 44 }} aria-label="Menu">
            <Menu size={22} />
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenu && (
          <div className="md:hidden border-t px-4 py-3 space-y-1" style={{ borderColor: C.border, background: C.surface }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setActiveSection(item.id); setMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-base"
                style={{ color: activeSection === item.id ? C.gold : C.text, background: activeSection === item.id ? `${C.gold}10` : 'transparent', minHeight: 48 }}>
                <item.icon size={20} /> {item.label}
              </button>
            ))}
            <button onClick={() => { setShowMessages(true); setMobileMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-base" style={{ color: C.text, minHeight: 48 }}>
              <MessageSquare size={20} /> Messages {unreadCount > 0 && <span className="ml-auto w-6 h-6 rounded-full text-xs flex items-center justify-center" style={{ background: C.red, color: '#fff' }}>{unreadCount}</span>}
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-base" style={{ color: C.red, minHeight: 48 }}>
              <LogOut size={20} /> Déconnexion
            </button>
          </div>
        )}
      </header>

      {/* ─── MAIN ─── */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeSection === 'feed' && <FeedLayout session={session} profile={profile} connections={connections} onRefresh={loadAll} jetonsBalance={jetonsBalance} />}
        {activeSection === 'profile' && <ProfilePage profile={profile} session={session} connections={connections} onUpdate={loadAll} />}
        {activeSection === 'network' && <NetworkPage connections={connections} session={session} onConnect={loadAll} />}
        {activeSection === 'opportunities' && <OpportunitiesPage opportunities={opportunities} />}
        {activeSection === 'events' && <EventsPage events={events} />}
      </div>

      {showMessages && <MessagesPanel messages={messages} session={session} onUpdate={loadAll} onClose={() => setShowMessages(false)} />}
      <CvlBrainFloat session={session} />

      {/* ─── Global CSS ─── */}
      <style>{`
        @keyframes jetonsPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(212,168,75,0); } 50% { box-shadow: 0 0 12px 2px rgba(212,168,75,0.25); } }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// FEED LAYOUT — 3 columns
// ═══════════════════════════════════════════════════════════
const FeedLayout = ({ session, profile, connections, onRefresh, jetonsBalance }) => (
  <div className="flex gap-6">
    {/* Left sidebar */}
    <aside className="hidden lg:block w-60 flex-shrink-0 space-y-4">
      <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="h-16" style={{ background: `linear-gradient(135deg, ${C.accent}70, ${C.gold}40, ${C.turquoise}30)` }} />
        <div className="px-4 pb-5 -mt-8 text-center">
          <Avatar src={session.image} name={session.name} type={session.type} size={60} className="mx-auto" style={{ border: `3px solid ${C.card}` }} />
          <h3 className="text-base font-bold mt-2" style={{ color: C.text }}>{session.name}</h3>
          <p className="text-sm" style={{ color: C.muted }}>{PROFILE_LABELS[session.type] || 'Professionnel'}</p>
        </div>
        <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: C.border }}>
          <div className="flex justify-between text-sm"><span style={{ color: C.muted }}>Connexions</span><span className="font-semibold" style={{ color: C.gold }}>{connections.length}</span></div>
          <div className="flex justify-between text-sm"><span style={{ color: C.muted }}>Vues profil</span><span className="font-semibold" style={{ color: C.gold }}>{profile?.views || 0}</span></div>
          <div className="flex justify-between text-sm"><span style={{ color: C.muted }}>Jetons CC</span><span className="font-bold" style={{ color: C.gold }}>{jetonsBalance || 0}</span></div>
        </div>
      </div>
    </aside>

    {/* Center */}
    <main className="flex-1 min-w-0">
      <FeedSection session={session} />
    </main>

    {/* Right sidebar */}
    <aside className="hidden xl:block w-72 flex-shrink-0 space-y-4">
      <RecommendationsWidget session={session} />
    </aside>
  </div>
);

// ═══════════════════════════════════════════════════════════
// FEED SECTION — Countdown + Posts
// ═══════════════════════════════════════════════════════════
const FeedSection = ({ session }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [showComments, setShowComments] = useState({});

  const loadFeed = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/pro/social/feed`, { params: { profile_id: session.id } });
      setPosts(res.data.posts || []);
    } catch {} finally { setLoading(false); }
  }, [session.id]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const createPost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await axios.post(`${API}/pro/social/posts`, { author_id: session.id, author_name: session.name, author_image: session.image, author_type: session.type, content: newPost });
      setNewPost(''); toast.success('Publication partagée ! +5 Jetons CC'); loadFeed();
    } catch { toast.error('Erreur lors de la publication'); } finally { setPosting(false); }
  };

  const generateWithBrain = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/v1/llm/chat`, {
        message: `Génère un post professionnel court (3-4 phrases max) pour le réseau CC2026. Le profil est : ${session.name}, ${PROFILE_LABELS[session.type] || 'professionnel culturel'}. Le post doit être authentique, culturellement ancré (Caraïbes/Afrique), et inspirant. Utilise un mélange de français et de créole si pertinent. Ne mets pas de hashtags.`,
        system_prompt: 'Tu es CVL BRAIN. Génère un post professionnel court et authentique pour le réseau culturel CC2026. Maximum 3-4 phrases. Pas de hashtags.',
        provider: 'anthropic', model: 'claude-sonnet-4-5-20250929',
      });
      setNewPost(res.data.response || '');
    } catch { toast.error('CVL BRAIN est momentanément indisponible'); } finally { setGenerating(false); }
  };

  const handleLike = async (postId) => {
    try { await axios.post(`${API}/pro/social/posts/${postId}/like?profile_id=${session.id}`); loadFeed(); } catch {}
  };
  const handleComment = async (postId) => {
    const content = commentInputs[postId]; if (!content?.trim()) return;
    try {
      await axios.post(`${API}/pro/social/posts/${postId}/comment`, { author_id: session.id, author_name: session.name, content });
      setCommentInputs({ ...commentInputs, [postId]: '' }); loadFeed();
    } catch {}
  };
  const deletePost = async (postId) => { try { await axios.delete(`${API}/pro/social/posts/${postId}?author_id=${session.id}`); loadFeed(); } catch {} };

  const timeAgo = (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "à l'instant"; if (s < 3600) return `${Math.floor(s / 60)} min`;
    if (s < 86400) return `${Math.floor(s / 3600)} h`; return `${Math.floor(s / 86400)} j`;
  };

  const daysLeft = getDaysUntil();

  return (
    <div className="space-y-5">
      {/* ─── CC2026 COUNTDOWN BANNER ─── */}
      <div className="rounded-xl p-5 relative overflow-hidden" data-testid="countdown-banner"
        style={{ background: `linear-gradient(135deg, ${C.accent}30, ${C.gold}15, ${C.forest}20)`, border: `1px solid ${C.gold}30` }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black" style={{ color: C.gold }}>CC2026 — La Savane</h2>
            <p className="text-sm mt-1" style={{ color: C.muted }}>20–23 Mai 2026 · Fort-de-France, Martinique</p>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl" style={{ background: `${C.gold}20`, border: `2px solid ${C.gold}` }}>
            <span className="text-2xl sm:text-3xl font-black" style={{ color: C.gold }}>J-{daysLeft}</span>
          </div>
        </div>
      </div>

      {/* ─── CREATE POST ─── */}
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }} data-testid="create-post-box">
        <div className="flex gap-3">
          <Avatar src={session.image} name={session.name} type={session.type} size={48} />
          <div className="flex-1">
            <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
              placeholder="Partagez votre actualité culturelle..."
              rows={3} data-testid="new-post-input" aria-label="Nouveau post"
              className="w-full p-4 rounded-xl text-base resize-none"
              style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, outline: 'none', minHeight: 80, lineHeight: 1.6 }} />
            <div className="flex flex-wrap justify-between items-center gap-3 mt-3">
              <div className="flex gap-2">
                <button onClick={generateWithBrain} disabled={generating} data-testid="generate-brain-btn"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                  style={{ background: `${C.gold}15`, color: C.gold, border: `1px solid ${C.gold}30`, minHeight: 44 }}>
                  <Sparkles size={16} /> {generating ? 'CVL BRAIN écrit...' : 'Générer avec CVL BRAIN'}
                </button>
                <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ color: C.blue, minHeight: 44 }} aria-label="Ajouter une photo">
                  <Image size={16} /> <span className="hidden sm:inline">Photo</span>
                </button>
              </div>
              <Button disabled={!newPost.trim() || posting} onClick={createPost} data-testid="publish-post-btn"
                className="rounded-full px-6 text-base font-bold" style={{ background: C.gold, color: '#000', minHeight: 44 }}>
                {posting ? 'Publication...' : 'Publier'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── POSTS ─── */}
      {loading ? (
        <div className="py-16 text-center"><div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: C.gold }} /></div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl p-16 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Newspaper size={48} className="mx-auto mb-4" style={{ color: C.dim }} />
          <p className="text-base" style={{ color: C.muted }}>Aucune publication. Soyez le premier !</p>
        </div>
      ) : posts.map(post => {
        const borderColor = TYPE_COLORS[post.author_type] || C.border;
        return (
          <article key={post.id} className="rounded-xl overflow-hidden" data-testid={`post-${post.id}`}
            style={{ background: C.card, borderLeft: `4px solid ${borderColor}`, border: `1px solid ${C.border}`, borderLeftWidth: 4, borderLeftColor: borderColor }}>
            {/* Post Header */}
            <div className="p-5 pb-0">
              <div className="flex gap-3">
                <Avatar src={post.author_image} name={post.author_name} type={post.author_type} size={52} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold truncate" style={{ color: C.text }}>{post.author_name}</span>
                    {post.author_id === session.id && (
                      <button onClick={() => deletePost(post.id)} aria-label="Supprimer ce post" className="ml-auto p-2 rounded-lg hover:bg-white/10" style={{ color: C.dim, minHeight: 44 }}><X size={16} /></button>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: TYPE_COLORS[post.author_type] || C.muted }}>{PROFILE_LABELS[post.author_type] || ''}</p>
                  <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: C.dim }}><Clock size={12} /> {timeAgo(post.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              <p className="text-base whitespace-pre-wrap leading-relaxed" style={{ color: C.text, lineHeight: 1.7 }}>{post.content}</p>
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map(t => <span key={t} className="text-sm font-medium" style={{ color: C.gold }}>#{t}</span>)}
                </div>
              )}
            </div>

            {/* Counts */}
            {(post.likes_count > 0 || post.comments_count > 0) && (
              <div className="px-5 py-2 flex items-center justify-between text-sm border-t" style={{ borderColor: C.border, color: C.muted }}>
                {post.likes_count > 0 && <span className="flex items-center gap-1"><Heart size={14} fill={C.red} style={{ color: C.red }} /> {post.likes_count}</span>}
                {post.comments_count > 0 && <button onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })} className="hover:underline">{post.comments_count} commentaire{post.comments_count > 1 ? 's' : ''}</button>}
              </div>
            )}

            {/* Actions */}
            <div className="px-3 py-1 flex border-t" style={{ borderColor: C.border }}>
              <button onClick={() => handleLike(post.id)} aria-label={post.likes?.includes(session.id) ? "Retirer le j'aime" : "J'aime"}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg hover:bg-white/5 text-base transition-colors"
                style={{ color: post.likes?.includes(session.id) ? C.red : C.muted, minHeight: 48 }}>
                <Heart size={20} fill={post.likes?.includes(session.id) ? C.red : 'none'} /> J'aime
              </button>
              <button onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })} aria-label="Commenter"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg hover:bg-white/5 text-base"
                style={{ color: C.muted, minHeight: 48 }}>
                <MessageCircle size={20} /> Commenter
              </button>
            </div>

            {/* Comments */}
            {showComments[post.id] && (
              <div className="px-5 pb-5 border-t space-y-3" style={{ borderColor: C.border }}>
                {post.comments?.map(c => (
                  <div key={c.id} className="flex gap-3 mt-3">
                    <Avatar name={c.author_name} type="other" size={36} />
                    <div className="flex-1 p-3 rounded-xl" style={{ background: C.input }}>
                      <span className="text-sm font-bold" style={{ color: C.text }}>{c.author_name}</span>
                      <p className="text-sm mt-1 leading-relaxed" style={{ color: C.muted }}>{c.content}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 mt-3">
                  <Avatar src={session.image} name={session.name} type={session.type} size={36} />
                  <div className="flex-1 flex gap-2">
                    <input value={commentInputs[post.id] || ''} onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                      placeholder="Ajouter un commentaire..." aria-label="Ajouter un commentaire"
                      className="flex-1 px-4 rounded-full text-base"
                      style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, outline: 'none', minHeight: 44 }} />
                    <button onClick={() => handleComment(post.id)} aria-label="Envoyer le commentaire"
                      className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10" style={{ color: C.gold, minHeight: 44 }}>
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// RECOMMENDATIONS WIDGET
// ═══════════════════════════════════════════════════════════
const RecommendationsWidget = ({ session }) => {
  const [recs, setRecs] = useState([]);
  useEffect(() => {
    axios.get(`${API}/pro/social/recommendations/${session.id}?limit=5`).then(r => setRecs(r.data.recommendations || [])).catch(() => {});
  }, [session.id]);
  const sendConnect = async (id) => {
    try { await axios.post(`${API}/pro/connect`, { from: session.id, to: id }); toast.success('Demande envoyée ! +3 Jetons CC'); setRecs(prev => prev.filter(r => r.id !== id)); } catch {}
  };
  return (
    <div className="rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="p-4 border-b" style={{ borderColor: C.border }}>
        <h3 className="text-base font-bold" style={{ color: C.text }}>Profils suggérés</h3>
      </div>
      {recs.length === 0 ? (
        <div className="p-5 text-center"><p className="text-sm" style={{ color: C.dim }}>Complétez votre profil pour recevoir des suggestions</p></div>
      ) : recs.map(r => (
        <div key={r.id} className="p-4 border-b last:border-0 hover:bg-white/[0.03] transition-colors" style={{ borderColor: C.border }}>
          <div className="flex gap-3">
            <Avatar src={r.image} name={r.full_name} type={r.profile_type} size={52} />
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate" style={{ color: C.text }}>{r.full_name}</p>
              <p className="text-sm truncate" style={{ color: C.muted }}>{r.organization_name || PROFILE_LABELS[r.profile_type]}</p>
              {r.reasons?.[0] && <p className="text-xs mt-1 font-medium" style={{ color: C.gold }}>{r.reasons[0]}</p>}
              <Button size="sm" variant="outline" onClick={() => sendConnect(r.id)} data-testid={`connect-${r.id}`}
                className="mt-2 rounded-full px-4 text-sm" style={{ borderColor: C.gold, color: C.gold, minHeight: 36 }}>
                <Plus size={14} className="mr-1" /> Se connecter
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════════════════════
const ProfilePage = ({ profile, session, connections, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(true);
  const [formData, setFormData] = useState({ bio: '', website: '', linkedin: '', instagram: '', seeking: '', offering: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setFormData({ bio: profile.bio || '', website: profile.website || '', linkedin: profile.linkedin || '', instagram: profile.instagram || '', seeking: profile.seeking || '', offering: profile.offering || '' });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try { await axios.put(`${API}/pro/profile/${session.id}`, formData); toast.success('Profil mis à jour ! +15 Jetons CC'); setEditing(false); onUpdate(); }
    catch { toast.error('Erreur de sauvegarde'); } finally { setSaving(false); }
  };

  const tags = profile?.expertise_tags || [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Banner */}
      <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="h-40 sm:h-52 relative" style={{ background: `linear-gradient(135deg, ${C.accent}60, ${C.gold}30, ${C.forest}25, ${C.turquoise}20)` }}>
          {/* Madras pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px), repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)' }} />
        </div>
        <div className="px-5 sm:px-8 pb-6 relative">
          <div className="absolute -top-14 sm:-top-16">
            <Avatar src={profile?.image || session.image} name={session.name} type={session.type} size={112}
              style={{ border: `4px solid ${C.card}` }} />
          </div>
          <div className="flex justify-end pt-4 gap-2">
            <Button onClick={() => editing ? handleSave() : setEditing(true)} data-testid="edit-profile-btn"
              className="rounded-full text-base" style={editing ? { background: C.gold, color: '#000', minHeight: 44 } : { background: 'transparent', border: `2px solid ${C.gold}`, color: C.gold, minHeight: 44 }}>
              {editing ? (saving ? 'Sauvegarde...' : <><Save size={16} className="mr-2" /> Enregistrer</>) : <><Edit2 size={16} className="mr-2" /> Modifier</>}
            </Button>
            {editing && <Button variant="ghost" onClick={() => setEditing(false)} className="rounded-full" style={{ color: C.muted, minHeight: 44 }}><X size={16} /></Button>}
          </div>
          <div className="mt-10 sm:mt-12">
            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: C.text }}>{session.name}</h1>
            <p className="text-base sm:text-lg mt-1" style={{ color: C.muted }}>{profile?.organization_name || PROFILE_LABELS[session.type]}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm" style={{ color: C.dim }}>
              {profile?.country && <span className="flex items-center gap-1"><MapPin size={16} /> {profile.country}</span>}
              <span className="flex items-center gap-1" style={{ color: C.gold }}><Users size={16} /> {connections.length} connexion{connections.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: `${C.gold}20`, color: C.gold }}>
                <Award size={14} /> Accrédité CC2026
              </span>
              {profile?.frek_id && <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: `${C.blue}20`, color: C.blue }}><Shield size={14} /> {profile.frek_id}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-xl p-5 sm:p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <button className="flex items-center justify-between w-full" onClick={() => setAboutOpen(!aboutOpen)} style={{ minHeight: 44 }}>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>À propos</h2>
          {aboutOpen ? <ChevronUp size={20} style={{ color: C.dim }} /> : <ChevronDown size={20} style={{ color: C.dim }} />}
        </button>
        {aboutOpen && (
          <div className="mt-4">
            {editing ? (
              <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} rows={4} aria-label="Votre biographie"
                placeholder="Décrivez votre parcours, vos projets..." className="w-full p-4 rounded-xl text-base"
                style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, outline: 'none', lineHeight: 1.6 }} />
            ) : <p className="text-base leading-relaxed" style={{ color: profile?.bio ? C.muted : C.dim }}>{profile?.bio || 'Aucune description. Cliquez sur Modifier pour ajouter.'}</p>}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="rounded-xl p-5 sm:p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: C.text }}>Compétences</h2>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => <span key={tag} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: `${C.gold}15`, color: C.gold, border: `1px solid ${C.gold}25` }}>{tag}</span>)}
          </div>
        ) : <p className="text-base" style={{ color: C.dim }}>Aucune compétence renseignée</p>}
      </div>

      {/* Seeking / Offering */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: C.text }}><Search size={18} style={{ color: C.forest }} /> Je recherche</h2>
          {editing ? <textarea value={formData.seeking} onChange={e => setFormData({ ...formData, seeking: e.target.value })} rows={2} aria-label="Ce que vous recherchez"
            placeholder="Ex: Distribution, Booking..." className="w-full p-3 rounded-lg text-base" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
          : <p className="text-base" style={{ color: profile?.seeking ? C.muted : C.dim }}>{profile?.seeking || 'Non renseigné'}</p>}
        </div>
        <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: C.text }}><Handshake size={18} style={{ color: C.accent }} /> Je propose</h2>
          {editing ? <textarea value={formData.offering} onChange={e => setFormData({ ...formData, offering: e.target.value })} rows={2} aria-label="Ce que vous proposez"
            placeholder="Ex: Production, Conseil..." className="w-full p-3 rounded-lg text-base" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
          : <p className="text-base" style={{ color: profile?.offering ? C.muted : C.dim }}>{profile?.offering || 'Non renseigné'}</p>}
        </div>
      </div>

      {/* Links */}
      <div className="rounded-xl p-5 sm:p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: C.text }}>Liens</h2>
        {editing ? (
          <div className="space-y-3">
            <Input placeholder="Site web" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} aria-label="Site web" className="text-base" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, minHeight: 44 }} />
            <Input placeholder="LinkedIn" value={formData.linkedin} onChange={e => setFormData({ ...formData, linkedin: e.target.value })} aria-label="LinkedIn" className="text-base" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, minHeight: 44 }} />
            <Input placeholder="Instagram" value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })} aria-label="Instagram" className="text-base" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, minHeight: 44 }} />
          </div>
        ) : (
          <div className="space-y-3">
            {profile?.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-base hover:underline" style={{ color: C.gold }}><Globe size={16} /> {profile.website}</a>}
            {profile?.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-base hover:underline" style={{ color: C.gold }}><Link2 size={16} /> LinkedIn</a>}
            {!profile?.website && !profile?.linkedin && <p className="text-base" style={{ color: C.dim }}>Aucun lien</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// NETWORK PAGE
// ═══════════════════════════════════════════════════════════
const NetworkPage = ({ connections, session, onConnect }) => {
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [selectedPro, setSelectedPro] = useState(null);

  useEffect(() => {
    axios.get(`${API}/pro/social/directory`).then(r => { setPros(r.data.professionals || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && pros.length === 0) {
      axios.get(`${API}/registrations`).then(r => { setPros(r.data.registrations?.filter(x => x.status === 'approved' && x.id !== session.id) || []); }).catch(() => {});
    }
  }, [loading, pros.length, session.id]);

  const sendConnect = async (proId) => {
    try { await axios.post(`${API}/pro/connect`, { from: session.id, to: proId }); toast.success('Demande envoyée ! +3 Jetons CC'); onConnect(); } catch { toast.error('Erreur'); }
  };

  const filtered = pros.filter(p => {
    const s = search.toLowerCase();
    return (!search || p.full_name?.toLowerCase().includes(s) || p.organization_name?.toLowerCase().includes(s) || p.bio?.toLowerCase().includes(s))
      && (!filterType || p.profile_type === filterType)
      && (!filterCountry || p.country === filterCountry)
      && p.id !== session.id;
  });
  const countries = [...new Set(pros.map(p => p.country).filter(Boolean))];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-xl font-black mb-4" style={{ color: C.text }}>Réseau — {filtered.length} professionnel{filtered.length !== 1 ? 's' : ''}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: C.dim }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, organisation..." aria-label="Rechercher" data-testid="network-search"
              className="w-full pl-11 pr-4 rounded-lg text-base" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, outline: 'none', minHeight: 48 }} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Filtrer par type"
            className="px-4 rounded-lg text-base" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, minHeight: 48 }}>
            <option value="">Tous les profils</option>
            <option value="artist">Artistes</option><option value="label">Labels</option>
            <option value="booking_agency">Booking</option><option value="institution">Institutions</option><option value="press">Presse</option>
          </select>
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} aria-label="Filtrer par territoire"
            className="px-4 rounded-lg text-base" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, minHeight: 48 }}>
            <option value="">Tous territoires</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center"><div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: C.gold }} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(pro => {
            const borderColor = TYPE_COLORS[pro.profile_type] || C.border;
            const isConnected = connections.some(c => c.id === pro.id);
            return (
              <div key={pro.id} className="rounded-xl p-5 flex gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${borderColor}` }}
                onClick={() => setSelectedPro(pro)} data-testid={`pro-card-${pro.id}`}>
                <Avatar src={pro.image || pro.logo_url} name={pro.full_name} type={pro.profile_type} size={64} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold truncate" style={{ color: C.text }}>{pro.full_name}</h3>
                  <p className="text-sm truncate" style={{ color: TYPE_COLORS[pro.profile_type] || C.muted }}>{pro.organization_name || PROFILE_LABELS[pro.profile_type]}</p>
                  {pro.country && <p className="text-sm flex items-center gap-1 mt-1" style={{ color: C.dim }}><MapPin size={14} /> {pro.country}</p>}
                  {pro.bio && <p className="text-sm mt-1 line-clamp-2 leading-relaxed" style={{ color: C.dim }}>{pro.bio}</p>}
                  <div className="mt-3">
                    {isConnected ? (
                      <span className="text-sm px-3 py-1.5 rounded-full font-medium" style={{ background: `${C.gold}15`, color: C.gold }}>Connecté</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); sendConnect(pro.id); }}
                        className="rounded-full px-4 text-sm" style={{ borderColor: C.gold, color: C.gold, minHeight: 40 }} data-testid={`connect-btn-${pro.id}`}>
                        <Plus size={14} className="mr-1" /> Se connecter
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedPro && <ProfileModal pro={selectedPro} onClose={() => setSelectedPro(null)} session={session} isConnected={connections.some(c => c.id === selectedPro.id)} onConnect={() => sendConnect(selectedPro.id)} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// PROFILE MODAL
// ═══════════════════════════════════════════════════════════
const ProfileModal = ({ pro, onClose, session, isConnected, onConnect }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={`Profil de ${pro.full_name}`} onClick={onClose}>
    <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()} data-testid="profile-modal">
      <div className="h-32 relative rounded-t-xl" style={{ background: `linear-gradient(135deg, ${TYPE_COLORS[pro.profile_type] || C.accent}50, ${C.gold}25, ${C.forest}15)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.08) 15px, rgba(255,255,255,0.08) 30px)' }} />
        <button onClick={onClose} aria-label="Fermer le profil" data-testid="close-profile-modal"
          className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center bg-black/40" style={{ minHeight: 44 }}>
          <X size={18} style={{ color: '#fff' }} />
        </button>
      </div>
      <div className="px-6 pb-6 -mt-12">
        <Avatar src={pro.logo_url || pro.image} name={pro.full_name} type={pro.profile_type} size={96} style={{ border: `4px solid ${C.surface}` }} />
        <div className="flex items-center gap-2 mt-3">
          <span className="text-sm font-medium" style={{ color: TYPE_COLORS[pro.profile_type] || C.accent }}>{PROFILE_LABELS[pro.profile_type]}</span>
        </div>
        <h2 className="text-xl font-black mt-1" style={{ color: C.text }}>{pro.full_name}</h2>
        <p className="text-base" style={{ color: C.muted }}>{pro.organization_name}</p>
        {pro.country && <p className="text-sm flex items-center gap-1 mt-1" style={{ color: C.dim }}><MapPin size={14} /> {pro.country}</p>}

        <div className="mt-4 p-4 rounded-xl" style={{ background: C.card }}>
          {isConnected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base" style={{ color: C.muted }}><Mail size={16} style={{ color: C.gold }} /> {pro.email}</div>
              {pro.phone && <div className="flex items-center gap-2 text-base" style={{ color: C.muted }}><Phone size={16} style={{ color: C.gold }} /> {pro.phone}</div>}
            </div>
          ) : (
            <div className="text-center py-3" data-testid="contact-locked">
              <Users size={24} className="mx-auto mb-2" style={{ color: C.dim }} />
              <p className="text-sm" style={{ color: C.dim }}>Connectez-vous pour voir les coordonnées</p>
            </div>
          )}
        </div>

        {pro.bio && <div className="mt-4"><h3 className="text-base font-bold mb-2" style={{ color: C.text }}>À propos</h3><p className="text-base leading-relaxed" style={{ color: C.muted }}>{pro.bio}</p></div>}
        {pro.expertise_tags?.length > 0 && (
          <div className="mt-4"><h3 className="text-base font-bold mb-2" style={{ color: C.text }}>Compétences</h3>
            <div className="flex flex-wrap gap-2">{pro.expertise_tags.map(t => <span key={t} className="px-3 py-1.5 text-sm rounded-full" style={{ background: `${C.gold}15`, color: C.gold }}>{t}</span>)}</div>
          </div>
        )}
        <div className="mt-6 flex gap-3">
          {isConnected ? (
            <Button className="flex-1 rounded-full text-base" style={{ background: `${C.gold}20`, color: C.gold, minHeight: 48 }}><MessageSquare size={18} className="mr-2" /> Message</Button>
          ) : (
            <Button onClick={onConnect} className="flex-1 rounded-full text-base" style={{ background: C.gold, color: '#000', minHeight: 48 }}><Plus size={18} className="mr-2" /> Se connecter</Button>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════
// MESSAGES PANEL
// ═══════════════════════════════════════════════════════════
const MessagesPanel = ({ messages, session, onUpdate, onClose }) => {
  const [selectedConv, setSelectedConv] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const convos = messages.reduce((acc, msg) => {
    const otherId = msg.from === session.id ? msg.to : msg.from;
    if (!acc[otherId]) acc[otherId] = { id: otherId, name: msg.fromName || msg.toName, messages: [], unread: 0 };
    acc[otherId].messages.push(msg);
    if (!msg.read && msg.to === session.id) acc[otherId].unread++;
    return acc;
  }, {});
  const sendMsg = async () => {
    if (!newMsg.trim() || !selectedConv) return;
    try { await axios.post(`${API}/pro/messages`, { from: session.id, to: selectedConv, content: newMsg }); setNewMsg(''); onUpdate(); } catch { toast.error('Erreur'); }
  };

  return (
    <div className="fixed bottom-0 right-4 z-50 w-80 sm:w-96 shadow-2xl rounded-t-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }} data-testid="messages-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b cursor-pointer" style={{ borderColor: C.border, minHeight: 48 }} onClick={() => !selectedConv && onClose()}>
        <div className="flex items-center gap-2">
          <MessageSquare size={18} style={{ color: C.gold }} />
          <span className="text-base font-bold" style={{ color: C.text }}>{selectedConv ? (convos[selectedConv]?.name || 'Conversation') : 'Messages'}</span>
        </div>
        <div className="flex gap-1">
          {selectedConv && <button onClick={() => setSelectedConv(null)} className="p-2 rounded-lg hover:bg-white/10" style={{ minHeight: 44 }}><ChevronDown size={16} style={{ color: C.dim }} /></button>}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10" style={{ minHeight: 44 }} aria-label="Fermer les messages"><X size={16} style={{ color: C.dim }} /></button>
        </div>
      </div>

      {!selectedConv ? (
        <div className="max-h-80 overflow-y-auto">
          {Object.values(convos).length === 0 ? (
            <div className="p-8 text-center"><p className="text-base" style={{ color: C.dim }}>Aucune conversation</p></div>
          ) : Object.values(convos).map(conv => (
            <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
              className="w-full p-4 flex items-center gap-3 hover:bg-white/5 border-b" style={{ borderColor: C.border, minHeight: 56 }}>
              <Avatar name={conv.name} type="other" size={40} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-base font-semibold truncate" style={{ color: C.text }}>{conv.name}</p>
                <p className="text-sm truncate" style={{ color: C.dim }}>{conv.messages[conv.messages.length - 1]?.content}</p>
              </div>
              {conv.unread > 0 && <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: C.red, color: '#fff' }}>{conv.unread}</span>}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {convos[selectedConv]?.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === session.id ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%] px-4 py-3 rounded-2xl text-base" style={{ background: msg.from === session.id ? C.gold : C.card, color: msg.from === session.id ? '#000' : C.text }}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2" style={{ borderColor: C.border }}>
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} aria-label="Écrire un message"
              placeholder="Écrire..." className="flex-1 px-4 rounded-lg text-base" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, outline: 'none', minHeight: 44 }} />
            <button onClick={sendMsg} className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: C.gold, minHeight: 44 }} aria-label="Envoyer"><Send size={16} style={{ color: '#000' }} /></button>
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// OPPORTUNITIES & EVENTS
// ═══════════════════════════════════════════════════════════
const OpportunitiesPage = ({ opportunities }) => {
  const typeColors = { Booking: C.accent, Business: C.gold, Subvention: C.forest, Formation: C.blue, Emploi: '#8B1A4A' };
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-xl font-black" style={{ color: C.text }}>Opportunités — {opportunities.length} offres</h2>
      </div>
      {opportunities.length === 0 ? (
        <div className="rounded-xl p-16 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Briefcase size={48} className="mx-auto mb-4" style={{ color: C.dim }} />
          <p className="text-base" style={{ color: C.muted }}>Aucune opportunité pour le moment</p>
        </div>
      ) : opportunities.map(opp => (
        <div key={opp.id} className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${typeColors[opp.type] || C.dim}` }}>
          <span className="text-sm px-3 py-1 rounded-full font-medium" style={{ background: `${typeColors[opp.type] || C.dim}20`, color: typeColors[opp.type] || C.muted }}>{opp.type}</span>
          <h3 className="text-lg font-bold mt-3" style={{ color: C.text }}>{opp.title}</h3>
          <p className="text-base mt-2 leading-relaxed" style={{ color: C.muted }}>{opp.description}</p>
        </div>
      ))}
    </div>
  );
};

const EventsPage = ({ events }) => (
  <div className="max-w-3xl mx-auto space-y-5">
    <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <h2 className="text-xl font-black" style={{ color: C.text }}>Agenda — {events.length} événements</h2>
    </div>
    {events.length === 0 ? (
      <div className="rounded-xl p-16 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <Calendar size={48} className="mx-auto mb-4" style={{ color: C.dim }} />
        <p className="text-base" style={{ color: C.muted }}>Aucun événement programmé</p>
      </div>
    ) : events.map(evt => (
      <div key={evt.id} className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.gold}` }}>
        <h3 className="text-lg font-bold" style={{ color: C.text }}>{evt.title}</h3>
        <p className="text-base mt-2 leading-relaxed" style={{ color: C.muted }}>{evt.description}</p>
        {evt.date && <p className="text-sm mt-3 flex items-center gap-2" style={{ color: C.dim }}><Clock size={14} /> {new Date(evt.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════
// PRO SPACE LOGIN — Connexion par code
// ═══════════════════════════════════════════════════════════
export const ProSpaceLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/pro/request-access`, { email });
      if (res.data.success) {
        if (res.data.bypass) {
          try {
            const verifyRes = await axios.post(`${API}/pro/verify-code`, { email, code: '000000' });
            if (verifyRes.data.success) {
              const proSession = { id: verifyRes.data.profile.id, email: verifyRes.data.profile.email, name: verifyRes.data.profile.full_name, image: verifyRes.data.profile.image, type: verifyRes.data.profile.profile_type, verified: true, createdAt: Date.now() };
              localStorage.setItem('cc2026_pro_session', JSON.stringify(proSession));
              toast.success(`Bienvenue ${verifyRes.data.profile.full_name} !`);
              navigate('/espace-pro', { replace: true });
              return;
            }
          } catch {}
        }
        setCodeSent(true);
        toast.success("Code d'accès envoyé !", { description: 'Vérifiez votre boîte mail' });
      } else {
        toast.error(res.data.message || 'Email non trouvé dans notre base');
      }
    } catch { toast.error('Email non reconnu', { description: 'Vous devez être inscrit à CC2026' }); }
    finally { setLoading(false); }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!accessCode) return;
    setVerifying(true);
    try {
      const res = await axios.post(`${API}/pro/verify-code`, { email, code: accessCode });
      if (res.data.success) {
        const proSession = { id: res.data.profile.id, email: res.data.profile.email, name: res.data.profile.full_name, image: res.data.profile.image, type: res.data.profile.profile_type, verified: true, createdAt: Date.now() };
        localStorage.setItem('cc2026_pro_session', JSON.stringify(proSession));
        toast.success(`Bienvenue ${res.data.profile.full_name} !`);
        navigate('/espace-pro', { replace: true });
      }
    } catch { toast.error('Code invalide'); }
    finally { setVerifying(false); }
  };

  if (verifying) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}><div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.gold }} /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${C.gold}20` }}>
            <Users size={32} style={{ color: C.gold }} />
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>Espace Pro CC2026</h1>
          <p className="text-base" style={{ color: C.muted }}>Votre réseau professionnel culturel afro-caribéen</p>
        </div>
        <div className="p-6 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {!codeSent ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label htmlFor="pro-email" className="block text-sm mb-2 font-medium" style={{ color: C.muted }}>Email professionnel</label>
                <input id="pro-email" type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 rounded-lg text-base" data-testid="pro-email-input"
                  style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, outline: 'none', minHeight: 48 }} />
              </div>
              <Button type="submit" disabled={loading || !email} className="w-full rounded-full text-base font-bold"
                style={{ background: C.gold, color: '#000', minHeight: 48 }} data-testid="pro-request-code-btn">
                {loading ? 'Envoi...' : "Recevoir mon code d'accès"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-sm text-center" style={{ color: C.muted }}>Un code à 6 chiffres a été envoyé à <strong style={{ color: C.gold }}>{email}</strong></p>
              <div>
                <label htmlFor="pro-code" className="block text-sm mb-2 font-medium" style={{ color: C.muted }}>Code d'accès</label>
                <input id="pro-code" type="text" placeholder="000000" value={accessCode} onChange={e => setAccessCode(e.target.value)}
                  className="w-full px-4 rounded-lg text-center text-xl tracking-widest" data-testid="pro-code-input" maxLength={6}
                  style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text, outline: 'none', minHeight: 48, letterSpacing: '0.3em' }} />
              </div>
              <Button type="submit" disabled={verifying || accessCode.length < 6} className="w-full rounded-full text-base font-bold"
                style={{ background: C.gold, color: '#000', minHeight: 48 }} data-testid="pro-verify-code-btn">
                {verifying ? 'Vérification...' : 'Vérifier et accéder'}
              </Button>
              <button type="button" onClick={() => setCodeSent(false)} className="w-full text-center text-sm py-2" style={{ color: C.dim }}>
                Changer d'adresse email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProSpaceDashboard;
