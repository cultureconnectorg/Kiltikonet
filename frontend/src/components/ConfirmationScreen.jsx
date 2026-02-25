import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { ArrowLeft, Download, Share2, Sparkles, Users, Crown } from 'lucide-react';
import { profileTypes } from '../lib/translations';
import { BadgeGenerator } from './BadgeGenerator';

const tierConfig = {
  emerging: { name: 'ÉMERGENT', nameEn: 'EMERGING', color: '#00d4ff', icon: Sparkles },
  professional: { name: 'PROFESSIONNEL', nameEn: 'PROFESSIONAL', color: '#D2A53C', icon: Users },
  institutional: { name: 'INSTITUTIONNEL', nameEn: 'INSTITUTIONAL', color: '#a855f7', icon: Crown }
};

export const ConfirmationScreen = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const registration = location.state?.registration;
  const [showBadge, setShowBadge] = useState(false);
  
  React.useEffect(() => {
    if (!registration) {
      navigate('/');
    }
  }, [registration, navigate]);
  
  if (!registration) return null;
  
  const profileTypeObj = profileTypes.find(p => p.value === registration.profile_type);
  const profileLabel = profileTypeObj ? t(profileTypeObj.labelKey) : registration.profile_type;
  
  // Assign a random tier for demo (in production, this would come from backend)
  const tier = tierConfig[['emerging', 'professional', 'institutional'][Math.floor(Math.random() * 3)]];
  const participantWithTier = { 
    ...registration, 
    tier: Object.keys(tierConfig).find(k => tierConfig[k] === tier) || 'professional',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop'
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 sm:pt-24 flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D2A53C]/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div 
          className="relative rounded-2xl p-8 sm:p-10 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,212,255,0.2)'
          }}
          data-testid="confirmation-card"
        >
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent" />
          
          {/* Gold Checkmark */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <svg
                className="w-24 h-24 text-[#D2A53C]"
                viewBox="0 0 100 100"
                data-testid="confirmation-checkmark"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="283"
                  strokeDashoffset="0"
                  style={{
                    transformOrigin: 'center',
                    transform: 'rotate(-90deg)',
                    filter: 'drop-shadow(0 0 10px #D2A53C)'
                  }}
                />
                <path
                  d="M30 52 L45 67 L70 37"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 0 8px #D2A53C)' }}
                />
              </svg>
            </div>
          </div>
          
          {/* Title */}
          <h1 
            className="font-serif text-2xl sm:text-3xl text-white mb-2"
            data-testid="confirmation-title"
          >
            {language === 'fr' ? 'Demande reçue !' : 'Request received!'}
          </h1>
          
          <p className="text-[#00d4ff] font-medium mb-6">
            Culture Connect 2026
          </p>
          
          {/* Message */}
          <p 
            className="text-white/70 mb-8 leading-relaxed"
            data-testid="confirmation-message"
          >
            {language === 'fr' 
              ? "Votre demande d'accréditation a bien été reçue. L'équipe Culture Connect vous contactera sous 72h."
              : "Your accreditation request has been received. The Culture Connect team will contact you within 72 hours."
            }
          </p>
          
          {/* Registration Details */}
          <div 
            className="rounded-xl p-6 mb-8 text-left"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <h3 className="text-sm text-[#00d4ff] uppercase tracking-wider mb-4">
              {t('registrationDetails')}
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-white/50">{t('name')}</span>
                <span className="text-white font-medium" data-testid="confirmation-name">
                  {registration.full_name}
                </span>
              </div>
              
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-white/50">{t('organization')}</span>
                <span className="text-white font-medium" data-testid="confirmation-organization">
                  {registration.organization_name}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white/50">{t('profile')}</span>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ background: '#D2A53C20', color: '#D2A53C' }}
                  data-testid="confirmation-profile"
                >
                  {profileLabel}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => setShowBadge(true)}
              className="w-full h-12 bg-[#00d4ff] text-[#0a0a0f] font-semibold hover:bg-[#00d4ff]/90"
              data-testid="preview-badge-button"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Prévisualiser mon badge' : 'Preview my badge'}
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full h-12 border-white/20 text-white/70 hover:text-white hover:border-white/40"
              data-testid="back-to-home-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToHome')}
            </Button>
          </div>
        </div>
        
        {/* Email info */}
        <p className="text-center text-white/40 text-sm mt-6">
          {language === 'fr' 
            ? 'Un email de confirmation sera envoyé à '
            : 'A confirmation email will be sent to '
          }
          <span className="text-[#00d4ff]">{registration.email}</span>
        </p>
      </div>

      {/* Badge Modal */}
      {showBadge && (
        <BadgeGenerator 
          participant={participantWithTier} 
          onClose={() => setShowBadge(false)} 
        />
      )}
    </div>
  );
};
