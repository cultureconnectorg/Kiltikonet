import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, CreditCard, Wallet, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const C = { bg: '#F4F0E8', card: '#FFFFFF', warm: '#E8E0D0', dark: '#1A1510', muted: '#6B6560', gold: '#C9A84C', terra: '#A65D47' };

export default function JetonsPage() {
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badgeId, setBadgeId] = useState('');
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/jetons/packs`).then(r => r.json()).then(d => setPacks(d.packs || [])).catch(() => {});
    setLoading(false);
  }, []);

  const lookupWallet = async () => {
    if (!badgeId.trim()) return;
    setWalletLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/jetons/wallet/${badgeId.trim()}`);
      if (res.ok) setWallet(await res.json());
      else { setWallet(null); alert('Badge non trouvé'); }
    } catch { alert('Erreur connexion'); }
    setWalletLoading(false);
  };

  const buyPack = async (packId) => {
    if (!wallet?.badge_id) {
      toast.error("Entrez votre Badge ID d'abord pour acheter");
      return;
    }
    setCheckoutLoading(packId);
    try {
      const res = await fetch(`${API_URL}/api/jetons/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge_id: wallet.badge_id, pack: packId, origin_url: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Erreur: ' + (data.detail || 'checkout failed'));
      }
    } catch { toast.error('Erreur de connexion'); }
    setCheckoutLoading('');
  };

  return (
    <div className="min-h-screen" style={{ background: C.bg }} data-testid="jetons-page">
      {/* Header */}
      <div className="py-12 px-4 text-center" style={{ background: `linear-gradient(135deg, ${C.terra} 0%, ${C.gold} 100%)` }}>
        <Ticket className="w-12 h-12 mx-auto mb-3 text-white" />
        <h1 className="text-3xl font-bold mb-2 text-white">Jetons CC</h1>
        <p className="text-white/80">Votre monnaie Culture Connect 2026</p>
        <p className="text-sm mt-1 text-white/60">1 Jeton = 1.50EUR de valeur faciale</p>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Wallet Lookup */}
        <div className="p-5 rounded-xl shadow-sm" style={{ background: C.card, border: `1px solid ${C.warm}` }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: C.dark }}>
            <Wallet size={20} style={{ color: C.gold }} /> Mon Porte-Monnaie
          </h2>
          <div className="flex gap-2">
            <input data-testid="badge-id-input" type="text" placeholder="Entrez votre Badge ID (ex: CC26-VIP-XXXXX)" value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)} className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{ background: C.bg, border: `1px solid ${C.warm}`, color: C.dark }} />
            <button data-testid="lookup-wallet-btn" onClick={lookupWallet} disabled={walletLoading}
              className="px-4 py-2 rounded-lg font-medium text-sm text-white" style={{ background: C.terra }}>
              {walletLoading ? <Loader2 size={16} className="animate-spin" /> : 'Voir'}
            </button>
          </div>
          {wallet && (
            <div className="mt-4 p-4 rounded-lg text-center" style={{ background: C.bg, border: `1px solid ${C.warm}` }} data-testid="wallet-display">
              <p className="text-xs mb-1" style={{ color: C.muted }}>{wallet.prenom} {wallet.nom}</p>
              <p className="text-4xl font-bold" style={{ color: C.gold }}>{wallet.jetons_solde}</p>
              <p className="text-sm" style={{ color: C.muted }}>Jetons CC ({wallet.valeur_eur}EUR)</p>
            </div>
          )}
        </div>

        {/* Packs */}
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: C.dark }}>
          <CreditCard size={20} style={{ color: C.gold }} /> Packs Disponibles
        </h2>
        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: C.terra }} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packs.map((pack) => (
              <div key={pack.id} className="p-5 rounded-xl relative overflow-hidden transition-transform hover:scale-[1.02] shadow-sm"
                style={{ background: C.card, border: `1px solid ${pack.id === 'vip' ? C.gold : C.warm}` }} data-testid={`pack-${pack.id}`}>
                {pack.id === 'vip' && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold" style={{ background: C.gold, color: '#fff' }}>BEST VALUE</div>
                )}
                <p className="text-sm font-medium mb-1" style={{ color: C.terra }}>Pack {pack.name}</p>
                <p className="text-3xl font-bold mb-1" style={{ color: C.dark }}>{pack.jetons} <span className="text-lg">Jetons</span></p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xl font-bold" style={{ color: C.gold }}>{pack.price_eur}EUR</span>
                  <span className="text-sm line-through" style={{ color: C.muted }}>{pack.value_eur}EUR</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: `${C.terra}15`, color: C.terra }}>-{pack.savings_pct}%</span>
                </div>
                <button data-testid={`buy-pack-${pack.id}`} onClick={() => buyPack(pack.id)} disabled={!!checkoutLoading}
                  className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 text-white"
                  style={{ background: pack.id === 'vip' || pack.id === 'diaspora' ? C.gold : C.terra }}>
                  {checkoutLoading === pack.id ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Acheter</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="p-4 rounded-xl text-sm" style={{ background: C.card, border: `1px solid ${C.warm}`, color: C.muted }}>
          <p className="flex items-center gap-2 mb-2"><Shield size={14} style={{ color: C.gold }} /> <strong style={{ color: C.dark }}>Sécurisé par Stripe</strong></p>
          <p>Les Jetons CC non utilisés sont convertibles à 100% pour CC2027.</p>
          <p>Rachat marchand J+3 SEPA : 1.35EUR/jeton.</p>
        </div>
      </div>
    </div>
  );
}
