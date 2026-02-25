import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Check, Sparkles, Users, Crown, ArrowRight, Star } from 'lucide-react';

export const PricingPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [hoveredTier, setHoveredTier] = useState(null);

  const tiers = [
    {
      id: 'emerging',
      name: language === 'fr' ? 'ÉMERGENT' : 'EMERGING',
      price: 50,
      description: language === 'fr' 
        ? 'Pour les artistes émergents et étudiants'
        : 'For emerging artists and students',
      icon: Sparkles,
      color: '#00d4ff',
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
      ],
      popular: false
    },
    {
      id: 'professional',
      name: language === 'fr' ? 'PROFESSIONNEL' : 'PROFESSIONAL',
      price: 150,
      description: language === 'fr'
        ? 'Pour les professionnels et structures'
        : 'For professionals and organizations',
      icon: Users,
      color: '#D2A53C',
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
      ],
      popular: true
    },
    {
      id: 'institutional',
      name: language === 'fr' ? 'INSTITUTIONNEL' : 'INSTITUTIONAL',
      price: 300,
      description: language === 'fr'
        ? 'Pour les institutions et partenaires majeurs'
        : 'For institutions and major partners',
      icon: Crown,
      color: '#a855f7',
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
      ],
      popular: false
    }
  ];

  const handleSelectTier = (tierId) => {
    navigate('/register', { state: { selectedTier: tierId } });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 sm:pt-24 overflow-hidden">
      {/* Animated background patterns */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00d4ff]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D2A53C]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#a855f7]/5 rounded-full blur-[150px]" />
        
        {/* Afro-futuristic pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="afro-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="20" fill="none" stroke="#00d4ff" strokeWidth="0.5"/>
              <circle cx="30" cy="30" r="10" fill="none" stroke="#D2A53C" strokeWidth="0.5"/>
              <path d="M30 10 L30 50 M10 30 L50 30" stroke="#a855f7" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#afro-pattern)"/>
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
            <Star className="w-4 h-4 text-[#D2A53C]" />
            <span className="text-sm text-white/70">
              {language === 'fr' ? 'Tarifs Early Bird jusqu\'au 1er Avril' : 'Early Bird pricing until April 1st'}
            </span>
          </div>
          
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white mb-4">
            {language === 'fr' ? 'Choisissez votre' : 'Choose your'}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] via-[#D2A53C] to-[#a855f7]">
              {language === 'fr' ? 'Accréditation' : 'Accreditation'}
            </span>
          </h1>
          
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {language === 'fr'
              ? 'Accédez au plus grand marché culturel afro-descendant de la Caraïbe. Fort-de-France, 20-23 Mai 2026.'
              : 'Access the largest Afro-descendant cultural market in the Caribbean. Fort-de-France, May 20-23, 2026.'
            }
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => {
            const IconComponent = tier.icon;
            const isHovered = hoveredTier === tier.id;
            
            return (
              <div
                key={tier.id}
                className={`relative group ${tier.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
                onMouseEnter={() => setHoveredTier(tier.id)}
                onMouseLeave={() => setHoveredTier(null)}
                data-testid={`pricing-card-${tier.id}`}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div 
                      className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{ 
                        background: `linear-gradient(135deg, ${tier.color}40, ${tier.color}20)`,
                        border: `1px solid ${tier.color}50`,
                        color: tier.color,
                        boxShadow: `0 0 20px ${tier.color}30`
                      }}
                    >
                      {language === 'fr' ? 'Populaire' : 'Popular'}
                    </div>
                  </div>
                )}

                {/* Card */}
                <div 
                  className={`relative h-full rounded-2xl overflow-hidden transition-all duration-500 ${
                    tier.popular ? 'bg-gradient-to-b from-white/15 to-white/5' : 'bg-gradient-to-b from-white/10 to-white/[0.02]'
                  }`}
                  style={{
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isHovered || tier.popular ? tier.color + '50' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: isHovered ? `0 0 40px ${tier.color}20, inset 0 0 60px ${tier.color}05` : 'none',
                    transform: isHovered ? 'translateY(-8px)' : 'translateY(0)'
                  }}
                >
                  {/* Glow effect on hover */}
                  <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px transition-opacity duration-500"
                    style={{ 
                      background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`,
                      opacity: isHovered ? 1 : 0
                    }}
                  />

                  <div className="p-6 sm:p-8">
                    {/* Icon */}
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
                      style={{ 
                        background: `linear-gradient(135deg, ${tier.color}30, ${tier.color}10)`,
                        border: `1px solid ${tier.color}30`,
                        boxShadow: isHovered ? `0 0 30px ${tier.color}40` : 'none'
                      }}
                    >
                      <IconComponent className="w-7 h-7" style={{ color: tier.color }} />
                    </div>

                    {/* Name & Description */}
                    <h3 
                      className="text-xl font-bold mb-2 tracking-wider"
                      style={{ color: tier.color }}
                    >
                      {tier.name}
                    </h3>
                    <p className="text-white/50 text-sm mb-6">
                      {tier.description}
                    </p>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-white">{tier.price}</span>
                        <span className="text-xl text-white/50">€</span>
                      </div>
                      <p className="text-white/40 text-sm mt-1">
                        {language === 'fr' ? 'par participant' : 'per participant'}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ 
                              background: `${tier.color}20`,
                              boxShadow: `0 0 10px ${tier.color}30`
                            }}
                          >
                            <Check className="w-3 h-3" style={{ color: tier.color }} />
                          </div>
                          <span className="text-white/70 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleSelectTier(tier.id)}
                      className="w-full h-12 font-semibold transition-all duration-300 group/btn"
                      style={{
                        background: tier.popular 
                          ? `linear-gradient(135deg, ${tier.color}, ${tier.color}cc)`
                          : 'transparent',
                        border: `1px solid ${tier.color}`,
                        color: tier.popular ? '#0a0a0f' : tier.color,
                        boxShadow: isHovered ? `0 0 30px ${tier.color}40` : 'none'
                      }}
                      data-testid={`select-${tier.id}-btn`}
                    >
                      <span>{language === 'fr' ? 'Sélectionner' : 'Select'}</span>
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom info */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm text-white/40">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4ADE80]" />
              {language === 'fr' ? 'Paiement sécurisé' : 'Secure payment'}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00d4ff]" />
              {language === 'fr' ? 'Confirmation immédiate' : 'Instant confirmation'}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D2A53C]" />
              {language === 'fr' ? 'Remboursable jusqu\'au 1er Mai' : 'Refundable until May 1st'}
            </span>
          </div>
          
          <p className="mt-8 text-white/30 text-sm">
            {language === 'fr' 
              ? 'Besoin d\'une solution sur mesure ? '
              : 'Need a custom solution? '
            }
            <a href="mailto:cultureconnectorg@gmail.com" className="text-[#00d4ff] hover:underline">
              {language === 'fr' ? 'Contactez-nous' : 'Contact us'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
