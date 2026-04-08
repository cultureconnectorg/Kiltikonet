import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, CreditCard, Loader2, ShieldCheck, QrCode, Printer, User, Building2, CalendarDays, CheckCircle, Clock, X, ChevronRight, AlertTriangle } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const STEPS = [
  { id: 1, label: "Identite" },
  { id: 2, label: "Type" },
  { id: 3, label: "Paiement" },
  { id: 4, label: "Soumission" },
  { id: 5, label: "Validation" },
  { id: 6, label: "Badge" },
  { id: 7, label: "Impression" },
];

export default function AccreditationView({ onBack, auth }) {
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState({});
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    prenom: auth?.userName?.split(' ')[0] || '',
    nom: auth?.userName?.split(' ').slice(1).join(' ') || '',
    email: auth?.user?.email || '',
    telephone: '',
    organisation: '',
    bio: '',
    type_accreditation: '',
    jours_selectionnes: ['2026-05-20', '2026-05-21', '2026-05-22', '2026-05-23'],
  });

  const [result, setResult] = useState(null);

  // Fetch types + existing accreditation
  const fetchData = useCallback(async () => {
    try {
      const [typesRes, myRes] = await Promise.all([
        fetch(`${API}/api/accreditation/types`, { credentials: 'include' }),
        fetch(`${API}/api/accreditation/my`, { credentials: 'include' }),
      ]);
      if (typesRes.ok) {
        const d = await typesRes.json();
        setTypes(d.types || {});
      }
      if (myRes.ok) {
        const d = await myRes.json();
        if (d.exists) {
          setExisting(d);
          setStep(d.etape || 5);
          setResult(d);
        }
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const selectedType = types[form.type_accreditation] || {};

  // Submit application
  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/accreditation/apply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form), credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.requires_payment) {
          setStep(3);
        } else {
          setStep(4);
        }
      } else {
        const err = await res.json();
        setError(err.detail || "Erreur lors de la soumission");
      }
    } catch (e) { setError("Erreur reseau"); }
    finally { setSubmitting(false); }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!result?.accreditation_id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/accreditation/pay/${result.accreditation_id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin_url: window.location.origin }), credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.checkout_url) window.location.href = data.checkout_url;
        if (data.already_free) setStep(4);
      }
    } catch {}
    finally { setSubmitting(false); }
  };

  const days = [
    { date: '2026-05-20', label: 'J1 — Ouverture' },
    { date: '2026-05-21', label: 'J2 — Innovation' },
    { date: '2026-05-22', label: 'J3 — Diaspora' },
    { date: '2026-05-23', label: 'J4 — Legacy' },
  ];

  const toggleDay = (date) => {
    setForm(prev => ({
      ...prev,
      jours_selectionnes: prev.jours_selectionnes.includes(date)
        ? prev.jours_selectionnes.filter(d => d !== date)
        : [...prev.jours_selectionnes, date],
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: '#050505' }}>
      <Loader2 className="w-8 h-8 animate-spin text-[#f2ca50]" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden" style={{ background: '#050505' }} data-testid="accreditation-view">
      {/* Header */}
      <header className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50]" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="accred-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <span className="italic text-base uppercase tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Accreditation CC2026</span>
            <span className="text-[8px] tracking-[0.3em] text-gray-600 uppercase block">20 — 23 Mai | Fort-de-France</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 px-2">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${step >= s.id ? '' : 'opacity-30'}`} style={{ background: step >= s.id ? '#f2ca50' : 'rgba(255,255,255,0.1)', color: step >= s.id ? 'black' : '#666' }}>
                  {step > s.id ? <Check className="w-3 h-3" /> : s.id}
                </div>
                <span className="text-[7px] text-gray-600 mt-1 text-center">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && <div className="h-[1px] flex-1 mx-0.5" style={{ background: step > s.id ? '#f2ca50' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Step 1: Identity */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 mt-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-400">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prenom" value={form.prenom} onChange={v => updateForm('prenom', v)} testId="acc-prenom" />
              <Field label="Nom" value={form.nom} onChange={v => updateForm('nom', v)} testId="acc-nom" />
            </div>
            <Field label="Email" value={form.email} onChange={v => updateForm('email', v)} testId="acc-email" />
            <Field label="Telephone" value={form.telephone} onChange={v => updateForm('telephone', v)} testId="acc-tel" />
            <Field label="Organisation" value={form.organisation} onChange={v => updateForm('organisation', v)} testId="acc-org" />
            <Field label="Bio (optionnel)" value={form.bio} onChange={v => updateForm('bio', v)} multiline testId="acc-bio" />

            <div>
              <label className="text-[10px] text-gray-500 tracking-widest uppercase mb-2 block">Jours de presence</label>
              <div className="grid grid-cols-2 gap-2">
                {days.map(d => (
                  <motion.button key={d.date} whileTap={{ scale: 0.98 }} onClick={() => toggleDay(d.date)} className="p-3 rounded-xl text-left flex items-center justify-between" style={{
                    background: form.jours_selectionnes.includes(d.date) ? 'rgba(242,202,80,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.jours_selectionnes.includes(d.date) ? 'rgba(242,202,80,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <div>
                      <div className="text-xs font-bold text-white">{d.label}</div>
                      <div className="text-[9px] text-gray-500">{d.date}</div>
                    </div>
                    {form.jours_selectionnes.includes(d.date) && <CheckCircle className="w-4 h-4" style={{ color: '#f2ca50' }} />}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStep(2)} disabled={!form.prenom || !form.nom || !form.email} className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2" style={{ background: '#f2ca50', color: 'black' }} data-testid="acc-next-1">
              Choisir le type <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Type selection */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 mt-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-400">Type d'accreditation</h3>
            {Object.entries(types).map(([id, type]) => (
              <motion.button key={id} whileTap={{ scale: 0.98 }} onClick={() => updateForm('type_accreditation', id)} className="w-full p-4 rounded-2xl text-left flex items-center justify-between" style={{
                background: form.type_accreditation === id ? 'rgba(242,202,80,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${form.type_accreditation === id ? 'rgba(242,202,80,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }} data-testid={`acc-type-${id}`}>
                <div>
                  <div className="text-sm font-bold text-white">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {type.price > 0 ? `${type.price}€` : 'Gratuit'}
                    {type.nfc && ' — Badge NFC inclus'}
                  </div>
                </div>
                {form.type_accreditation === id && <CheckCircle className="w-5 h-5" style={{ color: '#f2ca50' }} />}
              </motion.button>
            ))}

            {error && <div className="text-xs text-red-400 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={!form.type_accreditation || submitting} className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2" style={{ background: submitting ? '#333' : '#f2ca50', color: 'black' }} data-testid="acc-submit">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Soumettre la demande</>}
            </motion.button>
          </motion.div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mt-8 text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4" style={{ color: '#f2ca50' }} />
            <h3 className="text-lg font-bold text-white mb-2">Paiement requis</h3>
            <p className="text-sm text-gray-400 mb-6">{selectedType.label || result?.type_label} — {result?.prix || selectedType.price}€</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handlePayment} disabled={submitting} className="w-full py-4 rounded-xl text-sm font-bold tracking-widest uppercase" style={{ background: '#f2ca50', color: 'black' }} data-testid="acc-pay">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Payer par carte'}
            </motion.button>
          </motion.div>
        )}

        {/* Step 4: Submitted */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4" style={{ color: '#f2ca50' }} />
            <h3 className="text-lg font-bold text-white mb-2">Demande soumise</h3>
            <p className="text-sm text-gray-400 mb-2">Votre demande est en cours de validation.</p>
            <p className="text-xs text-gray-600">ID: {result?.accreditation_id || existing?.accreditation_id}</p>
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
              <p className="text-xs text-gray-400">Vous recevrez une notification lorsque votre accreditation sera validee par l'equipe CC2026.</p>
            </div>
          </motion.div>
        )}

        {/* Step 5: Under review */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4" style={{ color: '#f2ca50' }} />
            <h3 className="text-lg font-bold text-white mb-2">En cours de validation</h3>
            <p className="text-sm text-gray-400">L'equipe CC2026 examine votre demande.</p>
            {(existing?.statut === 'REFUSEE') && (
              <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                <p className="text-xs text-red-400">Demande refusee : {existing.motif_refus || 'Pas de motif specifie'}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 6: Badge generated */}
        {step === 6 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 text-center">
            <QrCode className="w-16 h-16 mx-auto mb-4" style={{ color: '#f2ca50' }} />
            <h3 className="text-lg font-bold text-white mb-2">Badge genere !</h3>
            <div className="p-5 rounded-2xl mx-auto max-w-xs" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.15)' }}>
              <div className="text-xl font-mono font-bold mb-2" style={{ color: '#f2ca50' }}>{existing?.badge_id || result?.badge_id}</div>
              <div className="text-xs text-gray-400 mb-1">{existing?.prenom} {existing?.nom}</div>
              <div className="text-[10px] text-gray-600">{existing?.type_label}</div>
              {existing?.nfc_enabled && <span className="text-[8px] px-2 py-0.5 rounded-full mt-2 inline-block" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>NFC Active</span>}
            </div>
          </motion.div>
        )}

        {/* Step 7: Printed */}
        {step === 7 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 text-center">
            <Printer className="w-16 h-16 mx-auto mb-4" style={{ color: '#22c55e' }} />
            <h3 className="text-lg font-bold text-white mb-2">Badge imprime</h3>
            <p className="text-sm text-gray-400">Votre badge sera disponible a l'accueil CC2026.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline, testId }) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div>
      <label className="text-[10px] text-gray-500 tracking-widest uppercase mb-1.5 block">{label}</label>
      <Tag value={value} onChange={e => onChange(e.target.value)} rows={multiline ? 3 : undefined}
        className="w-full bg-white/5 text-sm px-4 py-2.5 rounded-xl outline-none text-white resize-none"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid={testId} />
    </div>
  );
}
