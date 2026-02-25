import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Check, Send, Users, Globe, BarChart3, Mic2, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export const PartnershipPage = () => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({ company: '', name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to form if coming from "Devenir partenaire" link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#contact-form') {
      setTimeout(() => {
        document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  const impactMetrics = [
    { value: '200+', label: language === 'fr' ? 'Participants' : 'Participants' },
    { value: '5', label: language === 'fr' ? 'Territoires' : 'Territories' },
    { value: '40-60', label: 'Stands' },
    { value: '4', label: language === 'fr' ? 'Jours' : 'Days' }
  ];

  const benefits = [
    { icon: Globe, title: language === 'fr' ? 'Visibilité Premium' : 'Premium Visibility', desc: language === 'fr' ? 'Logo sur tous les supports officiels' : 'Logo on all official materials' },
    { icon: Mic2, title: language === 'fr' ? 'Prise de Parole' : 'Speaking Slot', desc: language === 'fr' ? 'Intervention en plénière' : 'Plenary intervention' },
    { icon: Users, title: language === 'fr' ? 'Accès Réseau' : 'Network Access', desc: language === 'fr' ? 'Base de données B2B complète' : 'Complete B2B database' },
    { icon: BarChart3, title: 'Data & Insights', desc: language === 'fr' ? 'Rapport post-événement exclusif' : 'Exclusive post-event report' }
  ];

  const partnerTiers = [
    { name: language === 'fr' ? 'Argent' : 'Silver', price: '2 500€', features: language === 'fr' ? ['Logo digital', '2 VIP', 'Réseaux sociaux'] : ['Digital logo', '2 VIP', 'Social media'] },
    { name: language === 'fr' ? 'Or' : 'Gold', price: '5 000€', popular: true, features: language === 'fr' ? ['Pack Argent', 'Stand dédié', '5 VIP', 'Prise de parole'] : ['Silver pack', 'Dedicated stand', '5 VIP', 'Speaking slot'] },
    { name: language === 'fr' ? 'Platine' : 'Platinum', price: '10 000€', features: language === 'fr' ? ['Pack Or', 'Co-branding', 'VIP illimités', 'Keynote'] : ['Gold pack', 'Co-branding', 'Unlimited VIP', 'Keynote'] }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(language === 'fr' ? 'Demande envoyée !' : 'Request sent!');
    setFormData({ company: '', name: '', email: '', phone: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-terracotta font-syne text-sm tracking-widest uppercase mb-4">
              {language === 'fr' ? 'Programme Partenaires' : 'Partners Program'}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-6">
              {language === 'fr' ? 'Investissez dans l\'avenir de la culture caribéenne' : 'Invest in the future of Caribbean culture'}
            </h1>
            <p className="text-charcoal/70 font-body text-lg">
              {language === 'fr'
                ? 'Rejoignez les acteurs majeurs qui façonnent l\'industrie culturelle afro-descendante.'
                : 'Join the major players shaping the Afro-descendant cultural industry.'
              }
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16">
            {impactMetrics.map((m, i) => (
              <div key={i} className="p-6 border border-lightborder bg-cream text-center">
                <p className="font-serif text-3xl text-terracotta mb-1">{m.value}</p>
                <p className="text-sm text-charcoal/60">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl text-charcoal">
              {language === 'fr' ? 'Pourquoi devenir partenaire ?' : 'Why become a partner?'}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="p-6 border border-lightborder bg-paper">
                <b.icon className="w-8 h-8 text-sage mb-4" />
                <h3 className="font-serif text-lg text-charcoal mb-2">{b.title}</h3>
                <p className="text-sm text-charcoal/60">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl text-charcoal">
              {language === 'fr' ? 'Formules Partenariat' : 'Partnership Packages'}
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {partnerTiers.map((t, i) => (
              <div key={i} className={`p-8 border bg-cream ${t.popular ? 'border-terracotta' : 'border-lightborder'}`}>
                {t.popular && (
                  <p className="text-terracotta font-syne text-xs tracking-widest uppercase mb-4">
                    {language === 'fr' ? 'Recommandé' : 'Recommended'}
                  </p>
                )}
                <h3 className="font-serif text-2xl text-charcoal mb-2">{t.name}</h3>
                <p className="font-serif text-3xl text-terracotta mb-6">{t.price}</p>
                <ul className="space-y-2 mb-6">
                  {t.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-charcoal/70">
                      <Check className="w-4 h-4 text-sage" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className={`w-full h-12 font-syne text-sm rounded-none ${t.popular ? 'bg-terracotta text-paper' : 'bg-charcoal text-paper'}`}
                >
                  {language === 'fr' ? 'Nous contacter' : 'Contact us'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-16 sm:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="font-serif text-3xl text-charcoal mb-6">
                {language === 'fr' ? 'Discutons de votre partenariat' : 'Let\'s discuss your partnership'}
              </h2>
              <p className="text-charcoal/70 mb-8">
                {language === 'fr'
                  ? 'Notre équipe vous contactera sous 48h pour construire ensemble une offre sur mesure.'
                  : 'Our team will contact you within 48h to build a custom offer together.'
                }
              </p>
              <div className="space-y-3 text-charcoal/60">
                <p className="flex items-center gap-3"><MapPin className="w-4 h-4" /> Fort-de-France, Martinique</p>
                <p className="flex items-center gap-3"><Calendar className="w-4 h-4" /> 20-23 Mai 2026</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                placeholder={language === 'fr' ? 'Nom de l\'entreprise *' : 'Company name *'}
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                required
                className="h-12 bg-paper border-lightborder text-charcoal placeholder:text-charcoal/40 rounded-none"
              />
              <Input
                placeholder={language === 'fr' ? 'Votre nom *' : 'Your name *'}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="h-12 bg-paper border-lightborder text-charcoal placeholder:text-charcoal/40 rounded-none"
              />
              <Input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="h-12 bg-paper border-lightborder text-charcoal placeholder:text-charcoal/40 rounded-none"
              />
              <Textarea
                placeholder={language === 'fr' ? 'Vos objectifs...' : 'Your objectives...'}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="bg-paper border-lightborder text-charcoal placeholder:text-charcoal/40 min-h-[100px] rounded-none"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-terracotta text-paper font-syne text-sm rounded-none"
              >
                <Send className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Envoyer ma demande' : 'Send my request'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
