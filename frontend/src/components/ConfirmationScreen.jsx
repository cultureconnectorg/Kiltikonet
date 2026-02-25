import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { ArrowLeft, Download, Check } from 'lucide-react';
import { profileTypes } from '../lib/translations';
import { BadgeGenerator } from './BadgeGenerator';

export const ConfirmationScreen = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const registration = location.state?.registration;
  const [showBadge, setShowBadge] = useState(false);
  
  React.useEffect(() => {
    if (!registration) navigate('/');
  }, [registration, navigate]);
  
  if (!registration) return null;
  
  const profileTypeObj = profileTypes.find(p => p.value === registration.profile_type);
  const profileLabel = profileTypeObj ? t(profileTypeObj.labelKey) : registration.profile_type;
  
  const participantWithTier = { 
    ...registration, 
    tier: registration.tier || 'professional',
    image: registration.logo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop'
  };
  
  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="border border-lightborder bg-cream p-10 text-center" data-testid="confirmation-card">
          {/* Checkmark */}
          <div className="w-20 h-20 border-2 border-sage mx-auto mb-8 flex items-center justify-center">
            <Check className="w-10 h-10 text-sage" />
          </div>
          
          <h1 className="font-serif text-2xl sm:text-3xl text-charcoal mb-4" data-testid="confirmation-title">
            {language === 'fr' ? 'Demande reçue' : 'Request received'}
          </h1>
          
          <p className="text-charcoal/60 mb-8 leading-relaxed" data-testid="confirmation-message">
            {language === 'fr' 
              ? "Votre demande d'accréditation a bien été reçue. L'équipe Culture Connect vous contactera sous 72h."
              : "Your accreditation request has been received. The Culture Connect team will contact you within 72 hours."
            }
          </p>
          
          {/* Details */}
          <div className="border border-lightborder bg-paper p-6 mb-8 text-left">
            <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-4">
              {t('registrationDetails')}
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-lightborder pb-3">
                <span className="text-charcoal/50 text-sm">{t('name')}</span>
                <span className="text-charcoal font-medium" data-testid="confirmation-name">{registration.full_name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-lightborder pb-3">
                <span className="text-charcoal/50 text-sm">{t('organization')}</span>
                <span className="text-charcoal font-medium" data-testid="confirmation-organization">{registration.organization_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal/50 text-sm">{t('profile')}</span>
                <span className="px-3 py-1 bg-terracotta/10 text-terracotta text-sm" data-testid="confirmation-profile">
                  {profileLabel}
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => setShowBadge(true)}
              className="w-full h-12 bg-charcoal text-paper font-syne text-sm rounded-none"
              data-testid="preview-badge-button"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Prévisualiser mon badge' : 'Preview my badge'}
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full h-12 border-charcoal text-charcoal font-syne text-sm rounded-none"
              data-testid="back-to-home-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToHome')}
            </Button>
          </div>
        </div>
        
        <p className="text-center text-charcoal/40 text-sm mt-6">
          {language === 'fr' ? 'Confirmation envoyée à ' : 'Confirmation sent to '}
          <span className="text-terracotta">{registration.email}</span>
        </p>
      </div>

      {showBadge && (
        <BadgeGenerator participant={participantWithTier} onClose={() => setShowBadge(false)} />
      )}
    </div>
  );
};
