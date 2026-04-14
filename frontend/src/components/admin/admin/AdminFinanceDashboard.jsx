import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Wallet, TrendingUp, Users, Globe, BarChart3,
  Zap, Shield, Clock, ArrowUpRight, ArrowDownRight, Building2, MapPin,
  RefreshCw, CreditCard, Activity
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';
const C = {
  bg: '#0a0a0b', surface: '#111111', card: '#141414', border: '#1a1a1a',
  text: '#FFFFFF', muted: '#72727a', dim: '#555555',
  green: '#22c55e', red: '#ef4444', blue: '#3b82f6',
};

const StatCard = ({ label, value, sub, icon: Icon, color = G, trend }) => (
  <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}
    data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-8 translate-x-8"
      style={{ background: `${color}08` }} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: C.muted }}>{label}</p>
        <p className="text-2xl font-black mt-1" style={{ color: C.text, fontFamily: "'DM Sans', sans-serif" }}>{value}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{sub}</p>}
      </div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 mt-2">
        {trend > 0 ? <ArrowUpRight size={12} style={{ color: C.green }} /> : <ArrowDownRight size={12} style={{ color: C.red }} />}
        <span className="text-[10px] font-bold" style={{ color: trend > 0 ? C.green : C.red }}>
          {Math.abs(trend)}%
        </span>
      </div>
    )}
  </div>
);

const ZoneBar = ({ label, count, max, color }) => (
  <div className="flex items-center gap-3 group">
    <span className="text-[11px] font-medium w-20 text-right truncate" style={{ color: C.muted }}>{label}</span>
    <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
      <div className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
        style={{ width: `${Math.min((count / Math.max(max, 1)) * 100, 100)}%`, background: color }}>
        <span className="text-[9px] font-bold" style={{ color: '#0a0a0b' }}>{count}</span>
      </div>
    </div>
  </div>
);

const AdminFinanceDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/fintech/dashboard`);
      setData(res.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: G }} />
      </div>
    );
  }

  const zoneData = Object.entries(data.adoption_by_zone || {}).sort((a, b) => b[1] - a[1]);
  const maxZone = zoneData.length > 0 ? zoneData[0][1] : 1;
  const zoneColors = {
    'lagos': '#22c55e', 'dakar': '#f59e0b', 'abidjan': '#ef4444',
    'accra': '#8b5cf6', 'kinshasa': '#ec4899',
    'salvador': '#3b82f6', 'cartagena': '#06b6d4', 'havana': '#14b8a6',
    'bogota': '#a855f7', 'lima': '#f97316',
    'paris': '#6366f1', 'brussels': '#84cc16', 'montreal': '#0ea5e9',
    'new_york': '#e11d48', 'london': '#8b5cf6',
  };

  const packData = Object.entries(data.revenue_by_pack || {});
  const channelData = Object.entries(data.revenue_by_channel || {});

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'DM Sans', sans-serif" }} data-testid="admin-finance-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(10,10,11,0.95)', backdropFilter: 'blur(24px)', borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="p-2 rounded-lg hover:bg-white/5" style={{ color: C.muted }}
              data-testid="back-to-admin">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-black" style={{ color: C.text }}>
                <span style={{ background: `linear-gradient(135deg, #fff, ${G})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Dashboard Financier
                </span>
              </h1>
              <p className="text-[10px]" style={{ color: C.muted }}>Factory Maker Studio EURL — KiltiKonet Fintech</p>
            </div>
          </div>
          <button onClick={loadDashboard} className="p-2 rounded-lg hover:bg-white/5 transition-all" style={{ color: G }}
            data-testid="refresh-dashboard">
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Float / Cash / Passif */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="float-section">
          <StatCard label="Cash EUR"
            value={`${data.float?.cash_eur?.toLocaleString('fr-FR') || 0}€`}
            sub="Tresorerie encaissee"
            icon={DollarSign} color={C.green} />
          <StatCard label="Passif KT"
            value={`${data.float?.passif_kt?.toLocaleString('fr-FR') || 0} KT`}
            sub="En circulation (obligations)"
            icon={Wallet} color="#f59e0b" />
          <StatCard label="KT Emis"
            value={`${data.float?.kt_total_emitted?.toLocaleString('fr-FR') || 0}`}
            sub="Total tokens generes"
            icon={Zap} color={G} />
          <StatCard label="KT Consommes"
            value={`${data.float?.kt_consumed?.toLocaleString('fr-FR') || 0}`}
            sub="Revenus realises"
            icon={TrendingUp} color={C.blue} />
        </div>

        {/* Wallets & Sessions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Wallets"
            value={data.wallets || 0}
            sub={`${data.frek_linked || 0} FREK-ID lies`}
            icon={Users} color="#8b5cf6" />
          <StatCard label="Transactions"
            value={data.transactions || 0}
            icon={Activity} color="#06b6d4" />
          <StatCard label="Checkout"
            value={`${data.checkout_sessions?.paid || 0}/${data.checkout_sessions?.total || 0}`}
            sub="Payes / Total"
            icon={CreditCard} color={G} />
          <StatCard label="Transferts"
            value={data.transfers || 0}
            sub={`${data.consumptions || 0} consommations`}
            icon={ArrowUpRight} color={C.green} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Adoption par Zone */}
          <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}
            data-testid="adoption-by-zone">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} style={{ color: G }} />
              <h2 className="text-sm font-bold" style={{ color: C.text }}>Adoption par Zone</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${G}15`, color: G }}>
                {zoneData.length} zones
              </span>
            </div>
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {zoneData.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: C.muted }}>
                  Donnees en cours de collecte...
                </p>
              ) : (
                zoneData.map(([zone, count]) => (
                  <ZoneBar key={zone} label={zone} count={count} max={maxZone}
                    color={zoneColors[zone] || G} />
                ))
              )}
            </div>
          </div>

          {/* Revenue par Pack */}
          <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}
            data-testid="revenue-by-pack">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} style={{ color: G }} />
              <h2 className="text-sm font-bold" style={{ color: C.text }}>Revenue par Pack</h2>
            </div>
            {packData.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: C.muted }}>
                Aucune vente enregistree
              </p>
            ) : (
              <div className="space-y-3">
                {packData.map(([pack, info]) => (
                  <div key={pack} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: '#0a0a0b', border: '1px solid #1e1e1e' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: C.text }}>{pack}</p>
                      <p className="text-[10px]" style={{ color: C.muted }}>{info.count} ventes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black" style={{ color: G }}>{info.eur?.toFixed(0)}€</p>
                      <p className="text-[10px]" style={{ color: C.muted }}>{info.kt} KT</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Revenue par Canal */}
        {channelData.length > 0 && (
          <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}
            data-testid="revenue-by-channel">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} style={{ color: G }} />
              <h2 className="text-sm font-bold" style={{ color: C.text }}>Revenue par Canal</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {channelData.map(([channel, info]) => (
                <div key={channel} className="rounded-lg p-3 text-center"
                  style={{ background: '#0a0a0b', border: '1px solid #1e1e1e' }}>
                  <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: C.muted }}>{channel}</p>
                  <p className="text-lg font-black mt-1" style={{ color: G }}>{info.tokens} KT</p>
                  <p className="text-[10px]" style={{ color: C.muted }}>{info.count} ops</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entite Legale */}
        <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}
          data-testid="legal-entity-info">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} style={{ color: G }} />
            <h2 className="text-sm font-bold" style={{ color: C.text }}>Entite Legale</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <Building2 size={14} style={{ color: C.muted }} />
              <div>
                <p className="text-xs font-bold" style={{ color: C.text }}>{data.legal_entity?.business_name}</p>
                <p className="text-[10px]" style={{ color: C.muted }}>Emetteur</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: C.muted }} />
              <div>
                <p className="text-xs font-bold" style={{ color: C.text }}>{data.legal_entity?.business_location}</p>
                <p className="text-[10px]" style={{ color: C.muted }}>Siege</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={14} style={{ color: G }} />
              <div>
                <p className="text-xs font-bold" style={{ color: G }}>Reportable CC2027</p>
                <p className="text-[10px]" style={{ color: C.muted }}>Validite etendue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}
          data-testid="recent-transactions">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: G }} />
            <h2 className="text-sm font-bold" style={{ color: C.text }}>Transactions Recentes</h2>
          </div>
          {(data.recent_transactions || []).length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: C.muted }}>Aucune transaction</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {(data.recent_transactions || []).map((tx, i) => (
                <div key={tx.tx_id || i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: '#0a0a0b' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: tx.amount > 0 ? `${C.green}20` : `${C.red}20` }}>
                      {tx.amount > 0 ? <ArrowUpRight size={12} style={{ color: C.green }} /> : <ArrowDownRight size={12} style={{ color: C.red }} />}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium" style={{ color: C.text }}>{tx.reason || tx.type}</p>
                      <p className="text-[9px]" style={{ color: C.muted }}>{tx.channel} — {tx.created_at?.slice(0, 16)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold tabular-nums"
                    style={{ color: tx.amount > 0 ? C.green : C.red }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} KT
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminFinanceDashboard;
