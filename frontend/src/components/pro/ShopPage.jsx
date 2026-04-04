import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

const MATERIAL_ICONS = {
  all: 'storefront', jetons: 'bolt', billetterie: 'confirmation_number',
  musique: 'music_note', art: 'palette', gastronomie: 'restaurant',
  mode: 'checkroom', litterature: 'menu_book', formation: 'school',
};

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: 'storefront' },
  { id: 'jetons', label: 'Kilti-Tokens', icon: 'bolt' },
  { id: 'billetterie', label: 'Billetterie', icon: 'confirmation_number' },
  { id: 'musique', label: 'Musique', icon: 'music_note' },
  { id: 'art', label: 'Art', icon: 'palette' },
  { id: 'gastronomie', label: 'Gastronomie', icon: 'restaurant' },
  { id: 'mode', label: 'Mode', icon: 'checkroom' },
  { id: 'litterature', label: 'Littérature', icon: 'menu_book' },
  { id: 'formation', label: 'Formation', icon: 'school' },
];

const PACK_TIERS = {
  'kt-decouverte': { tier: 'bronze', icon: 'redeem', gradient: 'linear-gradient(135deg, #CD7F32, #8B4513)' },
  'kt-culture': { tier: 'silver', icon: 'star', gradient: 'linear-gradient(135deg, #C0C0C0, #808080)' },
  'kt-diaspora': { tier: 'gold', icon: 'verified_user', gradient: `linear-gradient(135deg, ${G}, #C8A84B)` },
  'kt-vip': { tier: 'platinum', icon: 'diamond', gradient: 'linear-gradient(135deg, #E5E4E2, #B4B4B4)' },
  'kt-partenaire': { tier: 'diamond', icon: 'auto_awesome', gradient: `linear-gradient(135deg, #B9F2FF, ${G})` },
};

const CelebrationOverlay = ({ tokens, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative text-center" style={{ animation: 'celebPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' }} data-testid="celebration-overlay">
        <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: `radial-gradient(circle, ${G}30, ${G}08)`, border: `2px solid ${G}40`, animation: 'glowPulse 1.5s ease-in-out infinite' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: G, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </div>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          +{tokens} Kilti-Tokens
        </h2>
        <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#72727a' }}>
          Merci de soutenir la culture du Sud Global !
        </p>
        <p className="mt-2 px-4 py-1.5 rounded-full inline-block" style={{ background: 'rgba(232,213,160,0.1)', color: G, border: `1px solid ${G}30`, fontFamily: "'Manrope', sans-serif", fontSize: 11 }}>
          Reportables sur CC2027
        </p>
      </div>
      <style>{`
        @keyframes celebPop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 30px ${G}20; } 50% { box-shadow: 0 0 60px ${G}40; } }
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
            toast.success('Paiement reçu ! Kilti-Tokens crédités.');
          }
        } catch { /* silent */ }
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
      toast.error('Erreur de paiement', { description: err.response?.data?.detail || 'Réessayez' });
    } finally {
      setPurchasing(null);
    }
  };

  const showPacks = category === 'all' || category === 'jetons';
  const nonTokenProducts = products.filter(p => p.category !== 'jetons');

  return (
    <div className="max-w-4xl mx-auto space-y-4" data-testid="shop-page">
      {celebration && <CelebrationOverlay tokens={celebration} onClose={() => setCelebration(null)} />}

      {/* Header — Stitch Sovereign */}
      <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: '#0e0e0f', border: '1px solid rgba(75,70,59,0.1)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(232,213,160,0.04), transparent 60%)' }} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 400, letterSpacing: '-0.03em', color: '#e5e2e3' }}>
                Market<span style={{ color: G }}>place</span>
              </h1>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a', marginTop: 4 }}>Monnaie Forte KT — Plus vous investissez, plus vous gagnez</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(232,213,160,0.1)', border: '1px solid rgba(232,213,160,0.25)' }}>
              <span className="material-symbols-outlined" style={{ color: G, fontSize: 14, fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <span className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 800, color: G }}>{jetonsBalance}</span>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, color: G }}>KT</span>
            </div>
          </div>

          {/* Promesse 2027 */}
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(232,213,160,0.04)', border: '1px solid rgba(232,213,160,0.1)' }}
            data-testid="promesse-2027-banner">
            <span className="material-symbols-outlined" style={{ color: G, fontSize: 14 }}>verified_user</span>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, color: G }}>
              Jetons KT valables CC2026, reportables sur CC2027
            </span>
          </div>

          <div className="relative mt-3">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#555', fontSize: 18 }}>search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg"
              style={{ background: '#131314', border: 'none', color: '#e5e2e3', outline: 'none', fontFamily: "'Manrope', sans-serif", fontSize: 13 }}
              data-testid="shop-search" />
          </div>
        </div>
      </div>

      {/* Categories — Stitch pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" data-testid="shop-categories">
        {CATEGORIES.map(cat => {
          const isActive = category === cat.id;
          return (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
              style={{
                background: isActive ? G : 'rgba(255,255,255,0.04)',
                color: isActive ? '#0a0a0b' : '#72727a',
                border: `1px solid ${isActive ? G : 'rgba(75,70,59,0.15)'}`,
                fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700,
              }}
              data-testid={`shop-cat-${cat.id}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* KT Packs */}
      {showPacks && packages.length > 0 && (
        <div className="space-y-3" data-testid="kt-packs-section">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined" style={{ color: G, fontSize: 16, fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>
              Packs Kilti-Tokens — Monnaie Forte
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {packages.map(pkg => {
              const tier = PACK_TIERS[pkg.id] || PACK_TIERS['kt-decouverte'];
              const isBuying = purchasing === pkg.id;
              return (
                <div key={pkg.id}
                  className="group rounded-xl overflow-hidden transition-all hover:scale-[1.01]"
                  style={{ background: '#1c1b1c', border: '1px solid rgba(75,70,59,0.1)' }}
                  data-testid={`pack-${pkg.id}`}>
                  <div className="relative h-28 flex items-center justify-center"
                    style={{ background: tier.gradient, opacity: 0.9 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#fff', opacity: 0.3, fontVariationSettings: "'FILL' 1" }}>{tier.icon}</span>
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, backdropFilter: 'blur(8px)' }}>
                      {pkg.badge}
                    </div>
                    <div className="absolute bottom-3 right-3 text-right">
                      <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 24, fontWeight: 800, color: '#fff' }}>
                        {pkg.tokens} <span style={{ fontSize: 12 }}>KT</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, color: '#e5e2e3' }}>
                      {pkg.name}
                    </h3>
                    <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 500, color: G, marginTop: 4 }}>
                      {pkg.marketing_label}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 800, color: '#e5e2e3' }}>
                          {pkg.price?.toFixed(0)}€
                        </span>
                        {pkg.bonus_pct > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(232,213,160,0.15)', color: G, fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700 }}>
                            +{pkg.bonus_pct}%
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleBuy(pkg)} disabled={isBuying}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                        style={{ background: G, color: '#0a0a0b', fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700 }}
                        data-testid={`buy-${pkg.id}`}>
                        {isBuying ? 'Chargement...' : 'Acheter'}
                        {!isBuying && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>}
                      </button>
                    </div>
                    <p className="flex items-center gap-1 mt-2" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, color: '#555' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 9 }}>verified_user</span> Reportable CC2027 — {pkg.legal_entity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {['s1','s2','s3'].map(id => (
            <div key={id} className="rounded-xl h-64 kn-skeleton-shimmer" />
          ))}
        </div>
      ) : (category !== 'jetons' && nonTokenProducts.length === 0 && !showPacks) ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#1c1b1c', border: '1px solid rgba(75,70,59,0.1)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#2a2a2b' }}>storefront</span>
          <p className="mt-3" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#72727a' }}>Aucun produit dans cette catégorie</p>
        </div>
      ) : category !== 'jetons' && nonTokenProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nonTokenProducts.map(product => {
            const catIcon = MATERIAL_ICONS[product.category] || 'storefront';
            const isBuying = purchasing === product.id;
            return (
              <div key={product.id}
                className="group rounded-xl overflow-hidden transition-all hover:scale-[1.01]"
                style={{ background: '#1c1b1c', border: '1px solid rgba(75,70,59,0.1)' }}
                data-testid={`product-${product.id}`}>
                <div className="relative h-36 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), #0a0a0b)' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ fontSize: 40, color: '#222', opacity: 0.15, fontVariationSettings: "'FILL' 1" }}>{catIcon}</span>
                  )}
                  {product.badge && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700 }}>
                      {product.badge}
                    </span>
                  )}
                  {product.stock > 0 && product.stock < 50 && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(232,90,79,0.15)', color: '#E85A4F', fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700 }}>
                      {product.stock} restants
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, color: '#e5e2e3' }}>
                    {product.name}
                  </h3>
                  <p className="line-clamp-2 mt-1" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, color: '#72727a', lineHeight: 1.4 }}>
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 800, color: '#e5e2e3' }}>
                      {product.price?.toFixed(2)} {product.currency || 'EUR'}
                    </span>
                    <button onClick={() => handleBuy(product)} disabled={isBuying}
                      className="px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#e5e2e3', border: '1px solid rgba(75,70,59,0.15)', fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700 }}
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
    </div>
  );
};

export default ShopPage;
