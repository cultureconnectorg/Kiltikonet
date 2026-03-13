import React, { useState, useEffect } from 'react';
import { Ticket, CreditCard, Wallet, ArrowRight, Check, Shield, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function JetonsPage() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badgeId, setBadgeId] = useState('');
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');

  useEffect(() => { fetchPacks(); }, []);

  const fetchPacks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/jetons/packs`);
      const data = await res.json();
      setPacks(data.packs || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const lookupWallet = async () => {
    if (!badgeId.trim()) return;
    setWalletLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/jetons/wallet/${badgeId.trim()}`);
      if (res.ok) {
        setWallet(await res.json());
      } else {
        setWallet(null);
        alert('Badge non trouve');
      }
    } catch { alert('Erreur connexion'); }
    setWalletLoading(false);
  };

  const buyPack = async (packId) => {
    if (!wallet?.badge_id) { alert('Entrez votre Badge ID d\'abord'); return; }
    setCheckoutLoading(packId);
    try {
      const res = await fetch(`${API_URL}/api/jetons/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          badge_id: wallet.badge_id,
          pack: packId,
          origin_url: window.location.origin,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert('Erreur: ' + (data.detail || 'checkout failed'));
    } catch { alert('Erreur de connexion'); }
    setCheckoutLoading('');
  };

  const packColors = {
    decouverte: '#6B21A8',
    culture: '#3B0764',
    diaspora: '#C9A84C',
    vip: '#C9A84C',
  };

  return (
    <div className="min-h-screen" style={{ background: '#0C0818' }} data-testid="jetons-page">
      {/* Header */}
      <div className="py-12 px-4 text-center" style={{ background: 'linear-gradient(135deg, #3B0764 0%, #0C0818 100%)' }}>
        <Ticket className="w-12 h-12 mx-auto mb-3" style={{ color: '#C9A84C' }} />
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#C9A84C' }}>Jetons CC</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Votre monnaie Culture Connect 2026</p>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>1 Jeton = 1.50EUR de valeur faciale</p>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Wallet Lookup */}
        <div className="p-5 rounded-xl" style={{ background: '#1a1040', border: '1px solid #3B0764' }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#e0d8f0' }}>
            <Wallet size={20} style={{ color: '#C9A84C' }} /> Mon Porte-Monnaie
          </h2>
          <div className="flex gap-2">
            <input
              data-testid="badge-id-input"
              type="text"
              placeholder="Entrez votre Badge ID (ex: CC26-VIP-XXXXX)"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{ background: '#0C0818', border: '1px solid #3B0764', color: '#e0d8f0' }}
            />
            <button
              data-testid="lookup-wallet-btn"
              onClick={lookupWallet}
              disabled={walletLoading}
              className="px-4 py-2 rounded-lg font-medium text-sm"
              style={{ background: '#C9A84C', color: '#0C0818' }}
            >
              {walletLoading ? <Loader2 size={16} className="animate-spin" /> : 'Voir'}
            </button>
          </div>
          {wallet && (
            <div className="mt-4 p-4 rounded-lg text-center" style={{ background: '#0C0818', border: '1px solid #3B0764' }} data-testid="wallet-display">
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{wallet.prenom} {wallet.nom}</p>
              <p className="text-4xl font-bold" style={{ color: '#C9A84C' }}>{wallet.jetons_solde}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Jetons CC ({wallet.valeur_eur}EUR)</p>
            </div>
          )}
        </div>

        {/* Packs */}
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#e0d8f0' }}>
          <CreditCard size={20} style={{ color: '#C9A84C' }} /> Packs Disponibles
        </h2>
        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#C9A84C' }} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="p-5 rounded-xl relative overflow-hidden transition-transform hover:scale-[1.02]"
                style={{ background: '#1a1040', border: `1px solid ${packColors[pack.id] || '#3B0764'}` }}
                data-testid={`pack-${pack.id}`}
              >
                {pack.id === 'vip' && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold" style={{ background: '#C9A84C', color: '#0C0818' }}>
                    BEST VALUE
                  </div>
                )}
                <p className="text-sm font-medium mb-1" style={{ color: packColors[pack.id] || '#C9A84C' }}>
                  Pack {pack.name}
                </p>
                <p className="text-3xl font-bold mb-1" style={{ color: '#e0d8f0' }}>{pack.jetons} <span className="text-lg">Jetons</span></p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xl font-bold" style={{ color: '#C9A84C' }}>{pack.price_eur}EUR</span>
                  <span className="text-sm line-through" style={{ color: 'rgba(255,255,255,0.4)' }}>{pack.value_eur}EUR</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#3B0764', color: '#C9A84C' }}>
                    -{pack.savings_pct}%
                  </span>
                </div>
                <button
                  data-testid={`buy-pack-${pack.id}`}
                  onClick={() => buyPack(pack.id)}
                  disabled={!!checkoutLoading}
                  className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: packColors[pack.id] === '#C9A84C' ? '#C9A84C' : '#6B21A8', color: packColors[pack.id] === '#C9A84C' ? '#0C0818' : '#fff' }}
                >
                  {checkoutLoading === pack.id ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Acheter</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="p-4 rounded-xl text-sm" style={{ background: '#1a1040', border: '1px solid #3B0764', color: 'rgba(255,255,255,0.5)' }}>
          <p className="flex items-center gap-2 mb-2"><Shield size={14} style={{ color: '#C9A84C' }} /> <strong style={{ color: '#e0d8f0' }}>Securise par Stripe</strong></p>
          <p>Les Jetons CC non utilises sont convertibles a 100% pour CC2027.</p>
          <p>Rachat marchand J+3 SEPA : 1.35EUR/jeton.</p>
        </div>
      </div>
    </div>
  );
}
