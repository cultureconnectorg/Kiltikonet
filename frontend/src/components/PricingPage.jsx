import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Check, ArrowRight, Star } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useAnimations';

// Animated pricing card component
const PricingCard = ({ tier, index, language, onSelect }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.15 });
  const [isHovered, setIsHovered] = useState(false);
  
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const colorClasses = {
    sage: 'border-sage hover:border-sage',
    terracotta: 'border-terracotta hover:border-terracotta',
    charcoal: 'border-charcoal hover:border-charcoal'
  };

  const buttonClasses = {
    sage: 'bg-sage hover:bg-sage/90',
    terracotta: 'bg-terracotta hover:bg-terracotta/90',
    charcoal: 'bg-charcoal hover:bg-charcoal/90'
  };

  return (
    <div
      ref={ref}
      className={`relative bg-paper border-2 rounded-lg p-6 sm:p-8 transition-all duration-500 ${
        colorClasses[tier.color]
      } ${tier.popular ? 'shadow-xl scale-105' : ''} ${
        isHovered ? 'shadow-lg -translate-y-1' : ''
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
      data-testid={`pricing-card-${tier.id}`}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-terracotta text-paper text-xs font-medium rounded-full flex items-center gap-1">
          <Star className="w-3 h-3" />
          {language === 'fr' ? 'Populaire' : 'Popular'}
        </div>
      )}

      <h3 className="font-serif text-2xl text-charcoal mb-2">{tier.name}</h3>
      <p className="text-charcoal/60 text-sm mb-6">{tier.description}</p>

      <div className="mb-6">
        <span className="font-serif text-4xl text-charcoal">
          {tier.price === 0 ? (language === 'fr' ? 'Gratuit' : 'Free') : `${tier.price}€`}
        </span>
        {tier.price > 0 && (
          <span className="text-charcoal/50 text-sm ml-2">
            {language === 'fr' ? '/ personne' : '/ person'}
          </span>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {tier.features.map((feature, i) => (
          <li 
            key={i} 
            className="flex items-start gap-3 text-sm text-charcoal/70"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-10px)',
              transition: prefersReducedMotion 
                ? 'opacity 0.2s' 
                : `opacity 0.4s ease-out ${(index * 0.15) + (i * 0.05)}s, transform 0.4s ease-out ${(index * 0.15) + (i * 0.05)}s`,
            }}
          >
            <Check className={`w-4 h-4 mt-0.5 text-${tier.color} flex-shrink-0`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(tier)}
        className={`w-full h-12 ${buttonClasses[tier.color]} text-paper font-syne text-sm tracking-wide rounded-none transition-all duration-300 group`}
      >
        {tier.price === 0
          ? (language === 'fr' ? "S'inscrire gratuitement" : 'Register for free')
          : (language === 'fr' ? "S'inscrire" : 'Register')
        }
        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
};

export const PricingPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const tiers = [
    {
      id: 'visiteur',
      name: language === 'fr' ? 'Visiteur' : 'Visitor',
      price: 0,
      description: language === 'fr'
        ? 'Accès gratuit pour découvrir l\'événement'
        : 'Free access to discover the event',
      color: 'sage',
      badge_type: 'VIS',
      features: language === 'fr' ? [
        'Accès à l\'entrée générale',
        'Badge Culture Connect',
        'FREK-ID culturel',
        'Accès aux ateliers ouverts',
        'Accès à la Savane (22 Mai)',
        'Documentation digitale'
      ] : [
        'General entrance access',
        'Culture Connect badge',
        'Cultural FREK-ID',
        'Open workshop access',
        'La Savane access (May 22)',
        'Digital documentation'
      ]
    },
    {
      id: 'emerging',
      name: language === 'fr' ? 'Émergent' : 'Emerging',
      price: 50,
      description: language === 'fr' 
        ? 'Pour les artistes émergents et étudiants'
        : 'For emerging artists and students',
      color: 'sage',
      badge_type: 'BNV',
      features: language === 'fr' ? [
        'Accès aux conférences',
        'Badge accréditation',
        'Networking sessions',
        'Accès à la Savane (22 Mai)',
        'Documentation digitale',
        'Certificat de participation'
      ] : [
        'Conference access',
        'Accreditation badge',
        'Networking sessions',
        'La Savane access (May 22)',
        'Digital documentation',
        'Participation certificate'
      ]
    },
    {
      id: 'professional',
      name: language === 'fr' ? 'Professionnel' : 'Professional',
      price: 150,
      description: language === 'fr'
        ? 'Pour les professionnels et structures'
        : 'For professionals and organizations',
      color: 'terracotta',
      popular: true,
      badge_type: 'INT',
      features: language === 'fr' ? [
        'Tout le pack Émergent',
        'Accès prioritaire aux tables rondes',
        'Rendez-vous B2B personnalisés',
        'Espace networking VIP',
        'Catalogue des participants',
        'Stand partagé (option)',
        'Accès backstage concerts',
        'Support dédié'
      ] : [
        'All Emerging benefits',
        'Priority roundtable access',
        'Personalized B2B meetings',
        'VIP networking lounge',
        'Participant directory',
        'Shared stand (option)',
        'Concert backstage access',
        'Dedicated support'
      ]
    },
    {
      id: 'institutional',
      name: language === 'fr' ? 'Institutionnel' : 'Institutional',
      price: 300,
      description: language === 'fr'
        ? 'Pour les institutions et partenaires majeurs'
        : 'For institutions and major partners',
      color: 'charcoal',
      badge_type: 'SPO',
      features: language === 'fr' ? [
        'Tout le pack Professionnel',
        'Stand dédié au Marché Culturel',
        'Prise de parole en plénière',
        'Accès aux données & analytics',
        'Logo sur supports officiels',
        'Invitations VIP illimitées',
        'Accès zone presse',
        'Partenariat média'
      ] : [
        'All Professional benefits',
        'Dedicated Cultural Market stand',
        'Plenary speaking slot',
        'Data & analytics access',
        'Logo on official materials',
        'Unlimited VIP invitations',
        'Press area access',
        'Media partnership'
      ]
    }
  ];

  const handleSelectTier = (tier) => {
    if (tier.price === 0) {
      navigate('/badge-inscription', { state: { selectedType: tier.badge_type, tierName: tier.name } });
    } else {
      navigate('/inscription', { state: { selectedTier: tier.id, price: tier.price, badge_type: tier.badge_type } });
    }
  };

  return (
    <div className="min-h-screen bg-paper overflow-hidden">
      {/* Hero Section */}
      <section className="py-20 sm:py-28 bg-charcoal text-cream overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta/20 rounded-full mb-6"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(-20px)',
              transition: prefersReducedMotion ? 'opacity 0.3s' : 'opacity 0.5s ease-out, transform 0.5s ease-out',
            }}
          >
            <span className="text-terracotta text-sm font-medium">
              20-23 Mai 2026 · Fort-de-France
            </span>
          </div>

          {/* Title */}
          <h1 
            className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-6"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(-30px)',
              transition: prefersReducedMotion 
                ? 'opacity 0.3s ease-out' 
                : 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
            }}
          >
            {language === 'fr' ? 'Tarifs & Accréditations' : 'Pricing & Accreditations'}
          </h1>

          {/* Subtitle */}
          <p 
            className="text-lg text-cream/70 max-w-2xl mx-auto"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: prefersReducedMotion 
                ? 'opacity 0.3s ease-out' 
                : 'opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s',
            }}
          >
            {language === 'fr'
              ? 'Choisissez le pass qui correspond à votre profil et rejoignez Culture Connect 2026.'
              : 'Choose the pass that fits your profile and join Culture Connect 2026.'
            }
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 sm:py-28 -mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {tiers.map((tier, index) => (
              <PricingCard
                key={tier.id}
                tier={tier}
                index={index}
                language={language}
                onSelect={handleSelectTier}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-2xl text-charcoal mb-4">
            {language === 'fr' ? 'Des questions ?' : 'Questions?'}
          </h2>
          <p className="text-charcoal/60 mb-6">
            {language === 'fr'
              ? 'Contactez-nous pour plus d\'informations sur les accréditations.'
              : 'Contact us for more information about accreditations.'
            }
          </p>
          <a 
            href="mailto:cultureconnectorg@gmail.com"
            className="text-terracotta hover:text-terracotta/80 underline underline-offset-4 transition-colors"
          >
            cultureconnectorg@gmail.com
          </a>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
