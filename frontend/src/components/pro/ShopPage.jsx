import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Ticket, Zap, Music, Palette, UtensilsCrossed, Shirt, BookOpen, GraduationCap, Search, Sparkles, X, Shield, ArrowRight, Star, Gift, Crown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: ShoppingBag },
  { id: 'jetons', label: 'Kilti-Tokens', icon: Zap },
  { id: 'billetterie', label: 'Billetterie', icon: Ticket },
  { id: 'musique', label: 'Musique', icon: Music },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'gastronomie', label: 'Gastronomie', icon: UtensilsCrossed },
  { id: 'mode', label: 'Mode', icon: Shirt },
  { id: 'litterature', label: 'Litterature', icon: BookOpen },
  { id: 'formation', label: 'Formation', icon: GraduationCap },
];

const getCategoryIcon = (cat) => {
  const found = CATEGORIES.find(c => c.id === cat);
  return found ? found.icon : ShoppingBag;
};

const PACK_TIERS = {
  'kt-decouverte': { tier: 'bronze', icon: Gift, gradient: 'linear-gradient(135deg, #CD7F32, #8B4513)' },
  'kt-culture': { tier: 'silver', icon: Star, gradient: 'linear-gradient(135deg, #C0C0C0, #808080)' },
  'kt-diaspora': { tier: 'gold', icon: Shield, gradient: `linear-gradient(135deg, ${G}, #C8A84B)` },
  'kt-vip': { tier: 'platinum', icon: Crown, gradient: 'linear-gradient(135deg, #E5E4E2, #B4B4B4)' },
  'kt-partenaire': { tier: 'diamond', icon: Sparkles, gradient: `linear-gradient(135deg, #B9F2FF, ${G})` },
};

const CelebrationOverlay = ({ tokens, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative text-center kn-celebration-pop" data-testid="celebration-overlay">
        <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center kn-glow-pulse"
          style={{ background: `radial-gradient(circle, ${G}30, ${G}08)`, border: `2px solid ${G}40` }}>
          <Sparkles size={40} style={{ color: G }} />
        </div>
        <h2 className="text-3xl font-black mb-2" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
          +{tokens} Kilti-Tokens
        </h2>
        <p className="text-sm" style={{ color: '#72727a' }}>
          Merci de soutenir la culture du Sud Global !
        </p>
        <p className="text-xs mt-2 px-4 py-1.5 rounded-full inline-block" style={{ background: 'rgba(232,213,160,0.1)', color: G, border: `1px solid ${G}30` }}>
          Reportables sur CC2027
        </p>
        <div className="mt-4 flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="kn-sparkle-float" style={{ animationDelay: `${i * 200}ms` }}>
              <Zap size={12} style={{ color: G }} />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes celebrationPop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 30px ${G}20; } 50% { box-shadow: 0 0 60px ${G}40, 0 0 120px ${G}15; } }
        @keyframes sparkleFloat { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-40px) scale(0); opacity: 0; } }
        .kn-celebration-pop { animation: celebrationPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .kn-glow-pulse { animation: glowPulse 1.5s ease-in-out infinite; }
        .kn-sparkle-float { animation: sparkleFloat 1.5s ease-out infinite; }
      `}</style>
    </div>
  );
};

const ShopPage = ({ session, jetonsBalance = 0 }) => {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [celebration, setCelebration] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');
    if (payment === 'success' && sessionId) {
      const checkStatus = async () => {
        try {
          const res = await axios.get(`${API}/shop/checkout/status/${sessionId}`);
          if (res.data.payment_status === 'paid') {
            setCelebration(res.data.tokens || 15);
            toast.success('Paiement recu ! Kilti-Tokens credites.');
          }
        } catch (e) { console.warn('[Shop] Payment status check:', e.message); }
      };
      checkStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'all' && category !== 'jetons') params.category = category;
      if (category === 'jetons') params.category = 'jetons';
      if (search) params.search = search;
      const [prodRes, pkgRes] = await Promise.all([
        axios.get(`${API}/shop/products`, { params }),
        axios.get(`${API}/shop/packages`),
      ]);
      setProducts(prodRes.data.products || []);
      setPackages(pkgRes.data.packages || []);
    } catch {
      setProducts([]);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleBuy = async (product) => {
    setPurchasing(product.id);
    try {
      const res = await axios.post(`${API}/shop/checkout/create`, {
        package_id: product.id,
        user_id: session?.id,
        origin_url: window.location.origin,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error('Erreur de paiement', { description: err.response?.data?.detail || 'Reessayez' });
    } finally {
      setPurchasing(null);
    }
  };

  const showPacks = category === 'all' || category === 'jetons';
  const nonTokenProducts = products.filter(p => p.category !== 'jetons');

  return (
    <div className="max-w-4xl mx-auto space-y-5" data-testid="shop-page">
      {celebration && <CelebrationOverlay tokens={celebration} onClose={() => setCelebration(null)} />}

      {/* Header */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(232,213,160,0.06), transparent 60%)' }} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ background: 'linear-gradient(135deg, #FFFFFF, #E8D5A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Marketplace
                </span>
              </h1>
              <p className="text-xs mt-1" style={{ color: '#72727a' }}>Monnaie Forte KT — Plus vous investissez, plus vous gagnez</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(232,213,160,0.1)', border: '1px solid rgba(232,213,160,0.25)' }}>
              <Zap size={14} style={{ color: G }} />
              <span className="text-sm font-black tabular-nums" style={{ color: G }}>{jetonsBalance}</span>
              <span className="text-[10px] font-bold" style={{ color: G }}>KT</span>
            </div>
          </div>

          {/* Promesse 2027 Banner */}
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(232,213,160,0.06)', border: '1px solid rgba(232,213,160,0.15)' }}
            data-testid="promesse-2027-banner">
            <Shield size={14} style={{ color: G }} />
            <span className="text-[11px] font-semibold" style={{ color: G }}>
              Jetons KT valables CC2026, reportables sur CC2027
            </span>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#555' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
              style={{ background: '#0a0a0b', border: '1px solid #1e1e1e', color: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
              data-testid="shop-search" />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" data-testid="shop-categories">
        {CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          const isActive = category === cat.id;
          return (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: isActive ? G : 'rgba(255,255,255,0.04)',
                color: isActive ? '#0a0a0b' : '#72727a',
                border: `1px solid ${isActive ? G : '#1e1e1e'}`,
              }}
              data-testid={`shop-cat-${cat.id}`}>
              <CatIcon size={14} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* KT Packs — Monnaie Forte */}
      {showPacks && packages.length > 0 && (
        <div className="space-y-3" data-testid="kt-packs-section">
          <div className="flex items-center gap-2 px-1">
            <Zap size={16} style={{ color: G }} />
            <span className="text-sm font-bold" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
              Packs Kilti-Tokens — Monnaie Forte
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {packages.map(pkg => {
              const tier = PACK_TIERS[pkg.id] || PACK_TIERS['kt-decouverte'];
              const TierIcon = tier.icon;
              const isBuying = purchasing === pkg.id;
              return (
                <div key={pkg.id}
                  className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
                  style={{ background: '#141414', border: '1px solid #1e1e1e' }}
                  data-testid={`pack-${pkg.id}`}>
                  <div className="relative h-28 flex items-center justify-center"
                    style={{ background: tier.gradient, opacity: 0.9 }}>
                    <TierIcon size={36} style={{ color: '#fff', opacity: 0.3 }} />
                    <div className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                      {pkg.badge}
                    </div>
                    <div className="absolute bottom-3 right-3 text-right">
                      <div className="text-2xl font-black" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                        {pkg.tokens} <span className="text-sm">KT</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                      {pkg.name}
                    </h3>
                    <p className="text-[11px] mt-1 font-medium" style={{ color: G }}>
                      {pkg.marketing_label}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-lg font-black" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                          {pkg.price?.toFixed(0)}€
                        </span>
                        {pkg.bonus_pct > 0 && (
                          <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(232,213,160,0.15)', color: G }}>
                            +{pkg.bonus_pct}%
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleBuy(pkg)} disabled={isBuying}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
                        style={{ background: G, color: '#0a0a0b' }}
                        data-testid={`buy-${pkg.id}`}>
                        {isBuying ? 'Chargement...' : 'Acheter'}
                        {!isBuying && <ArrowRight size={12} />}
                      </button>
                    </div>
                    <p className="text-[9px] mt-2 flex items-center gap-1" style={{ color: '#555' }}>
                      <Shield size={9} /> Reportable CC2027 — {pkg.legal_entity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products grid (non-token) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {['skeleton-1','skeleton-2','skeleton-3'].map(id => (
            <div key={id} className="rounded-2xl h-64 animate-pulse" style={{ background: '#141414' }} />
          ))}
        </div>
      ) : (category !== 'jetons' && nonTokenProducts.length === 0 && !showPacks) ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
          <ShoppingBag size={40} className="mx-auto mb-3" style={{ color: '#333' }} />
          <p className="text-sm" style={{ color: '#72727a' }}>Aucun produit dans cette categorie</p>
        </div>
      ) : category !== 'jetons' && nonTokenProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nonTokenProducts.map(product => {
            const CatIcon = getCategoryIcon(product.category);
            const isBuying = purchasing === product.id;
            return (
              <div key={product.id}
                className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
                style={{ background: '#141414', border: '1px solid #1e1e1e' }}
                data-testid={`product-${product.id}`}>
                <div className="relative h-36 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), #0a0a0b)' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <CatIcon size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ color: '#222', opacity: 0.15 }} />
                  )}
                  {product.badge && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {product.badge}
                    </span>
                  )}
                  {product.stock > 0 && product.stock < 50 && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(232,90,79,0.15)', color: '#E85A4F' }}>
                      {product.stock} restants
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold truncate" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                    {product.name}
                  </h3>
                  <p className="text-[11px] mt-1 line-clamp-2" style={{ color: '#72727a', lineHeight: 1.4 }}>
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-base font-black" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                      {product.price?.toFixed(2)} {product.currency || 'EUR'}
                    </span>
                    <button onClick={() => handleBuy(product)} disabled={isBuying}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid #1e1e1e' }}
                      data-testid={`buy-${product.id}`}>
                      {isBuying ? 'Chargement...' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ShopPage;
