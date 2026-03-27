// ═══════════════════════════════════════════════════════════════
// ESPACE PRO CC2026 - LinkedIn Culturel Afro-Caribéen
// Refonte complète — Structure et design inspirés de LinkedIn
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Users, MessageSquare, Briefcase, Calendar, Search,
  Settings, LogOut, Bell, ChevronRight, Plus, Send, Heart,
  Star, MapPin, Globe, Building2, Mic2, Mail, Phone, Link2,
  Edit2, Save, X, Check, Filter, Sparkles, ArrowRight,
  Clock, Eye, MessageCircle, Handshake, Newspaper, Tag,
  ChevronDown, ChevronUp, Shield, Award, Image, Home, Bookmark
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Design tokens — dark kiltikonet.fr
const C = {
  bg: '#0F0F0F',
  surface: '#1B1B1B',
  card: '#242424',
  border: '#333333',
  text: '#E8E4DC',
  muted: '#9A9A9A',
  dim: '#666666',
  gold: '#D4A84B',
  accent: '#C4714A',
  forest: '#4A5D4E',
  blue: '#5B9BD5',
  red: '#E85A4F',
  inputBg: '#2A2A2A',
};

const PROFILE_ICONS = {
  artist: Mic2, label: Building2, booking_agency: Globe,
  institution: Building2, press: Newspaper, other: Users,
};
const PROFILE_LABELS = {
  artist: 'Artiste', label: 'Label / Producteur', booking_agency: 'Agence Booking',
  institution: 'Institution', press: 'Presse / Média', other: 'Professionnel',
};

// ═══════════════════════════════════════════════════════════════
// PRO SPACE LOGIN — Preserved as-is
// ═══════════════════════════════════════════════════════════════
export const ProSpaceLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) verifyMagicLink(token);
  }, [searchParams]);

  const verifyMagicLink = async (token) => {
    setVerifying(true);
    try {
      const res = await axios.post(`${API}/pro/verify-token`, { token });
      if (res.data.success) {
        const proSession = { id: res.data.profile.id, email: res.data.profile.email, name: res.data.profile.full_name, image: res.data.profile.image, type: res.data.profile.profile_type, verified: true, createdAt: Date.now() };
        localStorage.setItem('cc2026_pro_session', JSON.stringify(proSession));
        toast.success(`Bienvenue ${res.data.profile.full_name} !`);
        navigate('/espace-pro', { replace: true });
      }
    } catch { toast.error('Lien expiré ou invalide'); }
    finally { setVerifying(false); }
  };

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
        toast.success('Code d\'accès envoyé !', { description: 'Vérifiez votre boîte mail' });
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
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.gold }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${C.gold}20` }}>
            <Users className="w-8 h-8" style={{ color: C.gold }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>Espace Pro CC2026</h1>
          <p className="text-sm" style={{ color: C.muted }}>Votre réseau professionnel culturel afro-caribéen</p>
        </div>
        <div className="p-6 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {!codeSent ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: C.muted }}>Email professionnel</label>
                <Input type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text }} data-testid="pro-email-input" />
              </div>
              <Button type="submit" disabled={loading || !email} className="w-full h-12" style={{ background: C.gold, color: '#000' }} data-testid="pro-request-code-btn">{loading ? 'Envoi...' : 'Recevoir mon code d\'accès'}</Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-4">
                <Check className="w-12 h-12 mx-auto mb-2" style={{ color: C.forest }} />
                <p className="text-sm" style={{ color: C.text }}>Code envoyé à <strong>{email}</strong></p>
              </div>
              <Input type="text" placeholder="000000" value={accessCode} onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="h-12 text-center text-2xl tracking-widest" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text }} data-testid="pro-code-input" />
              <Button type="submit" disabled={verifying || accessCode.length !== 6} className="w-full h-12" style={{ background: C.gold, color: '#000' }} data-testid="pro-verify-code-btn">{verifying ? 'Vérification...' : 'Accéder'}</Button>
              <button type="button" onClick={() => setCodeSent(false)} className="w-full text-sm py-2" style={{ color: C.dim }}>Autre email</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PRO SESSION HOOK — Preserved as-is
// ═══════════════════════════════════════════════════════════════
export const useProSession = () => {
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

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD — LinkedIn Layout
// ═══════════════════════════════════════════════════════════════
const ProSpaceDashboard = () => {
  const navigate = useNavigate();
  const { session, loading, logout, isAuthenticated } = useProSession();
  const [activeSection, setActiveSection] = useState('feed');
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => { if (!loading && !isAuthenticated) navigate('/espace-pro/connexion'); }, [loading, isAuthenticated, navigate]);
  useEffect(() => { if (session?.id) loadProfileData(); }, [session?.id]);

  const loadProfileData = async () => {
    setLoadingData(true);
    try {
      const [profileRes, connectionsRes, messagesRes, oppsRes, eventsRes] = await Promise.all([
        axios.get(`${API}/pro/profile/${session.id}`).catch(() => ({ data: null })),
        axios.get(`${API}/pro/connections/${session.id}`).catch(() => ({ data: { connections: [] } })),
        axios.get(`${API}/pro/messages/${session.id}`).catch(() => ({ data: { messages: [] } })),
        axios.get(`${API}/pro/opportunities`).catch(() => ({ data: { opportunities: [] } })),
        axios.get(`${API}/pro/events`).catch(() => ({ data: { events: [] } })),
      ]);
      setProfile(profileRes.data);
      setConnections(connectionsRes.data.connections || []);
      setMessages(messagesRes.data.messages || []);
      setOpportunities(oppsRes.data.opportunities || []);
      setEvents(eventsRes.data.events || []);
    } catch (err) { console.error(err); }
    finally { setLoadingData(false); }
  };

  const handleLogout = () => { logout(); toast.success('Déconnexion'); navigate('/espace-pro/connexion'); };

  if (loading || !session) {
    return (<div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.gold }} /></div>);
  }

  const unreadCount = messages.filter(m => !m.read && m.to === session.id).length;

  const navItems = [
    { id: 'feed', label: 'Accueil', icon: Home },
    { id: 'network', label: 'Réseau', icon: Users },
    { id: 'opportunities', label: 'Emplois', icon: Briefcase },
    { id: 'events', label: 'Agenda', icon: Calendar },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Syne', sans-serif" }} data-testid="pro-space-dashboard">
      {/* ───── TOP NAV BAR (LinkedIn style) ───── */}
      <header className="sticky top-0 z-50 border-b" style={{ background: C.surface, borderColor: C.border }}>
        <div className="max-w-[1128px] mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveSection('feed')}>
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: C.gold }}>
              <span className="font-black text-sm" style={{ color: '#000' }}>CC</span>
            </div>
          </div>
          {/* Search */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.dim }} />
            <input placeholder="Rechercher..." className="w-full h-9 pl-9 pr-3 rounded text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
          </div>
          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)} data-testid={`nav-${item.id}`}
                className="flex flex-col items-center px-4 py-1 transition-colors relative"
                style={{ color: activeSection === item.id ? C.text : C.dim }}>
                <item.icon size={20} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
                {activeSection === item.id && <div className="absolute bottom-0 left-2 right-2 h-0.5" style={{ background: C.text }} />}
              </button>
            ))}
            <button onClick={() => setShowMessages(!showMessages)} className="flex flex-col items-center px-4 py-1 relative" style={{ color: showMessages ? C.text : C.dim }} data-testid="nav-messages">
              <MessageSquare size={20} />
              <span className="text-[10px] mt-0.5">Messages</span>
              {unreadCount > 0 && <span className="absolute top-0 right-2 w-4 h-4 rounded-full text-[10px] flex items-center justify-center" style={{ background: C.red, color: '#fff' }}>{unreadCount}</span>}
            </button>
          </nav>
          {/* Profile dropdown */}
          <div className="flex items-center gap-3 ml-2 pl-4 border-l" style={{ borderColor: C.border }}>
            <button onClick={() => setActiveSection('profile')} className="flex items-center gap-2" data-testid="nav-profile">
              <img src={session.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name)}&background=D4A84B&color=1C1A14`} alt="" className="w-7 h-7 rounded-full object-cover" />
              <ChevronDown size={12} style={{ color: C.dim }} />
            </button>
            <button onClick={handleLogout} className="p-1.5 rounded hover:bg-white/5" style={{ color: C.dim }} data-testid="logout-btn">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ───── MAIN CONTENT ───── */}
      <div className="max-w-[1128px] mx-auto px-4 py-6">
        {activeSection === 'feed' && <FeedLayout session={session} profile={profile} connections={connections} onRefresh={loadProfileData} />}
        {activeSection === 'profile' && <ProfilePage profile={profile} session={session} connections={connections} onUpdate={loadProfileData} />}
        {activeSection === 'network' && <NetworkPage connections={connections} session={session} onConnect={loadProfileData} />}
        {activeSection === 'opportunities' && <OpportunitiesPage opportunities={opportunities} session={session} />}
        {activeSection === 'events' && <EventsPage events={events} session={session} />}
      </div>

      {/* ───── MESSAGES PANEL (Bottom-right like LinkedIn) ───── */}
      {showMessages && <MessagesPanel messages={messages} session={session} onUpdate={loadProfileData} onClose={() => setShowMessages(false)} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// AVATAR — reused everywhere
// ═══════════════════════════════════════════════════════════════
const Avatar = ({ src, name, size = 48, className = '' }) => (
  <img src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&background=4A5D4E&color=F4F1EA&size=${size * 2}`} alt={name} className={`rounded-full object-cover ${className}`} style={{ width: size, height: size }} />
);

// ═══════════════════════════════════════════════════════════════
// FEED LAYOUT — 3 colonnes LinkedIn
// ═══════════════════════════════════════════════════════════════
const FeedLayout = ({ session, profile, connections, onRefresh }) => (
  <div className="flex gap-6">
    {/* Left sidebar — Mini profile card */}
    <aside className="hidden lg:block w-56 flex-shrink-0 space-y-4">
      <div className="rounded-lg overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="h-14" style={{ background: `linear-gradient(135deg, ${C.accent}60, ${C.gold}30)` }} />
        <div className="px-4 pb-4 -mt-7 text-center">
          <Avatar src={session.image} name={session.name} size={56} className="mx-auto border-2" style={{ borderColor: C.card }} />
          <h3 className="text-sm font-bold mt-2" style={{ color: C.text }}>{session.name}</h3>
          <p className="text-xs" style={{ color: C.muted }}>{PROFILE_LABELS[session.type] || 'Professionnel'}</p>
        </div>
        <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: C.border }}>
          <div className="flex justify-between text-xs"><span style={{ color: C.muted }}>Connexions</span><span style={{ color: C.gold }}>{connections.length}</span></div>
          <div className="flex justify-between text-xs"><span style={{ color: C.muted }}>Vues profil</span><span style={{ color: C.gold }}>{profile?.views || 0}</span></div>
        </div>
      </div>
    </aside>

    {/* Center — Feed */}
    <main className="flex-1 min-w-0">
      <FeedSection session={session} />
    </main>

    {/* Right sidebar — Suggestions */}
    <aside className="hidden xl:block w-72 flex-shrink-0 space-y-4">
      <RecommendationsWidget session={session} />
    </aside>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// FEED SECTION — LinkedIn-style posts
// ═══════════════════════════════════════════════════════════════
const FeedSection = ({ session }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [showComments, setShowComments] = useState({});

  const loadFeed = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/pro/social/feed`, { params: { profile_id: session.id } });
      setPosts(res.data.posts || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [session.id]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const createPost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await axios.post(`${API}/pro/social/posts`, { author_id: session.id, author_name: session.name, author_image: session.image, author_type: session.type, content: newPost });
      setNewPost('');
      toast.success('Publication partagée');
      loadFeed();
    } catch { toast.error('Erreur'); }
    finally { setPosting(false); }
  };

  const handleLike = async (postId) => {
    try { await axios.post(`${API}/pro/social/posts/${postId}/like?profile_id=${session.id}`); loadFeed(); } catch {}
  };

  const handleComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    try {
      await axios.post(`${API}/pro/social/posts/${postId}/comment`, { author_id: session.id, author_name: session.name, content });
      setCommentInputs({ ...commentInputs, [postId]: '' });
      loadFeed();
    } catch {}
  };

  const deletePost = async (postId) => {
    try { await axios.delete(`${API}/pro/social/posts/${postId}?author_id=${session.id}`); loadFeed(); } catch {}
  };

  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return `${Math.floor(diff / 86400)} j`;
  };

  return (
    <div className="space-y-4">
      {/* Create Post Box */}
      <div className="rounded-lg p-4" style={{ background: C.card, border: `1px solid ${C.border}` }} data-testid="create-post-box">
        <div className="flex gap-3">
          <Avatar src={session.image} name={session.name} size={48} />
          <div className="flex-1">
            <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Commencer un post..." rows={2}
              className="w-full p-3 rounded-lg text-sm resize-none" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} data-testid="new-post-input" />
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2">
                <button className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/5" style={{ color: C.blue }}><Image size={14} /> Photo</button>
                <button className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/5" style={{ color: C.forest }}><Calendar size={14} /> Event</button>
              </div>
              <Button size="sm" disabled={!newPost.trim() || posting} onClick={createPost} className="rounded-full px-4" style={{ background: C.gold, color: '#000' }} data-testid="publish-post-btn">
                {posting ? 'Publication...' : 'Publier'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="py-12 text-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: C.gold }} /></div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg p-12 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Newspaper size={40} className="mx-auto mb-3" style={{ color: C.dim }} />
          <p style={{ color: C.muted }}>Aucune publication. Soyez le premier !</p>
        </div>
      ) : posts.map(post => (
        <div key={post.id} className="rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}` }} data-testid={`post-${post.id}`}>
          {/* Post Header */}
          <div className="p-4 pb-0">
            <div className="flex gap-3">
              <Avatar src={post.author_image} name={post.author_name} size={48} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: C.text }}>{post.author_name}</span>
                  {post.author_id === session.id && (
                    <button onClick={() => deletePost(post.id)} className="ml-auto p-1 rounded hover:bg-white/10" style={{ color: C.dim }}><X size={14} /></button>
                  )}
                </div>
                <p className="text-xs" style={{ color: C.muted }}>{PROFILE_LABELS[post.author_type] || ''}</p>
                <p className="text-xs flex items-center gap-1" style={{ color: C.dim }}><Clock size={10} /> {timeAgo(post.created_at)}</p>
              </div>
            </div>
          </div>
          {/* Post Content */}
          <div className="px-4 py-3">
            <p className="text-sm whitespace-pre-wrap" style={{ color: C.text, lineHeight: 1.6 }}>{post.content}</p>
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.tags.map(t => <span key={t} className="text-xs" style={{ color: C.gold }}>#{t}</span>)}
              </div>
            )}
          </div>
          {/* Counts */}
          {(post.likes_count > 0 || post.comments_count > 0) && (
            <div className="px-4 py-1 flex items-center justify-between text-xs border-b" style={{ borderColor: C.border, color: C.muted }}>
              {post.likes_count > 0 && <span className="flex items-center gap-1"><Heart size={12} fill={C.red} style={{ color: C.red }} /> {post.likes_count}</span>}
              {post.comments_count > 0 && <button onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })}>{post.comments_count} commentaire{post.comments_count > 1 ? 's' : ''}</button>}
            </div>
          )}
          {/* Action Bar */}
          <div className="px-2 py-1 flex border-t" style={{ borderColor: C.border }}>
            <button onClick={() => handleLike(post.id)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded hover:bg-white/5 text-sm transition-colors"
              style={{ color: post.likes?.includes(session.id) ? C.red : C.muted }}>
              <Heart size={18} fill={post.likes?.includes(session.id) ? C.red : 'none'} /> J'aime
            </button>
            <button onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded hover:bg-white/5 text-sm" style={{ color: C.muted }}>
              <MessageCircle size={18} /> Commenter
            </button>
          </div>
          {/* Comments */}
          {showComments[post.id] && (
            <div className="px-4 pb-4 border-t" style={{ borderColor: C.border }}>
              {post.comments?.map(c => (
                <div key={c.id} className="flex gap-2 mt-3">
                  <Avatar src={null} name={c.author_name} size={32} />
                  <div className="flex-1 p-2 rounded-lg" style={{ background: C.inputBg }}>
                    <span className="text-xs font-semibold" style={{ color: C.text }}>{c.author_name}</span>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{c.content}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <Avatar src={session.image} name={session.name} size={32} />
                <div className="flex-1 flex gap-2">
                  <input value={commentInputs[post.id] || ''} onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                    placeholder="Ajouter un commentaire..." className="flex-1 h-8 px-3 rounded-full text-xs" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
                  <button onClick={() => handleComment(post.id)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10" style={{ color: C.gold }}><Send size={14} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATIONS WIDGET — "Personnes que vous connaissez"
// ═══════════════════════════════════════════════════════════════
const RecommendationsWidget = ({ session }) => {
  const [recs, setRecs] = useState([]);
  useEffect(() => {
    axios.get(`${API}/pro/social/recommendations/${session.id}?limit=5`).then(r => setRecs(r.data.recommendations || [])).catch(() => {});
  }, [session.id]);

  const sendConnect = async (id) => {
    try { await axios.post(`${API}/pro/connect`, { from: session.id, to: id }); toast.success('Demande envoyée'); setRecs(prev => prev.filter(r => r.id !== id)); } catch {}
  };

  return (
    <div className="rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="p-4 border-b" style={{ borderColor: C.border }}>
        <h3 className="text-sm font-semibold" style={{ color: C.text }}>Profils suggérés</h3>
      </div>
      {recs.length === 0 ? (
        <div className="p-4 text-center"><p className="text-xs" style={{ color: C.dim }}>Complétez votre profil pour recevoir des suggestions</p></div>
      ) : recs.map(r => (
        <div key={r.id} className="p-3 border-b last:border-0 hover:bg-white/5 transition-colors" style={{ borderColor: C.border }} data-testid={`suggestion-${r.id}`}>
          <div className="flex gap-3">
            <Avatar src={r.image} name={r.full_name} size={48} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: C.text }}>{r.full_name}</p>
              <p className="text-xs truncate" style={{ color: C.muted }}>{r.organization_name || PROFILE_LABELS[r.profile_type]}</p>
              {r.reasons?.[0] && <p className="text-[10px] mt-1" style={{ color: C.gold }}>{r.reasons[0]}</p>}
              <Button size="sm" variant="outline" onClick={() => sendConnect(r.id)} className="mt-2 rounded-full h-7 px-3 text-xs" style={{ borderColor: C.gold, color: C.gold }} data-testid={`connect-${r.id}`}>
                <Plus size={12} className="mr-1" /> Se connecter
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROFILE PAGE — LinkedIn-style full profile
// ═══════════════════════════════════════════════════════════════
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
    try { await axios.put(`${API}/pro/profile/${session.id}`, formData); toast.success('Profil mis à jour'); setEditing(false); onUpdate(); }
    catch { toast.error('Erreur sauvegarde'); }
    finally { setSaving(false); }
  };

  const Icon = PROFILE_ICONS[profile?.profile_type] || Users;
  const tags = profile?.expertise_tags || [];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Banner + Photo Card */}
      <div className="rounded-lg overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="h-48 relative" style={{ background: `linear-gradient(135deg, ${C.accent}50, ${C.gold}20, ${C.forest}30)` }}>
          {editing && <Button size="sm" className="absolute top-3 right-3 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}><Image size={14} className="mr-1" /> Bannière</Button>}
        </div>
        <div className="px-6 pb-6 relative">
          {/* Profile Photo */}
          <div className="absolute -top-16">
            <img src={profile?.image || session.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name)}&background=D4A84B&color=1C1A14&size=256`} alt={session.name}
              className="w-32 h-32 rounded-full object-cover border-4" style={{ borderColor: C.card }} />
          </div>
          {/* Actions */}
          <div className="flex justify-end pt-4 gap-2">
            <Button size="sm" onClick={() => editing ? handleSave() : setEditing(true)} className="rounded-full" style={editing ? { background: C.gold, color: '#000' } : { background: 'transparent', border: `1px solid ${C.gold}`, color: C.gold }} data-testid="edit-profile-btn">
              {editing ? (saving ? 'Sauvegarde...' : <><Save size={14} className="mr-1" /> Enregistrer</>) : <><Edit2 size={14} className="mr-1" /> Modifier le profil</>}
            </Button>
            {editing && <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="rounded-full" style={{ color: C.muted }}><X size={14} /></Button>}
          </div>
          {/* Name & Title */}
          <div className="mt-8">
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>{session.name}</h1>
            <p className="text-base mt-0.5" style={{ color: C.muted }}>{profile?.organization_name || PROFILE_LABELS[session.type]}</p>
            <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: C.dim }}>
              {profile?.country && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.country}</span>}
              <span className="flex items-center gap-1" style={{ color: C.gold }}><Users size={14} /> {connections.length} connexion{connections.length !== 1 ? 's' : ''}</span>
            </div>
            {/* Badges */}
            <div className="flex gap-2 mt-3">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ background: `${C.gold}20`, color: C.gold }}>
                <Award size={12} /> Accrédité CC2026
              </span>
              {profile?.frek_id && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ background: `${C.blue}20`, color: C.blue }}>
                  <Shield size={12} /> FREK Vérifié
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* À propos */}
      <div className="rounded-lg p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <button className="flex items-center justify-between w-full" onClick={() => setAboutOpen(!aboutOpen)}>
          <h2 className="text-base font-semibold" style={{ color: C.text }}>À propos</h2>
          {aboutOpen ? <ChevronUp size={18} style={{ color: C.dim }} /> : <ChevronDown size={18} style={{ color: C.dim }} />}
        </button>
        {aboutOpen && (
          <div className="mt-3">
            {editing ? (
              <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} placeholder="Décrivez votre parcours, vos projets..."
                className="w-full p-3 rounded-lg text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: profile?.bio ? C.muted : C.dim }}>{profile?.bio || 'Aucune description. Cliquez sur Modifier pour ajouter.'}</p>
            )}
          </div>
        )}
      </div>

      {/* Compétences & Tags */}
      <div className="rounded-lg p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-base font-semibold mb-3" style={{ color: C.text }}>Compétences</h2>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: `${C.gold}15`, color: C.gold, border: `1px solid ${C.gold}30` }}>{tag}</span>
            ))}
          </div>
        ) : <p className="text-sm" style={{ color: C.dim }}>Aucune compétence renseignée</p>}
      </div>

      {/* Je recherche / Je propose */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: C.text }}><Search size={16} style={{ color: C.forest }} /> Je recherche</h2>
          {editing ? <textarea value={formData.seeking} onChange={(e) => setFormData({ ...formData, seeking: e.target.value })} rows={2} placeholder="Ex: Distribution, Booking Europe..."
            className="w-full p-2 rounded text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
          : <p className="text-sm" style={{ color: profile?.seeking ? C.muted : C.dim }}>{profile?.seeking || 'Non renseigné'}</p>}
        </div>
        <div className="rounded-lg p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: C.text }}><Handshake size={16} style={{ color: C.accent }} /> Je propose</h2>
          {editing ? <textarea value={formData.offering} onChange={(e) => setFormData({ ...formData, offering: e.target.value })} rows={2} placeholder="Ex: Production musicale, Conseil..."
            className="w-full p-2 rounded text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
          : <p className="text-sm" style={{ color: profile?.offering ? C.muted : C.dim }}>{profile?.offering || 'Non renseigné'}</p>}
        </div>
      </div>

      {/* Liens */}
      <div className="rounded-lg p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-base font-semibold mb-3" style={{ color: C.text }}>Liens</h2>
        {editing ? (
          <div className="space-y-2">
            <Input placeholder="Site web" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="h-9 text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text }} />
            <Input placeholder="LinkedIn" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} className="h-9 text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text }} />
            <Input placeholder="Instagram" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} className="h-9 text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text }} />
          </div>
        ) : (
          <div className="space-y-2">
            {profile?.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline" style={{ color: C.gold }}><Globe size={14} /> {profile.website}</a>}
            {profile?.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline" style={{ color: C.gold }}><Link2 size={14} /> LinkedIn</a>}
            {!profile?.website && !profile?.linkedin && <p className="text-sm" style={{ color: C.dim }}>Aucun lien</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// NETWORK PAGE — Annuaire LinkedIn
// ═══════════════════════════════════════════════════════════════
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

  // Fallback: if directory is empty, load from registrations
  useEffect(() => {
    if (!loading && pros.length === 0) {
      axios.get(`${API}/registrations`).then(r => { setPros(r.data.registrations?.filter(x => x.status === 'approved' && x.id !== session.id) || []); }).catch(() => {});
    }
  }, [loading, pros.length, session.id]);

  const sendConnect = async (proId) => {
    try { await axios.post(`${API}/pro/connect`, { from: session.id, to: proId }); toast.success('Demande envoyée'); onConnect(); } catch { toast.error('Erreur'); }
  };

  const filtered = pros.filter(p => {
    const matchSearch = !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.organization_name?.toLowerCase().includes(search.toLowerCase()) || p.bio?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.profile_type === filterType;
    const matchCountry = !filterCountry || p.country === filterCountry;
    return matchSearch && matchType && matchCountry && p.id !== session.id;
  });

  const countries = [...new Set(pros.map(p => p.country).filter(Boolean))];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="rounded-lg p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: C.text }}>Réseau — {filtered.length} professionnel{filtered.length !== 1 ? 's' : ''}</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.dim }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom, organisation..." className="w-full h-9 pl-9 pr-3 rounded text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} data-testid="network-search" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-9 px-3 rounded text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text }}>
            <option value="">Tous les profils</option>
            <option value="artist">Artistes</option>
            <option value="label">Labels</option>
            <option value="booking_agency">Booking</option>
            <option value="institution">Institutions</option>
            <option value="press">Presse</option>
          </select>
          <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="h-9 px-3 rounded text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text }}>
            <option value="">Tous territoires</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: C.gold }} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(pro => {
            const isConnected = connections.some(c => c.id === pro.id);
            return (
              <div key={pro.id} className="rounded-lg p-4 flex gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ background: C.card, border: `1px solid ${C.border}` }}
                onClick={() => setSelectedPro(pro)} data-testid={`pro-card-${pro.id}`}>
                <Avatar src={pro.image || pro.logo_url} name={pro.full_name} size={64} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate" style={{ color: C.text }}>{pro.full_name}</h3>
                  <p className="text-xs truncate" style={{ color: C.muted }}>{pro.organization_name || PROFILE_LABELS[pro.profile_type]}</p>
                  {pro.country && <p className="text-xs flex items-center gap-1 mt-1" style={{ color: C.dim }}><MapPin size={10} /> {pro.country}</p>}
                  {pro.bio && <p className="text-xs mt-1 line-clamp-1" style={{ color: C.dim }}>{pro.bio}</p>}
                  <div className="mt-2">
                    {isConnected ? (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${C.gold}15`, color: C.gold }}>Connecté</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); sendConnect(pro.id); }} className="rounded-full h-7 px-3 text-xs" style={{ borderColor: C.gold, color: C.gold }} data-testid={`connect-btn-${pro.id}`}>
                        <Plus size={12} className="mr-1" /> Se connecter
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

// ═══════════════════════════════════════════════════════════════
// PROFILE MODAL — LinkedIn profile card
// ═══════════════════════════════════════════════════════════════
const ProfileModal = ({ pro, onClose, session, isConnected, onConnect }) => {
  const Icon = PROFILE_ICONS[pro.profile_type] || Users;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg" style={{ background: C.surface, border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()} data-testid="profile-modal">
        {/* Banner */}
        <div className="h-32 relative rounded-t-lg" style={{ background: `linear-gradient(135deg, ${C.accent}50, ${C.gold}25)` }}>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/40" data-testid="close-profile-modal"><X size={16} style={{ color: '#fff' }} /></button>
        </div>
        <div className="px-6 pb-6 -mt-12">
          <img src={pro.logo_url || pro.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.full_name)}&background=D4A84B&color=1C1A14&size=200`} alt={pro.full_name}
            className="w-24 h-24 rounded-full object-cover border-4" style={{ borderColor: C.surface }} />
          <div className="flex items-center gap-2 mt-3">
            <Icon size={16} style={{ color: C.accent }} />
            <span className="text-xs" style={{ color: C.accent }}>{PROFILE_LABELS[pro.profile_type]}</span>
          </div>
          <h2 className="text-xl font-bold mt-1" style={{ color: C.text }}>{pro.full_name}</h2>
          <p className="text-sm" style={{ color: C.muted }}>{pro.organization_name}</p>
          {pro.country && <p className="text-xs flex items-center gap-1 mt-1" style={{ color: C.dim }}><MapPin size={12} /> {pro.country}</p>}

          {/* Contact — locked for non-connected */}
          <div className="mt-4 p-4 rounded-lg" style={{ background: C.card }}>
            {isConnected ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}><Mail size={14} style={{ color: C.gold }} /> <span data-testid="pro-email">{pro.email}</span></div>
                {pro.phone && <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}><Phone size={14} style={{ color: C.gold }} /> <span data-testid="pro-phone">{pro.phone}</span></div>}
              </div>
            ) : (
              <div className="text-center py-2" data-testid="contact-locked">
                <Users size={20} className="mx-auto mb-2" style={{ color: C.dim }} />
                <p className="text-xs" style={{ color: C.dim }}>Connectez-vous pour voir les coordonnées</p>
              </div>
            )}
          </div>

          {/* Bio */}
          {pro.bio && <div className="mt-4"><h3 className="text-sm font-semibold mb-1" style={{ color: C.text }}>À propos</h3><p className="text-sm" style={{ color: C.muted }}>{pro.bio}</p></div>}

          {/* Tags */}
          {pro.expertise_tags?.length > 0 && (
            <div className="mt-4"><h3 className="text-sm font-semibold mb-2" style={{ color: C.text }}>Compétences</h3>
              <div className="flex flex-wrap gap-1">{pro.expertise_tags.map(t => <span key={t} className="px-2 py-1 text-xs rounded-full" style={{ background: `${C.gold}15`, color: C.gold }}>{t}</span>)}</div>
            </div>
          )}

          {/* Action */}
          <div className="mt-5 flex gap-2">
            {isConnected ? (
              <Button className="flex-1 rounded-full" style={{ background: `${C.gold}20`, color: C.gold }}><MessageSquare size={14} className="mr-2" /> Message</Button>
            ) : (
              <Button onClick={onConnect} className="flex-1 rounded-full" style={{ background: C.gold, color: '#000' }}><Plus size={14} className="mr-2" /> Se connecter</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MESSAGES PANEL — Bottom-right LinkedIn style
// ═══════════════════════════════════════════════════════════════
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
    <div className="fixed bottom-0 right-4 z-50 w-80 shadow-2xl rounded-t-lg" style={{ background: C.surface, border: `1px solid ${C.border}` }} data-testid="messages-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b cursor-pointer" style={{ borderColor: C.border }} onClick={() => !selectedConv && onClose()}>
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: C.gold }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>
            {selectedConv ? (convos[selectedConv]?.name || 'Conversation') : 'Messages'}
          </span>
        </div>
        <div className="flex gap-1">
          {selectedConv && <button onClick={() => setSelectedConv(null)} className="p-1 rounded hover:bg-white/10"><ChevronDown size={14} style={{ color: C.dim }} /></button>}
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X size={14} style={{ color: C.dim }} /></button>
        </div>
      </div>

      {!selectedConv ? (
        /* Conversation List */
        <div className="max-h-80 overflow-y-auto">
          {Object.values(convos).length === 0 ? (
            <div className="p-6 text-center"><p className="text-xs" style={{ color: C.dim }}>Aucune conversation</p></div>
          ) : Object.values(convos).map(conv => (
            <button key={conv.id} onClick={() => setSelectedConv(conv.id)} className="w-full p-3 flex items-center gap-3 hover:bg-white/5 border-b" style={{ borderColor: C.border }}>
              <Avatar src={null} name={conv.name} size={36} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate" style={{ color: C.text }}>{conv.name}</p>
                <p className="text-xs truncate" style={{ color: C.dim }}>{conv.messages[conv.messages.length - 1]?.content}</p>
              </div>
              {conv.unread > 0 && <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center flex-shrink-0" style={{ background: C.red, color: '#fff' }}>{conv.unread}</span>}
            </button>
          ))}
        </div>
      ) : (
        /* Chat */
        <>
          <div className="h-64 overflow-y-auto p-3 space-y-2">
            {convos[selectedConv]?.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === session.id ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm" style={{ background: msg.from === session.id ? C.gold : C.card, color: msg.from === session.id ? '#000' : C.text }}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2" style={{ borderColor: C.border }}>
            <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMsg()} placeholder="Écrire..." className="flex-1 h-8 px-3 rounded text-sm" style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
            <button onClick={sendMsg} className="w-8 h-8 rounded flex items-center justify-center" style={{ background: C.gold }}><Send size={14} style={{ color: '#000' }} /></button>
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// OPPORTUNITIES PAGE
// ═══════════════════════════════════════════════════════════════
const OpportunitiesPage = ({ opportunities, session }) => {
  const typeColors = { Booking: C.accent, Business: C.gold, Subvention: C.forest, Formation: C.blue, Emploi: '#8B1A4A' };
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="rounded-lg p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-lg font-bold" style={{ color: C.text }}>Opportunités — {opportunities.length} offres</h2>
      </div>
      {opportunities.length === 0 ? (
        <div className="rounded-lg p-12 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Briefcase size={40} className="mx-auto mb-3" style={{ color: C.dim }} />
          <p style={{ color: C.muted }}>Aucune opportunité pour le moment</p>
        </div>
      ) : opportunities.map(opp => (
        <div key={opp.id} className="rounded-lg p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${typeColors[opp.type] || C.dim}20`, color: typeColors[opp.type] || C.muted }}>{opp.type}</span>
              <h3 className="text-base font-semibold mt-2" style={{ color: C.text }}>{opp.title}</h3>
              <p className="text-sm mt-1" style={{ color: C.muted }}>{opp.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EVENTS PAGE
// ═══════════════════════════════════════════════════════════════
const EventsPage = ({ events, session }) => (
  <div className="max-w-3xl mx-auto space-y-4">
    <div className="rounded-lg p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <h2 className="text-lg font-bold" style={{ color: C.text }}>Agenda — {events.length} événements</h2>
    </div>
    {events.length === 0 ? (
      <div className="rounded-lg p-12 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <Calendar size={40} className="mx-auto mb-3" style={{ color: C.dim }} />
        <p style={{ color: C.muted }}>Aucun événement programmé</p>
      </div>
    ) : events.map(evt => (
      <div key={evt.id} className="rounded-lg p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="text-base font-semibold" style={{ color: C.text }}>{evt.title}</h3>
        <p className="text-sm mt-1" style={{ color: C.muted }}>{evt.description}</p>
        {evt.date && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: C.dim }}><Clock size={12} /> {new Date(evt.date).toLocaleDateString('fr-FR')}</p>}
      </div>
    ))}
  </div>
);

export default ProSpaceDashboard;
