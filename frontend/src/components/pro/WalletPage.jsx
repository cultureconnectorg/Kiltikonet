import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WalletPage = ({ session, jetonsBalance = 0, onBalanceUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyingPack, setBuyingPack] = useState(null);

  // Handle Stripe payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    if (paymentStatus === 'success' && sessionId) {
      axios.get(`${API}/shop/checkout/status/${sessionId}`)
        .then(res => {
          if (res.data.payment_status === 'paid') {
            toast.success('Paiement reussi !', { description: `+${res.data.tokens} Jetons CC credites` });
            // Refresh wallet data
            axios.get(`${API}/my-wallet/me`, { withCredentials: true }).then(r => { if (r.data) setWalletData(r.data); });
            axios.get(`${API}/my-wallet/history`, { withCredentials: true }).then(r => { if (r.data?.history) setHistory(r.data.history); });
          }
        }).catch(() => {});
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      toast.info('Paiement annule');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Fetch wallet data
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const [meRes, histRes] = await Promise.all([
          axios.get(`${API}/my-wallet/me`, { withCredentials: true }).catch(() => ({ data: null })),
          axios.get(`${API}/my-wallet/history`, { withCredentials: true }).catch(() => ({ data: { history: [] } })),
        ]);
        if (meRes.data) setWalletData(meRes.data);
        if (histRes.data?.history) setHistory(histRes.data.history);
      } catch {} finally { setLoading(false); }
    };
    fetchWallet();
  }, []);

  // Fetch analytics when tab changes
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      axios.get(`${API}/my-wallet/analytics`, { withCredentials: true })
        .then(res => setAnalyticsData(res.data))
        .catch(() => {});
    }
  }, [activeTab, analyticsData]);

  const balance = walletData?.balance ?? jetonsBalance;
  const chartPoints = walletData?.chart_points || [balance || 0];
  const spentMonth = walletData?.spent_month || 0;
  const receivedMonth = walletData?.received_month || 0;
  const savedMonth = walletData?.saved_month || 0;

  // Sparkline chart
  const maxVal = Math.max(...chartPoints, 1);
  const chartWidth = 280;
  const chartHeight = 80;
  const points = chartPoints.map((v, i) => ({
    x: (i / Math.max(chartPoints.length - 1, 1)) * chartWidth,
    y: chartHeight - (v / maxVal) * (chartHeight - 10),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const lastTwo = chartPoints.slice(-2);
  const pctChange = lastTwo.length >= 2 && lastTwo[0] > 0
    ? ((lastTwo[1] - lastTwo[0]) / lastTwo[0] * 100).toFixed(1)
    : '0.0';

  const handleBuyPack = async (packId) => {
    setBuyingPack(packId);
    try {
      // Route through Stripe Checkout via fintech endpoint
      const res = await axios.post(`${API}/shop/checkout/create`, {
        package_id: `kt-${packId}`,
        user_id: session?.id || session?.email,
        channel: 'wallet',
        frek_id: session?.frek_id,
        origin_url: window.location.origin,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
        return;
      }
    } catch {
      // Fallback: direct wallet credit (demo/testing)
    }
    try {
      const res = await axios.post(`${API}/my-wallet/buy-pack`, { pack_id: packId }, { withCredentials: true });
      if (res.data.success) {
        toast.success(`${res.data.pack.label} achete !`, { description: `+${res.data.jetons_added} Jetons CC` });
        setWalletData(prev => prev ? { ...prev, balance: res.data.new_balance } : prev);
        const histRes = await axios.get(`${API}/my-wallet/history`, { withCredentials: true });
        if (histRes.data?.history) setHistory(histRes.data.history);
        if (onBalanceUpdate) onBalanceUpdate(res.data.new_balance);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur d\'achat');
    } finally { setBuyingPack(null); }
  };

  return (
    <div className="max-w-lg mx-auto pb-16" data-testid="wallet-page">
      {/* HERO CARD */}
      <div className="mx-4 mt-2 rounded-2xl overflow-hidden relative" data-testid="wallet-hero-card"
        style={{ background: 'linear-gradient(135deg, #1a1a1b, #0e0e0f)', border: '1px solid rgba(75,70,59,0.15)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: 'rgba(232,213,160,0.06)', filter: 'blur(60px)' }} />

        <div className="relative p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8D5A0, #c8a84b)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#3a2f09', fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#E8D5A0' }}>Jetons CC</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: `rgba(${pctChange > 0 ? '74,222,128' : '248,113,113'},0.1)` }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12, color: pctChange > 0 ? '#4ade80' : '#f87171' }}>
                {pctChange > 0 ? 'trending_up' : 'trending_down'}
              </span>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, color: pctChange > 0 ? '#4ade80' : '#f87171' }}>
                {pctChange > 0 ? '+' : ''}{pctChange}%
              </span>
            </div>
          </div>

          <div className="mb-1">
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#72727a' }}>Solde disponible</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 48, fontWeight: 800, color: '#e5e2e3', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {loading ? '...' : balance}
            </span>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 700, color: '#E8D5A0' }}>CC</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a' }}>{'\u2248'} {(balance * 1.5).toFixed(2)}{'\u20AC'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#555' }}>info</span>
          </div>

          <div className="mt-4 -mx-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height: 60 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8D5A0" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#E8D5A0" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#chartGrad)" />
              <path d={pathD} fill="none" stroke="#E8D5A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {points.length > 0 && <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#E8D5A0" />}
              {points.length > 0 && <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="8" fill="rgba(232,213,160,0.2)" />}
            </svg>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex border-t" style={{ borderColor: 'rgba(75,70,59,0.1)' }}>
          {[
            { icon: 'add', label: 'Recharger', primary: true, action: () => setActiveTab('packs') },
            { icon: 'send', label: 'Envoyer' },
            { icon: 'swap_horiz', label: 'Echanger' },
            { icon: 'candlestick_chart', label: 'Trading' },
          ].map((action, i) => (
            <button key={action.label} onClick={action.action}
              className="flex-1 flex flex-col items-center gap-1 py-3 hover:bg-white/[0.02] transition-colors active:scale-95"
              style={{ borderRight: i < 3 ? '1px solid rgba(75,70,59,0.1)' : 'none' }}
              data-testid={`wallet-action-${action.label.toLowerCase()}`}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: action.primary ? 'rgba(232,213,160,0.15)' : 'rgba(255,255,255,0.04)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: action.primary ? '#E8D5A0' : '#72727a' }}>{action.icon}</span>
              </div>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, color: action.primary ? '#E8D5A0' : '#72727a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 px-4 mt-4" data-testid="wallet-tabs">
        {[
          { id: 'overview', label: 'Apercu', icon: 'dashboard' },
          { id: 'history', label: 'Historique', icon: 'receipt_long' },
          { id: 'packs', label: 'Recharger', icon: 'add_card' },
          { id: 'analytics', label: 'Analyse', icon: 'analytics' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg flex-1 justify-center transition-all active:scale-95"
            style={{
              background: activeTab === tab.id ? 'rgba(232,213,160,0.1)' : 'transparent',
              color: activeTab === tab.id ? '#E8D5A0' : '#555',
              border: `1px solid ${activeTab === tab.id ? 'rgba(232,213,160,0.2)' : 'transparent'}`,
            }}
            data-testid={`wallet-tab-${tab.id}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{tab.icon}</span>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="px-4 mt-3 space-y-3 fade-slide-in">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Depense ce mois', value: `${spentMonth} CC`, icon: 'trending_down', color: '#f87171' },
              { label: 'Recu ce mois', value: `${receivedMonth} CC`, icon: 'trending_up', color: '#4ade80' },
              { label: 'Economise', value: `${savedMonth} CC`, icon: 'savings', color: '#E8D5A0' },
              { label: 'Valeur EUR', value: `${(balance * 1.5).toFixed(0)}\u20AC`, icon: 'euro', color: '#818cf8' },
            ].map(stat => (
              <div key={stat.label} className="p-3 rounded-xl" style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.08)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: stat.color }}>{stat.icon}</span>
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, color: '#72727a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</span>
                </div>
                <span className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 800, color: '#e5e2e3' }}>{stat.value}</span>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(232,213,160,0.04)', border: '1px solid rgba(232,213,160,0.08)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#E8D5A0' }}>verified</span>
            <div>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, color: '#E8D5A0' }}>1 Jeton CC = 1,50{'\u20AC'}</p>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>Valeur stable garantie. Utilisable sur toute la plateforme.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="px-4 mt-3 fade-slide-in" data-testid="wallet-history">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#333' }}>receipt_long</span>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#555', marginTop: 8 }}>Aucune transaction pour le moment</p>
              <button onClick={() => setActiveTab('packs')} className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(232,213,160,0.1)', color: '#E8D5A0', border: '1px solid rgba(232,213,160,0.2)' }}>
                Recharger mon wallet
              </button>
            </div>
          ) : (
            history.map((tx, i) => (
              <div key={tx.id} className="flex items-center gap-3 py-3" style={{ borderBottom: i < history.length - 1 ? '1px solid rgba(75,70,59,0.06)' : 'none' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: tx.type === 'credit' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: tx.type === 'credit' ? '#4ade80' : '#f87171' }}>{tx.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: '#e5e2e3' }}>{tx.label}</p>
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#555' }}>{new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className="tabular-nums" style={{
                  fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700,
                  color: tx.type === 'credit' ? '#4ade80' : '#f87171',
                }}>
                  {tx.type === 'credit' ? '+' : ''}{tx.amount} CC
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'packs' && (
        <div className="px-4 mt-3 space-y-3 fade-slide-in" data-testid="wallet-packs">
          <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#72727a' }}>Choisissez un pack</p>
          {Object.entries(walletData?.packs || {
            decouverte: { label: 'Pack Decouverte', price_eur: 10, jetons: 6 },
            culture: { label: 'Pack Culture', price_eur: 25, jetons: 16 },
            diaspora: { label: 'Pack Diaspora', price_eur: 50, jetons: 33 },
            vip: { label: 'Pack VIP', price_eur: 100, jetons: 66 },
          }).map(([id, pack]) => (
            <button key={id} onClick={() => handleBuyPack(id)} disabled={!!buyingPack}
              className="w-full p-4 rounded-xl flex items-center gap-4 hover:bg-white/[0.02] transition-all active:scale-[0.98]"
              style={{ background: '#131314', border: `1px solid ${id === 'vip' ? 'rgba(232,213,160,0.2)' : 'rgba(75,70,59,0.08)'}` }}
              data-testid={`pack-${id}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: id === 'vip' ? 'linear-gradient(135deg, rgba(232,213,160,0.2), rgba(232,213,160,0.05))' : 'rgba(255,255,255,0.04)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: id === 'vip' ? '#E8D5A0' : '#72727a', fontVariationSettings: "'FILL' 1" }}>
                  {id === 'decouverte' ? 'explore' : id === 'culture' ? 'palette' : id === 'diaspora' ? 'public' : 'diamond'}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, color: '#e5e2e3' }}>{pack.label}</p>
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, color: '#72727a' }}>{pack.jetons} Jetons CC</p>
              </div>
              <div className="text-right">
                <p className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 800, color: '#E8D5A0' }}>{pack.price_eur}{'\u20AC'}</p>
                {buyingPack === id && <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin inline-block mt-1" style={{ borderColor: '#E8D5A0' }} />}
              </div>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="px-4 mt-3 space-y-3 fade-slide-in" data-testid="wallet-analytics">
          <div className="p-4 rounded-xl" style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.08)' }}>
            <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#72727a', marginBottom: 12 }}>Repartition des depenses</h3>
            {(analyticsData?.categories || []).length > 0 ? (
              analyticsData.categories.map(cat => (
                <div key={cat.label} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, color: '#e5e2e3' }}>{cat.label}</span>
                    <span className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, color: cat.color }}>{cat.pct}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${cat.pct}%`, background: cat.color }} />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#555' }}>Pas encore de donnees de depenses</p>
            )}
          </div>

          <button className="w-full p-4 rounded-xl flex items-center gap-3 hover:bg-white/[0.02] transition-all active:scale-[0.98]"
            style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.08)' }}
            data-testid="trading-route-btn">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,213,160,0.1)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#E8D5A0' }}>candlestick_chart</span>
            </div>
            <div className="flex-1 text-left">
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Trading CC</p>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>Echangez et tradez vos Jetons CC</p>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#555' }}>chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
