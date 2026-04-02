import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Activity, Users, Globe, BarChart3, Shield, Network, Eye, TrendingUp,
  RefreshCw, Loader2, ArrowLeft, Home, Zap, Signal, MapPin, Share2, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/smart-engine`;

const STREAMS = [
  { id: 'dashboard', label: 'Vue Globale', icon: Activity, color: '#A65D47' },
  { id: 'predictive', label: 'Prédictif', icon: TrendingUp, color: '#7A8F6D' },
  { id: 'mgraph', label: 'Mgraph', icon: Network, color: '#6B7DB3' },
  { id: 'live-audience', label: 'Live', icon: Signal, color: '#E74C3C' },
  { id: 'creation-origin', label: 'Origines', icon: MapPin, color: '#F39C12' },
  { id: 'cultural-diffusion', label: 'Diffusion', icon: Share2, color: '#9B59B6' },
  { id: 'conversion', label: 'Conversion', icon: BarChart3, color: '#2ECC71' },
  { id: 'verified-identity', label: 'Identités', icon: Shield, color: '#3498DB' },
  { id: 'creative-network', label: 'Reseau', icon: Users, color: '#E67E22' },
  { id: 'recommendations', label: 'Recommandations', icon: Sparkles, color: '#FFD700' },
];

const MetricCard = ({ label, value, icon: Icon, color, sub }) => (
  <div data-testid={`metric-${label.toLowerCase().replace(/\s/g, '-')}`} className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 rounded-lg">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon size={14} style={{ color }} />}
      <span className="text-xs text-[#888]">{label}</span>
    </div>
    <p className="text-2xl font-bold text-[#F4F1EA]">{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</p>
    {sub && <p className="text-xs text-[#666] mt-1">{sub}</p>}
  </div>
);

const BarSimple = ({ data, labelKey, valueKey, color = '#A65D47', maxItems = 8 }) => {
  if (!data?.length) return <p className="text-[#555] text-sm">Aucune donnée</p>;
  const items = data.slice(0, maxItems);
  const max = Math.max(...items.map(d => d[valueKey] || 0), 1);
  return (
    <div className="space-y-2">
      {items.map((d, i) => (
        <div key={d[labelKey] || `bar-${i}`} className="flex items-center gap-3">
          <span className="text-xs text-[#999] w-28 truncate">{d[labelKey] || '-'}</span>
          <div className="flex-1 bg-[#222] rounded-full h-5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(d[valueKey] / max) * 100}%`, backgroundColor: color }} />
          </div>
          <span className="text-xs text-[#F4F1EA] w-10 text-right">{d[valueKey]}</span>
        </div>
      ))}
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-[#141414] border border-[#222] p-5 rounded-lg">
    <h3 className="text-sm font-semibold text-[#F4F1EA] mb-4 tracking-wide uppercase">{title}</h3>
    {children}
  </div>
);

// ─── STREAM VIEWS ───
const DashboardView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard label="Badges" value={data.overview?.total_badges} icon={Shield} color="#3498DB" />
      <MetricCard label="Events 24h" value={data.overview?.events_24h} icon={Activity} color="#E74C3C" />
      <MetricCard label="En ligne" value={data.overview?.active_now} icon={Eye} color="#2ECC71" />
      <MetricCard label="NFC Actifs" value={data.overview?.nfc_enabled} icon={Zap} color="#F39C12" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <MetricCard label="Inscriptions Pro" value={data.overview?.total_registrations} icon={Users} color="#6B7DB3" />
      <MetricCard label="Connexions" value={data.overview?.connections} icon={Network} color="#9B59B6" />
      <MetricCard label="Messages" value={data.overview?.messages} icon={Share2} color="#E67E22" />
    </div>
    <Section title="Flux CVLN Actifs">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {data.streams?.map(s => (
          <div key={s.id} className="flex items-center gap-2 p-2 bg-[#1A1A1A] rounded">
            <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-[#CCC]">{s.name}</span>
          </div>
        ))}
      </div>
    </Section>
  </div>
);

const PredictiveView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard label="Total inscriptions" value={data.current_total} icon={Users} color="#7A8F6D" />
      <MetricCard label="Moy. / jour" value={data.avg_daily_rate} icon={TrendingUp} color="#F39C12" />
      <MetricCard label="Projection CC" value={data.projected_total_at_event} icon={BarChart3} color="#3498DB" sub={`J-${data.days_remaining}`} />
      <MetricCard label="Jours restants" value={data.days_remaining} icon={Activity} color="#E74C3C" />
    </div>
    <Section title="Inscriptions par type">
      <BarSimple data={data.registrations_by_type} labelKey="type" valueKey="count" color="#7A8F6D" />
    </Section>
    <Section title="Tendance inscriptions (quotidien)">
      {data.daily_registrations?.length ? (
        <div className="flex items-end gap-1 h-32">
          {data.daily_registrations.map((d) => {
            const max = Math.max(...data.daily_registrations.map(x => x.count), 1);
            return (
              <div key={d._id} className="flex-1 flex flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-[#888]">{d.count}</span>
                <div className="w-full bg-[#7A8F6D] rounded-t transition-all" style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }} />
                <span className="text-[8px] text-[#555] rotate-45">{d._id?.slice(5)}</span>
              </div>
            );
          })}
        </div>
      ) : <p className="text-[#555] text-sm">Pas de données</p>}
    </Section>
  </div>
);

const MgraphViewLazy = React.lazy(() => import('./MgraphView'));
const MgraphViewWrapper = () => (
  <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-[#A65D47]" /></div>}>
    <MgraphViewLazy />
  </React.Suspense>
);

const RecoLazy = React.lazy(() => import('./RecommendationsDashboard'));
const RecoWrapper = () => (
  <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-[#A65D47]" /></div>}>
    <RecoLazy />
  </React.Suspense>
);

const LiveAudienceView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3">
      <MetricCard label="En ligne maintenant" value={data.active_now} icon={Eye} color="#E74C3C" sub="Dernières 5 min" />
      <MetricCard label="Sessions / heure" value={data.sessions_last_hour} icon={Signal} color="#3498DB" />
    </div>
    <Section title="Pages consultées en ce moment">
      <BarSimple data={data.current_pages} labelKey="page" valueKey="viewers" color="#E74C3C" />
    </Section>
    <Section title="Activité horaire (24h)">
      {data.hourly_trend?.length ? (
        <div className="flex items-end gap-1 h-28">
          {Array.from({ length: 24 }, (_, h) => {
            const d = data.hourly_trend.find(x => x.hour === h);
            const max = Math.max(...data.hourly_trend.map(x => x.views), 1);
            return (
              <div key={h} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div className="w-full bg-[#E74C3C] rounded-t transition-all opacity-80" style={{ height: `${d ? (d.views / max) * 100 : 0}%`, minHeight: 2 }} />
                <span className="text-[8px] text-[#555]">{h}h</span>
              </div>
            );
          })}
        </div>
      ) : <p className="text-[#555] text-sm">Pas de données</p>}
    </Section>
  </div>
);

const CreationOriginView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Section title="Pays d'origine">
        <BarSimple data={data.countries} labelKey="country" valueKey="count" color="#F39C12" />
      </Section>
      <Section title="Types de profils">
        <BarSimple data={data.profile_types} labelKey="type" valueKey="count" color="#9B59B6" />
      </Section>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Section title="Langues">
        <BarSimple data={data.languages} labelKey="lang" valueKey="count" color="#3498DB" />
      </Section>
      <Section title="Appareils">
        <BarSimple data={data.devices} labelKey="type" valueKey="count" color="#2ECC71" />
      </Section>
    </div>
  </div>
);

const CulturalDiffusionView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3">
      <MetricCard label="Demandes contact" value={data.contact_inquiries} icon={Users} color="#9B59B6" />
      <MetricCard label="Partenariats" value={data.partnerships} icon={Globe} color="#F39C12" />
    </div>
    <Section title="Sources de trafic">
      <BarSimple data={data.referrers} labelKey="source" valueKey="visits" color="#9B59B6" />
    </Section>
    <Section title="Engagement par page">
      <BarSimple data={data.page_engagement} labelKey="page" valueKey="events" color="#6B7DB3" />
    </Section>
  </div>
);

const ConversionView = ({ data }) => {
  const funnel = data.funnel || {};
  const rates = data.rates || {};
  const steps = [
    { label: 'Visiteurs', value: funnel.visitors, color: '#3498DB' },
    { label: 'Vus Tarifs', value: funnel.pricing_viewers, color: '#F39C12' },
    { label: 'Inscrits', value: funnel.inscriptions, color: '#2ECC71' },
    { label: 'Payants', value: funnel.paid, color: '#E74C3C' },
  ];
  const max = Math.max(...steps.map(s => s.value || 0), 1);
  return (
    <div className="space-y-6">
      <Section title="Entonnoir de conversion">
        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-xs text-[#999] w-24">{s.label}</span>
              <div className="flex-1 bg-[#222] rounded-full h-8 overflow-hidden">
                <div className="h-full rounded-full flex items-center px-3 transition-all duration-700" style={{ width: `${Math.max((s.value / max) * 100, 5)}%`, backgroundColor: s.color }}>
                  <span className="text-xs text-white font-bold">{s.value?.toLocaleString('fr-FR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Visite → Tarifs" value={`${rates.visit_to_pricing}%`} icon={TrendingUp} color="#F39C12" />
        <MetricCard label="Tarifs → Inscrit" value={`${rates.pricing_to_inscription}%`} icon={BarChart3} color="#2ECC71" />
        <MetricCard label="Global" value={`${rates.overall}%`} icon={Activity} color="#E74C3C" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Revenus" value={`${data.revenue?.total_eur}€`} icon={Zap} color="#2ECC71" sub={`${data.revenue?.payments_count} paiements`} />
        <MetricCard label="Badges gratuits" value={funnel.free} icon={Shield} color="#3498DB" />
      </div>
    </div>
  );
};

const VerifiedIdentityView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard label="Total badges" value={data.total_badges} icon={Shield} color="#3498DB" />
      <MetricCard label="NFC actifs" value={data.nfc?.enabled} icon={Zap} color="#F39C12" />
      <MetricCard label="FREK vérifiés" value={data.frek_verified} icon={Users} color="#2ECC71" />
      <MetricCard label="Remis" value={data.handed_out} icon={Activity} color="#9B59B6" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Section title="Par type de badge">
        <BarSimple data={data.by_type} labelKey="type" valueKey="count" color="#3498DB" />
      </Section>
      <Section title="Par statut">
        <BarSimple data={Object.entries(data.by_status || {}).map(([k, v]) => ({ status: k, count: v }))} labelKey="status" valueKey="count" color="#2ECC71" />
      </Section>
    </div>
    <Section title="Derniers badges">
      <div className="space-y-2">
        {(data.recent_badges || []).map((b) => (
          <div key={b.badge_id} className="flex items-center gap-3 text-xs py-1 border-b border-[#222]">
            <span className="text-[#A65D47] font-mono w-16">{b.badge_id?.slice(-6)}</span>
            <span className="text-[#F4F1EA] flex-1">{b.prenom} {b.nom}</span>
            <span className="text-[#888] px-2 py-0.5 bg-[#1A1A1A] rounded">{b.type_badge}</span>
            <span className="text-[#555]">{b.statut}</span>
          </div>
        ))}
      </div>
    </Section>
  </div>
);

const CreativeNetworkView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard label="Connexions" value={data.connections?.total} icon={Network} color="#E67E22" sub={`${data.connections?.accepted} acceptées`} />
      <MetricCard label="Messages" value={data.messages?.total} icon={Share2} color="#3498DB" sub={`${data.messages?.this_week} cette semaine`} />
      <MetricCard label="Opportunités" value={data.opportunities?.total} icon={Zap} color="#2ECC71" sub={`${data.opportunities?.active} actives`} />
      <MetricCard label="Events" value={data.events?.total} icon={Globe} color="#9B59B6" />
    </div>
    <Section title="Profils les plus connectés">
      {data.top_connected?.length ? (
        <div className="space-y-2">
          {data.top_connected.map((p, i) => (
            <div key={p.name || `conn-${i}`} className="flex items-center gap-3 text-xs py-2 border-b border-[#222]">
              <span className="w-6 h-6 rounded-full bg-[#A65D47] flex items-center justify-center text-white font-bold">{i + 1}</span>
              <span className="text-[#F4F1EA] flex-1">{p.name}</span>
              <span className="text-[#888] px-2 py-0.5 bg-[#1A1A1A] rounded">{p.type}</span>
              <span className="text-[#F39C12] font-mono">{p.connections} cx</span>
            </div>
          ))}
        </div>
      ) : <p className="text-[#555] text-sm">Aucune connexion pour le moment</p>}
    </Section>
    <Section title="Activité réseau (7 jours)">
      <BarSimple data={Object.entries(data.weekly_activity || {}).map(([k, v]) => ({ action: k.replace(/_/g, ' '), count: v }))} labelKey="action" valueKey="count" color="#E67E22" />
    </Section>
  </div>
);

const VIEWS = {
  'dashboard': DashboardView,
  'predictive': PredictiveView,
  'mgraph': MgraphViewWrapper,
  'live-audience': LiveAudienceView,
  'creation-origin': CreationOriginView,
  'cultural-diffusion': CulturalDiffusionView,
  'conversion': ConversionView,
  'verified-identity': VerifiedIdentityView,
  'creative-network': CreativeNetworkView,
  'recommendations': RecoWrapper,
};

const SmartEngineDashboard = () => {
  const navigate = useNavigate();
  const [activeStream, setActiveStream] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStream = useCallback(async (streamId) => {
    // Views that manage their own data fetching
    const selfManaged = ['mgraph', 'recommendations'];
    if (selfManaged.includes(streamId)) {
      setData({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: result } = await axios.get(`${API}/${streamId}`);
      setData(result);
    } catch (err) {
      toast.error(`Erreur chargement ${streamId}`);
      setData({});
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStream(activeStream); }, [activeStream, fetchStream]);

  const StreamView = VIEWS[activeStream] || DashboardView;
  const activeConfig = STREAMS.find(s => s.id === activeStream) || STREAMS[0];

  return (
    <div data-testid="smart-engine-dashboard" className="min-h-screen bg-[#0D0D0D] text-[#F4F1EA]">
      {/* Header */}
      <div className="border-b border-[#222] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/workspace/coleen')} className="text-[#888] hover:text-[#F4F1EA]">
            <ArrowLeft size={16} className="mr-1" /> Retour
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-wide">CVLN Smart Engine</h1>
            <p className="text-xs text-[#666]">Culture Connect 2026 — Data System</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchStream(activeStream)} disabled={loading} className="border-[#333] text-[#CCC] hover:bg-[#222]">
          <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-52 border-r border-[#222] min-h-[calc(100vh-65px)] p-3 space-y-1">
          {STREAMS.map(s => {
            const Icon = s.icon;
            const isActive = activeStream === s.id;
            return (
              <button
                key={s.id}
                data-testid={`stream-tab-${s.id}`}
                onClick={() => setActiveStream(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-[#1A1A1A] text-[#F4F1EA] border border-[#333]' : 'text-[#777] hover:text-[#CCC] hover:bg-[#141414]'}`}
              >
                <Icon size={14} style={{ color: isActive ? s.color : undefined }} />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto max-h-[calc(100vh-65px)]">
          <div className="flex items-center gap-3 mb-6">
            <activeConfig.icon size={20} style={{ color: activeConfig.color }} />
            <h2 className="text-base font-bold">{activeConfig.label}</h2>
            {loading && <Loader2 size={16} className="animate-spin text-[#555]" />}
          </div>

          {loading && !data ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-[#A65D47]" />
            </div>
          ) : data ? (
            <StreamView data={data} />
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default SmartEngineDashboard;
