import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Eye, Users, Monitor, Smartphone,
  Globe, TrendingUp, Clock, BarChart3, Activity, ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';

const API = process.env.REACT_APP_BACKEND_URL;
const C = {
  bg: '#F4F0E8', card: '#FFFFFF', warm: '#E8E0D0',
  dark: '#1A1510', muted: '#6B6560', gold: '#C9A84C',
  terra: '#A65D47', sage: '#4A5D4E', light: '#FAF8F4',
  blue: '#5B8DEF', purple: '#7C5CFC'
};

const PAGE_LABELS = {
  '/': 'Accueil',
  '/programme': 'Programme',
  '/concert': 'Concert',
  '/tarifs': 'Tarifs',
  '/pricing': 'Tarifs',
  '/partnership': 'Partenariat',
  '/partenaires': 'Partenariat',
  '/catalogue': 'Catalogue',
  '/catalog': 'Catalogue',
  '/jetons': 'Jetons',
  '/espace-pro': 'Espace Pro',
  '/admin': 'Admin',
  '/mon-espace': 'Mon Espace',
};

export default function SiteAnalyticsDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/analytics/site?days=${period}`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = data?.summary || {};
  const maxDailyViews = Math.max(...(data?.daily || []).map(d => d.views), 1);

  return (
    <div className="min-h-screen" style={{ background: C.bg }} data-testid="site-analytics-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(244,240,232,0.95)', backdropFilter: 'blur(8px)', borderColor: C.warm }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} style={{ color: C.muted }} data-testid="back-btn">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: C.dark }}>Smart Engine — Analytics Site</h1>
              <p className="text-xs" style={{ color: C.muted }}>Trafic et comportement visiteurs CC2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={e => setPeriod(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ background: C.light, border: `1px solid ${C.warm}`, color: C.dark }}
              data-testid="period-select"
            >
              <option value={7}>7 jours</option>
              <option value={14}>14 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
              <option value={365}>1 an</option>
            </select>
            <Button size="sm" onClick={fetchData} variant="outline" data-testid="refresh-btn">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: C.gold }} />
            <p className="mt-3 text-sm" style={{ color: C.muted }}>Chargement des analytics...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-16">
            <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: C.warm }} />
            <p style={{ color: C.muted }}>Erreur de chargement</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-cards">
              <KPI icon={Eye} label="Pages vues" value={s.total_page_views || 0} sub={`${s.total_page_views_all_time || 0} total`} color={C.terra} />
              <KPI icon={Users} label="Visiteurs uniques" value={s.unique_visitors || 0} sub={`${s.unique_ips || 0} IPs`} color={C.blue} />
              <KPI icon={TrendingUp} label="Pages/session" value={s.avg_pages_per_session || 0} sub="moyenne" color={C.gold} />
              <KPI icon={Activity} label="Evenements" value={s.total_events || 0} sub={`${s.total_events_all_time || 0} total`} color={C.sage} />
            </div>

            {/* Traffic Chart + Devices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Daily Traffic Chart */}
              <div className="lg:col-span-2 rounded-xl border p-5" style={{ background: C.card, borderColor: C.warm }} data-testid="traffic-chart">
                <h3 className="font-bold text-sm mb-4" style={{ color: C.dark }}>
                  <BarChart3 className="w-4 h-4 inline mr-2" style={{ color: C.terra }} />
                  Trafic quotidien
                </h3>
                {(data.daily || []).length > 0 ? (
                  <div className="space-y-1.5">
                    {data.daily.map(d => (
                      <div key={d.date} className="flex items-center gap-2">
                        <span className="text-xs w-20 text-right flex-shrink-0" style={{ color: C.muted, fontFamily: 'monospace' }}>
                          {formatDate(d.date)}
                        </span>
                        <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: C.light }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max((d.views / maxDailyViews) * 100, 2)}%`,
                              background: `linear-gradient(90deg, ${C.terra}, ${C.gold})`
                            }}
                          />
                        </div>
                        <span className="text-xs w-12 flex-shrink-0 font-medium" style={{ color: C.dark }}>
                          {d.views}
                        </span>
                        <span className="text-xs w-16 flex-shrink-0" style={{ color: C.muted }}>
                          {d.visitors} vis.
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyChart text="Pas encore de trafic enregistre" />
                )}
              </div>

              {/* Devices + Hourly */}
              <div className="space-y-4">
                {/* Devices */}
                <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.warm }} data-testid="device-breakdown">
                  <h3 className="font-bold text-sm mb-4" style={{ color: C.dark }}>
                    <Monitor className="w-4 h-4 inline mr-2" style={{ color: C.blue }} />
                    Appareils
                  </h3>
                  <DeviceBar mobile={data.devices?.mobile || 0} desktop={data.devices?.desktop || 0} />
                </div>

                {/* Hourly Today */}
                <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.warm }} data-testid="hourly-chart">
                  <h3 className="font-bold text-sm mb-4" style={{ color: C.dark }}>
                    <Clock className="w-4 h-4 inline mr-2" style={{ color: C.gold }} />
                    Trafic aujourd'hui (par heure)
                  </h3>
                  {(data.hourly_today || []).length > 0 ? (
                    <div className="flex items-end gap-1" style={{ height: 80 }}>
                      {Array.from({ length: 24 }, (_, i) => {
                        const h = String(i).padStart(2, '0');
                        const found = data.hourly_today.find(x => x.hour === h);
                        const count = found?.count || 0;
                        const maxH = Math.max(...data.hourly_today.map(x => x.count), 1);
                        return (
                          <div key={h} className="flex-1 flex flex-col items-center gap-0.5" title={`${h}h: ${count}`}>
                            <div
                              className="w-full rounded-t"
                              style={{
                                height: `${Math.max((count / maxH) * 60, 2)}px`,
                                background: count > 0 ? C.terra : C.warm,
                                minHeight: 2
                              }}
                            />
                            {i % 4 === 0 && <span className="text-[8px]" style={{ color: C.muted }}>{h}</span>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-center py-4" style={{ color: C.muted }}>Pas de trafic aujourd'hui</p>
                  )}
                </div>
              </div>
            </div>

            {/* Top Pages + Referrers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Pages */}
              <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.warm }} data-testid="top-pages">
                <h3 className="font-bold text-sm mb-4" style={{ color: C.dark }}>
                  <Globe className="w-4 h-4 inline mr-2" style={{ color: C.sage }} />
                  Pages les plus visitees
                </h3>
                {(data.top_pages || []).length > 0 ? (
                  <div className="space-y-2">
                    {data.top_pages.map((p, i) => {
                      const maxV = data.top_pages[0]?.views || 1;
                      return (
                        <div key={p.page || `page-${i}`} className="flex items-center gap-3">
                          <span className="text-xs w-5 text-right font-bold" style={{ color: C.terra }}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium truncate" style={{ color: C.dark }}>
                                {PAGE_LABELS[p.page] || p.page}
                              </span>
                              <span className="text-xs flex-shrink-0 ml-2" style={{ color: C.muted }}>
                                {p.views} vues / {p.visitors} vis.
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background: C.light }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(p.views / maxV) * 100}%`,
                                  background: C.sage
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyChart text="Aucune page visitee" />
                )}
              </div>

              {/* Referrers */}
              <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.warm }} data-testid="referrers">
                <h3 className="font-bold text-sm mb-4" style={{ color: C.dark }}>
                  <ExternalLink className="w-4 h-4 inline mr-2" style={{ color: C.purple }} />
                  Sources de trafic
                </h3>
                {(data.referrers || []).length > 0 ? (
                  <div className="space-y-2">
                    {data.referrers.map((r) => (
                      <div key={r.source} className="flex items-center justify-between p-2 rounded-lg" style={{ background: C.light }}>
                        <span className="text-xs truncate flex-1" style={{ color: C.dark }}>{cleanReferrer(r.source)}</span>
                        <span className="text-xs font-bold ml-2" style={{ color: C.purple }}>{r.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyChart text="Aucun referrer (trafic direct)" />
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.warm }} data-testid="recent-activity">
              <h3 className="font-bold text-sm mb-4" style={{ color: C.dark }}>
                <Activity className="w-4 h-4 inline mr-2" style={{ color: C.terra }} />
                Activite recente (derniers visiteurs)
              </h3>
              {(data.recent_activity || []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: C.muted }}>
                        <th className="text-left py-1.5 font-medium">Heure</th>
                        <th className="text-left py-1.5 font-medium">Page</th>
                        <th className="text-left py-1.5 font-medium">IP</th>
                        <th className="text-left py-1.5 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_activity.map((a, i) => (
                        <tr key={a.created_at || `act-${i}`} className="border-t" style={{ borderColor: C.warm }}>
                          <td className="py-1.5" style={{ color: C.muted, fontFamily: 'monospace' }}>{formatTime(a.created_at)}</td>
                          <td className="py-1.5 font-medium" style={{ color: C.dark }}>{PAGE_LABELS[a.data?.page] || a.data?.page}</td>
                          <td className="py-1.5" style={{ color: C.muted, fontFamily: 'monospace' }}>{a.ip || '-'}</td>
                          <td className="py-1.5">
                            {a.data?.device?.isMobile ? (
                              <span className="flex items-center gap-1" style={{ color: C.gold }}><Smartphone className="w-3 h-3" /> Mobile</span>
                            ) : (
                              <span className="flex items-center gap-1" style={{ color: C.blue }}><Monitor className="w-3 h-3" /> Desktop</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyChart text="Aucune activite recente" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══ SUB COMPONENTS ═══ */

function KPI({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="p-4 rounded-xl border" style={{ background: '#FFFFFF', borderColor: '#E8E0D0' }}>
      <Icon className="w-5 h-5 mb-2" style={{ color }} />
      <p className="text-2xl font-bold" style={{ color: '#1A1510' }}>
        {typeof value === 'number' && value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
      </p>
      <p className="text-xs" style={{ color: '#6B6560' }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: '#6B656080' }}>{sub}</p>}
    </div>
  );
}

function DeviceBar({ mobile, desktop }) {
  const total = mobile + desktop;
  if (total === 0) return <EmptyChart text="Pas de donnees" />;
  const mPct = Math.round((mobile / total) * 100);
  const dPct = 100 - mPct;
  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-6 mb-3" style={{ background: '#F4F0E8' }}>
        {dPct > 0 && (
          <div className="flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${dPct}%`, background: '#5B8DEF' }}>
            {dPct > 15 ? `${dPct}%` : ''}
          </div>
        )}
        {mPct > 0 && (
          <div className="flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${mPct}%`, background: '#C9A84C' }}>
            {mPct > 15 ? `${mPct}%` : ''}
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1" style={{ color: '#5B8DEF' }}>
          <Monitor className="w-3 h-3" /> Desktop ({desktop})
        </span>
        <span className="flex items-center gap-1" style={{ color: '#C9A84C' }}>
          <Smartphone className="w-3 h-3" /> Mobile ({mobile})
        </span>
      </div>
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div className="text-center py-8">
      <BarChart3 className="w-8 h-8 mx-auto mb-2" style={{ color: '#E8E0D0' }} />
      <p className="text-xs" style={{ color: '#6B6560' }}>{text}</p>
      <p className="text-[10px] mt-1" style={{ color: '#6B656060' }}>Les donnees apparaitront ici au fil des visites</p>
    </div>
  );
}

/* ═══ HELPERS ═══ */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  const months = ['', 'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(d)} ${months[parseInt(m)]}`;
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function cleanReferrer(ref) {
  if (!ref) return 'Direct';
  try {
    const url = new URL(ref);
    return url.hostname;
  } catch { return ref.slice(0, 40); }
}
