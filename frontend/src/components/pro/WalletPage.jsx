import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MOCK_HISTORY = [
  { id: 't1', type: 'credit', label: 'Pack Culture — Achat', amount: 50, date: '2026-04-03T14:30:00Z', icon: 'add_circle' },
  { id: 't2', type: 'debit', label: 'Billet CC2026 — VIP', amount: -15, date: '2026-04-02T09:15:00Z', icon: 'confirmation_number' },
  { id: 't3', type: 'credit', label: "Récompense — Profil complété", amount: 15, date: '2026-04-01T18:00:00Z', icon: 'emoji_events' },
  { id: 't4', type: 'debit', label: 'Don — Artiste @melina.bk', amount: -5, date: '2026-03-30T11:20:00Z', icon: 'volunteer_activism' },
  { id: 't5', type: 'credit', label: 'Pack Découverte — Achat', amount: 15, date: '2026-03-28T16:45:00Z', icon: 'add_circle' },
  { id: 't6', type: 'credit', label: 'Parrainage accepté', amount: 10, date: '2026-03-25T08:30:00Z', icon: 'group_add' },
  { id: 't7', type: 'debit', label: 'Album numérique — Achat', amount: -8, date: '2026-03-22T20:10:00Z', icon: 'music_note' },
];

const CHART_POINTS = [20, 25, 22, 35, 42, 38, 45, 50, 48, 55, 62, 65];

const WalletPage = ({ session, jetonsBalance = 0 }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [history] = useState(MOCK_HISTORY);

  // Mini sparkline chart
  const maxVal = Math.max(...CHART_POINTS);
  const chartWidth = 280;
  const chartHeight = 80;
  const points = CHART_POINTS.map((v, i) => ({
    x: (i / (CHART_POINTS.length - 1)) * chartWidth,
    y: chartHeight - (v / maxVal) * (chartHeight - 10),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const pctChange = ((CHART_POINTS[CHART_POINTS.length - 1] - CHART_POINTS[CHART_POINTS.length - 2]) / CHART_POINTS[CHART_POINTS.length - 2] * 100).toFixed(1);

  return (
    <div className="max-w-lg mx-auto pb-16" data-testid="wallet-page">
      {/* ─── HERO CARD — Revolut-style gradient ─── */}
      <div className="mx-4 mt-2 rounded-2xl overflow-hidden relative" data-testid="wallet-hero-card"
        style={{ background: 'linear-gradient(135deg, #1a1a1b, #0e0e0f)', border: '1px solid rgba(75,70,59,0.15)' }}>
        {/* Ambient glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: 'rgba(232,213,160,0.06)', filter: 'blur(60px)' }} />

        <div className="relative p-6 pb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8D5A0, #c8a84b)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#3a2f09', fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#E8D5A0' }}>Kilti-Tokens</span>
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

          {/* Balance */}
          <div className="mb-1">
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#72727a' }}>Solde disponible</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 48, fontWeight: 800, color: '#e5e2e3', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {jetonsBalance}
            </span>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 700, color: '#E8D5A0' }}>KT</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a' }}>≈ {(jetonsBalance * 1).toFixed(2)}€</span>
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#555' }}>info</span>
          </div>

          {/* Sparkline Chart */}
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
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#E8D5A0" />
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="8" fill="rgba(232,213,160,0.2)" />
            </svg>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex border-t" style={{ borderColor: 'rgba(75,70,59,0.1)' }}>
          {[
            { icon: 'add', label: 'Recharger', primary: true },
            { icon: 'send', label: 'Envoyer' },
            { icon: 'swap_horiz', label: 'Échanger' },
            { icon: 'candlestick_chart', label: 'Trading' },
          ].map((action, i) => (
            <button key={action.label}
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

      {/* ─── TABS ─── */}
      <div className="flex gap-1 px-4 mt-4" data-testid="wallet-tabs">
        {[
          { id: 'overview', label: 'Aperçu', icon: 'dashboard' },
          { id: 'history', label: 'Historique', icon: 'receipt_long' },
          { id: 'analytics', label: 'Analyse', icon: 'analytics' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg flex-1 justify-center transition-all active:scale-95"
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

      {/* ─── TAB CONTENT ─── */}
      {activeTab === 'overview' && (
        <div className="px-4 mt-3 space-y-3 fade-slide-in">
          {/* Stats Grid — Revolut style */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Dépensé ce mois', value: '23 KT', icon: 'trending_down', color: '#f87171' },
              { label: 'Reçu ce mois', value: '40 KT', icon: 'trending_up', color: '#4ade80' },
              { label: 'Économisé', value: '17 KT', icon: 'savings', color: '#E8D5A0' },
              { label: 'Reportable 2027', value: `${jetonsBalance} KT`, icon: 'event_repeat', color: '#818cf8' },
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

          {/* Promesse */}
          <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(232,213,160,0.04)', border: '1px solid rgba(232,213,160,0.08)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#E8D5A0' }}>verified</span>
            <div>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, color: '#E8D5A0' }}>Promesse de valeur</p>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>Vos KT sont reportables sur CC2027 et éditions suivantes</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="px-4 mt-3 fade-slide-in" data-testid="wallet-history">
          {history.map((tx, i) => (
            <div key={tx.id} className="flex items-center gap-3 py-3" style={{ borderBottom: i < history.length - 1 ? '1px solid rgba(75,70,59,0.06)' : 'none', animationDelay: `${i * 30}ms` }}>
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
                {tx.type === 'credit' ? '+' : ''}{tx.amount} KT
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="px-4 mt-3 space-y-3 fade-slide-in" data-testid="wallet-analytics">
          {/* Category Breakdown */}
          <div className="p-4 rounded-xl" style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.08)' }}>
            <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#72727a', marginBottom: 12 }}>Répartition des dépenses</h3>
            {[
              { label: 'Événements', pct: 45, color: '#E8D5A0' },
              { label: 'Musique', pct: 25, color: '#818cf8' },
              { label: 'Dons artistes', pct: 20, color: '#4ade80' },
              { label: 'Autres', pct: 10, color: '#72727a' },
            ].map(cat => (
              <div key={cat.label} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, color: '#e5e2e3' }}>{cat.label}</span>
                  <span className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, color: cat.color }}>{cat.pct}%</span>
                </div>
                <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${cat.pct}%`, background: cat.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Trading Route */}
          <button className="w-full p-4 rounded-xl flex items-center gap-3 hover:bg-white/[0.02] transition-all active:scale-[0.98]"
            style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.08)' }}
            data-testid="trading-route-btn">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,213,160,0.1)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#E8D5A0' }}>candlestick_chart</span>
            </div>
            <div className="flex-1 text-left">
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Trading KT</p>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>Échangez et tradez vos Kilti-Tokens</p>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#555' }}>chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
