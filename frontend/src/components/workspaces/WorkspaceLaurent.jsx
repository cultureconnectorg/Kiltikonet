import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Users, Activity, Clock, BarChart3, Eye, 
  FileText, Settings, Calendar, CheckCircle,
  TrendingUp, AlertCircle, RefreshCw, Music, DollarSign,
  Newspaper, Briefcase, Palette, Radio, ChevronRight,
  Check, X, Shield, Brain
} from 'lucide-react';
import { Button } from '../ui/button';
import { NotificationBell, useNotifications } from './NotificationSystem';
import InternalMessaging from '../InternalMessaging';
import FounderControlCenter from './FounderControlCenter';
import { useSharedData } from '../../contexts/SharedDataContext';
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
  const [showControlCenter, setShowControlCenter] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications('laurent', 3000);

  // Shared data from context (synchronized across all workspaces)
  const { artistes, partners, tasks, expenses, prestataires } = useSharedData();

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
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header - Responsive */}
      <header className="sticky top-0 z-50 px-3 sm:px-6 py-3 sm:py-4 safe-area-top" style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.gold}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm sm:text-lg font-bold"
              style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.burgundy})`, color: '#fff' }}>
              LC
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm tracking-wide" style={{ color: COLORS.gold }}>LAURENT COEURVOLAN</div>
              <div className="text-[10px] sm:text-xs hidden xs:block" style={{ color: COLORS.terracotta }}>Fondateur - Vue d'ensemble</div>
            </div>
          </div>
          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <NotificationBell target="laurent" />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowControlCenter(true)} 
              style={{ borderColor: `${COLORS.burgundy}80`, color: COLORS.burgundy, fontWeight: 'bold' }}
              data-testid="founder-control-center-btn"
            >
              <Shield className="w-4 h-4 mr-2" />
              Contrôle
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard-cc2026/laurent')} style={{ borderColor: `${COLORS.gold}80`, color: COLORS.gold, fontWeight: 'bold' }}>
              <Calendar className="w-4 h-4 mr-2" />
              CC2026
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')} style={{ borderColor: `${COLORS.gold}50`, color: COLORS.gold }}>
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/accreditation')} style={{ borderColor: `${COLORS.terracotta}50`, color: COLORS.terracotta }}>
              Accréditation
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/performance')} style={{ borderColor: `${COLORS.teal}50`, color: COLORS.teal }}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Performances
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/smart-engine')} style={{ borderColor: `${COLORS.gold}50`, color: COLORS.gold }}>
              <Brain className="w-4 h-4 mr-2" />
              Smart Engine
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-2">
            <NotificationBell target="laurent" />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowControlCenter(true)} 
              style={{ borderColor: `${COLORS.burgundy}80`, color: COLORS.burgundy }}
              data-testid="founder-control-center-btn-mobile"
            >
              <Shield className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs - Scroll horizontal sur mobile */}
      <div style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.gold}20` }}>
        <div className="max-w-7xl mx-auto flex overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', shortLabel: 'Vue', icon: BarChart3 },
            { id: 'logs', label: 'Activité équipe', shortLabel: 'Activité', icon: Activity },
            { id: 'workspaces', label: 'Workspaces', shortLabel: 'Espaces', icon: Eye },
            { id: 'briefs', label: 'Briefs', shortLabel: 'Briefs', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 sm:px-5 py-3 text-[10px] sm:text-xs font-bold tracking-wider uppercase flex items-center gap-1 sm:gap-2 border-b-2 transition-all flex-shrink-0 whitespace-nowrap"
              style={{
                color: activeTab === tab.id ? COLORS.gold : 'rgba(255,255,255,0.3)',
                borderColor: activeTab === tab.id ? COLORS.gold : 'transparent'
              }}
            >
              <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-3 sm:p-6">
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards - Grid responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="rounded-lg p-3 sm:p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: COLORS.terracotta }} />
                  <span className="text-[10px] sm:text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Participants</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold" style={{ color: '#fff', fontFamily: "'Cormorant Garamond', serif" }}>
                  {stats?.summary?.total_registrations || 44}
                </div>
              </div>
              <div className="rounded-lg p-3 sm:p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: COLORS.forest }} />
                  <span className="text-[10px] sm:text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Approuvés</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.forest, fontFamily: "'Cormorant Garamond', serif" }}>
                  {stats?.by_status?.approved || 32}
                </div>
              </div>
              <div className="rounded-lg p-3 sm:p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Music className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: COLORS.purple }} />
                  <span className="text-[10px] sm:text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Artistes</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.purple, fontFamily: "'Cormorant Garamond', serif" }}>
                  {artistes.length}
                </div>
                <div className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{artistes.filter(a => a.status === 'Confirmé').length} confirmé(s)</div>
              </div>
              <div className="rounded-lg p-3 sm:p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: COLORS.gold }} />
                  <span className="text-[10px] sm:text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Équipe</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.gold, fontFamily: "'Cormorant Garamond', serif" }}>
                  {sessions.length}
                </div>
              </div>
              <div className="rounded-lg p-3 sm:p-4 col-span-2 sm:col-span-1" style={{ background: '#2A2820', border: `1px solid ${COLORS.burgundy}20` }}>
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: COLORS.burgundy }} />
                  <span className="text-[10px] sm:text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>J-</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.burgundy, fontFamily: "'Cormorant Garamond', serif" }}>
                  {daysUntilEvent}
                </div>
                <div className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>22 mai 2026</div>
              </div>
            </div>

            {/* Chantiers status - Scroll horizontal sur mobile */}
            <div className="rounded-lg p-3 sm:p-5 mb-4 sm:mb-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-3 sm:mb-4" style={{ color: COLORS.gold }}>
                Statut des chantiers
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
                {Object.entries(chantiers).map(([key, chantier]) => {
                  const statusColors = {
                    green: COLORS.forest,
                    orange: COLORS.terracotta,
                    red: '#ef4444'
                  };
                  return (
                    <div key={key} className="p-2 sm:p-3 rounded-lg" style={{ background: `${statusColors[chantier.status]}15`, border: `1px solid ${statusColors[chantier.status]}30` }}>
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">{chantier.label}</span>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ background: statusColors[chantier.status] }} />
                      </div>
                      <div className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {chantier.count} éléments
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid responsive - 1 col mobile, 3 cols desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
          <div className="rounded-lg p-4 sm:p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6" style={{ color: COLORS.gold }}>Historique complet des modifications</h2>
            <div className="space-y-2">
              {logs.map((log, idx) => {
                const IconComponent = getActionIcon(log.action);
                return (
                  <div key={idx} className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${getRoleColor(log.role)}20` }}>
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: getRoleColor(log.role) }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <span className="font-bold text-white text-sm">{log.user}</span>
                        <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs" style={{ background: `${getRoleColor(log.role)}20`, color: getRoleColor(log.role) }}>
                          {log.role}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm mt-1 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {log.action} {log.details && `- ${log.details}`}
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-sm flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {formatTime(log.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'workspaces' && (
          <div className="rounded-lg p-4 sm:p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6" style={{ color: COLORS.gold }}>Accès rapide aux workspaces</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {workspaces.map(ws => (
                <button
                  key={ws.name}
                  onClick={() => navigate(ws.path)}
                  className="p-3 sm:p-5 rounded-lg text-left transition-all hover:scale-[1.02] group"
                  style={{ background: `${ws.color}15`, border: `1px solid ${ws.color}30` }}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <ws.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: ws.color }} />
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: ws.color }} />
                  </div>
                  <div className="font-bold text-white text-sm sm:text-base">{ws.name}</div>
                  <div className="text-[10px] sm:text-xs mt-1" style={{ color: ws.color }}>{ws.role}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'briefs' && (
          <div className="rounded-lg p-4 sm:p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold" style={{ color: COLORS.gold }}>Briefs & Assignations</h2>
              <Button size="sm" style={{ background: COLORS.terracotta }}>
                Nouveau brief
              </Button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="p-3 sm:p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${COLORS.pink}` }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-white text-sm sm:text-base">Visuels réseaux sociaux - Annonce artiste</span>
                  <span className="px-2 py-1 rounded text-xs w-fit" style={{ background: `${COLORS.terracotta}20`, color: COLORS.terracotta }}>En cours</span>
                </div>
                <div className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Assigné à Twina - Deadline: 10/03/2026</div>
              </div>
              <div className="p-3 sm:p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${COLORS.teal}` }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-white text-sm sm:text-base">Communiqué de presse - Line-up</span>
                  <span className="px-2 py-1 rounded text-xs w-fit" style={{ background: `${COLORS.forest}20`, color: COLORS.forest }}>Validé</span>
                </div>
                <div className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Assigné à Kaïge-Jean - Livré: 05/03/2026</div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Internal Messaging - Founder sees ALL messages */}
      <InternalMessaging 
        currentUser={{ 
          id: 'laurent', 
          name: 'Laurent', 
          role: 'founder' 
        }} 
        isFounder={true} 
      />
      
      {/* Centre de Contrôle Fondateur */}
      {showControlCenter && (
        <FounderControlCenter onClose={() => setShowControlCenter(false)} />
      )}
    </div>
  );
};

export default WorkspaceLaurent;
