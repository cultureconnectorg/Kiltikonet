import React, { useState, useEffect } from 'react';
import { ShoppingBag, Ticket, Zap, Music, Palette, UtensilsCrossed, Shirt, BookOpen, GraduationCap, Search, ChevronRight, Star } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: ShoppingBag },
  { id: 'billetterie', label: 'Billetterie', icon: Ticket },
  { id: 'jetons', label: 'Jetons CC', icon: Zap },
  { id: 'musique', label: 'Musique', icon: Music },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'gastronomie', label: 'Gastronomie', icon: UtensilsCrossed },
  { id: 'mode', label: 'Mode', icon: Shirt },
  { id: 'litterature', label: 'Litterature', icon: BookOpen },
  { id: 'formation', label: 'Formation', icon: GraduationCap },
];

// Products seeded locally (will be replaced by API when backend is ready)
const SEED_PRODUCTS = [
  { id: 'jcc-10', name: '10 Jetons CC', description: 'Pack de 10 jetons pour soutenir les artistes', price: 15, currency: 'EUR', category: 'jetons', image: null, badge: 'Populaire', stock: -1 },
  { id: 'jcc-50', name: '50 Jetons CC', description: 'Pack de 50 jetons — economisez 10%', price: 67.50, currency: 'EUR', category: 'jetons', image: null, badge: 'Meilleur rapport', stock: -1 },
  { id: 'jcc-100', name: '100 Jetons CC', description: 'Pack de 100 jetons — economisez 20%', price: 120, currency: 'EUR', category: 'jetons', image: null, badge: 'Premium', stock: -1 },
  { id: 'ticket-cc2026', name: 'Pass CC2026 General', description: 'Acces complet au festival Culture Connect 2026 (20–23 Mai)', price: 45, currency: 'EUR', category: 'billetterie', image: null, badge: 'J-60', stock: 500 },
  { id: 'ticket-cc2026-vip', name: 'Pass CC2026 VIP', description: 'Acces VIP + backstage + meet & greet artistes', price: 150, currency: 'EUR', category: 'billetterie', image: null, badge: 'VIP', stock: 100 },
  { id: 'album-kassav', name: 'Kassav — Les Annees Or', description: 'Album digital compilation des plus grands classiques', price: 12, currency: 'EUR', category: 'musique', image: null },
  { id: 'album-malavoi', name: 'Malavoi — Matebis', description: 'Chef-d\'oeuvre du biguine jazz contemporain', price: 10, currency: 'EUR', category: 'musique', image: null },
  { id: 'print-selbonne', name: 'Ronald Selbonne — Tirage Signe', description: 'Reproduction numerotee 30x40cm sur papier Hahnemuhle', price: 85, currency: 'EUR', category: 'art', image: null, badge: 'Edition limitee' },
  { id: 'spice-colombo', name: 'Kit Colombo Authentique', description: 'Melange d\'epices artisanal de Martinique — 3 sachets', price: 18, currency: 'EUR', category: 'gastronomie', image: null },
  { id: 'tshirt-cc2026', name: 'T-Shirt CC2026 — Or Blanc', description: 'Coton bio, serigraphie logo KILTIKONET', price: 35, currency: 'EUR', category: 'mode', image: null, badge: 'Nouveau' },
  { id: 'madras-scarf', name: 'Foulard Madras Signature', description: 'Tissu madras traditionnel reinterprete — creation exclusive', price: 55, currency: 'EUR', category: 'mode', image: null },
  { id: 'book-conde', name: 'Maryse Conde — Memoires', description: 'Derniere edition incluant les inedits posthumes', price: 22, currency: 'EUR', category: 'litterature', image: null },
  { id: 'workshop-bele', name: 'Atelier Bele — 2h', description: 'Initiation au Bele traditionnel avec maitre Ka', price: 40, currency: 'EUR', category: 'formation', image: null },
  { id: 'workshop-creole', name: 'Cours Creole Martiniquais — 5 sessions', description: 'Apprendre les bases du creole avec un formateur certifie', price: 75, currency: 'EUR', category: 'formation', image: null },
];

const ShopPage = ({ session, jetonsBalance = 0 }) => {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [products] = useState(SEED_PRODUCTS);

  const filtered = products.filter(p => {
    const matchCat = category === 'all' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCategoryIcon = (cat) => {
    const found = CATEGORIES.find(c => c.id === cat);
    return found ? found.icon : ShoppingBag;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5" data-testid="shop-page">
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
              <p className="text-xs mt-1" style={{ color: '#72727a' }}>Decouvrez la culture caribeenne, soutenez les artistes</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(232,213,160,0.1)', border: '1px solid rgba(232,213,160,0.25)' }}>
              <Zap size={14} style={{ color: G }} />
              <span className="text-sm font-black tabular-nums" style={{ color: G }}>{jetonsBalance}</span>
              <span className="text-[10px] font-bold" style={{ color: G }}>JCC</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#555' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
              style={{ background: '#0a0a0b', border: '1px solid #1e1e1e', color: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
              data-testid="shop-search" />
          </div>
        </div>
      </div>

      {/* Category filters */}
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

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
          <ShoppingBag size={40} className="mx-auto mb-3" style={{ color: '#333' }} />
          <p className="text-sm" style={{ color: '#72727a' }}>Aucun produit dans cette categorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(product => {
            const CatIcon = getCategoryIcon(product.category);
            const isJeton = product.category === 'jetons';
            return (
              <div key={product.id}
                className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
                style={{ background: '#141414', border: '1px solid #1e1e1e' }}
                data-testid={`product-${product.id}`}>

                {/* Image placeholder */}
                <div className="relative h-36 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${isJeton ? 'rgba(232,213,160,0.08)' : 'rgba(255,255,255,0.02)'}, #0a0a0b)` }}>
                  <CatIcon size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ color: isJeton ? G : '#222', opacity: isJeton ? 0.3 : 0.15 }} />

                  {product.badge && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: isJeton ? 'rgba(232,213,160,0.2)' : 'rgba(255,255,255,0.08)', color: isJeton ? G : '#fff', border: `1px solid ${isJeton ? 'rgba(232,213,160,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                      {product.badge}
                    </span>
                  )}

                  {product.stock !== undefined && product.stock > 0 && product.stock < 50 && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(232,90,79,0.15)', color: '#E85A4F' }}>
                      {product.stock} restants
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-bold truncate" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                    {product.name}
                  </h3>
                  <p className="text-[11px] mt-1 line-clamp-2" style={{ color: '#72727a', lineHeight: 1.4 }}>
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-base font-black" style={{ color: isJeton ? G : '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                      {product.price.toFixed(2)} {product.currency === 'EUR' ? 'EUR' : product.currency}
                    </span>
                    <button
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        background: isJeton ? G : 'rgba(255,255,255,0.06)',
                        color: isJeton ? '#0a0a0b' : '#fff',
                        border: isJeton ? 'none' : '1px solid #1e1e1e',
                      }}
                      onClick={() => toast.info('Paiement bientot disponible')}
                      data-testid={`buy-${product.id}`}>
                      {isJeton ? 'Acheter' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ShopPage;
