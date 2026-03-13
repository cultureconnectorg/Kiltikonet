import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Coins, TrendingUp, Users, ShoppingCart,
  Activity, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Button } from './ui/button';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';

const API = process.env.REACT_APP_BACKEND_URL;

const C = {
  bg: '#F4F0E8', card: '#FFFFFF', warm: '#E8E0D0', dark: '#1A1510',
  muted: '#6B6560', gold: '#C9A84C', terra: '#A65D47', sage: '#4A5D4E',
};

const PIE_COLORS = ['#A65D47', '#C9A84C', '#4A5D4E', '#6B6560', '#D4A84B', '#8B5E3C', '#2A5D47', '#C4714A'];

const StatCard = ({ icon: Icon, label, value, sub, trend }) => (
  <div className="p-5 rounded-xl border" style={{ background: C.card, borderColor: C.warm }} data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${C.terra}15` }}>
        <Icon className="w-5 h-5" style={{ color: C.terra }} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: trend > 0 ? C.sage : C.terra }}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold" style={{ color: C.dark }}>{value}</p>
    <p className="text-xs mt-1" style={{ color: C.muted }}>{label}</p>
    {sub && <p className="text-xs mt-0.5" style={{ color: C.gold }}>{sub}</p>}
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.warm }}>
    <h3 className="font-bold text-sm mb-4" style={{ color: C.dark }}>{title}</h3>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-lg border" style={{ background: C.card, borderColor: C.warm }}>
      <p className="font-bold mb-1" style={{ color: C.dark }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function JetonsAnalyticsDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/analytics/jetons/overview`);
      if (!res.ok) throw new Error('Erreur chargement');
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: C.gold }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: C.bg }}>
        <p style={{ color: C.muted }}>{error || 'Aucune donnée'}</p>
        <Button onClick={fetchData} style={{ background: C.terra, color: '#fff' }}>Réessayer</Button>
      </div>
    );
  }

  const { summary, pack_distribution, jetons_by_type, timeline, top_holders, recent_transactions, frek_core } = data;

  return (
    <div className="min-h-screen" style={{ background: C.bg }} data-testid="jetons-analytics-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(244,240,232,0.95)', backdropFilter: 'blur(8px)', borderColor: C.warm }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2" style={{ color: C.muted }} data-testid="analytics-back-btn">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: C.dark }}>Analytics Jetons</h1>
              <p className="text-xs" style={{ color: C.muted }}>Culture Connect 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {frek_core && (
              <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium" style={{ background: frek_core.connected ? `${C.sage}20` : `${C.terra}20`, color: frek_core.connected ? C.sage : C.terra }}>
                <Zap className="w-3 h-3" />
                FREK {frek_core.connected ? 'OK' : 'OFF'}
              </span>
            )}
            <Button size="sm" onClick={fetchData} variant="outline" data-testid="analytics-refresh-btn">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Coins} label="Jetons en circulation" value={summary.total_jetons_circulation.toLocaleString()} sub={`${summary.valeur_totale_eur.toLocaleString()}€ valeur`} />
          <StatCard icon={ShoppingCart} label="Revenus totaux" value={`${summary.total_revenue_eur.toLocaleString()}€`} sub={`${summary.total_purchased.toLocaleString()} jetons achetés`} />
          <StatCard icon={TrendingUp} label="Jetons dépensés" value={summary.total_spent.toLocaleString()} sub={`${summary.total_transactions} transactions`} />
          <StatCard icon={Users} label="Détenteurs" value={summary.holders_count} sub={`sur ${summary.total_badges} badges`} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <ChartCard title="Volume de transactions">
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.warm} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.muted }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="achats" name="Achats" stroke={C.sage} fill={`${C.sage}40`} />
                  <Area type="monotone" dataKey="depenses" name="Dépenses" stroke={C.terra} fill={`${C.terra}40`} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-sm" style={{ color: C.muted }}>Aucune transaction</p>
            )}
          </ChartCard>

          {/* Pack Distribution */}
          <ChartCard title="Distribution des packs">
            {pack_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pack_distribution} dataKey="count" nameKey="pack" cx="50%" cy="50%" outerRadius={90} label={({ pack, count }) => `${pack} (${count})`}>
                    {pack_distribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-sm" style={{ color: C.muted }}>Aucun achat</p>
            )}
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Jetons by badge type */}
          <ChartCard title="Jetons par type de badge">
            {jetons_by_type.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={jetons_by_type} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.warm} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} />
                  <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: C.muted }} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="jetons" name="Jetons" fill={C.gold} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-sm" style={{ color: C.muted }}>Aucun jeton distribué</p>
            )}
          </ChartCard>

          {/* Top Holders */}
          <ChartCard title="Top 10 détenteurs">
            {top_holders.length > 0 ? (
              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                {top_holders.map((h, i) => (
                  <div key={h.badge_id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: i === 0 ? `${C.gold}15` : C.bg }}>
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: i < 3 ? C.gold : C.warm, color: i < 3 ? '#fff' : C.muted }}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: C.dark }}>{h.nom || h.badge_id}</p>
                        <p className="text-xs" style={{ color: C.muted }}>{h.type}</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm" style={{ color: C.gold }}>{h.jetons} JCC</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-sm" style={{ color: C.muted }}>Aucun détenteur</p>
            )}
          </ChartCard>
        </div>

        {/* Recent Transactions */}
        <ChartCard title="Transactions récentes">
          {recent_transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.warm}` }}>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: C.muted }}>Badge</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: C.muted }}>Type</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: C.muted }}>Jetons</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: C.muted }}>Détail</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: C.muted }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_transactions.map((tx, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.bg}` }}>
                      <td className="py-2 px-2 font-mono text-xs" style={{ color: C.dark }}>{tx.badge_id}</td>
                      <td className="py-2 px-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: tx.type === 'achat' ? `${C.sage}20` : `${C.terra}20`, color: tx.type === 'achat' ? C.sage : C.terra }}>
                          {tx.type === 'achat' ? 'Achat' : 'Dépense'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-bold" style={{ color: tx.jetons > 0 ? C.sage : C.terra }}>
                        {tx.jetons > 0 ? '+' : ''}{tx.jetons}
                      </td>
                      <td className="py-2 px-2 text-xs" style={{ color: C.muted }}>{tx.pack || tx.description || '-'}</td>
                      <td className="py-2 px-2 text-right text-xs" style={{ color: C.muted }}>
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('fr-FR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-sm" style={{ color: C.muted }}>Aucune transaction récente</p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
