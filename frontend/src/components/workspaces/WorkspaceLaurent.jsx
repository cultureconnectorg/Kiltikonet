import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Users, Activity, Clock, BarChart3, Eye, 
  FileText, Settings, Calendar, CheckCircle,
  TrendingUp, AlertCircle, RefreshCw, Music, DollarSign,
  Newspaper, Briefcase, Palette, Radio, ChevronRight,
  Check, X
} from 'lucide-react';
import { Button } from '../ui/button';
import { NotificationBell, useNotifications } from './NotificationSystem';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  forest: '#4A5D4E',
  cream: '#F4F1EA',
  burgundy: '#8B1A4A',
  teal: '#00BCD4',
  purple: '#9C27B0',
  green: '#4CAF50',
  pink: '#E91E63'
};

const WorkspaceLaurent = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingValidations, setPendingValidations] = useState([]);
  const { notifications, unreadCount, markAsRead } = useNotifications('laurent', 3000);

  // Chantiers status
  const [chantiers, setChantiers] = useState({
    accreditation: { status: 'green', label: 'Accréditation', count: 14 },
    evenementiel: { status: 'orange', label: 'Événementiel', count: 3 },
    finances: { status: 'red', label: 'Finances', count: 0 },
    presse: { status: 'green', label: 'Presse', count: 2 },
    design: { status: 'green', label: 'Design', count: 1 }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [logsRes, sessionsRes, statsRes] = await Promise.all([
          axios.get(`${API}/workspace/logs?limit=50`),
          axios.get(`${API}/workspace/sessions`),
          axios.get(`${API}/v1/stats`).catch(() => ({ data: { summary: { total_registrations: 44 }, by_status: { approved: 32 } } }))
        ]);
        setLogs(logsRes.data.logs || []);
        setSessions(sessionsRes.data.sessions || []);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Log connection
    axios.post(`${API}/workspace/log`, {
      user: 'Laurent Coeurvolan',
      role: 'founder',
      action: 'login',
      details: 'Connexion workspace fondateur'
    });
    
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Laurent Coeurvolan', role: 'founder' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: COLORS.burgundy,
      founder: COLORS.gold,
      design: COLORS.pink,
      event: COLORS.forest,
      press: COLORS.teal,
      business: COLORS.terracotta,
      finance: COLORS.green,
      captions: COLORS.purple,
      analyst: '#607D8B'
    };
    return colors[role] || COLORS.charbon;
  };

  const getActionIcon = (action) => {
    const icons = {
      login: Clock,
      logout: LogOut,
      artiste_confirmed: Music,
      expense_added: DollarSign,
      communique_sent: Newspaper,
      live_active: Radio,
      partner_added: Users,
      update: FileText,
      ai_chat: Activity
    };
    return icons[action] || Activity;
  };

  const daysUntilEvent = Math.ceil((new Date('2026-05-22') - new Date()) / (1000 * 60 * 60 * 24));

  const workspaces = [
    { name: 'Twina', role: 'Design', path: '/workspace/twina', color: COLORS.pink, icon: Palette },
    { name: 'Gwen', role: 'Événementiel', path: '/workspace/gwen', color: COLORS.forest, icon: Music },
    { name: 'Kaïge-Jean', role: 'Presse', path: '/workspace/kaige', color: COLORS.teal, icon: Newspaper },
    { name: 'Alirio', role: 'Business', path: '/workspace/alirio', color: COLORS.terracotta, icon: Briefcase },
    { name: 'Wudy', role: 'Comptabilité', path: '/workspace/wudy', color: COLORS.green, icon: DollarSign },
    { name: 'Fabrice', role: 'Captions', path: '/workspace/fabrice', color: COLORS.purple, icon: Radio },
    { name: 'Data Analyst', role: 'À pourvoir', path: '/workspace/analyst', color: '#607D8B', icon: BarChart3 },
    { name: 'Admin', role: 'Gestion', path: '/admin', color: COLORS.burgundy, icon: Settings }
  ];

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.gold}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.burgundy})`, color: '#fff' }}>
              LC
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide" style={{ color: COLORS.gold }}>LAURENT COEURVOLAN</div>
              <div className="text-xs" style={{ color: COLORS.terracotta }}>Fondateur CVLN - Vue d'ensemble</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell target="laurent" />
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')} style={{ borderColor: `${COLORS.gold}50`, color: COLORS.gold }}>
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/accreditation')} style={{ borderColor: `${COLORS.terracotta}50`, color: COLORS.terracotta }}>
              Accréditation
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.gold}20` }}>
        <div className="max-w-7xl mx-auto flex">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            { id: 'logs', label: 'Activité équipe', icon: Activity },
            { id: 'workspaces', label: 'Workspaces', icon: Eye },
            { id: 'briefs', label: 'Briefs', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-3 text-xs font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all"
              style={{
                color: activeTab === tab.id ? COLORS.gold : 'rgba(255,255,255,0.3)',
                borderColor: activeTab === tab.id ? COLORS.gold : 'transparent'
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" style={{ color: COLORS.terracotta }} />
                  <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Participants</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#fff', fontFamily: "'Cormorant Garamond', serif" }}>
                  {stats?.summary?.total_registrations || 44}
                </div>
              </div>
              <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" style={{ color: COLORS.forest }} />
                  <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Approuvés</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: COLORS.forest, fontFamily: "'Cormorant Garamond', serif" }}>
                  {stats?.by_status?.approved || 32}
                </div>
              </div>
              <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-4 h-4" style={{ color: COLORS.purple }} />
                  <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Artistes</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: COLORS.purple, fontFamily: "'Cormorant Garamond', serif" }}>
                  1
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Kathy confirmée</div>
              </div>
              <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" style={{ color: COLORS.gold }} />
                  <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Équipe active</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: COLORS.gold, fontFamily: "'Cormorant Garamond', serif" }}>
                  {sessions.length}
                </div>
              </div>
              <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.burgundy}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" style={{ color: COLORS.burgundy }} />
                  <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>J-</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: COLORS.burgundy, fontFamily: "'Cormorant Garamond', serif" }}>
                  {daysUntilEvent}
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>22 mai 2026</div>
              </div>
            </div>

            {/* Chantiers status */}
            <div className="rounded-lg p-5 mb-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.gold }}>
                Statut des chantiers
              </h2>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(chantiers).map(([key, chantier]) => {
                  const statusColors = {
                    green: COLORS.forest,
                    orange: COLORS.terracotta,
                    red: '#ef4444'
                  };
                  return (
                    <div key={key} className="p-3 rounded-lg" style={{ background: `${statusColors[chantier.status]}15`, border: `1px solid ${statusColors[chantier.status]}30` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">{chantier.label}</span>
                        <div className="w-3 h-3 rounded-full" style={{ background: statusColors[chantier.status] }} />
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {chantier.count} éléments
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Recent notifications */}
              <div className="col-span-1 rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.terracotta }}>
                    Alertes récentes
                  </h2>
                  <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: `${COLORS.burgundy}20`, color: COLORS.burgundy }}>
                    {unreadCount} new
                  </span>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.slice(0, 5).map(notif => (
                    <div 
                      key={notif.id}
                      className="p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5"
                      style={{ background: notif.read ? 'transparent' : `${COLORS.gold}10`, borderLeft: `3px solid ${getRoleColor(notif.sender_role)}` }}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                    >
                      <div className="text-sm font-medium text-white">{notif.title}</div>
                      <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{notif.message}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs" style={{ color: getRoleColor(notif.sender_role) }}>{notif.sender}</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{formatTime(notif.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Aucune alerte
                    </div>
                  )}
                </div>
              </div>

              {/* Sessions équipe */}
              <div className="col-span-1 rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.gold }}>
                    Sessions Équipe
                  </h2>
                  <RefreshCw className="w-4 h-4 cursor-pointer" style={{ color: 'rgba(255,255,255,0.3)' }} />
                </div>
                
                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Aucune session récente
                    </div>
                  ) : (
                    sessions.map((session, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: getRoleColor(session.role), color: '#fff' }}>
                          {session._id?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{session._id}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {session.total_logins} connexions
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs" style={{ color: COLORS.gold }}>
                            {formatTime(session.last_login)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Logs d'activité */}
              <div className="col-span-1 rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.forest }}>
                    Activité récente
                  </h2>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{logs.length} entrées</span>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logs.slice(0, 10).map((log, idx) => {
                    const IconComponent = getActionIcon(log.action);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <IconComponent className="w-4 h-4" style={{ color: getRoleColor(log.role) }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-white">{log.user}</span>
                          <span className="text-xs mx-2" style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{log.action}</span>
                        </div>
                        <div className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {formatTime(log.timestamp)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'logs' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <h2 className="text-lg font-bold mb-6" style={{ color: COLORS.gold }}>Historique complet des modifications</h2>
            <div className="space-y-2">
              {logs.map((log, idx) => {
                const IconComponent = getActionIcon(log.action);
                return (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${getRoleColor(log.role)}20` }}>
                      <IconComponent className="w-5 h-5" style={{ color: getRoleColor(log.role) }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.user}</span>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: `${getRoleColor(log.role)}20`, color: getRoleColor(log.role) }}>
                          {log.role}
                        </span>
                      </div>
                      <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {log.action} {log.details && `- ${log.details}`}
                      </div>
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {formatTime(log.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'workspaces' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <h2 className="text-lg font-bold mb-6" style={{ color: COLORS.gold }}>Accès rapide aux workspaces</h2>
            <div className="grid grid-cols-4 gap-4">
              {workspaces.map(ws => (
                <button
                  key={ws.name}
                  onClick={() => navigate(ws.path)}
                  className="p-5 rounded-lg text-left transition-all hover:scale-[1.02] group"
                  style={{ background: `${ws.color}15`, border: `1px solid ${ws.color}30` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <ws.icon className="w-6 h-6" style={{ color: ws.color }} />
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: ws.color }} />
                  </div>
                  <div className="font-bold text-white">{ws.name}</div>
                  <div className="text-xs mt-1" style={{ color: ws.color }}>{ws.role}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'briefs' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: COLORS.gold }}>Briefs & Assignations</h2>
              <Button style={{ background: COLORS.terracotta }}>
                Nouveau brief
              </Button>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${COLORS.pink}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">Visuels réseaux sociaux - Annonce artiste</span>
                  <span className="px-2 py-1 rounded text-xs" style={{ background: `${COLORS.terracotta}20`, color: COLORS.terracotta }}>En cours</span>
                </div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Assigné à Twina - Deadline: 10/03/2026</div>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${COLORS.teal}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">Communiqué de presse - Line-up</span>
                  <span className="px-2 py-1 rounded text-xs" style={{ background: `${COLORS.forest}20`, color: COLORS.forest }}>Validé</span>
                </div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Assigné à Kaïge-Jean - Livré: 05/03/2026</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkspaceLaurent;
