/**
 * PerformanceDashboard - Culture Connect 2026
 * Tableau de bord des performances pour suivre:
 * - Taux de conversion des inscriptions
 * - Engagement sur l'Espace Pro
 * - Métriques temps réel
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, UserCheck, Eye, 
  Target, Activity, BarChart3, Clock, ArrowUpRight,
  Briefcase, Calendar, MessageSquare, RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const COLORS = {
  charbon: '#1C1A14',
  gold: '#D4A84B',
  terracotta: '#C4714A',
  forest: '#4A5D4E',
  cream: '#F4F1EA',
  purple: '#9C27B0',
  teal: '#00BCD4'
};

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7); // Derniers 7 jours par défaut
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch analytics dashboard data
      const [analyticsRes, statsRes, registrationsRes] = await Promise.all([
        axios.get(`${API}/api/analytics/dashboard?days=${period}`),
        axios.get(`${API}/api/v1/analytics/summary`).catch(() => ({ data: null })),
        axios.get(`${API}/api/registrations`)
      ]);
      
      setAnalytics(analyticsRes.data);
      
      // Calculate conversion metrics
      const registrations = registrationsRes.data;
      const total = registrations.total || 0;
      const approved = registrations.counts?.by_status?.approved || 0;
      const pending = registrations.counts?.by_status?.pending || 0;
      
      // Calculate engagement from analytics
      const eventCounts = analyticsRes.data?.event_counts || [];
      const pageViews = eventCounts.find(e => e._id === 'page_view')?.count || 0;
      const proProfileViews = eventCounts.find(e => e._id === 'pro_profile_view')?.count || 0;
      const opportunityInteractions = eventCounts.find(e => e._id === 'opportunity_interaction')?.count || 0;
      const eventInteractions = eventCounts.find(e => e._id === 'event_interaction')?.count || 0;
      const connections = eventCounts.find(e => e._id === 'pro_connection')?.count || 0;
      const messages = eventCounts.find(e => e._id === 'message_sent')?.count || 0;
      
      setMetrics({
        // Conversion
        total_inscriptions: total,
        approved: approved,
        pending: pending,
        conversion_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
        
        // Engagement Espace Pro
        page_views: pageViews,
        pro_profile_views: proProfileViews,
        opportunity_interactions: opportunityInteractions,
        event_interactions: eventInteractions,
        connections: connections,
        messages: messages,
        
        // Active users
        active_users: analyticsRes.data?.active_users?.length || 0,
        
        // Intro sections (funnel)
        intro_sections: analyticsRes.data?.intro_sections || [],
        
        // Pro activity breakdown
        pro_activity: analyticsRes.data?.pro_activity || [],
        
        // Top pages
        top_pages: analyticsRes.data?.page_stats || []
      });
      
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [period]);

  const MetricCard = ({ title, value, icon: Icon, color, trend, subtitle, onClick }) => (
    <div 
      className={`rounded-xl p-4 sm:p-5 transition-all hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''}`}
      style={{ background: '#2A2820', border: `1px solid ${color}30` }}
      onClick={onClick}
      data-testid={`metric-card-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{title}</div>
      {subtitle && <div className="text-[10px] mt-0.5" style={{ color }}>{subtitle}</div>}
    </div>
  );

  const ProgressBar = ({ label, value, max, color }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
          <span style={{ color }}>{value}</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, background: color }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.charbon }}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: COLORS.gold }} />
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Chargement des métriques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Tableau de Bord des Performances
            </h1>
            <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Suivi en temps réel des conversions et de l'engagement
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: '#2A2820', color: 'white', border: `1px solid ${COLORS.gold}30` }}
            >
              <option value={1}>Aujourd'hui</option>
              <option value={7}>7 derniers jours</option>
              <option value={30}>30 derniers jours</option>
              <option value={90}>3 mois</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={refreshing}
              style={{ borderColor: `${COLORS.gold}50`, color: COLORS.gold }}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <MetricCard
            title="Total Inscriptions"
            value={metrics?.total_inscriptions || 0}
            icon={Users}
            color={COLORS.terracotta}
          />
          <MetricCard
            title="Approuvées"
            value={metrics?.approved || 0}
            icon={UserCheck}
            color={COLORS.forest}
            subtitle={`${metrics?.conversion_rate || 0}% conversion`}
          />
          <MetricCard
            title="En attente"
            value={metrics?.pending || 0}
            icon={Clock}
            color={COLORS.gold}
          />
          <MetricCard
            title="Pages vues"
            value={metrics?.page_views || 0}
            icon={Eye}
            color={COLORS.teal}
          />
          <MetricCard
            title="Profils consultés"
            value={metrics?.pro_profile_views || 0}
            icon={Briefcase}
            color={COLORS.purple}
          />
          <MetricCard
            title="Utilisateurs actifs"
            value={metrics?.active_users || 0}
            icon={Activity}
            color={COLORS.gold}
          />
        </div>

        {/* Sections principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Conversion Funnel */}
          <div className="rounded-xl p-4 sm:p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}30` }}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5" style={{ color: COLORS.terracotta }} />
              <h2 className="font-bold text-white">Funnel de Conversion</h2>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-4xl font-bold" style={{ color: COLORS.terracotta, fontFamily: "'Cormorant Garamond', serif" }}>
                {metrics?.conversion_rate || 0}%
              </div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Taux de conversion global</div>
            </div>

            <ProgressBar 
              label="Inscriptions totales" 
              value={metrics?.total_inscriptions || 0} 
              max={metrics?.total_inscriptions || 1} 
              color={COLORS.terracotta}
            />
            <ProgressBar 
              label="Approuvées" 
              value={metrics?.approved || 0} 
              max={metrics?.total_inscriptions || 1} 
              color={COLORS.forest}
            />
            <ProgressBar 
              label="En attente" 
              value={metrics?.pending || 0} 
              max={metrics?.total_inscriptions || 1} 
              color={COLORS.gold}
            />

            {/* Intro sections funnel */}
            {metrics?.intro_sections?.length > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: COLORS.gold }}>
                  Sections Introduction les plus vues
                </div>
                {metrics.intro_sections.slice(0, 4).map((section) => (
                  <div key={section._id} className="flex justify-between text-xs py-1">
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{section._id}</span>
                    <span style={{ color: COLORS.gold }}>{section.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Engagement Espace Pro */}
          <div className="rounded-xl p-4 sm:p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.purple}30` }}>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5" style={{ color: COLORS.purple }} />
              <h2 className="font-bold text-white">Engagement Espace Pro</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-xl font-bold" style={{ color: COLORS.purple }}>{metrics?.opportunity_interactions || 0}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Interactions Opportunités</div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-xl font-bold" style={{ color: COLORS.teal }}>{metrics?.event_interactions || 0}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Interactions Événements</div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-xl font-bold" style={{ color: COLORS.forest }}>{metrics?.connections || 0}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Connexions Pro</div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-xl font-bold" style={{ color: COLORS.gold }}>{metrics?.messages || 0}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Messages envoyés</div>
              </div>
            </div>

            {/* Pro Activity Breakdown */}
            {metrics?.pro_activity?.length > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: COLORS.purple }}>
                  Activité par type
                </div>
                {metrics.pro_activity.map((activity) => (
                  <div key={activity._id} className="flex justify-between text-xs py-1">
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{activity._id}</span>
                    <span style={{ color: COLORS.purple }}>{activity.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Pages & Alertes */}
          <div className="rounded-xl p-4 sm:p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.teal}30` }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" style={{ color: COLORS.teal }} />
              <h2 className="font-bold text-white">Pages populaires</h2>
            </div>

            <div className="space-y-2 mb-4">
              {(metrics?.top_pages || []).slice(0, 6).map((page, idx) => (
                <div key={page._id || `page-${idx}`} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold" style={{ color: COLORS.teal }}>{idx + 1}</span>
                    <span className="text-xs text-white truncate">{page._id || 'Page inconnue'}</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: COLORS.teal }}>{page.count || 0}</span>
                </div>
              ))}
            </div>

            {/* Alertes si données faibles */}
            {(metrics?.page_views || 0) < 10 && (
              <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: `${COLORS.gold}15`, border: `1px solid ${COLORS.gold}30` }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: COLORS.gold }} />
                <div>
                  <div className="text-xs font-semibold" style={{ color: COLORS.gold }}>Trafic faible</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Considérez d'augmenter la promotion pour attirer plus de visiteurs.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Last updated */}
        <div className="mt-6 text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Dernière mise à jour : {new Date().toLocaleString('fr-FR')} • Actualisation automatique toutes les 60s
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
