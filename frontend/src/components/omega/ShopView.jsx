import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ShoppingBag, Tag, Star, Search, ChevronRight, Coins, ShieldCheck, Zap, Heart, Loader2, X } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ShopView({ onBack, onSelect, balance, auth }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [packs, setPacks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", label: "Tout" }, { id: "jetons", label: "Jetons CC" },
    { id: "billetterie", label: "Billetterie" }, { id: "musique", label: "Musique" },
    { id: "art", label: "Art" }, { id: "gastronomie", label: "Gastro" },
    { id: "mode", label: "Mode" }, { id: "formation", label: "Formation" },
  ];

  // Dynamic countdown to CC2026 (20 mai 2026)
  const cc2026Date = new Date('2026-05-20T00:00:00');
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((cc2026Date - now) / (1000 * 60 * 60 * 24)));

  // Fetch packs + products
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [packsRes, productsRes] = await Promise.all([
        fetch(`${API}/api/shop/packs`, { credentials: 'include' }),
        fetch(`${API}/api/shop/products?limit=50`, { credentials: 'include' }),
      ]);
      if (packsRes.ok) { const d = await packsRes.json(); setPacks(d.packs || []); }
      if (productsRes.ok) { const d = await productsRes.json(); setProducts(d.products || []); }
    } catch (e) { console.error("Shop fetch error:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Stripe checkout
  const handleCheckout = async (packageId) => {
    setCheckoutLoading(packageId);
    try {
      const userId = auth?.user?.id || auth?.user?.email || 'anon';
      const res = await fetch(`${API}/api/shop/checkout/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId, user_id: userId, origin_url: window.location.origin }),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      } else {
        const err = await res.json();
        console.error("Checkout error:", err.detail);
      }
    } catch (e) { console.error("Checkout error:", e); }
    finally { setCheckoutLoading(null); }
  };

  // Filter products by category and search
  const filteredProducts = products.filter(p => {
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    if (searchQuery && !p.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const allItems = activeCategory === "all" || activeCategory === "jetons"
    ? [...packs.map(p => ({ ...p, _isPack: true })), ...filteredProducts.filter(p => p.category !== "jetons")]
    : filteredProducts;

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden" style={{ background: '#050505' }} data-testid="shop-view">
      {/* Header */}
      <header className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50]" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="shop-back-btn">
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <div>
              <span className="italic text-base uppercase tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Shop</span>
              <span className="text-[8px] tracking-[0.3em] text-gray-600 uppercase block">Marketplace Souveraine</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 tracking-wider">CC2026</div>
            <div className="text-sm font-bold" style={{ color: '#f2ca50' }}>J-{daysLeft}</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="w-full bg-white/5 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none text-white" style={{ border: '1px solid rgba(255,255,255,0.08)' }} data-testid="shop-search" />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0 transition-all" style={{ background: activeCategory === cat.id ? '#f2ca50' : 'rgba(255,255,255,0.05)', color: activeCategory === cat.id ? 'black' : '#999', border: `1px solid ${activeCategory === cat.id ? '#f2ca50' : 'rgba(255,255,255,0.08)'}` }} data-testid={`shop-cat-${cat.id}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* Products grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#f2ca50]" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allItems.map((item, idx) => (
              <motion.div key={item.id || idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="rounded-2xl overflow-hidden group cursor-pointer" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} data-testid={`shop-item-${item.id}`}>
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: item._isPack ? 'linear-gradient(135deg, #f2ca50 0%, #d4a84b 100%)' : 'rgba(255,255,255,0.05)' }}>
                      {item._isPack ? <Coins className="w-10 h-10 text-black/60" /> : <ShoppingBag className="w-8 h-8 text-gray-600" />}
                    </div>
                  )}
                  {item.badge && (
                    <span className="absolute top-2 left-2 text-[8px] px-2 py-0.5 rounded-full font-bold tracking-wider" style={{ background: '#f2ca50', color: 'black' }}>{item.badge}</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-xs font-bold text-white truncate">{item.name || item.title}</h3>
                  {item.description && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold" style={{ color: '#f2ca50' }}>{item.price}€</span>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleCheckout(item.id)} disabled={checkoutLoading === item.id} className="px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-wider uppercase" style={{ background: checkoutLoading === item.id ? '#333' : 'rgba(242,202,80,0.15)', color: '#f2ca50', border: '1px solid rgba(242,202,80,0.3)' }} data-testid={`buy-btn-${item.id}`}>
                      {checkoutLoading === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : item._isPack ? 'Acheter' : 'Acheter'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
