// ═══════════════════════════════════════════════════════════════
// ESPACE PRO CC2026 - LinkedIn Culturel Afro-Caribéen
// Plateforme exclusive pour les professionnels accrédités
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Users, MessageSquare, Briefcase, Calendar, Search,
  Settings, LogOut, Bell, ChevronRight, Plus, Send, Heart,
  Star, MapPin, Globe, Building2, Mic2, Mail, Phone, Link2,
  Edit2, Save, X, Check, Filter, Sparkles, ArrowRight,
  Clock, Eye, MessageCircle, Handshake, Newspaper, Tag
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Design tokens
const COLORS = {
  charbon: '#1C1A14',
  card: '#2A2820',
  cream: '#F4F1EA',
  gold: '#D4A84B',
  terracotta: '#C4714A',
  forest: '#4A5D4E',
  sage: '#7A8B7A',
  burgundy: '#8B1A4A',
};

// Profile type icons
const PROFILE_ICONS = {
  artist: Mic2,
  label: Building2,
  booking_agency: Globe,
  institution: Building2,
  press: Newspaper,
  other: Users,
};

// ═══════════════════════════════════════════════════════════════
// PRO SPACE LOGIN
// ═══════════════════════════════════════════════════════════════
export const ProSpaceLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Check for magic link token
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyMagicLink(token);
    }
  }, [searchParams]);

  const verifyMagicLink = async (token) => {
    setVerifying(true);
    try {
      const res = await axios.post(`${API}/pro/verify-token`, { token });
      if (res.data.success) {
        // Store pro session
        const proSession = {
          id: res.data.profile.id,
          email: res.data.profile.email,
          name: res.data.profile.full_name,
          image: res.data.profile.image,
          type: res.data.profile.profile_type,
          verified: true,
          createdAt: Date.now(),
        };
        localStorage.setItem('cc2026_pro_session', JSON.stringify(proSession));
        toast.success(`Bienvenue ${res.data.profile.full_name} !`);
        navigate('/espace-pro', { replace: true });
      }
    } catch (err) {
      toast.error('Lien expiré ou invalide');
    } finally {
      setVerifying(false);
    }
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/pro/request-access`, { email });
      if (res.data.success) {
        setCodeSent(true);
        toast.success('Code d\'accès envoyé !', {
          description: 'Vérifiez votre boîte mail'
        });
      } else {
        toast.error(res.data.message || 'Email non trouvé dans notre base');
      }
    } catch (err) {
      toast.error('Email non reconnu', {
        description: 'Vous devez être inscrit à CC2026 pour accéder à l\'Espace Pro'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!accessCode) return;
    
    setVerifying(true);
    try {
      const res = await axios.post(`${API}/pro/verify-code`, { email, code: accessCode });
      if (res.data.success) {
        const proSession = {
          id: res.data.profile.id,
          email: res.data.profile.email,
          name: res.data.profile.full_name,
          image: res.data.profile.image,
          type: res.data.profile.profile_type,
          verified: true,
          createdAt: Date.now(),
        };
        localStorage.setItem('cc2026_pro_session', JSON.stringify(proSession));
        toast.success(`Bienvenue ${res.data.profile.full_name} !`);
        navigate('/espace-pro', { replace: true });
      }
    } catch (err) {
      toast.error('Code invalide');
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.charbon }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: COLORS.gold }} />
          <p style={{ color: COLORS.cream }}>Vérification en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: COLORS.charbon }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${COLORS.gold}20` }}>
            <Users className="w-8 h-8" style={{ color: COLORS.gold }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.cream, fontFamily: "'Syne', sans-serif" }}>
            Espace Pro CC2026
          </h1>
          <p className="text-sm" style={{ color: 'rgba(244,241,234,0.6)' }}>
            Votre réseau professionnel culturel afro-caribéen
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 rounded-xl" style={{ background: COLORS.card }}>
          {!codeSent ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(244,241,234,0.7)' }}>
                  Email professionnel
                </label>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
                  data-testid="pro-email-input"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full h-12"
                style={{ background: COLORS.gold, color: COLORS.charbon }}
                data-testid="pro-request-code-btn"
              >
                {loading ? 'Envoi...' : 'Recevoir mon code d\'accès'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-4">
                <Check className="w-12 h-12 mx-auto mb-2" style={{ color: COLORS.forest }} />
                <p className="text-sm" style={{ color: COLORS.cream }}>
                  Code envoyé à <strong>{email}</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(244,241,234,0.7)' }}>
                  Code d'accès (6 chiffres)
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-12 text-center text-2xl tracking-widest"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
                  data-testid="pro-code-input"
                />
              </div>
              <Button
                type="submit"
                disabled={verifying || accessCode.length !== 6}
                className="w-full h-12"
                style={{ background: COLORS.gold, color: COLORS.charbon }}
                data-testid="pro-verify-code-btn"
              >
                {verifying ? 'Vérification...' : 'Accéder à l\'Espace Pro'}
              </Button>
              <button
                type="button"
                onClick={() => setCodeSent(false)}
                className="w-full text-sm py-2"
                style={{ color: 'rgba(244,241,234,0.5)' }}
              >
                ← Utiliser un autre email
              </button>
            </form>
          )}
        </div>

        {/* Info */}
        <p className="text-center text-xs mt-6" style={{ color: 'rgba(244,241,234,0.4)' }}>
          Réservé aux professionnels inscrits à Culture Connect 2026
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PRO SESSION HOOK
// ═══════════════════════════════════════════════════════════════
export const useProSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('cc2026_pro_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check expiration (7 days)
        if (parsed.createdAt && (Date.now() - parsed.createdAt) < 7 * 24 * 60 * 60 * 1000) {
          setSession(parsed);
        } else {
          localStorage.removeItem('cc2026_pro_session');
        }
      } catch {
        localStorage.removeItem('cc2026_pro_session');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('cc2026_pro_session');
    setSession(null);
  };

  return { session, loading, logout, isAuthenticated: !!session };
};

// ═══════════════════════════════════════════════════════════════
// PRO SPACE DASHBOARD - Main Hub
// ═══════════════════════════════════════════════════════════════
const ProSpaceDashboard = () => {
  const navigate = useNavigate();
  const { session, loading, logout, isAuthenticated } = useProSession();
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/espace-pro/connexion');
    }
  }, [loading, isAuthenticated, navigate]);

  // Load user data
  useEffect(() => {
    if (session?.id) {
      loadProfileData();
    }
  }, [session?.id]);

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
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
    navigate('/espace-pro/connexion');
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.charbon }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.gold }} />
      </div>
    );
  }

  const sections = [
    { id: 'profile', label: 'Mon Profil', icon: User },
    { id: 'network', label: 'Réseau Pro', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: messages.filter(m => !m.read).length },
    { id: 'opportunities', label: 'Opportunités', icon: Briefcase, badge: opportunities.length },
    { id: 'events', label: 'Agenda', icon: Calendar },
  ];

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b" style={{ background: COLORS.card, borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${COLORS.gold}20` }}>
              <Users className="w-5 h-5" style={{ color: COLORS.gold }} />
            </div>
            <div>
              <span className="font-bold" style={{ color: COLORS.gold }}>Espace Pro</span>
              <span className="ml-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>CC2026</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-white/5">
              <Bell className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.6)' }} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center" style={{ background: COLORS.terracotta, color: '#fff' }}>
                  {notifications.length}
                </span>
              )}
            </button>
            
            {/* User Menu */}
            <div className="flex items-center gap-3">
              <img 
                src={session.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name)}&background=D4A84B&color=1C1A14`}
                alt={session.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="hidden sm:block text-sm" style={{ color: COLORS.cream }}>{session.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.4)' }}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeSection === section.id ? 'font-bold' : ''}`}
                  style={{
                    background: activeSection === section.id ? `${COLORS.gold}20` : 'transparent',
                    color: activeSection === section.id ? COLORS.gold : 'rgba(255,255,255,0.6)',
                  }}
                  data-testid={`nav-${section.id}`}
                >
                  <section.icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{section.label}</span>
                  {section.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: COLORS.terracotta, color: '#fff' }}>
                      {section.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            
            {/* Quick Stats */}
            <div className="mt-6 p-4 rounded-lg" style={{ background: COLORS.card }}>
              <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Votre activité</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Connexions</span>
                  <span style={{ color: COLORS.gold }}>{connections.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Messages</span>
                  <span style={{ color: COLORS.gold }}>{messages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Vues profil</span>
                  <span style={{ color: COLORS.gold }}>{profile?.views || 0}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeSection === 'profile' && (
              <ProfileSection profile={profile} session={session} onUpdate={loadProfileData} />
            )}
            {activeSection === 'network' && (
              <NetworkSection connections={connections} session={session} onConnect={loadProfileData} />
            )}
            {activeSection === 'messages' && (
              <MessagesSection messages={messages} session={session} onUpdate={loadProfileData} />
            )}
            {activeSection === 'opportunities' && (
              <OpportunitiesSection opportunities={opportunities} session={session} />
            )}
            {activeSection === 'events' && (
              <EventsSection events={events} session={session} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROFILE SECTION - Mon Profil Pro
// ═══════════════════════════════════════════════════════════════
const ProfileSection = ({ profile, session, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    website: profile?.website || '',
    linkedin: profile?.linkedin || '',
    instagram: profile?.instagram || '',
    seeking: profile?.seeking || '',
    offering: profile?.offering || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/pro/profile/${session.id}`, formData);
      toast.success('Profil mis à jour !');
      setEditing(false);
      onUpdate();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const ProfileIcon = PROFILE_ICONS[profile?.profile_type] || Users;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="p-6 rounded-xl" style={{ background: COLORS.card }}>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="relative">
            <img
              src={profile?.image || session.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name)}&background=D4A84B&color=1C1A14&size=200`}
              alt={session.name}
              className="w-32 h-32 rounded-xl object-cover"
            />
            <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: COLORS.gold }}>
              <Edit2 className="w-4 h-4" style={{ color: COLORS.charbon }} />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ProfileIcon className="w-5 h-5" style={{ color: COLORS.terracotta }} />
              <span className="text-sm" style={{ color: COLORS.terracotta }}>{profile?.profile_type || 'Professionnel'}</span>
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: COLORS.cream }}>{session.name}</h1>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>{profile?.organization_name}</p>
            
            <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {profile?.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {profile.country}
                </span>
              )}
              {profile?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" /> {profile.email}
                </span>
              )}
            </div>
          </div>
          
          <div>
            <Button
              onClick={() => setEditing(!editing)}
              variant={editing ? 'outline' : 'default'}
              style={editing ? { borderColor: `${COLORS.gold}50`, color: COLORS.gold } : { background: COLORS.gold, color: COLORS.charbon }}
            >
              {editing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
              {editing ? 'Annuler' : 'Modifier'}
            </Button>
          </div>
        </div>
      </div>

      {/* Bio & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl" style={{ background: COLORS.card }}>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.cream }}>
            <User className="w-5 h-5" style={{ color: COLORS.gold }} />
            À propos
          </h2>
          {editing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full p-3 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
              placeholder="Décrivez votre activité..."
            />
          ) : (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {profile?.bio || 'Aucune description pour le moment.'}
            </p>
          )}
        </div>

        <div className="p-6 rounded-xl" style={{ background: COLORS.card }}>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.cream }}>
            <Link2 className="w-5 h-5" style={{ color: COLORS.gold }} />
            Liens & Réseaux
          </h2>
          {editing ? (
            <div className="space-y-3">
              <Input
                placeholder="Site web"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="h-10"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
              />
              <Input
                placeholder="LinkedIn"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                className="h-10"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
              />
              <Input
                placeholder="Instagram"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="h-10"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline" style={{ color: COLORS.gold }}>
                  <Globe className="w-4 h-4" /> {profile.website}
                </a>
              )}
              {profile?.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline" style={{ color: COLORS.gold }}>
                  <Link2 className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {!profile?.website && !profile?.linkedin && (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Aucun lien ajouté</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Seeking & Offering */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl" style={{ background: `${COLORS.forest}20`, border: `1px solid ${COLORS.forest}40` }}>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.forest }}>
            <Search className="w-5 h-5" />
            Je recherche
          </h2>
          {editing ? (
            <textarea
              value={formData.seeking}
              onChange={(e) => setFormData({ ...formData, seeking: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
              placeholder="Ex: Distribution digitale, Booking Europe..."
            />
          ) : (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {profile?.seeking || 'Non renseigné'}
            </p>
          )}
        </div>

        <div className="p-6 rounded-xl" style={{ background: `${COLORS.terracotta}20`, border: `1px solid ${COLORS.terracotta}40` }}>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.terracotta }}>
            <Handshake className="w-5 h-5" />
            Je propose
          </h2>
          {editing ? (
            <textarea
              value={formData.offering}
              onChange={(e) => setFormData({ ...formData, offering: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
              placeholder="Ex: Production musicale, Conseil export..."
            />
          ) : (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {profile?.offering || 'Non renseigné'}
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      {editing && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} style={{ background: COLORS.gold, color: COLORS.charbon }}>
            {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// NETWORK SECTION - Réseau Pro (Smart Engine Complet)
// ═══════════════════════════════════════════════════════════════
const NetworkSection = ({ connections, session, onConnect }) => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedPro, setSelectedPro] = useState(null);

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/registrations`);
      setProfessionals(res.data.registrations?.filter(r => r.status === 'approved') || []);
    } catch (err) {
      console.error('Error loading professionals:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (proId) => {
    try {
      await axios.post(`${API}/pro/connect`, { from: session.id, to: proId });
      toast.success('Demande de connexion envoyée !');
      onConnect();
    } catch (err) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const filteredPros = professionals.filter(pro => {
    const matchesSearch = !searchQuery || 
      pro.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.organization_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || pro.profile_type === filterType;
    return matchesSearch && matchesType && pro.id !== session.id;
  });

  const ProfileIcon = (type) => PROFILE_ICONS[type] || Users;

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="p-4 rounded-xl flex flex-col sm:flex-row gap-4" style={{ background: COLORS.card }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <Input
            placeholder="Rechercher un professionnel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-11 px-4 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
        >
          <option value="">Tous les profils</option>
          <option value="artist">Artistes</option>
          <option value="label">Labels / Producteurs</option>
          <option value="booking_agency">Agences Booking</option>
          <option value="institution">Institutions</option>
          <option value="press">Médias</option>
        </select>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 text-sm">
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{filteredPros.length} professionnels</span>
        <span style={{ color: COLORS.gold }}>{connections.length} connexions</span>
      </div>

      {/* Professionals Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: COLORS.gold }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPros.map(pro => {
            const Icon = ProfileIcon(pro.profile_type);
            const isConnected = connections.some(c => c.id === pro.id);
            
            return (
              <div
                key={pro.id}
                className="p-4 rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
                style={{ background: COLORS.card, border: `1px solid ${isConnected ? COLORS.gold : 'transparent'}40` }}
                onClick={() => setSelectedPro(pro)}
              >
                <div className="flex gap-4">
                  <img
                    src={pro.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.full_name)}&background=4A5D4E&color=F4F1EA`}
                    alt={pro.full_name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" style={{ color: COLORS.terracotta }} />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{pro.profile_type}</span>
                    </div>
                    <h3 className="font-bold truncate" style={{ color: COLORS.cream }}>{pro.full_name}</h3>
                    <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{pro.organization_name}</p>
                    {pro.country && (
                      <span className="flex items-center gap-1 text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <MapPin className="w-3 h-3" /> {pro.country}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Tags */}
                {pro.expertise_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {pro.expertise_tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 text-xs rounded" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded" style={{ background: `${COLORS.gold}20`, color: COLORS.gold }}>
                      <Check className="w-3 h-3" /> Connecté
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); sendConnectionRequest(pro.id); }}
                      style={{ background: COLORS.gold, color: COLORS.charbon }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Connecter
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); setSelectedPro(pro); }}
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Voir profil
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile Modal */}
      {selectedPro && (
        <ProfileModal 
          pro={selectedPro} 
          onClose={() => setSelectedPro(null)} 
          session={session}
          isConnected={connections.some(c => c.id === selectedPro.id)}
          onConnect={() => sendConnectionRequest(selectedPro.id)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROFILE MODAL
// ═══════════════════════════════════════════════════════════════
const ProfileModal = ({ pro, onClose, session, isConnected, onConnect }) => {
  const Icon = PROFILE_ICONS[pro.profile_type] || Users;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{ background: COLORS.charbon, border: `1px solid ${COLORS.gold}30` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-32" style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}40, ${COLORS.gold}20)` }}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <X className="w-5 h-5" style={{ color: '#fff' }} />
          </button>
        </div>
        
        <div className="px-6 pb-6 -mt-16">
          <div className="flex flex-col sm:flex-row gap-4">
            <img
              src={pro.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.full_name)}&background=D4A84B&color=1C1A14&size=200`}
              alt={pro.full_name}
              className="w-32 h-32 rounded-xl object-cover border-4"
              style={{ borderColor: COLORS.charbon }}
            />
            <div className="flex-1 pt-8 sm:pt-16">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-5 h-5" style={{ color: COLORS.terracotta }} />
                <span className="text-sm" style={{ color: COLORS.terracotta }}>{pro.profile_type}</span>
              </div>
              <h2 className="text-2xl font-bold" style={{ color: COLORS.cream }}>{pro.full_name}</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>{pro.organization_name}</p>
            </div>
          </div>
          
          {/* Contact Info (visible only to connected users) */}
          <div className="mt-6 p-4 rounded-lg" style={{ background: COLORS.card }}>
            <h3 className="font-bold mb-3" style={{ color: COLORS.cream }}>Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <Mail className="w-4 h-4" style={{ color: COLORS.gold }} />
                <span>{pro.email}</span>
              </div>
              {pro.phone && (
                <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <Phone className="w-4 h-4" style={{ color: COLORS.gold }} />
                  <span>{pro.phone}</span>
                </div>
              )}
              {pro.country && (
                <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <MapPin className="w-4 h-4" style={{ color: COLORS.gold }} />
                  <span>{pro.country}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Bio */}
          {pro.bio && (
            <div className="mt-4">
              <h3 className="font-bold mb-2" style={{ color: COLORS.cream }}>À propos</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{pro.bio}</p>
            </div>
          )}
          
          {/* Tags */}
          {pro.expertise_tags?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold mb-2" style={{ color: COLORS.cream }}>Expertises</h3>
              <div className="flex flex-wrap gap-2">
                {pro.expertise_tags.map(tag => (
                  <span key={tag} className="px-3 py-1 text-sm rounded" style={{ background: `${COLORS.gold}20`, color: COLORS.gold }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {isConnected ? (
              <Button className="flex-1" style={{ background: `${COLORS.gold}20`, color: COLORS.gold }}>
                <MessageSquare className="w-4 h-4 mr-2" /> Envoyer un message
              </Button>
            ) : (
              <Button onClick={onConnect} className="flex-1" style={{ background: COLORS.gold, color: COLORS.charbon }}>
                <Plus className="w-4 h-4 mr-2" /> Se connecter
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MESSAGES SECTION
// ═══════════════════════════════════════════════════════════════
const MessagesSection = ({ messages, session, onUpdate }) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  const conversations = messages.reduce((acc, msg) => {
    const otherId = msg.from === session.id ? msg.to : msg.from;
    if (!acc[otherId]) {
      acc[otherId] = { id: otherId, name: msg.fromName || msg.toName, messages: [], unread: 0 };
    }
    acc[otherId].messages.push(msg);
    if (!msg.read && msg.to === session.id) acc[otherId].unread++;
    return acc;
  }, {});

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      await axios.post(`${API}/pro/messages`, {
        from: session.id,
        to: selectedConversation,
        content: newMessage,
      });
      setNewMessage('');
      onUpdate();
      toast.success('Message envoyé');
    } catch (err) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  return (
    <div className="h-[600px] rounded-xl overflow-hidden flex" style={{ background: COLORS.card }}>
      {/* Conversations List */}
      <div className="w-80 border-r overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h2 className="font-bold" style={{ color: COLORS.cream }}>Messages</h2>
        </div>
        {Object.values(conversations).length === 0 ? (
          <div className="p-4 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Aucune conversation
          </div>
        ) : (
          Object.values(conversations).map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`w-full p-4 text-left border-b transition-all ${selectedConversation === conv.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${COLORS.gold}20`, color: COLORS.gold }}>
                  {conv.name?.substring(0, 2).toUpperCase() || '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" style={{ color: COLORS.cream }}>{conv.name}</div>
                  <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {conv.messages[conv.messages.length - 1]?.content}
                  </div>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center" style={{ background: COLORS.terracotta, color: '#fff' }}>
                    {conv.unread}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {conversations[selectedConversation]?.messages.map((msg, idx) => (
                <div key={idx} className={`mb-4 ${msg.from === session.id ? 'text-right' : ''}`}>
                  <div 
                    className={`inline-block max-w-[70%] p-3 rounded-lg ${msg.from === session.id ? '' : ''}`}
                    style={{ 
                      background: msg.from === session.id ? COLORS.gold : 'rgba(255,255,255,0.1)',
                      color: msg.from === session.id ? COLORS.charbon : COLORS.cream
                    }}
                  >
                    {msg.content}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <Input
                placeholder="Votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: COLORS.cream }}
              />
              <Button onClick={sendMessage} style={{ background: COLORS.gold, color: COLORS.charbon }}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// OPPORTUNITIES SECTION
// ═══════════════════════════════════════════════════════════════
const OpportunitiesSection = ({ opportunities, session }) => {
  // Mock opportunities for demo
  const mockOpportunities = [
    { id: 1, title: 'Recherche artiste Zouk pour festival', type: 'Booking', author: 'Festival Carib\'Art', deadline: '2026-04-15', description: 'Nous recherchons un artiste Zouk confirmé pour notre festival annuel en Guadeloupe.' },
    { id: 2, title: 'Distribution digitale - Partenariat', type: 'Business', author: 'DigiSound Africa', deadline: '2026-03-30', description: 'Offre de distribution pour artistes caribéens souhaitant se développer en Afrique.' },
    { id: 3, title: 'Appel à projets - Création musicale', type: 'Subvention', author: 'DAC Martinique', deadline: '2026-05-01', description: 'Subvention disponible pour projets de création musicale caribéenne.' },
  ];

  const displayOpps = opportunities.length > 0 ? opportunities : mockOpportunities;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: COLORS.cream }}>Opportunités</h2>
        <Button style={{ background: COLORS.gold, color: COLORS.charbon }}>
          <Plus className="w-4 h-4 mr-2" /> Publier une offre
        </Button>
      </div>

      <div className="space-y-4">
        {displayOpps.map(opp => (
          <div key={opp.id} className="p-5 rounded-xl" style={{ background: COLORS.card }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="px-2 py-1 text-xs rounded mr-2" style={{ background: `${COLORS.terracotta}20`, color: COLORS.terracotta }}>
                  {opp.type}
                </span>
                <h3 className="font-bold mt-2" style={{ color: COLORS.cream }}>{opp.title}</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>par {opp.author}</p>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Clock className="w-4 h-4" />
                Deadline: {new Date(opp.deadline).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{opp.description}</p>
            <Button size="sm" style={{ background: COLORS.gold, color: COLORS.charbon }}>
              Postuler <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EVENTS SECTION (Agenda)
// ═══════════════════════════════════════════════════════════════
const EventsSection = ({ events, session }) => {
  // Mock events
  const mockEvents = [
    { id: 1, title: 'Networking Petit-déjeuner', date: '2026-03-15', time: '09:00', location: 'Fort-de-France', type: 'Networking', attendees: 24 },
    { id: 2, title: 'Masterclass: Export Musical', date: '2026-03-20', time: '14:00', location: 'En ligne', type: 'Formation', attendees: 89 },
    { id: 3, title: 'Showcase CC2026', date: '2026-05-21', time: '19:00', location: 'La Savane, Fort-de-France', type: 'Concert', attendees: 156 },
    { id: 4, title: 'CHIMIN SAVANN', date: '2026-05-22', time: '18:00', location: 'Parc de La Savane', type: 'Événement Principal', attendees: 6000 },
  ];

  const displayEvents = events.length > 0 ? events : mockEvents;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: COLORS.cream }}>Agenda CC2026</h2>

      <div className="space-y-4">
        {displayEvents.map(event => (
          <div 
            key={event.id} 
            className="p-5 rounded-xl flex gap-4"
            style={{ 
              background: event.type === 'Événement Principal' ? `linear-gradient(135deg, ${COLORS.gold}20, ${COLORS.card})` : COLORS.card,
              border: event.type === 'Événement Principal' ? `1px solid ${COLORS.gold}40` : 'none'
            }}
          >
            {/* Date Badge */}
            <div className="flex-shrink-0 w-16 text-center">
              <div className="text-2xl font-bold" style={{ color: COLORS.gold }}>
                {new Date(event.date).getDate()}
              </div>
              <div className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}
              </div>
            </div>
            
            {/* Details */}
            <div className="flex-1">
              <span className="px-2 py-0.5 text-xs rounded" style={{ background: `${COLORS.forest}20`, color: COLORS.forest }}>
                {event.type}
              </span>
              <h3 className="font-bold mt-1" style={{ color: COLORS.cream }}>{event.title}</h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {event.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {event.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {event.attendees} participants
                </span>
              </div>
            </div>
            
            {/* Action */}
            <div className="flex-shrink-0">
              <Button size="sm" style={{ background: COLORS.gold, color: COLORS.charbon }}>
                S'inscrire
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProSpaceDashboard;
