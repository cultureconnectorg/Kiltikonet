import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Users, Activity, Clock, BarChart3, Eye, 
  FileText, Settings, Bell, Calendar, CheckCircle,
  TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Design colors
const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  forest: '#4A5D4E',
  cream: '#F4F1EA',
  burgundy: '#8B1A4A'
};

const WorkspaceLaurent = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Load logs and sessions
  useEffect(() => {
    const loadData = async () => {
      try {
        const [logsRes, sessionsRes, statsRes] = await Promise.all([
          axios.get(`${API}/workspace/logs?limit=50`),
          axios.get(`${API}/workspace/sessions`),
          axios.get(`${API}/v1/stats`)
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
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/workspace/logout`, {
        user: 'Laurent Coeurvolan',
        role: 'founder'
      });
      sessionStorage.removeItem('workspace_user');
      navigate('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: COLORS.burgundy,
      founder: COLORS.gold,
      design: '#E91E63',
      event: COLORS.forest,
      press: '#00BCD4',
      business: COLORS.terracotta,
      finance: '#4CAF50',
      captions: '#9C27B0',
      analyst: '#607D8B'
    };
    return colors[role] || COLORS.charbon;
  };

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.gold}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.burgundy})`, color: '#fff' }}>
              LC
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: COLORS.gold }}>LAURENT COEURVOLAN</div>
              <div className="text-xs" style={{ color: COLORS.terracotta }}>Fondateur CVLN - Vue d'ensemble</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')} style={{ borderColor: `${COLORS.gold}50`, color: COLORS.gold }}>
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/accreditation')} style={{ borderColor: `${COLORS.terracotta}50`, color: COLORS.terracotta }}>
              Accreditation
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" style={{ color: COLORS.terracotta }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Participants</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: '#fff', fontFamily: "'Cormorant Garamond', serif" }}>
              {stats?.summary?.total_registrations || 0}
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" style={{ color: COLORS.forest }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Approuves</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: COLORS.forest, fontFamily: "'Cormorant Garamond', serif" }}>
              {stats?.by_status?.approved || 0}
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" style={{ color: COLORS.gold }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Equipe active</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: COLORS.gold, fontFamily: "'Cormorant Garamond', serif" }}>
              {sessions.length}
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" style={{ color: COLORS.burgundy }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Jours restants</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: COLORS.burgundy, fontFamily: "'Cormorant Garamond', serif" }}>
              {Math.ceil((new Date('2026-05-22') - new Date()) / (1000 * 60 * 60 * 24))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Sessions equipe */}
          <div className="col-span-1 rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.gold }}>
                Sessions Equipe
              </h2>
              <RefreshCw className="w-4 h-4 cursor-pointer" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
            
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Aucune session recente
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

          {/* Logs d'activite */}
          <div className="col-span-2 rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.terracotta }}>
                Historique des modifications
              </h2>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{logs.length} entrees</span>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Aucune activite recente
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: getRoleColor(log.role) }} />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white">{log.user}</span>
                      <span className="text-xs mx-2" style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{log.action}</span>
                      {log.details && (
                        <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>({log.details})</span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {formatTime(log.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick access to all workspaces */}
        <div className="mt-6 rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.gold }}>
            Acces rapide aux workspaces
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { name: 'Twina', role: 'Design', path: '/workspace/twina', color: '#E91E63' },
              { name: 'Gwen', role: 'Evenementiel', path: '/workspace/gwen', color: COLORS.forest },
              { name: 'Kaige-Jean', role: 'Presse', path: '/workspace/kaige', color: '#00BCD4' },
              { name: 'Alirio', role: 'Business', path: '/workspace/alirio', color: COLORS.terracotta },
              { name: 'Wudy', role: 'Comptabilite', path: '/workspace/wudy', color: '#4CAF50' },
              { name: 'Fabrice', role: 'Captions', path: '/workspace/fabrice', color: '#9C27B0' },
              { name: 'Data Analyst', role: 'A pourvoir', path: '/workspace/analyst', color: '#607D8B' },
              { name: 'Admin', role: 'Gestion', path: '/admin', color: COLORS.burgundy }
            ].map(ws => (
              <button
                key={ws.name}
                onClick={() => navigate(ws.path)}
                className="p-4 rounded-lg text-left transition-all hover:scale-[1.02]"
                style={{ background: `${ws.color}15`, border: `1px solid ${ws.color}30` }}
              >
                <div className="font-bold text-sm text-white">{ws.name}</div>
                <div className="text-xs mt-1" style={{ color: ws.color }}>{ws.role}</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkspaceLaurent;
