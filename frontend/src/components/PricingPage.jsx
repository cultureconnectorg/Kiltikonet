import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Check, ArrowRight } from 'lucide-react';

export const PricingPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const tiers = [
    {
      id: 'emerging',
      name: language === 'fr' ? 'Émergent' : 'Emerging',
      price: 50,
      description: language === 'fr' 
        ? 'Pour les artistes émergents et étudiants'
        : 'For emerging artists and students',
      color: 'sage',
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
      features: language === 'fr' ? [
        'Tout le pack Professionnel',
        'Stand dédié au Marché Culturel',
        'Prise de parole en plénière',
        'Accès aux données & analytics',
        'Logo sur supports officiels',
        'Invitations VIP illimitées',
        'Accès zone presse',
        'Rapport post-événement exclusif',
        'Partenariat média privilégié'
      ] : [
        'All Professional benefits',
        'Dedicated Cultural Market stand',
        'Plenary speaking slot',
        'Data & analytics access',
        'Logo on official materials',
        'Unlimited VIP invitations',
        'Press zone access',
        'Exclusive post-event report',
        'Priority media partnership'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-terracotta font-syne text-sm tracking-widest uppercase mb-4">
            {language === 'fr' ? 'Tarifs 2026' : 'Pricing 2026'}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-6">
            {language === 'fr' ? 'Choisissez votre accréditation' : 'Choose your accreditation'}
          </h1>
          <p className="text-charcoal/70 font-body text-lg max-w-2xl mx-auto">
            {language === 'fr'
              ? 'Accédez au plus grand marché culturel afro-descendant de la Caraïbe.'
              : 'Access the largest Afro-descendant cultural market in the Caribbean.'
            }
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative border bg-cream ${
                tier.popular ? 'border-terracotta' : 'border-lightborder'
              }`}
              data-testid={`pricing-card-${tier.id}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-terracotta text-paper px-4 py-1 text-xs font-syne tracking-wider uppercase">
                    {language === 'fr' ? 'Recommandé' : 'Recommended'}
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="font-serif text-2xl text-charcoal mb-2">
                  {tier.name}
                </h3>
                <p className="text-charcoal/60 text-sm mb-6">
                  {tier.description}
                </p>

                <div className="mb-8">
                  <span className="font-serif text-5xl text-charcoal">{tier.price}</span>
                  <span className="text-charcoal/60 ml-1">€</span>
                  <p className="text-charcoal/50 text-sm mt-1">
                    {language === 'fr' ? 'par participant' : 'per participant'}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className={`w-4 h-4 mt-1 flex-shrink-0 ${
                        tier.color === 'terracotta' ? 'text-terracotta' : 
                        tier.color === 'sage' ? 'text-sage' : 'text-charcoal'
                      }`} />
                      <span className="text-charcoal/70 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate('/register', { state: { selectedTier: tier.id } })}
                  className={`w-full h-12 font-syne text-sm tracking-wide rounded-none ${
                    tier.popular 
                      ? 'bg-terracotta text-paper hover:bg-terracotta/90' 
                      : 'bg-charcoal text-paper hover:bg-charcoal/90'
                  }`}
                  data-testid={`select-${tier.id}-btn`}
                >
                  {language === 'fr' ? 'Sélectionner' : 'Select'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom info */}
        <div className="mt-16 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-charcoal/50">
            <span>✓ {language === 'fr' ? 'Paiement sécurisé' : 'Secure payment'}</span>
            <span>✓ {language === 'fr' ? 'Confirmation immédiate' : 'Instant confirmation'}</span>
            <span>✓ {language === 'fr' ? 'Remboursable jusqu\'au 1er Mai' : 'Refundable until May 1st'}</span>
          </div>
          
          <p className="mt-8 text-charcoal/50 text-sm">
            {language === 'fr' ? 'Besoin d\'une solution sur mesure ? ' : 'Need a custom solution? '}
            <a href="mailto:cultureconnectorg@gmail.com" className="text-terracotta hover:underline">
              {language === 'fr' ? 'Contactez-nous' : 'Contact us'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
