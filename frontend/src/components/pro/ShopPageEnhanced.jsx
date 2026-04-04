// ═══════════════════════════════════════════════════════════
// ÉCRAN 10 — SOVEREIGN CORP SHOP AMÉLIORÉ
// Marketplace culturelle diasporique enrichie
// Sections: Packs KT, Marché Diaspora, Collections, Détails produit
// Design System: Sovereign Onyx · Material Symbols Only
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: 'storefront' },
  { id: 'jetons', label: 'Kilti-Tokens', icon: 'bolt' },
  { id: 'mode', label: 'Mode & Madras', icon: 'checkroom' },
  { id: 'art', label: 'Art Caribéen', icon: 'palette' },
  { id: 'musique', label: 'Musique', icon: 'music_note' },
  { id: 'gastronomie', label: 'Gastronomie', icon: 'restaurant' },
  { id: 'litterature', label: 'Littérature', icon: 'menu_book' },
  { id: 'billetterie', label: 'Billetterie', icon: 'confirmation_number' },
  { id: 'formation', label: 'Formation', icon: 'school' },
];

const PACK_TIERS = {
  'kt-decouverte': { tier: 'bronze', icon: 'redeem', gradient: 'linear-gradient(135deg, #CD7F32, #8B4513)' },
  'kt-culture': { tier: 'silver', icon: 'star', gradient: 'linear-gradient(135deg, #C0C0C0, #808080)' },
  'kt-diaspora': { tier: 'gold', icon: 'verified_user', gradient: `linear-gradient(135deg, ${G}, #C8A84B)` },
  'kt-vip': { tier: 'platinum', icon: 'diamond', gradient: 'linear-gradient(135deg, #E5E4E2, #B4B4B4)' },
  'kt-partenaire': { tier: 'diamond', icon: 'auto_awesome', gradient: `linear-gradient(135deg, #B9F2FF, ${G})` },
};

// ─── Produits culturels diasporiques curatés ─────────────
const DIASPORA_PRODUCTS = [
  { id: 'dp-1', name: 'Ensemble Madras Prestige', description: 'Tenue complète en tissu Madras authentique de Martinique. Coupe contemporaine par des artisans locaux.', price: 189, currency: 'EUR', category: 'mode', badge: 'Artisanal', origin: 'Martinique', artisan: 'Atelier Ti Madras', rating: 4.9, reviews: 47 },
  { id: 'dp-2', name: 'Peinture "Anse Noire" — Série Limitée', description: "Huile sur toile 60x80cm. Interprétation contemporaine de l'Anse Noire par un artiste caribéen reconnu.", price: 450, currency: 'EUR', category: 'art', badge: 'Série Limitée', origin: 'Guadeloupe', artisan: 'Galerie Négritude', rating: 5.0, reviews: 12 },
  { id: 'dp-3', name: 'Coffret Rhum Agricole AOC', description: "Sélection de 3 rhums d'exception : Blanc 50°, Ambré 3 ans, Vieux 8 ans. Distillerie familiale depuis 1892.", price: 95, currency: 'EUR', category: 'gastronomie', badge: 'AOC', origin: 'Martinique', artisan: 'Habitation Clément', rating: 4.8, reviews: 89 },
  { id: 'dp-4', name: 'Album Vinyl "Racines Gwoka"', description: 'Double vinnil 180g. Enregistrement live au Festival de Sainte-Anne. Masterisé à Abbey Road.', price: 35, currency: 'EUR', category: 'musique', badge: 'Vinyl 180g', origin: 'Guadeloupe', artisan: 'Label Karibéen', rating: 4.7, reviews: 34 },
  { id: 'dp-5', name: 'Bijou Graines Job — Collier Or', description: 'Collier en graines de Job et fermoir or 18 carats. Tradition caribéenne revisitée.', price: 220, currency: 'EUR', category: 'mode', badge: 'Or 18K', origin: 'Guyane', artisan: 'Maison Tukusipan', rating: 4.9, reviews: 28 },
  { id: 'dp-6', name: 'Café Bourbon Pointu — Grand Cru', description: "Le café le plus rare au monde. Récolte manuelle, micro-lot de 250g, torréfaction artisanale.", price: 68, currency: 'EUR', category: 'gastronomie', badge: 'Grand Cru', origin: 'La Réunion', artisan: 'Domaine du Café Grillé', rating: 5.0, reviews: 56 },
  { id: 'dp-7', name: '"Cahier d\'un Retour" — Édition Illustrée', description: "Réédition luxe du chef-d'œuvre de Césaire avec illustrations originales. Reliure cuir numérotée.", price: 75, currency: 'EUR', category: 'litterature', badge: 'Numéroté', origin: 'Martinique', artisan: 'Éditions Souveraines', rating: 4.8, reviews: 41 },
  { id: 'dp-8', name: 'Sculpture "Neg Mawon" Bronze', description: 'Bronze patiné 30cm. Reproduction de la statue emblématique. Certificat authenticité.', price: 320, currency: 'EUR', category: 'art', badge: 'Bronze', origin: 'Haïti', artisan: 'Fonderie Christophe', rating: 4.6, reviews: 19 },
  { id: 'dp-9', name: 'Panier Caraïbe Tressé Main', description: 'Panier artisanal en fibres de bakoua tressées. Teintures naturelles. Pièce unique.', price: 55, currency: 'EUR', category: 'mode', badge: 'Fait main', origin: 'Martinique', artisan: 'Vannerie Traditionnelle', rating: 4.7, reviews: 63 },
];

const COLLECTIONS = [
  { id: 'col-1', name: 'CC2026 Officiel', desc: '12 artistes sélectionnés', count: 12, color: G, icon: 'celebration' },
  { id: 'col-2', name: 'Patrimoine Immatériel', desc: 'Savoir-faire ancestraux', count: 8, color: '#C4714A', icon: 'history_edu' },
  { id: 'col-3', name: 'Saveurs Caribéennes', desc: 'Gastronomie & terroir', count: 6, color: '#2DD4BF', icon: 'local_dining' },
  { id: 'col-4', name: 'Musique Souveraine', desc: 'Vinyles & éditions rares', count: 9, color: '#8B5CF6', icon: 'album' },
];

const CelebrationOverlay = ({ tokens, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative text-center" style={{ animation: 'celebPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' }} data-testid="celebration-overlay">
        <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: `radial-gradient(circle, ${G}30, ${G}08)`, border: `2px solid ${G}40` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: G, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </div>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 800, color: '#fff' }}>+{tokens} Kilti-Tokens</h2>
        <p className="mt-2" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#72727a' }}>Merci de soutenir la culture du Sud Global !</p>
      </div>
      <style>{`@keyframes celebPop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
};

// ─── Product Detail Modal ───────────────────────────────
const ProductDetail = ({ product, onClose, onBuy }) => {
  if (!product) return null;
  const catIcons = { mode: 'checkroom', art: 'palette', musique: 'music_note', gastronomie: 'restaurant', litterature: 'menu_book' };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" data-testid="product-detail-modal">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.15)', maxHeight: '85vh', overflowY: 'auto' }}>
        {/* Hero image area */}
        <div className="relative h-52" style={{ background: 'linear-gradient(135deg, rgba(232,213,160,0.06), rgba(200,168,75,0.02))' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined" style={{ fontSize: 72, color: 'rgba(232,213,160,0.08)', fontVariationSettings: "'FILL' 1" }}>{catIcons[product.category] || 'storefront'}</span>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} data-testid="detail-close-btn">
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 18 }}>close</span>
          </button>
          {product.badge && (
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full" style={{ background: G, color: '#3a2f09', fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700 }}>{product.badge}</span>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Title & origin */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,213,160,0.08)', color: G, fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {product.origin}
              </span>
              {product.artisan && (
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>par {product.artisan}</span>
              )}
            </div>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 24, fontWeight: 400, color: '#e5e2e3' }}>{product.name}</h2>
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined" style={{ fontSize: 14, color: i < Math.floor(product.rating) ? G : '#2a2a2b', fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700, color: '#e5e2e3' }}>{product.rating}</span>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, color: '#72727a' }}>({product.reviews} avis)</span>
            </div>
          )}

          {/* Description */}
          <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#a0a0a5', lineHeight: 1.7 }}>{product.description}</p>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2">
            {['Livraison Caraïbes', 'Authenticité garantie', 'Support artisan'].map(badge => (
              <span key={badge} className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: '#1c1b1c', fontFamily: "'Manrope', sans-serif", fontSize: 9, color: '#72727a' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#4ADE80' }}>check_circle</span>
                {badge}
              </span>
            ))}
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(75,70,59,0.1)' }}>
            <div>
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 32, fontWeight: 400, color: '#e5e2e3' }}>{product.price}</span>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: '#72727a', marginLeft: 4 }}>{product.currency || 'EUR'}</span>
            </div>
            <button
              onClick={() => onBuy(product)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: G, color: '#3a2f09', fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700 }}
              data-testid="detail-buy-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shopping_bag</span>
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── COMPOSANT PRINCIPAL ────────────────────────────────
const ShopPageEnhanced = ({ session, jetonsBalance = 0 }) => {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [view, setView] = useState('grid');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' && params.get('session_id')) {
      const checkStatus = async () => {
        try {
          const res = await axios.get(`${API}/shop/checkout/status/${params.get('session_id')}`);
          if (res.data.payment_status === 'paid') { setCelebration(res.data.tokens || 15); toast.success('Paiement reçu ! Kilti-Tokens crédités.'); }
        } catch {}
      };
      checkStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/shop/packages`);
      setPackages(res.data.packages || []);
    } catch { setPackages([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadPackages(); }, [loadPackages]);

  const handleBuy = async (product) => {
    if (product.id?.startsWith('dp-')) {
      toast.success(`${product.name} ajouté au panier`, { description: `${product.price} ${product.currency}` });
      setSelectedProduct(null);
      return;
    }
    setPurchasing(product.id);
    try {
      const res = await axios.post(`${API}/shop/checkout/create`, { package_id: product.id, user_id: session?.id, origin_url: window.location.origin });
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) { toast.error('Erreur de paiement', { description: err.response?.data?.detail || 'Réessayez' }); }
    setPurchasing(null);
  };

  const filteredDiaspora = DIASPORA_PRODUCTS.filter(p => {
    if (category !== 'all' && category !== 'jetons' && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const showPacks = category === 'all' || category === 'jetons';
  const showDiaspora = category !== 'jetons';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16" data-testid="shop-page">
      {celebration && <CelebrationOverlay tokens={celebration} onClose={() => setCelebration(null)} />}
      {selectedProduct && <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} onBuy={handleBuy} />}

      {/* ─── HEADER ──────────────────────────────────────── */}
      <div className="rounded-xl p-6 relative overflow-hidden" style={{ background: '#0e0e0f', border: '1px solid rgba(75,70,59,0.1)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(232,213,160,0.04), transparent 60%)' }} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: G }}>Sovereign Corp</span>
              <h1 className="mt-1" style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 400, letterSpacing: '-0.03em', color: '#e5e2e3' }}>
                Market<span style={{ color: G }}>place</span>
              </h1>
              <p className="mt-1" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a' }}>Produits culturels de la diaspora — Artisans vérifiés</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(232,213,160,0.1)', border: '1px solid rgba(232,213,160,0.25)' }}>
                <span className="material-symbols-outlined" style={{ color: G, fontSize: 14, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <span className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 800, color: G }}>{jetonsBalance}</span>
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, color: G }}>KT</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#555', fontSize: 18 }}>search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit culturel..." className="w-full pl-10 pr-4 py-2.5 rounded-xl" style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.1)', color: '#e5e2e3', outline: 'none', fontFamily: "'Manrope', sans-serif", fontSize: 13 }} data-testid="shop-search" />
          </div>
        </div>
      </div>

      {/* ─── CATEGORIES ──────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" data-testid="shop-categories">
        {CATEGORIES.map(cat => {
          const isActive = category === cat.id;
          return (
            <button key={cat.id} onClick={() => setCategory(cat.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap flex-shrink-0 transition-all active:scale-95" style={{ background: isActive ? G : 'rgba(255,255,255,0.04)', color: isActive ? '#0a0a0b' : '#72727a', border: `1px solid ${isActive ? G : 'rgba(75,70,59,0.15)'}`, fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700 }} data-testid={`shop-cat-${cat.id}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ─── COLLECTIONS ─────────────────────────────────── */}
      {category === 'all' && !search && (
        <section data-testid="shop-collections">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 20, color: '#e5e2e3' }}>Collections</h2>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#72727a' }}>Voir tout</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLLECTIONS.map(col => (
              <button key={col.id} className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] group" style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.08)' }} data-testid={`collection-${col.id}`}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${col.color}12`, border: `1px solid ${col.color}20` }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: col.color, fontVariationSettings: "'FILL' 1" }}>{col.icon}</span>
                </div>
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>{col.name}</p>
                <p className="mt-0.5" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>{col.desc}</p>
                <p className="mt-2" style={{ fontFamily: "'Newsreader', serif", fontSize: 14, color: col.color }}>{col.count} produits</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─── KT PACKS ────────────────────────────────────── */}
      {showPacks && packages.length > 0 && (
        <section data-testid="kt-packs-section">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined" style={{ color: G, fontSize: 16, fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 20, color: '#e5e2e3' }}>Packs Kilti-Tokens</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {packages.map(pkg => {
              const tier = PACK_TIERS[pkg.id] || PACK_TIERS['kt-decouverte'];
              const isBuying = purchasing === pkg.id;
              return (
                <div key={pkg.id} className="group rounded-xl overflow-hidden transition-all hover:scale-[1.01]" style={{ background: '#1c1b1c', border: '1px solid rgba(75,70,59,0.1)' }} data-testid={`pack-${pkg.id}`}>
                  <div className="relative h-24 flex items-center justify-center" style={{ background: tier.gradient }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#fff', opacity: 0.3, fontVariationSettings: "'FILL' 1" }}>{tier.icon}</span>
                    <div className="absolute bottom-2 right-3">
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 800, color: '#fff' }}>{pkg.tokens} <span style={{ fontSize: 11 }}>KT</span></span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>{pkg.name}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 800, color: '#e5e2e3' }}>{pkg.price?.toFixed(0)}€</span>
                      <button onClick={() => handleBuy(pkg)} disabled={isBuying} className="px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50" style={{ background: G, color: '#0a0a0b', fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700 }} data-testid={`buy-${pkg.id}`}>
                        {isBuying ? '...' : 'Acheter'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── MARCHÉ DIASPORA ─────────────────────────────── */}
      {showDiaspora && (
        <section data-testid="diaspora-market">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: '#C4714A', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>public</span>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 20, color: '#e5e2e3' }}>Marché Diasporique</h2>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setView('grid')} className="p-1.5 rounded-lg" style={{ background: view === 'grid' ? 'rgba(232,213,160,0.08)' : 'transparent' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: view === 'grid' ? G : '#555' }}>grid_view</span>
              </button>
              <button onClick={() => setView('list')} className="p-1.5 rounded-lg" style={{ background: view === 'list' ? 'rgba(232,213,160,0.08)' : 'transparent' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: view === 'list' ? G : '#555' }}>view_list</span>
              </button>
            </div>
          </div>

          {filteredDiaspora.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{ background: '#131314' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#2a2a2b' }}>search_off</span>
              <p className="mt-3" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#72727a' }}>Aucun produit trouvé</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDiaspora.map(product => {
                const catIcons = { mode: 'checkroom', art: 'palette', musique: 'music_note', gastronomie: 'restaurant', litterature: 'menu_book' };
                return (
                  <button key={product.id} onClick={() => setSelectedProduct(product)} className="rounded-xl overflow-hidden text-left transition-all hover:scale-[1.01] group" style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.08)' }} data-testid={`product-${product.id}`}>
                    <div className="relative h-36" style={{ background: 'linear-gradient(135deg, rgba(232,213,160,0.04), rgba(200,168,75,0.01))' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'rgba(232,213,160,0.06)', fontVariationSettings: "'FILL' 1" }}>{catIcons[product.category] || 'storefront'}</span>
                      </div>
                      {product.badge && <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full" style={{ background: G, color: '#3a2f09', fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700 }}>{product.badge}</span>}
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#a0a0a5', fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 600 }}>{product.origin}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-left truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>{product.name}</p>
                      <p className="text-left truncate mt-0.5" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>par {product.artisan}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span style={{ fontFamily: "'Newsreader', serif", fontSize: 18, color: '#e5e2e3' }}>{product.price}€</span>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: 12, color: G, fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, color: '#a0a0a5' }}>{product.rating}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDiaspora.map(product => (
                <button key={product.id} onClick={() => setSelectedProduct(product)} className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:bg-white/[0.02]" style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.06)' }} data-testid={`product-list-${product.id}`}>
                  <div className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(232,213,160,0.04)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: G, opacity: 0.4 }}>
                      {{ mode: 'checkroom', art: 'palette', musique: 'music_note', gastronomie: 'restaurant', litterature: 'menu_book' }[product.category] || 'storefront'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>{product.name}</p>
                    <p className="truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>{product.artisan} · {product.origin}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span style={{ fontFamily: "'Newsreader', serif", fontSize: 16, color: '#e5e2e3' }}>{product.price}€</span>
                    <div className="flex items-center gap-0.5 justify-end mt-0.5">
                      <span className="material-symbols-outlined" style={{ fontSize: 10, color: G, fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, color: '#72727a' }}>{product.rating} ({product.reviews})</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ShopPageEnhanced;
