import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Coins, ShoppingCart, QrCode, History,
  CreditCard, LogOut, RefreshCw, Copy, Check, User
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const C = {
  bg: '#F4F0E8', card: '#FFFFFF', warm: '#E8E0D0', dark: '#1A1510',
  muted: '#6B6560', gold: '#C9A84C', terra: '#A65D47', sage: '#4A5D4E',
};

const PACKS = [
  { id: 'decouverte', name: 'Découverte', jetons: 10, price: '13.50€', color: C.sage },
  { id: 'culture', name: 'Culture', jetons: 25, price: '30.00€', popular: true, color: C.terra },
  { id: 'diaspora', name: 'Diaspora', jetons: 50, price: '56.25€', color: C.gold },
  { id: 'vip', name: 'VIP', jetons: 100, price: '105.00€', color: C.dark },
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const [badgeId, setBadgeId] = useState('');
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadProfile = useCallback(async (id) => {
    const bid = (id || badgeId).trim().toUpperCase();
    if (!bid) { toast.error('Entrez votre Badge ID'); return; }
    setLoading(true);
    try {
      // Load badge info
      const bRes = await fetch(`${API}/api/badges/single/${bid}`);
      if (!bRes.ok) throw new Error('Badge non trouvé');
      const badge = await bRes.json();
      setProfile(badge);

      // Load wallet
      const wRes = await fetch(`${API}/api/jetons/wallet/${bid}`);
      if (wRes.ok) {
        const w = await wRes.json();
        setWallet(w);
        setTransactions(w.transactions || []);
      }
    } catch (e) {
      toast.error(e.message || 'Badge non trouvé');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [badgeId]);

  const buyPack = async (packId) => {
    if (!profile?.badge_id) return;
    setPurchasing(packId);
    try {
      const res = await fetch(`${API}/api/jetons/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge_id: profile.badge_id, pack: packId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Erreur checkout');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setPurchasing(null);
    }
  };

  const copyId = async () => {
    const text = profile?.badge_id || '';
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      setCopied(true); toast.success('Copié !');
    } catch { toast.error('Copie impossible'); }
    setTimeout(() => setCopied(false), 2000);
  };

  // Login screen
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }} data-testid="user-dashboard-login">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: `${C.terra}15` }}>
              <User className="w-8 h-8" style={{ color: C.terra }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: C.dark }}>Mon Espace</h1>
            <p className="text-sm mt-1" style={{ color: C.muted }}>Culture Connect 2026</p>
          </div>

          <div className="rounded-xl p-6 space-y-4" style={{ background: C.card, border: `1px solid ${C.warm}` }}>
            <label className="block text-sm font-medium" style={{ color: C.dark }}>Badge ID</label>
            <input
              value={badgeId}
              onChange={e => setBadgeId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && loadProfile()}
              placeholder="CC26-VIS-XXXXX"
              className="w-full px-4 py-3 rounded-lg text-center text-lg font-mono tracking-wide"
              style={{ background: C.bg, border: `1px solid ${C.warm}`, color: C.dark }}
              data-testid="user-badge-input"
            />
            <Button
              onClick={() => loadProfile()}
              disabled={loading || !badgeId.trim()}
              className="w-full h-12 text-white font-medium"
              style={{ background: C.terra }}
              data-testid="user-login-btn"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-2" /> Accéder à mon espace</>}
            </Button>
          </div>

          <p className="text-center text-xs" style={{ color: C.muted }}>
            Votre Badge ID vous a été envoyé par email lors de l'inscription.
          </p>

          <button onClick={() => navigate('/')} className="block mx-auto text-sm" style={{ color: C.muted }} data-testid="user-back-home">
            <ArrowLeft className="w-3 h-3 inline mr-1" />Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen" style={{ background: C.bg }} data-testid="user-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(244,240,232,0.95)', backdropFilter: 'blur(8px)', borderColor: C.warm }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${C.terra}15`, color: C.terra }}>
              {profile.prenom?.[0]}{profile.nom?.[0]}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.dark }}>{profile.prenom} {profile.nom}</p>
              <p className="text-xs" style={{ color: C.muted }}>{profile.type_label || profile.type_badge}</p>
            </div>
          </div>
          <button
            onClick={() => { setProfile(null); setWallet(null); setBadgeId(''); }}
            className="p-2 rounded-lg"
            style={{ color: C.muted }}
            data-testid="user-logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Badge Card */}
        <div className="rounded-xl overflow-hidden" style={{ background: C.dark }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <QrCode className="w-6 h-6" style={{ color: C.gold }} />
              <span className="text-xs px-2 py-1 rounded" style={{ background: `${C.sage}40`, color: '#fff' }}>
                {profile.statut}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xl font-mono font-bold" style={{ color: '#fff' }} data-testid="dashboard-badge-id">{profile.badge_id}</p>
              <button onClick={copyId} className="p-1 rounded" style={{ color: C.gold }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>FREK: {profile.frek_id}</p>
          </div>
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(201,168,76,0.15)' }}>
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Solde Jetons</p>
              <p className="text-3xl font-bold" style={{ color: C.gold }}>{wallet?.solde ?? profile.jetons_solde ?? 0} <span className="text-sm">JCC</span></p>
            </div>
            <Coins className="w-10 h-10" style={{ color: C.gold, opacity: 0.3 }} />
          </div>
        </div>

        {/* Recharger */}
        <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.warm}` }}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5" style={{ color: C.terra }} />
            <h2 className="font-bold" style={{ color: C.dark }}>Recharger mes jetons</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PACKS.map(pack => (
              <button
                key={pack.id}
                onClick={() => buyPack(pack.id)}
                disabled={purchasing === pack.id}
                className="relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md"
                style={{
                  borderColor: pack.popular ? C.terra : C.warm,
                  background: pack.popular ? `${C.terra}08` : C.card,
                }}
                data-testid={`buy-pack-${pack.id}`}
              >
                {pack.popular && (
                  <span className="absolute -top-2 right-3 text-xs px-2 py-0.5 rounded-full text-white" style={{ background: C.terra }}>Populaire</span>
                )}
                <p className="font-bold text-lg" style={{ color: C.dark }}>{pack.jetons} <span className="text-xs font-normal" style={{ color: C.muted }}>JCC</span></p>
                <p className="text-xs mt-1" style={{ color: C.muted }}>{pack.name}</p>
                <p className="font-bold mt-2" style={{ color: pack.color }}>{pack.price}</p>
                {purchasing === pack.id && <RefreshCw className="w-4 h-4 animate-spin absolute top-3 right-3" style={{ color: C.terra }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Historique */}
        <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.warm}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5" style={{ color: C.gold }} />
              <h2 className="font-bold" style={{ color: C.dark }}>Historique</h2>
            </div>
            <button onClick={() => loadProfile(profile.badge_id)} className="p-1 rounded" style={{ color: C.muted }}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {transactions.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: C.bg }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.dark }}>
                      {tx.type === 'achat' ? 'Recharge' : tx.description || 'Transaction'}
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                  </div>
                  <span className="font-bold text-sm" style={{ color: tx.jetons > 0 ? C.sage : C.terra }}>
                    {tx.jetons > 0 ? '+' : ''}{tx.jetons} JCC
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-sm" style={{ color: C.muted }}>Aucune transaction</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/jetons')}
            variant="outline"
            className="flex-1"
            data-testid="goto-jetons-shop"
          >
            <ShoppingCart className="w-4 h-4 mr-2" /> Boutique Jetons
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex-1"
            data-testid="goto-home"
          >
            Retour accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
