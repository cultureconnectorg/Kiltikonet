import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Activity, Database, Shield, Mail, Clock, AlertTriangle, CheckCircle, Users, Globe, Zap } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const C = { bg: '#0a0a0b', card: '#131315', gold: '#E8D5A0', text: '#FFFFFF', muted: '#72727a', border: 'rgba(255,255,255,0.06)', dim: '#3a3a42' };

const statusColor = (val, thresholds) => {
  if (val <= thresholds[0]) return '#4ade80';
  if (val <= thresholds[1]) return '#E8D5A0';
  return '#f08080';
};

const MetricCard = ({ icon: Icon, label, value, unit, color }) => (
  <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }} data-testid={`health-metric-${label.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} style={{ color: C.muted }} />
      <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{label}</span>
    </div>
    <p className="text-2xl font-bold" style={{ color: color || C.text }}>{value ?? '--'}<span className="text-xs ml-1 font-normal" style={{ color: C.muted }}>{unit}</span></p>
  </div>
);

const AdminHealthPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/admin/health-stats`, { withCredentials: true });
      setStats(res.data);
    } catch { /* silently retry */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 rounded-xl" style={{ background: '#1A1A1A' }} />)}
    </div>
  );

  if (!stats) return <p style={{ color: C.muted }}>Erreur de chargement des metriques</p>;

  const uptimeStr = stats.uptime_serveur_s > 3600
    ? `${Math.floor(stats.uptime_serveur_s / 3600)}h ${Math.floor((stats.uptime_serveur_s % 3600) / 60)}m`
    : `${Math.floor(stats.uptime_serveur_s / 60)}m`;

  return (
    <div data-testid="admin-health-panel">
      <div className="flex items-center gap-3 mb-4">
        <Activity size={18} style={{ color: C.gold }} />
        <h3 className="text-lg font-bold" style={{ color: C.text }}>Kilti-Health</h3>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#4ade80' }}>Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Zap} label="Latence moy." value={stats.latence_moyenne_ms} unit="ms"
          color={statusColor(stats.latence_moyenne_ms, [200, 500])} />
        <MetricCard icon={AlertTriangle} label="Taux erreur" value={stats.taux_erreur_pct} unit="%"
          color={statusColor(stats.taux_erreur_pct, [1, 5])} />
        <MetricCard icon={Database} label="Taille DB" value={stats.taille_db_mb} unit="MB" />
        <MetricCard icon={Clock} label="Uptime" value={uptimeStr} unit="" />
        <MetricCard icon={Mail} label="Emails 24h" value={stats.emails_envoyes_24h} unit="" />
        <MetricCard icon={Shield} label="Brevo" value={stats.brevo_status === 'operational' ? 'OK' : 'Erreur'} unit=""
          color={stats.brevo_status === 'operational' ? '#4ade80' : '#f08080'} />
        <MetricCard icon={Globe} label="Google Auth" value={stats.google_auth_enabled ? 'Actif' : 'Inactif'} unit=""
          color={stats.google_auth_enabled ? '#4ade80' : C.muted} />
        <MetricCard icon={Users} label="Magic Links" value={stats.magic_links_actifs} unit="actifs" />
      </div>

      {stats.top_ips_actives?.length > 0 && (
        <div className="mt-4 rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.muted }}>Top IPs actives</p>
          <div className="flex flex-wrap gap-2">
            {stats.top_ips_actives.map(ip => (
              <span key={ip} className="px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(232,213,160,0.08)', color: C.muted }}>{ip}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHealthPanel;
