import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Award, BarChart3, Fingerprint, MapPin, Calendar, Mail,
  ChevronRight, Download, FileText, Globe, Users, Briefcase,
  Palette, Building2, CheckCircle, ArrowDown, ExternalLink, Clock, Send, AlertCircle
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const TERRITORIES = ['Martinique', 'Caraibes', 'Diaspora FR', 'Amerique Latine', 'Afrique', 'Autre'];
const PROFILES = ['Artiste', 'Association culturelle', 'Entreprise culturelle'];
const FORMATS = ['Conference/table ronde', 'Atelier/workshop', 'Performance scenique'];

const CRITERIA = [
  { id: 'C1', name: 'Impact territorial', pct: '25%', desc: 'Impact culturel reel et documentable sur un territoire caribeen ou diaspora.' },
  { id: 'C2', name: 'Portee diaspora', pct: '20%', desc: 'Liens entre la Martinique, les Caraibes et la diaspora.' },
  { id: 'C3', name: 'Transmission', pct: '20%', desc: 'Formation, mediation ou transmission culturelle.' },
  { id: 'C4', name: 'Innovation culturelle', pct: '20%', desc: 'Approche nouvelle dans la forme, le modele ou les outils.' },
  { id: 'C5', name: 'Contribution CC', pct: '15%', desc: 'Adoption du framework Culture Connect.' },
];

const TIMELINE = [
  { date: '15 avril', label: 'Ouverture de l\'appel', active: true },
  { date: '30 avril', label: 'Date limite de candidature', active: false },
  { date: '10 mai', label: 'Annonce des laureats', active: false },
  { date: '20-23 mai', label: 'Chimin Savann', active: false },
  { date: '23 mai', label: 'Publication des scores', active: false },
];

const LAUREATE_CARDS = [
  { icon: Award, title: 'Label CC Certified', desc: 'Reconnaissance publique permanente, associee aux supports de communication du projet.' },
  { icon: BarChart3, title: 'Cultural Impact Score', desc: 'Evaluation proprietaire du CIP, publiee sur kiltikonet.fr le 23 mai 2026.' },
  { icon: Fingerprint, title: 'FREK-ID', desc: 'Empreinte numerique unique integree a l\'infrastructure CVLN, permanente et portable.' },
  { icon: MapPin, title: 'Presence a Chimin Savann', desc: 'Integration au programme officiel : conference, atelier ou performance scenique.' },
];

const ELIGIBLE_CARDS = [
  { icon: Palette, title: 'Artistes & createurs', desc: 'Musiciens, plasticiens, auteurs, choregraphes, cineastes, designers culturels.' },
  { icon: Building2, title: 'Associations culturelles', desc: 'Compagnies de danse, collectifs artistiques, reseaux diaspora.' },
  { icon: Briefcase, title: 'Entreprises culturelles', desc: 'Labels musicaux, maisons d\'edition, agences creatives, studios audiovisuels.' },
];

const AppelPage = () => {
  const formRef = useRef(null);
  const [form, setForm] = useState({
    nom_complet: '', email: '', organisation: '', territoire: '', profil: '',
    nom_projet: '', description_projet: '', impact_culturel: '', lien_web: '',
    format_souhaite: '', engagement_cc: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.engagement_cc) { toast.error('Veuillez accepter l\'engagement Culture Connect'); return; }
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/api/candidatures/cc2026`, form);
      setSubmitted(true);
      setRefId(data.id);
      toast.success('Candidature envoyee avec succes !');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'envoi');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white" data-testid="appel-page">
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4A3AB7 0%, #2D1F8C 60%, #0F6E56 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
        <div className="max-w-5xl mx-auto px-6 py-20 sm:py-28 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-0.5 bg-white/40" />
            <span className="text-white/60 text-sm tracking-widest uppercase">Kilti Konet</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4" data-testid="appel-hero-title">
            Appel a projet<br />Culture Connect 2026
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-2">
            Chimin Savann &middot; La Savane, Fort-de-France &middot; 20 - 23 mai 2026
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-white text-sm mt-3 mb-8">
            <Clock size={14} /> Date limite : <strong>30 avril 2026</strong>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button onClick={scrollToForm} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#4A3AB7] font-bold rounded-full hover:bg-white/90 transition-all text-sm" data-testid="cta-candidater">
              <Send size={16} /> Candidater en ligne <ArrowDown size={14} />
            </button>
            <a href={`${API}/api/docs/AAP_CahierDesCharges_FR.docx`} className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white/40 text-white rounded-full hover:bg-white/10 transition-all text-sm" data-testid="cta-download-fr">
              <Download size={16} /> Cahier des charges (FR)
            </a>
          </div>
          <div className="flex gap-3 mt-3">
            <a href={`${API}/api/docs/AAP_CultureConnect2026_EN.docx`} className="inline-flex items-center gap-1.5 px-4 py-2 text-white/60 text-xs hover:text-white/90 transition-colors">
              <Globe size={12} /> English version
            </a>
            <a href={`${API}/api/docs/AAP_CultureConnect2026_KW.docx`} className="inline-flex items-center gap-1.5 px-4 py-2 text-white/60 text-xs hover:text-white/90 transition-colors">
              <Globe size={12} /> Vèsyon kreyòl
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 1 — Qui sommes-nous */}
      <section className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-6">Qui sommes-nous</h2>
        <div className="space-y-4 text-[#444] leading-relaxed">
          <p><strong style={{ color: '#0F6E56' }}>Kilti Konet</strong> est l'association qui porte Culture Connect en Martinique.</p>
          <p><strong style={{ color: '#4A3AB7' }}>Culture Connect</strong> est un standard de mesure de l'impact culturel caribeen.</p>
          <p>Cet appel selectionne <strong>3 a 5 projets</strong> pour integrer l'ecosysteme CC lors de <strong>Chimin Savann</strong>.</p>
        </div>
      </section>

      {/* SECTION 2 — Ce que recoivent les laureats */}
      <section className="bg-[#FAFAFA] py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-8">Ce que recoivent les laureats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LAUREATE_CARDS.map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-[#eee] hover:shadow-lg hover:border-[#4A3AB7]/30 transition-all" data-testid={`laureate-card-${i}`}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#4A3AB7' + '15' }}>
                  <c.icon size={20} style={{ color: '#4A3AB7' }} />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-1.5">{c.title}</h3>
                <p className="text-xs text-[#666] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — Qui peut candidater */}
      <section className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-8">Qui peut candidater</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {ELIGIBLE_CARDS.map((c, i) => (
            <div key={i} className="rounded-xl p-6 border-2 border-[#0F6E56]/20 hover:border-[#0F6E56]/50 transition-all" data-testid={`eligible-card-${i}`}>
              <c.icon size={28} className="mb-3" style={{ color: '#0F6E56' }} />
              <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{c.title}</h3>
              <p className="text-sm text-[#666]">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#0F6E56]/5 rounded-lg p-4 border border-[#0F6E56]/20">
          <p className="text-sm text-[#444] leading-relaxed">
            <Globe size={14} className="inline mr-1.5 -mt-0.5" style={{ color: '#0F6E56' }} />
            Vous pouvez venir de partout — Martinique, Caraibes, diaspora, Amerique Latine, Afrique. Ce qui compte : <strong>l'impact culturel de votre projet</strong>.
          </p>
        </div>
      </section>

      {/* SECTION 4 — Criteres */}
      <section className="bg-[#FAFAFA] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-8">Criteres de selection</h2>
          <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
            {CRITERIA.map((c, i) => (
              <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i < CRITERIA.length - 1 ? 'border-b border-[#f0f0f0]' : ''}`} data-testid={`criteria-row-${i}`}>
                <span className="text-xs font-bold text-[#4A3AB7] bg-[#4A3AB7]/10 px-2 py-1 rounded w-8 text-center flex-shrink-0">{c.id}</span>
                <div className="flex-1">
                  <span className="text-sm font-bold text-[#1A1A1A]">{c.name}</span>
                  <p className="text-xs text-[#888] mt-0.5">{c.desc}</p>
                </div>
                <div className="flex-shrink-0 w-16 text-right">
                  <span className="text-lg font-bold" style={{ color: '#4A3AB7' }}>{c.pct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — Formulaire */}
      <section ref={formRef} className="max-w-3xl mx-auto px-6 py-16 sm:py-20" id="formulaire">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-8">Formulaire de candidature</h2>

        {submitted ? (
          <div className="bg-[#0F6E56]/10 border-2 border-[#0F6E56]/30 rounded-xl p-8 text-center" data-testid="form-success">
            <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#0F6E56' }} />
            <h3 className="text-xl font-bold text-[#0F6E56] mb-2">Candidature envoyee !</h3>
            <p className="text-[#444] mb-2">Votre dossier a ete enregistre avec la reference :</p>
            <p className="text-lg font-mono font-bold text-[#4A3AB7] bg-[#4A3AB7]/10 inline-block px-4 py-2 rounded">{refId}</p>
            <p className="text-sm text-[#888] mt-4">Un email de confirmation vous a ete envoye. Les resultats seront annonces le 10 mai 2026.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" data-testid="candidature-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nom complet" required>
                <input type="text" required value={form.nom_complet} onChange={e => set('nom_complet', e.target.value)} className="form-input" placeholder="Prenom Nom" data-testid="field-nom" />
              </Field>
              <Field label="Email" required>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className="form-input" placeholder="email@exemple.com" data-testid="field-email" />
              </Field>
            </div>
            <Field label="Organisation / structure">
              <input type="text" value={form.organisation} onChange={e => set('organisation', e.target.value)} className="form-input" placeholder="Optionnel" data-testid="field-organisation" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Territoire d'ancrage du projet" required>
                <select required value={form.territoire} onChange={e => set('territoire', e.target.value)} className="form-input" data-testid="field-territoire">
                  <option value="">Selectionner...</option>
                  {TERRITORIES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Profil" required>
                <select required value={form.profil} onChange={e => set('profil', e.target.value)} className="form-input" data-testid="field-profil">
                  <option value="">Selectionner...</option>
                  {PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Nom du projet" required>
              <input type="text" required value={form.nom_projet} onChange={e => set('nom_projet', e.target.value)} className="form-input" placeholder="Le nom de votre projet culturel" data-testid="field-projet" />
            </Field>
            <Field label="Description du projet" required count={form.description_projet.length} max={1500}>
              <textarea required maxLength={1500} rows={5} value={form.description_projet} onChange={e => set('description_projet', e.target.value)} className="form-input resize-none" placeholder="Decrivez votre projet, ses objectifs, son public..." data-testid="field-description" />
            </Field>
            <Field label="Impact culturel — decrivez l'impact existant ou projete" required count={form.impact_culturel.length} max={1000}>
              <textarea required maxLength={1000} rows={4} value={form.impact_culturel} onChange={e => set('impact_culturel', e.target.value)} className="form-input resize-none" placeholder="Quel est l'impact culturel de votre projet ?" data-testid="field-impact" />
            </Field>
            <Field label="Lien web ou reseaux sociaux du projet">
              <input type="url" value={form.lien_web} onChange={e => set('lien_web', e.target.value)} className="form-input" placeholder="https://..." data-testid="field-lien" />
            </Field>
            <Field label="Format souhaite a Chimin Savann" required>
              <select required value={form.format_souhaite} onChange={e => set('format_souhaite', e.target.value)} className="form-input" data-testid="field-format">
                <option value="">Selectionner...</option>
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <div className="bg-[#4A3AB7]/5 rounded-lg p-4 border border-[#4A3AB7]/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.engagement_cc} onChange={e => set('engagement_cc', e.target.checked)} className="mt-1 w-4 h-4 accent-[#4A3AB7]" data-testid="field-engagement" />
                <span className="text-sm text-[#444] leading-relaxed">
                  J'accepte le framework Culture Connect et la publication de mon Cultural Impact Score le 23 mai 2026.
                  <span className="text-red-500 ml-0.5">*</span>
                </span>
              </label>
            </div>
            <button type="submit" disabled={submitting} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 text-white font-bold rounded-full text-sm transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #4A3AB7, #0F6E56)' }} data-testid="submit-candidature">
              {submitting ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={16} />}
              {submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
            </button>
          </form>
        )}
      </section>

      {/* SECTION 6 — Calendrier */}
      <section className="bg-[#FAFAFA] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-10">Calendrier</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-[#4A3AB7]/20" />
            <div className="space-y-6">
              {TIMELINE.map((t, i) => (
                <div key={i} className="flex items-start gap-4 sm:gap-6 relative" data-testid={`timeline-step-${i}`}>
                  <div className={`w-8 sm:w-12 h-8 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${t.active ? 'bg-[#4A3AB7] shadow-lg' : 'bg-white border-2 border-[#4A3AB7]/30'}`}>
                    <Calendar size={14} className={t.active ? 'text-white' : 'text-[#4A3AB7]/50'} />
                  </div>
                  <div className="pt-1 sm:pt-2.5">
                    <span className="text-sm font-bold" style={{ color: '#4A3AB7' }}>{t.date}</span>
                    <p className="text-sm text-[#444] mt-0.5">{t.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — Contact */}
      <section className="py-16 sm:py-20" style={{ background: 'linear-gradient(135deg, #4A3AB7, #0F6E56)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Contact</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a href="mailto:appel2026@kiltikonet.fr" className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
              <Mail size={18} /> appel2026@kiltikonet.fr
            </a>
            <a href="https://kiltikonet.fr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
              <ExternalLink size={18} /> kiltikonet.fr
            </a>
          </div>
          <p className="text-white/50 text-xs mt-8">Kilti Konet — Association loi 1901 | Cultural Impact Program | Culture Connect 2026</p>
        </div>
      </section>

      <style>{`
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          color: #1A1A1A;
          background: #fff;
          transition: border-color 0.2s;
          outline: none;
        }
        .form-input:focus {
          border-color: #4A3AB7;
          box-shadow: 0 0 0 3px rgba(74,58,183,0.1);
        }
        .form-input::placeholder { color: #bbb; }
      `}</style>
    </div>
  );
};

const Field = ({ label, required, children, count, max }) => (
  <div>
    <label className="block text-sm font-medium text-[#333] mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {count !== undefined && max && (
      <p className={`text-xs mt-1 text-right ${count > max * 0.9 ? 'text-red-500' : 'text-[#bbb]'}`}>{count}/{max}</p>
    )}
  </div>
);

export default AppelPage;
