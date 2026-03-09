import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Activity, Bell, TrendingUp, TrendingDown, Users, Clock, 
  AlertTriangle, CheckCircle, Settings, RefreshCw, Zap, Eye,
  BarChart3, ArrowLeft, Filter, X
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  forest: '#4A5D4E',
  cream: '#F4F1EA'
};

const SmartEngineDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [teamNotifications, setTeamNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRuleModal, setShowRuleModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, insightsRes, rulesRes, notifRes] = await Promise.all([
        axios.get(`${API}/smart-engine/stats`),
        axios.get(`${API}/smart-engine/insights`),
        axios.get(`${API}/smart-engine/alerts/rules`),
        axios.get(`${API}/team/notifications?limit=20`)
      ]);
      
      setStats(statsRes.data);
      setInsights(insightsRes.data);
      setAlertRules(rulesRes.data);
      setTeamNotifications(notifRes.data.notifications || []);
    } catch (error) {
      console.error('Failed to load Smart Engine data:', error);
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadData]);

  const toggleRule = async (ruleId, enabled) => {
    try {
      await axios.patch(`${API}/smart-engine/alerts/rules/${ruleId}?enabled=${enabled}`);
      setAlertRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));
      toast.success(`Règle ${enabled ? 'activée' : 'désactivée'}`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const triggerManualCheck = async () => {
    try {
      const res = await axios.post(`${API}/smart-engine/check-alerts`);
      toast.success(`${res.data.alerts_triggered} alerte(s) déclenchée(s)`);
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la vérification');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/team/notifications/mark-all-read`);
      setTeamNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Toutes les notifications marquées comme lues');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getInsightIcon = (type) => {
    const icons = {
      positive: <TrendingUp className="w-5 h-5 text-green-400" />,
      warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      info: <Eye className="w-5 h-5 text-blue-400" />,
      action: <Zap className="w-5 h-5 text-orange-400" />
    };
    return icons[type] || <Activity className="w-5 h-5 text-gray-400" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: COLORS.gold,
      low: '#6b7280'
    };
    return colors[priority] || COLORS.gold;
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.charbon }}>
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: COLORS.gold }} />
          <p className="text-white/50">Chargement du Smart Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-6" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 sm:px-6" style={{ background: '#2A2820', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-white/50">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${COLORS.gold}20` }}>
              <Brain className="w-5 h-5" style={{ color: COLORS.gold }} />
            </div>
            <div>
              <h1 className="font-bold text-white">Smart Engine</h1>
              <p className="text-xs text-white/40">Intelligence & Automatisation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={loadData} style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={triggerManualCheck} style={{ background: COLORS.gold, color: COLORS.charbon }}>
              <Zap className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Vérifier alertes</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4" style={{ color: COLORS.gold }} />
                <span className="text-xs text-white/50">Événements 24h</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: COLORS.gold }}>{stats.total_events_24h.toLocaleString()}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: '#2A2820', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-white/50">Sessions actives</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{stats.active_sessions}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: '#2A2820', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-red-400" />
                <span className="text-xs text-white/50">Alertes aujourd'hui</span>
              </div>
              <div className="text-2xl font-bold text-red-400">{stats.alerts_triggered}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.forest}20` }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" style={{ color: COLORS.forest }} />
                <span className="text-xs text-white/50">Status</span>
              </div>
              <div className="text-lg font-bold" style={{ color: COLORS.forest }}>
                {stats.engine_status === 'healthy' ? '✓ Opérationnel' : '⚠️ Attention'}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            { id: 'insights', label: 'Insights', icon: Brain },
            { id: 'alerts', label: 'Règles d\'alerte', icon: Settings },
            { id: 'notifications', label: 'Notifications', icon: Bell }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap flex-shrink-0"
              style={{ 
                background: activeTab === tab.id ? COLORS.gold : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? COLORS.charbon : 'rgba(255,255,255,0.5)'
              }}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Actions */}
            <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: COLORS.gold }}>Actions les plus fréquentes</h3>
              <div className="space-y-3">
                {stats.top_actions.slice(0, 8).map((action, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-white truncate">{action.type.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full" style={{ 
                        width: `${Math.min(100, (action.count / stats.top_actions[0].count) * 100)}px`,
                        background: COLORS.gold 
                      }} />
                      <span className="text-xs text-white/50 w-12 text-right">{action.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Anomalies */}
            <div className="rounded-lg p-5" style={{ background: '#2A2820', border: '1px solid rgba(239,68,68,0.2)' }}>
              <h3 className="text-sm font-bold mb-4 text-red-400">Anomalies détectées</h3>
              {stats.anomalies_detected.length === 0 ? (
                <div className="text-center py-8 text-white/30">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Aucune anomalie détectée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.anomalies_detected.map((anomaly, idx) => (
                    <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{anomaly.data?.type}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ 
                          background: getPriorityColor(anomaly.data?.severity),
                          color: '#fff'
                        }}>
                          {anomaly.data?.severity}
                        </span>
                      </div>
                      <p className="text-xs text-white/50">{JSON.stringify(anomaly.data?.details || {})}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'insights' && insights && (
          <div className="space-y-6">
            {/* Insights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {insights.insights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className="rounded-lg p-4 flex items-start gap-3"
                  style={{ 
                    background: '#2A2820', 
                    border: `1px solid ${insight.type === 'positive' ? COLORS.forest : insight.type === 'warning' ? '#fbbf24' : COLORS.gold}30`
                  }}
                >
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{insight.title}</h4>
                    <p className="text-xs text-white/60 mt-1">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Funnel */}
            <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: COLORS.terracotta }}>Funnel Espace Pro</h3>
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {[
                  { label: 'Inscriptions', value: insights.funnel.registrations, color: '#6b7280' },
                  { label: 'Approuvés', value: insights.funnel.approved, color: COLORS.gold },
                  { label: 'Connexions', value: insights.funnel.connections, color: COLORS.terracotta },
                  { label: 'Messages', value: insights.funnel.messages, color: COLORS.forest }
                ].map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="text-center flex-shrink-0">
                      <div className="text-2xl font-bold" style={{ color: step.color }}>{step.value}</div>
                      <div className="text-xs text-white/50">{step.label}</div>
                    </div>
                    {idx < 3 && <div className="text-white/20 flex-shrink-0">→</div>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg p-4 text-center" style={{ background: '#2A2820' }}>
                <div className="text-2xl font-bold" style={{ color: COLORS.gold }}>{insights.metrics.retention_rate}%</div>
                <div className="text-xs text-white/50">Rétention</div>
              </div>
              <div className="rounded-lg p-4 text-center" style={{ background: '#2A2820' }}>
                <div className="text-2xl font-bold" style={{ color: COLORS.forest }}>{insights.metrics.conversion_rate}%</div>
                <div className="text-xs text-white/50">Conversion</div>
              </div>
              <div className="rounded-lg p-4 text-center" style={{ background: '#2A2820' }}>
                <div className="text-2xl font-bold text-blue-400">{insights.metrics.returning_users}</div>
                <div className="text-xs text-white/50">Utilisateurs fidèles</div>
              </div>
              <div className="rounded-lg p-4 text-center" style={{ background: '#2A2820' }}>
                <div className="text-2xl font-bold" style={{ color: COLORS.terracotta }}>
                  {insights.metrics.peak_hours?.[0]?._id || '--'}h
                </div>
                <div className="text-xs text-white/50">Heure de pointe</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: COLORS.gold }}>Règles d'alerte automatique</h3>
              <span className="text-xs text-white/50">{alertRules.filter(r => r.enabled).length} actives</span>
            </div>
            <div className="space-y-3">
              {alertRules.map(rule => (
                <div 
                  key={rule.id} 
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ background: rule.enabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)' }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ background: rule.enabled ? COLORS.forest : '#6b7280' }}
                    />
                    <div>
                      <div className="font-medium text-white text-sm">{rule.name}</div>
                      <div className="text-xs text-white/40">
                        {rule.condition_type} • Seuil: {rule.threshold} • Priorité: {rule.notification_priority}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: COLORS.gold }}>Notifications équipe</h3>
              <Button size="sm" variant="ghost" onClick={markAllRead} className="text-white/50">
                Tout marquer lu
              </Button>
            </div>
            {teamNotifications.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <Bell className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {teamNotifications.map(notif => (
                  <div 
                    key={notif.id}
                    className="p-3 rounded-lg flex items-start gap-3"
                    style={{ 
                      background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      borderLeft: `3px solid ${getPriorityColor(notif.priority)}`
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">{notif.title}</span>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                      </div>
                      <p className="text-xs text-white/50 mt-1">{notif.message}</p>
                      <div className="text-xs text-white/30 mt-1">
                        {new Date(notif.created_at).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SmartEngineDashboard;
