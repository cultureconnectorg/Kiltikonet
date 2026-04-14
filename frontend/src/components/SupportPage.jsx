import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Send, CheckCircle, MessageSquare, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Reveal } from '../hooks/useAnimations';

const API = process.env.REACT_APP_BACKEND_URL;

export const SupportPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: '', category: 'general'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const categories = [
    { value: 'general', fr: 'Question générale', en: 'General question' },
    { value: 'complaint', fr: 'Réclamation', en: 'Complaint' },
    { value: 'technical', fr: 'Problème technique', en: 'Technical issue' },
    { value: 'billing', fr: 'Facturation / Paiement', en: 'Billing / Payment' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error(language === 'fr' ? 'Veuillez remplir les champs obligatoires' : 'Please fill in required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitted(data.ticket_id);
        toast.success(language === 'fr' ? 'Votre demande a été enregistrée' : 'Your request has been submitted');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Erreur');
      }
    } catch {
      toast.error(language === 'fr' ? 'Erreur de connexion' : 'Connection error');
    }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-paper pt-24 sm:pt-32" data-testid="support-page">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 text-center">
          <Reveal>
            <div className="border border-sage/30 bg-sage/5 p-10">
              <CheckCircle className="w-12 h-12 text-sage mx-auto mb-4" />
              <h2 className="font-serif text-2xl text-charcoal mb-3">
                {language === 'fr' ? 'Demande envoyée' : 'Request submitted'}
              </h2>
              <p className="text-charcoal/60 text-sm mb-4">
                {language === 'fr'
                  ? 'Nous avons bien reçu votre message. Notre équipe vous répondra dans les plus brefs délais.'
                  : 'We have received your message. Our team will respond as soon as possible.'}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal/5 border border-lightborder mb-6">
                <span className="text-xs text-charcoal/50">{language === 'fr' ? 'Référence' : 'Reference'} :</span>
                <span className="text-sm font-mono font-bold text-charcoal">{submitted}</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button onClick={() => navigate('/')} className="h-11 px-6 bg-charcoal text-paper rounded-none font-syne">
                  {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
                </Button>
                <Button onClick={() => { setSubmitted(null); setFormData({ name: '', email: '', subject: '', message: '', category: 'general' }); }}
                  variant="outline" className="h-11 px-6 border-terracotta text-terracotta rounded-none font-syne">
                  {language === 'fr' ? 'Nouveau message' : 'New message'}
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32" data-testid="support-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-charcoal/50 hover:text-terracotta mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> {language === 'fr' ? 'Retour' : 'Back'}
          </button>

          <div className="text-center mb-10">
            <p className="text-terracotta font-syne text-sm tracking-widest uppercase mb-4">
              {language === 'fr' ? 'Support' : 'Support'}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-charcoal mb-3">
              {language === 'fr' ? 'Contactez-nous' : 'Contact us'}
            </h1>
            <p className="text-charcoal/60 text-sm">
              {language === 'fr'
                ? 'Une question, une réclamation ou un problème technique ? Nous sommes là pour vous aider.'
                : 'A question, complaint or technical issue? We\'re here to help.'}
            </p>
          </div>
        </Reveal>

        <div className="border border-lightborder bg-paper p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                  {language === 'fr' ? 'Nom complet' : 'Full name'} *
                </label>
                <Input
                  required value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="h-12 bg-cream border-lightborder text-charcoal rounded-none"
                  data-testid="support-name"
                />
              </div>
              <div>
                <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">Email *</label>
                <Input
                  type="email" required value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="h-12 bg-cream border-lightborder text-charcoal rounded-none"
                  data-testid="support-email"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                  {language === 'fr' ? 'Catégorie' : 'Category'}
                </label>
                <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="h-12 bg-cream border-lightborder rounded-none" data-testid="support-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-paper border-lightborder">
                    {categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        {language === 'fr' ? c.fr : c.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                  {language === 'fr' ? 'Sujet' : 'Subject'}
                </label>
                <Input
                  value={formData.subject}
                  onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                  className="h-12 bg-cream border-lightborder text-charcoal rounded-none"
                  data-testid="support-subject"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                {language === 'fr' ? 'Votre message' : 'Your message'} *
              </label>
              <Textarea
                required value={formData.message}
                onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                className="bg-cream border-lightborder text-charcoal rounded-none min-h-[150px]"
                placeholder={language === 'fr' ? 'Décrivez votre demande en détail...' : 'Describe your request in detail...'}
                data-testid="support-message"
              />
            </div>

            <Button
              type="submit" disabled={submitting}
              className="w-full h-14 bg-terracotta hover:bg-terracotta/90 text-paper font-syne text-base rounded-none"
              data-testid="support-submit"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {language === 'fr' ? 'Envoyer ma demande' : 'Send my request'}
                </>
              )}
            </Button>

            <p className="text-xs text-charcoal/40 text-center">
              {language === 'fr'
                ? 'Vous pouvez aussi nous écrire directement à contact@kiltikonet.fr'
                : 'You can also write directly to contact@kiltikonet.fr'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
