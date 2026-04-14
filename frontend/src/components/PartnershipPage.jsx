import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Check, Users, Globe, BarChart3, Mic2, MapPin, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Reveal, useIntersectionObserver } from '../hooks/useAnimations';
import HCaptchaWidget from './HCaptchaWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const partnerTiersData = {
  bronze: { 
    id: 'bronze',
    nameFr: 'Partenaire Bronze', 
    nameEn: 'Bronze Partner', 
    price: 2500, 
    vip: 2,
    featuresFr: ['Logo sur le site officiel', '2 accréditations VIP offertes', 'Mention sur les réseaux sociaux', 'Rapport post-événement'],
    featuresEn: ['Logo on official website', '2 complimentary VIP accreditations', 'Social media mention', 'Post-event report']
  },
  silver: { 
    id: 'silver',
    nameFr: 'Partenaire Silver', 
    nameEn: 'Silver Partner', 
    price: 5000, 
    vip: 5,
    popular: true,
    featuresFr: ['Tout le pack Bronze', 'Stand dédié au Marché Culturel', '5 accréditations VIP offertes', 'Prise de parole en plénière', 'Logo sur tous les supports'],
    featuresEn: ['All Bronze benefits', 'Dedicated stand at Cultural Market', '5 complimentary VIP accreditations', 'Plenary speaking slot', 'Logo on all materials']
  },
  gold: { 
    id: 'gold',
    nameFr: 'Partenaire Gold', 
    nameEn: 'Gold Partner', 
    price: 10000, 
    vip: 10,
    featuresFr: ['Tout le pack Silver', 'Co-branding événement', '10 accréditations VIP offertes', 'Keynote exclusive', 'Accès données & analytics', 'Partenariat média privilégié'],
    featuresEn: ['All Silver benefits', 'Event co-branding', '10 complimentary VIP accreditations', 'Exclusive keynote', 'Data & analytics access', 'Priority media partnership']
  }
};

// Animated Metric Card
const MetricCard = ({ metric, index }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.2 });
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div 
      ref={ref}
      className="p-6 border border-lightborder bg-cream text-center"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: prefersReducedMotion 
          ? 'opacity 0.3s ease-out' 
          : `opacity 0.5s ease-out ${index * 0.1}s, transform 0.5s ease-out ${index * 0.1}s`,
      }}
      data-testid={`metric-card-${index}`}
    >
      <p className="font-serif text-3xl text-terracotta mb-1">{metric.value}</p>
      <p className="text-sm text-charcoal/60">{metric.label}</p>
    </div>
  );
};

// Animated Benefit Card  
const BenefitCard = ({ benefit, index }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.2 });
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Icon = benefit.icon;

  return (
    <div 
      ref={ref}
      className="p-6 border border-lightborder bg-paper hover:border-terracotta transition-colors"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: prefersReducedMotion 
          ? 'opacity 0.3s ease-out' 
          : `opacity 0.5s ease-out ${index * 0.12}s, transform 0.5s ease-out ${index * 0.12}s`,
      }}
      data-testid={`benefit-card-${index}`}
    >
      <Icon className="w-8 h-8 text-sage mb-4" />
      <h3 className="font-serif text-lg text-charcoal mb-2">{benefit.title}</h3>
      <p className="text-sm text-charcoal/60">{benefit.desc}</p>
    </div>
  );
};

// Animated Partner Tier Card
const TierCard = ({ tier, index, selectedTier, onSelect, language }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.15 });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div 
      ref={ref}
      className={`p-8 border bg-cream transition-all duration-300 ${
        tier.popular ? 'border-terracotta' : 'border-lightborder'
      } ${selectedTier === tier.id ? 'ring-2 ring-sage' : ''} ${
        isHovered ? '-translate-y-1 shadow-lg' : ''
      }`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? (isHovered ? 'translateY(-4px)' : 'translateY(0)') 
          : 'translateY(40px)',
        transition: prefersReducedMotion 
          ? 'opacity 0.3s ease-out' 
          : `opacity 0.6s ease-out ${index * 0.15}s, transform 0.6s ease-out ${index * 0.15}s`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`tier-card-${tier.id}`}
    >
      {tier.popular && (
        <p className="text-terracotta font-syne text-xs tracking-widest uppercase mb-4">
          {language === 'fr' ? 'Recommandé' : 'Recommended'}
        </p>
      )}
      <h3 className="font-serif text-2xl text-charcoal mb-2">
        {language === 'fr' ? tier.nameFr : tier.nameEn}
      </h3>
      <p className="font-serif text-3xl text-terracotta mb-2">
        {tier.price.toLocaleString('fr-FR')}€
      </p>
      <p className="text-sm text-sage mb-6">
        {tier.vip} {language === 'fr' ? 'accréditations VIP offertes' : 'complimentary VIP accreditations'}
      </p>
      <ul className="space-y-2 mb-6">
        {(language === 'fr' ? tier.featuresFr : tier.featuresEn).map((f, j) => (
          <li 
            key={j} 
            className="flex items-start gap-2 text-sm text-charcoal/70"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-10px)',
              transition: prefersReducedMotion 
                ? 'opacity 0.2s' 
                : `opacity 0.4s ease-out ${(index * 0.15) + (j * 0.05)}s, transform 0.4s ease-out ${(index * 0.15) + (j * 0.05)}s`,
            }}
          >
            <Check className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Button
        onClick={() => onSelect(tier.id)}
        className={`w-full h-12 font-syne text-sm rounded-none ${
          selectedTier === tier.id 
            ? 'bg-sage text-paper' 
            : tier.popular 
              ? 'bg-terracotta text-paper hover:bg-terracotta/90' 
              : 'bg-charcoal text-paper hover:bg-charcoal/90'
        }`}
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {language === 'fr' ? 'Devenir partenaire' : 'Become a partner'}
      </Button>
    </div>
  );
};

export const PartnershipPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTier, setSelectedTier] = useState(null);
  const [formData, setFormData] = useState({ 
    company_name: '', 
    contact_name: '', 
    contact_email: '', 
    contact_phone: '',
    website: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [partnerCaptchaToken, setPartnerCaptchaToken] = useState(null);
  const partnerCaptchaRef = useRef(null);
  
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Pre-select tier when coming from BadgeInscription (Exposant flow)
  useEffect(() => {
    const pre = location.state?.preSelectedTier;
    if (pre && partnerTiersData[pre]) {
      setSelectedTier(pre);
      setShowPaymentForm(true);
      setTimeout(() => {
        document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location.state]);

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

  const tierToBadgeType = { bronze: 'EXP-B', silver: 'EXP-S', gold: 'EXP-G' };

  const handleSelectTier = (tierId) => {
    setSelectedTier(tierId);
    setShowPaymentForm(true);
    setTimeout(() => {
      document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmitPartnership = async (e) => {
    e.preventDefault();
    if (!selectedTier) {
      toast.error(language === 'fr' ? 'Veuillez sélectionner une formule' : 'Please select a package');
      return;
    }

    setIsSubmitting(true);
    try {
      const checkoutData = {
        type: "partnership",
        tier: selectedTier,
        origin_url: window.location.origin,
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website,
        captcha_token: partnerCaptchaToken
      };

      const response = await axios.post(`${API}/create-checkout-session`, checkoutData);

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la création du paiement' : 'Payment creation error');
      setIsSubmitting(false);
      setPartnerCaptchaToken(null);
      partnerCaptchaRef.current?.reset();
    }
  };

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32 overflow-hidden">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p 
              className="text-terracotta font-syne text-sm tracking-widest uppercase mb-4"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateX(0)' : 'translateX(-30px)',
                transition: prefersReducedMotion 
                  ? 'opacity 0.3s ease-out' 
                  : 'opacity 0.5s ease-out, transform 0.5s ease-out',
              }}
            >
              {language === 'fr' ? 'Programme Partenaires' : 'Partners Program'}
            </p>
            <h1 
              className="font-serif text-4xl sm:text-5xl text-charcoal mb-6"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(-30px)',
                transition: prefersReducedMotion 
                  ? 'opacity 0.3s ease-out' 
                  : 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
              }}
            >
              {language === 'fr' ? 'Investissez dans l\'avenir de la culture caribéenne' : 'Invest in the future of Caribbean culture'}
            </h1>
            <p 
              className="text-charcoal/70 font-body text-lg"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: prefersReducedMotion 
                  ? 'opacity 0.3s ease-out' 
                  : 'opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s',
              }}
            >
              {language === 'fr'
                ? 'Rejoignez les acteurs majeurs qui façonnent l\'industrie culturelle afro-descendante.'
                : 'Join the major players shaping the Afro-descendant cultural industry.'
              }
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16">
            {impactMetrics.map((m, i) => (
              <MetricCard key={i} metric={m} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl text-charcoal">
                {language === 'fr' ? 'Pourquoi devenir partenaire ?' : 'Why become a partner?'}
              </h2>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <BenefitCard key={i} benefit={b} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl text-charcoal">
                {language === 'fr' ? 'Formules Partenariat' : 'Partnership Packages'}
              </h2>
            </div>
          </Reveal>
          <div className="grid lg:grid-cols-3 gap-6">
            {Object.values(partnerTiersData).map((tier, index) => (
              <TierCard 
                key={tier.id}
                tier={tier}
                index={index}
                selectedTier={selectedTier}
                onSelect={handleSelectTier}
                language={language}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Payment Form */}
      {showPaymentForm && selectedTier && (
        <Reveal>
          <section id="payment-form" className="py-16 sm:py-24 bg-cream">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="border border-lightborder bg-paper p-8">
                <div className="text-center mb-8">
                  <h2 className="font-serif text-2xl text-charcoal mb-2">
                    {language === 'fr' ? 'Finaliser votre partenariat' : 'Complete your partnership'}
                  </h2>
                  <div className="inline-flex items-center gap-3 px-4 py-2 border border-sage/30 bg-sage/5">
                    <span className="text-sage font-syne text-sm">
                      {language === 'fr' ? partnerTiersData[selectedTier].nameFr : partnerTiersData[selectedTier].nameEn}
                    </span>
                    <span className="text-charcoal/40">—</span>
                    <span className="text-charcoal font-medium">{partnerTiersData[selectedTier].price.toLocaleString('fr-FR')}€</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitPartnership} className="space-y-5">
                  <div>
                    <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                      {language === 'fr' ? 'Nom de l\'entreprise' : 'Company name'} *
                    </label>
                    <Input
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      className="h-12 bg-cream border-lightborder text-charcoal rounded-none"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                        {language === 'fr' ? 'Nom du contact' : 'Contact name'} *
                      </label>
                      <Input
                        required
                        value={formData.contact_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                        className="h-12 bg-cream border-lightborder text-charcoal rounded-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        required
                        value={formData.contact_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                        className="h-12 bg-cream border-lightborder text-charcoal rounded-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                        {language === 'fr' ? 'Téléphone' : 'Phone'}
                      </label>
                      <Input
                        value={formData.contact_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                        className="h-12 bg-cream border-lightborder text-charcoal rounded-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                        {language === 'fr' ? 'Site web' : 'Website'}
                      </label>
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://"
                        className="h-12 bg-cream border-lightborder text-charcoal rounded-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 bg-sage text-paper font-syne text-base rounded-none"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          {language === 'fr' ? 'Procéder au paiement' : 'Proceed to payment'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-charcoal/50 text-center mt-3">
                      {language === 'fr' 
                        ? 'Paiement sécurisé par Stripe. Vous serez redirigé vers la page de paiement.'
                        : 'Secure payment by Stripe. You will be redirected to the payment page.'
                      }
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Contact Info */}
      <Reveal>
        <section className="py-16 sm:py-24 bg-paper">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-2xl text-charcoal mb-6">
              {language === 'fr' ? 'Des questions ?' : 'Questions?'}
            </h2>
            <p className="text-charcoal/70 mb-8">
              {language === 'fr'
                ? 'Notre équipe est disponible pour discuter de vos besoins spécifiques.'
                : 'Our team is available to discuss your specific needs.'
              }
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-charcoal/60">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Fort-de-France, Martinique</p>
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> 20-23 Mai 2026</p>
            </div>
            <p className="mt-6">
              <a href="mailto:cultureconnectorg@gmail.com" className="text-terracotta hover:underline font-syne">
                cultureconnectorg@gmail.com
              </a>
            </p>
          </div>
        </section>
      </Reveal>
    </div>
  );
};
