import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  TrendingUp, Users, Globe, Award, Handshake, 
  BarChart3, Eye, Network, Send, Check, Star,
  Building2, Mic2, Calendar, MapPin, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export const PartnershipPage = () => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const impactMetrics = [
    { 
      value: '200+', 
      label: language === 'fr' ? 'Participants attendus' : 'Expected participants',
      icon: Users 
    },
    { 
      value: '5', 
      label: language === 'fr' ? 'Territoires connectés' : 'Connected territories',
      icon: Globe 
    },
    { 
      value: '40-60', 
      label: language === 'fr' ? 'Stands au Marché' : 'Market stands',
      icon: Building2 
    },
    { 
      value: '4', 
      label: language === 'fr' ? 'Jours d\'événement' : 'Event days',
      icon: Calendar 
    }
  ];

  const visibilityBenefits = [
    {
      icon: Eye,
      title: language === 'fr' ? 'Visibilité Premium' : 'Premium Visibility',
      description: language === 'fr' 
        ? 'Logo sur tous les supports officiels, signalétique événement, communications digitales'
        : 'Logo on all official materials, event signage, digital communications'
    },
    {
      icon: Mic2,
      title: language === 'fr' ? 'Prise de Parole' : 'Speaking Opportunities',
      description: language === 'fr'
        ? 'Intervention en plénière, modération de table ronde, pitch session dédiée'
        : 'Plenary intervention, roundtable moderation, dedicated pitch session'
    },
    {
      icon: Network,
      title: language === 'fr' ? 'Accès Réseau' : 'Network Access',
      description: language === 'fr'
        ? 'Base de données B2B complète, networking VIP, rendez-vous personnalisés'
        : 'Complete B2B database, VIP networking, personalized meetings'
    },
    {
      icon: BarChart3,
      title: language === 'fr' ? 'Data & Insights' : 'Data & Insights',
      description: language === 'fr'
        ? 'Rapport post-événement exclusif, analytics participants, tendances marché'
        : 'Exclusive post-event report, participant analytics, market trends'
    }
  ];

  const partnerTiers = [
    {
      name: language === 'fr' ? 'PARTENAIRE ARGENT' : 'SILVER PARTNER',
      price: '2 500€',
      color: '#C0C0C0',
      features: language === 'fr' ? [
        'Logo sur supports digitaux',
        '2 accréditations VIP',
        'Mention réseaux sociaux',
        'Accès networking B2B'
      ] : [
        'Logo on digital materials',
        '2 VIP accreditations',
        'Social media mention',
        'B2B networking access'
      ]
    },
    {
      name: language === 'fr' ? 'PARTENAIRE OR' : 'GOLD PARTNER',
      price: '5 000€',
      color: '#D2A53C',
      popular: true,
      features: language === 'fr' ? [
        'Tout Partenaire Argent',
        'Stand dédié au Marché',
        '5 accréditations VIP',
        'Prise de parole 10 min',
        'Logo sur kakémonos'
      ] : [
        'All Silver Partner benefits',
        'Dedicated Market stand',
        '5 VIP accreditations',
        '10 min speaking slot',
        'Logo on banners'
      ]
    },
    {
      name: language === 'fr' ? 'PARTENAIRE PLATINE' : 'PLATINUM PARTNER',
      price: '10 000€',
      color: '#00d4ff',
      features: language === 'fr' ? [
        'Tout Partenaire Or',
        'Co-branding événement',
        'Accréditations illimitées',
        'Keynote 20 min',
        'Accès données exclusif',
        'Interview média'
      ] : [
        'All Gold Partner benefits',
        'Event co-branding',
        'Unlimited accreditations',
        '20 min keynote',
        'Exclusive data access',
        'Media interview'
      ]
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(language === 'fr' 
      ? 'Demande envoyée ! Nous vous contacterons sous 48h.'
      : 'Request sent! We will contact you within 48h.'
    );
    setFormData({ company: '', name: '', email: '', phone: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 sm:pt-24 overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-[#D2A53C]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#C0C0C0]/5 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D2A53C]/10 border border-[#D2A53C]/20 rounded-full mb-6">
              <Handshake className="w-4 h-4 text-[#D2A53C]" />
              <span className="text-sm text-[#D2A53C]">
                {language === 'fr' ? 'Programme Partenaires 2026' : 'Partners Program 2026'}
              </span>
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
              {language === 'fr' ? 'Investissez dans l\'avenir' : 'Invest in the future'}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#C0C0C0] via-[#D2A53C] to-[#00d4ff]">
                {language === 'fr' ? 'de la Culture Caribéenne' : 'of Caribbean Culture'}
              </span>
            </h1>
            
            <p className="text-lg text-white/60 max-w-3xl mx-auto">
              {language === 'fr'
                ? 'Rejoignez les acteurs majeurs qui façonnent l\'industrie culturelle afro-descendante. Visibilité premium, réseau exclusif, impact mesurable.'
                : 'Join the major players shaping the Afro-descendant cultural industry. Premium visibility, exclusive network, measurable impact.'
              }
            </p>
          </div>

          {/* Impact Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {impactMetrics.map((metric, index) => (
              <div 
                key={index}
                className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-6 text-center"
              >
                <metric.icon className="w-8 h-8 text-[#D2A53C] mx-auto mb-3" />
                <p className="text-4xl font-bold text-white mb-1">{metric.value}</p>
                <p className="text-sm text-white/50">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-16 bg-gradient-to-b from-transparent via-[#D2A53C]/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl text-white text-center mb-4">
            {language === 'fr' ? 'Pourquoi devenir partenaire ?' : 'Why become a partner?'}
          </h2>
          <p className="text-white/50 text-center mb-12 max-w-2xl mx-auto">
            {language === 'fr'
              ? 'Un investissement stratégique avec des retombées concrètes pour votre marque'
              : 'A strategic investment with concrete benefits for your brand'
            }
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibilityBenefits.map((benefit, index) => (
              <div 
                key={index}
                className="group p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#D2A53C]/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-[#D2A53C]/10 flex items-center justify-center mb-4 group-hover:bg-[#D2A53C]/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-[#D2A53C]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-sm text-white/50">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Tiers */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl text-white text-center mb-4">
            {language === 'fr' ? 'Formules Partenariat' : 'Partnership Packages'}
          </h2>
          <p className="text-white/50 text-center mb-12">
            {language === 'fr' ? 'Choisissez le niveau qui correspond à vos ambitions' : 'Choose the level that matches your ambitions'}
          </p>

          <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {partnerTiers.map((tier, index) => (
              <div 
                key={index}
                className={`relative rounded-2xl overflow-hidden ${tier.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
                style={{
                  background: `linear-gradient(135deg, ${tier.color}15, ${tier.color}05)`,
                  border: `1px solid ${tier.color}30`
                }}
              >
                {tier.popular && (
                  <div 
                    className="absolute top-0 left-0 right-0 py-2 text-center text-xs font-bold uppercase tracking-wider"
                    style={{ background: tier.color, color: '#0a0a0f' }}
                  >
                    {language === 'fr' ? 'Recommandé' : 'Recommended'}
                  </div>
                )}
                
                <div className={`p-6 ${tier.popular ? 'pt-12' : ''}`}>
                  <h3 className="text-lg font-bold mb-1" style={{ color: tier.color }}>
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                        <span className="text-sm text-white/70">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })}
                    className="w-full"
                    style={{
                      background: tier.popular ? tier.color : 'transparent',
                      border: `1px solid ${tier.color}`,
                      color: tier.popular ? '#0a0a0f' : tier.color
                    }}
                  >
                    {language === 'fr' ? 'Nous contacter' : 'Contact us'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Info */}
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6">
                {language === 'fr' ? 'Discutons de votre partenariat' : 'Let\'s discuss your partnership'}
              </h2>
              <p className="text-white/60 mb-8">
                {language === 'fr'
                  ? 'Notre équipe vous contactera sous 48h pour construire ensemble une offre sur mesure adaptée à vos objectifs.'
                  : 'Our team will contact you within 48h to build a custom offer tailored to your objectives.'
                }
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#D2A53C]/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#D2A53C]" />
                  </div>
                  <span className="text-white/70">Fort-de-France, Martinique</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#D2A53C]/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#D2A53C]" />
                  </div>
                  <span className="text-white/70">20-23 Mai 2026</span>
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <div className="relative">
              <div 
                className="relative rounded-2xl overflow-hidden p-8"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D2A53C]/10 rounded-full blur-3xl" />
                
                <form onSubmit={handleSubmit} className="relative space-y-5">
                  <div>
                    <Input
                      type="text"
                      placeholder={language === 'fr' ? 'Nom de l\'entreprise *' : 'Company name *'}
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#D2A53C]"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder={language === 'fr' ? 'Votre nom *' : 'Your name *'}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#D2A53C]"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder={language === 'fr' ? 'Email professionnel *' : 'Professional email *'}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#D2A53C]"
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder={language === 'fr' ? 'Téléphone' : 'Phone'}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#D2A53C]"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder={language === 'fr' ? 'Parlez-nous de vos objectifs...' : 'Tell us about your objectives...'}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px] focus:border-[#D2A53C]"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#D2A53C] text-[#0a0a0f] font-semibold hover:bg-[#D2A53C]/90"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] rounded-full animate-spin" />
                        {language === 'fr' ? 'Envoi...' : 'Sending...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        {language === 'fr' ? 'Envoyer ma demande' : 'Send my request'}
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
