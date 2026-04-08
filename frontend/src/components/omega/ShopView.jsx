import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ShoppingBag, Tag, Star, Search, ChevronRight, Coins, ShieldCheck, Zap, Heart } from "lucide-react";

export default function ShopView({ onBack, onSelect, balance, auth }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const categories = [
    { id: "all", label: "Tout" }, { id: "jetons", label: "Jetons CC" }, { id: "billetterie", label: "Billetterie" }, { id: "music", label: "Musique" }, { id: "art", label: "Art" }, { id: "gastronomy", label: "Gastro" },
  ];

  // Dynamic countdown to CC2026 (20 mai 2026)
  const cc2026Date = new Date('2026-05-20T00:00:00');
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((cc2026Date - now) / (1000 * 60 * 60 * 24)));

  const JETON_PACKS = [
    { id: "pack-decouverte", title: "Pack Decouverte", author: "Kiltikonet", price: 10, category: "jetons", rating: 5.0, sales: 0, image: "https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&q=80&w=400", desc: "10 JCC" },
    { id: "pack-culture", title: "Pack Culture", author: "Kiltikonet", price: 25, category: "jetons", rating: 5.0, sales: 0, image: "https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&q=80&w=400", desc: "25 JCC" },
    { id: "pack-diaspora", title: "Pack Diaspora", author: "Kiltikonet", price: 50, category: "jetons", rating: 5.0, sales: 0, image: "https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&q=80&w=400", desc: "50 JCC" },
    { id: "pack-vip", title: "Pack VIP", author: "Kiltikonet", price: 100, category: "jetons", rating: 5.0, sales: 0, image: "https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&q=80&w=400", desc: "100 JCC" },
  ];

  const products = [
    ...JETON_PACKS,
    { id: "cc2026-ticket", title: "Badge CC2026 — La Savane", author: "Culture Connect", price: 0, category: "billetterie", rating: 5.0, sales: 0, image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=400", desc: "Gratuit" },
    { id: 1, title: "Ti' Punch & Identite Creole", author: "Ben ARRIS", price: 12, category: "gastronomy", rating: 4.9, sales: 242, image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400" },
    { id: 2, title: "Session Studio — Beat Zouk", author: "Kilti Maker", price: 8, category: "music", rating: 4.7, sales: 156, image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400" },
    { id: 3, title: "Architecture Luciole v2", author: "Core Engine", price: 45, category: "art", rating: 5.0, sales: 89, image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400" },
    { id: 4, title: "Diaspora Rhythms", author: "Global Sound", price: 15, category: "music", rating: 4.8, sales: 312, image: "https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=400" },
  ];
  const filteredProducts = activeCategory === "all" ? products : products.filter(p => p.category === activeCategory);

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden" style={{ background: '#050505' }} data-testid="shop-view">
      <header className="h-20 flex items-center justify-between px-6 backdrop-blur-xl z-50 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-4">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(242,202,80,0.1)', color: '#f2ca50', border: '1px solid rgba(242,202,80,0.2)' }}>
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex flex-col">
            <span className="italic text-lg uppercase tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Souveraign Shop</span>
            <span className="text-[8px] tracking-[0.2em] text-gray-500 uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Économie Circulaire JCC</span>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} onClick={() => onSelect("wallet")} className="flex items-center gap-2 rounded-full px-3 py-1.5 cursor-pointer" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
          <Coins className="w-3 h-3" style={{ color: '#f2ca50' }} />
          <span className="font-mono text-[10px] font-bold" style={{ color: '#f2ca50' }}>{balance} JCC</span>
        </motion.div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Rechercher une œuvre, un créateur..." className="w-full bg-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-[rgba(242,202,80,0.3)] transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap`}
                  style={activeCategory === cat.id ? { background: '#f2ca50', color: 'black' } : { background: 'rgba(255,255,255,0.05)', color: 'rgb(107,114,128)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative h-48 rounded-3xl overflow-hidden group cursor-pointer">
            <img src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover grayscale-[0.3] group-hover:scale-105 transition-transform duration-700" alt="Featured" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" style={{ color: '#f2ca50', fill: '#f2ca50' }} />
                <span className="text-[10px] tracking-widest uppercase" style={{ color: '#f2ca50', fontFamily: "'Space Grotesk', sans-serif" }}>J-{daysLeft} · Places limitees</span>
              </div>
              <h2 className="italic text-3xl text-white mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>CC2026 — La Savane</h2>
              <p className="text-xs text-gray-300 max-w-xs">20-23 mai 2026 · Fort-de-France · Badge FREK-ID inclus</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div key={product.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/5 rounded-3xl overflow-hidden group hover:border-[rgba(242,202,80,0.3)] transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="aspect-video relative overflow-hidden">
                    <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.title} referrerPolicy="no-referrer" />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Star className="w-3 h-3" style={{ color: '#f2ca50', fill: '#f2ca50' }} />
                      <span className="text-[10px] font-bold text-white">{product.rating}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="italic text-xl text-white group-hover:text-[#f2ca50] transition-colors" style={{ fontFamily: "'Noto Serif', serif" }}>{product.title}</h3>
                      <div className="flex items-center gap-1" style={{ color: '#f2ca50' }}>
                        <Coins className="w-4 h-4" />
                        <span className="font-mono font-bold">{product.price}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          <ShoppingBag className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">{product.author}</span>
                      </div>
                      <div className="text-[9px] text-gray-600 uppercase tracking-widest">{product.sales} ventes</div>
                    </div>
                    <div className="mt-6 flex gap-2">
                      <button className="flex-1 py-3 rounded-xl font-bold tracking-widest text-[10px] hover:bg-white transition-all" style={{ background: '#f2ca50', color: 'black' }}>ACHETER</button>
                      <button className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Heart className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {filteredProducts.length === 0 && (
            <div className="py-20 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 tracking-widest uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Aucun produit dans cette catégorie</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
