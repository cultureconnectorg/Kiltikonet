import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle, Loader2, QrCode, Copy, Check, ArrowLeft, ArrowRight, Store, Users, Briefcase, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const C = { bg: '#F4F0E8', card: '#FFFFFF', warm: '#E8E0D0', dark: '#1A1510', muted: '#6B6560', gold: '#C9A84C', terra: '#A65D47', sage: '#4A5D4E' };

const CATEGORIES = [
  {
    id: 'visitor', label: 'Visiteur', icon: Users, badge: 'VIS', price: 'Gratuit',
    desc: 'Accès général à l\'événement, ateliers ouverts et concerts',
  },
  {
    id: 'emerging', label: 'Émergent', icon: Star, badge: 'BNV', price: '50€',
    desc: 'Jeunes entrepreneurs, PME, startups culturelles, artistes émergents',
  },
  {
    id: 'pro', label: 'Professionnel', icon: Briefcase, badge: 'INT', price: '300€',
    desc: 'Structures culturelles, producteurs, distributeurs, médias',
  },
  {
    id: 'exposant', label: 'Exposant / Stand', icon: Store, badge: null, price: 'Dès 2 500€',
    desc: 'Avoir un stand au Marché Culturel — Bronze, Silver ou Gold',
    sub: [
      { badge: 'EXP-B', label: 'Bronze', price: '2 500€', desc: 'Stand 6m², badge + 2 invités' },
      { badge: 'EXP-S', label: 'Silver', price: '5 000€', desc: 'Stand 12m², badge + 5 invités, conférences' },
      { badge: 'EXP-G', label: 'Gold', price: '10 000€', desc: 'Stand 24m², badge NFC + 10 invités VIP, plénière' },
    ],
  },
];

export default function BadgeInscription() {
  const location = useLocation();
  const navigate = useNavigate();
  const preSelectedType = location.state?.selectedType || '';
  const tierName = location.state?.tierName || '';

  const [step, setStep] = useState(preSelectedType ? 2 : 1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(preSelectedType || '');
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', type_badge: preSelectedType || '', organisation: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (preSelectedType) {
      const cat = CATEGORIES.find(c => c.badge === preSelectedType || c.sub?.some(s => s.badge === preSelectedType));
      if (cat) setSelectedCategory(cat.id);
      setSelectedBadge(preSelectedType);
      setForm(f => ({ ...f, type_badge: preSelectedType }));
    }
  }, [preSelectedType]);

  const selectCategory = (cat) => {
    setSelectedCategory(cat.id);
    if (cat.badge) {
      setSelectedBadge(cat.badge);
      setForm(f => ({ ...f, type_badge: cat.badge }));
      setStep(2);
    } else {
      setStep(1.5); // Show sub-options
    }
  };

  const selectExposant = (badge) => {
    setSelectedBadge(badge);
    setForm(f => ({ ...f, type_badge: badge }));
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.email || !form.type_badge) { toast.error('Veuillez remplir tous les champs obligatoires'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/badges/inscrire`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { setResult(data); toast.success('Badge créé !'); setStep(3); }
      else toast.error(data.detail || 'Erreur inscription');
    } catch { toast.error('Erreur de connexion'); }
    setLoading(false);
  };

  const copyBadgeId = async () => {
    const text = result?.badge_id || '';
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      setCopied(true); toast.success('Badge ID copié !');
    } catch { toast.error('Copie impossible'); }
    setTimeout(() => setCopied(false), 2000);
  };

  // Step indicator
  const StepBar = () => (
    <div className="flex items-center justify-center gap-2 mb-8" data-testid="step-bar">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            style={{ background: (step >= s || (step === 1.5 && s === 1)) ? C.terra : C.warm, color: (step >= s || (step === 1.5 && s === 1)) ? '#fff' : C.muted }}
          >
            {s === 3 && result ? <Check className="w-4 h-4" /> : s}
          </div>
          {s < 3 && <div className="w-8 h-0.5" style={{ background: step > s ? C.terra : C.warm }} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: C.bg }} data-testid="badge-inscription-page">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step > 1 && !result ? setStep(step === 1.5 ? 1 : step - 1) : navigate(-1)} style={{ color: C.muted }} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: C.dark }}>
              {tierName ? `Inscription ${tierName}` : 'Inscription Badge'}
            </h1>
            <p className="text-xs" style={{ color: C.muted }}>Culture Connect 2026 — 20-23 Mai</p>
          </div>
        </div>

        <StepBar />

        {/* STEP 1: Choose category */}
        {step === 1 && (
          <div className="space-y-3" data-testid="step-choose-category">
            <p className="text-sm font-medium mb-4" style={{ color: C.dark }}>Choisissez votre profil :</p>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md"
                style={{ background: C.card, borderColor: selectedCategory === cat.id ? C.terra : C.warm }}
                data-testid={`cat-${cat.id}`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${C.terra}12` }}>
                  <cat.icon className="w-6 h-6" style={{ color: C.terra }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: C.dark }}>{cat.label}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${C.gold}20`, color: C.gold }}>{cat.price}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{cat.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: C.muted }} />
              </button>
            ))}
          </div>
        )}

        {/* STEP 1.5: Choose exposant tier */}
        {step === 1.5 && (
          <div className="space-y-3" data-testid="step-choose-exposant">
            <p className="text-sm font-medium mb-4" style={{ color: C.dark }}>Choisissez votre formule exposant :</p>
            {CATEGORIES.find(c => c.id === 'exposant')?.sub?.map(opt => (
              <button
                key={opt.badge}
                onClick={() => selectExposant(opt.badge)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md"
                style={{ background: C.card, borderColor: selectedBadge === opt.badge ? C.terra : C.warm }}
                data-testid={`exp-${opt.badge}`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{
                  background: opt.badge === 'EXP-G' ? `${C.gold}20` : opt.badge === 'EXP-S' ? `${C.muted}15` : `${C.terra}15`,
                  color: opt.badge === 'EXP-G' ? C.gold : opt.badge === 'EXP-S' ? C.muted : C.terra
                }}>
                  {opt.label[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: C.dark }}>{opt.label}</span>
                    <span className="text-xs font-bold" style={{ color: C.terra }}>{opt.price}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{opt.desc}</p>
                </div>
              </button>
            ))}
            <button onClick={() => setStep(1)} className="text-sm" style={{ color: C.muted }} data-testid="back-to-categories">
              <ArrowLeft className="w-3 h-3 inline mr-1" />Retour aux catégories
            </button>
          </div>
        )}

        {/* STEP 2: Form */}
        {step === 2 && !result && (
          <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl shadow-lg" style={{ background: C.card, border: `1px solid ${C.warm}` }} data-testid="inscription-form">
            <div className="p-3 rounded-lg flex items-center gap-3" style={{ background: `${C.terra}08` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.terra}20` }}>
                <UserPlus className="w-4 h-4" style={{ color: C.terra }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: C.dark }}>
                  {CATEGORIES.flatMap(c => c.sub ? c.sub.map(s => ({ ...s, cat: c.label })) : [{ badge: c.badge, label: c.label, cat: c.label }]).find(x => x.badge === selectedBadge)?.label || selectedBadge}
                </p>
                <p className="text-xs" style={{ color: C.muted }}>Badge: {selectedBadge}</p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs" style={{ color: C.terra }}>Modifier</button>
            </div>

            <Field label="Prénom *" value={form.prenom} onChange={v => setForm({ ...form, prenom: v })} testId="input-prenom" />
            <Field label="Nom *" value={form.nom} onChange={v => setForm({ ...form, nom: v })} testId="input-nom" />
            <Field label="Email *" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} testId="input-email" />
            <Field label="Organisation / Entreprise" value={form.organisation} onChange={v => setForm({ ...form, organisation: v })} testId="input-organisation" />

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-white font-bold"
              style={{ background: C.terra }}
              data-testid="submit-inscription"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-2" /> Valider l'inscription</>}
            </Button>
          </form>
        )}

        {/* STEP 3: Success */}
        {step === 3 && result && (
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ background: C.card, border: `1px solid ${C.warm}` }} data-testid="badge-inscription-success">
            <div className="p-6 text-center" style={{ background: C.dark }}>
              <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: C.gold }} />
              <h2 className="text-xl font-bold" style={{ color: '#fff' }}>Inscription réussie !</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center p-4 rounded-lg" style={{ background: C.bg }}>
                <p className="text-xs mb-1" style={{ color: C.muted }}>VOTRE BADGE</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold font-mono" style={{ color: C.terra }} data-testid="new-badge-id">{result.badge_id}</p>
                  <button onClick={copyBadgeId} className="p-1 rounded" style={{ color: C.muted }} data-testid="copy-badge-btn">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-sm mt-2" style={{ color: C.muted }}>{result.type_label}</p>
                {result.nfc_enabled && <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-medium" style={{ background: `${C.gold}20`, color: C.gold }}>NFC Activé</span>}
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: C.bg }}>
                <QrCode size={18} className="mx-auto mb-1" style={{ color: C.gold }} />
                <p className="text-xs" style={{ color: C.muted }}>FREK-ID: {result.frek_id}</p>
                <p className="text-xs mt-1" style={{ color: result.frek_status === 'emitted' ? C.sage : C.gold }}>
                  {result.frek_status === 'emitted' ? 'Identité FREK certifiée' : 'En cours de certification'}
                </p>
              </div>
              <p className="text-center text-xs" style={{ color: C.muted }}>Un email de confirmation vous sera envoyé. Conservez votre Badge ID.</p>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/mon-espace')} className="flex-1" style={{ background: C.terra, color: '#fff' }} data-testid="goto-espace">
                  Mon Espace
                </Button>
                <Button onClick={() => { setResult(null); setStep(1); setForm({ prenom: '', nom: '', email: '', type_badge: '', organisation: '' }); }} variant="outline" className="flex-1" data-testid="new-inscription-btn">
                  Nouvelle inscription
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', testId }) {
  return (
    <div>
      <label className="block text-sm mb-1 font-medium" style={{ color: '#1A1510' }}>{label}</label>
      <input data-testid={testId} type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg text-sm" style={{ background: '#F4F0E8', border: '1px solid #E8E0D0', color: '#1A1510' }} />
    </div>
  );
}
