import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UserPlus, CheckCircle, Loader2, QrCode, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const C = { bg: '#F4F0E8', card: '#FFFFFF', warm: '#E8E0D0', dark: '#1A1510', muted: '#6B6560', gold: '#C9A84C', terra: '#A65D47' };

export default function BadgeInscription() {
  const location = useLocation();
  const preSelectedType = location.state?.selectedType || '';
  const tierName = location.state?.tierName || '';
  const [types, setTypes] = useState({});
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', type_badge: preSelectedType || 'VIS', organisation: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/badges/types`).then(r => r.json()).then(d => setTypes(d.types || {})).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.email || !form.type_badge) { toast.error('Veuillez remplir tous les champs obligatoires'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/badges/inscrire`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { setResult(data); toast.success('Badge créé avec succès !'); }
      else toast.error(data.detail || 'Erreur inscription');
    } catch { toast.error('Erreur de connexion'); }
    setLoading(false);
  };

  const copyBadgeId = () => { navigator.clipboard.writeText(result?.badge_id || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }}>
        <div className="w-full max-w-md rounded-xl overflow-hidden shadow-lg" style={{ background: C.card, border: `1px solid ${C.warm}` }} data-testid="badge-inscription-success">
          <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${C.terra}, ${C.gold})` }}>
            <CheckCircle className="w-14 h-14 mx-auto mb-3 text-white" />
            <h1 className="text-2xl font-bold text-white">Inscription réussie !</h1>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-center p-4 rounded-lg" style={{ background: C.bg, border: `1px solid ${C.warm}` }}>
              <p className="text-xs mb-1" style={{ color: C.muted }}>VOTRE BADGE</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold" style={{ color: C.terra }} data-testid="new-badge-id">{result.badge_id}</p>
                <button onClick={copyBadgeId} className="p-1 rounded" style={{ color: C.muted }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-sm mt-2" style={{ color: C.muted }}>{result.type_label}</p>
              {result.nfc_enabled && (
                <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-medium" style={{ background: `${C.gold}20`, color: C.gold }}>NFC Activé</span>
              )}
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: C.bg }}>
              <QrCode size={18} className="mx-auto mb-1" style={{ color: C.gold }} />
              <p className="text-xs" style={{ color: C.muted }}>FREK-ID: {result.frek_id}</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>
                {result.frek_status === 'local_fallback' ? 'Mode hors-ligne (sync auto)' : 'Connecté'}
              </p>
            </div>
            <p className="text-center text-xs" style={{ color: C.muted }}>Un email avec votre QR code a été envoyé. Conservez votre Badge ID.</p>
            <button
              onClick={() => { setResult(null); setForm({ prenom: '', nom: '', email: '', type_badge: 'BNV', organisation: '' }); }}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
              style={{ background: C.terra, color: '#fff' }}
              data-testid="new-inscription-btn"
            >Nouvelle inscription</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto" data-testid="badge-inscription-form">
        <div className="text-center mb-8">
          <UserPlus className="w-12 h-12 mx-auto mb-3" style={{ color: C.terra }} />
          <h1 className="text-2xl font-bold" style={{ color: C.dark }}>
            {tierName ? `Inscription ${tierName}` : 'Inscription Badge'}
          </h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Culture Connect 2026</p>
          {preSelectedType === 'VIS' && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${C.gold}20`, color: C.gold }}>
              Accès gratuit
            </span>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl shadow-lg" style={{ background: C.card, border: `1px solid ${C.warm}` }}>
          <Field label="Prénom *" value={form.prenom} onChange={v => setForm({...form, prenom: v})} testId="input-prenom" />
          <Field label="Nom *" value={form.nom} onChange={v => setForm({...form, nom: v})} testId="input-nom" />
          <Field label="Email *" type="email" value={form.email} onChange={v => setForm({...form, email: v})} testId="input-email" />
          <div>
            <label className="block text-sm mb-1 font-medium" style={{ color: C.dark }}>Type de Badge *</label>
            <select
              data-testid="select-type-badge"
              value={form.type_badge}
              onChange={e => setForm({...form, type_badge: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg text-sm"
              style={{ background: C.bg, border: `1px solid ${C.warm}`, color: C.dark }}
            >
              {Object.entries(types).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
            </select>
          </div>
          <Field label="Organisation" value={form.organisation} onChange={v => setForm({...form, organisation: v})} testId="input-organisation" />
          <button
            data-testid="submit-inscription"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors hover:opacity-90"
            style={{ background: C.terra, color: '#fff' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> S'inscrire</>}
          </button>
        </form>
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
