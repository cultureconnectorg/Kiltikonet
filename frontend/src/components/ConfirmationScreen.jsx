import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { profileTypes } from '../lib/translations';

export const ConfirmationScreen = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const registration = location.state?.registration;
  
  // If no registration data, redirect to home
  React.useEffect(() => {
    if (!registration) {
      navigate('/');
    }
  }, [registration, navigate]);
  
  if (!registration) {
    return null;
  }
  
  // Find the profile type label
  const profileTypeObj = profileTypes.find(p => p.value === registration.profile_type);
  const profileLabel = profileTypeObj ? t(profileTypeObj.labelKey) : registration.profile_type;
  
  return (
    <div className="min-h-screen bg-[#0C0B09] pt-20 sm:pt-24 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div 
          className="bg-[#141311] border border-[#2A2825] p-8 sm:p-10 text-center animate-scale-in"
          data-testid="confirmation-card"
        >
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
                  strokeWidth="3"
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
                  className="animate-checkmark"
                  style={{
                    transformOrigin: 'center',
                    transform: 'rotate(-90deg)'
                  }}
                />
                <path
                  d="M30 52 L45 67 L70 37"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-fade-in"
                  style={{ animationDelay: '0.3s' }}
                />
              </svg>
            </div>
          </div>
          
          {/* Title */}
          <h1 
            className="font-serif text-2xl sm:text-3xl text-[#D2A53C] mb-4"
            data-testid="confirmation-title"
          >
            {t('confirmationTitle')}
          </h1>
          
          {/* Confirmation Message */}
          <p 
            className="text-[#EDE8DC]/80 mb-8 leading-relaxed"
            data-testid="confirmation-message"
          >
            {language === 'fr' 
              ? "Votre demande d'accréditation a bien été reçue. L'équipe Culture Connect vous contactera sous 72h."
              : "Your accreditation request has been received. The Culture Connect team will contact you within 72 hours."
            }
          </p>
          
          {/* Registration Details */}
          <div className="bg-[#1A1917] border border-[#2A2825] p-6 mb-8 text-left">
            <h3 className="font-serif text-lg text-[#D2A53C] mb-4">
              {t('registrationDetails')}
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-[#2A2825] pb-3">
                <span className="text-[#EDE8DC]/60">{t('name')}</span>
                <span className="text-[#EDE8DC] font-medium" data-testid="confirmation-name">
                  {registration.full_name}
                </span>
              </div>
              
              <div className="flex justify-between items-center border-b border-[#2A2825] pb-3">
                <span className="text-[#EDE8DC]/60">{t('organization')}</span>
                <span className="text-[#EDE8DC] font-medium" data-testid="confirmation-organization">
                  {registration.organization_name}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[#EDE8DC]/60">{t('profile')}</span>
                <span 
                  className="bg-[#D2A53C]/20 text-[#D2A53C] px-3 py-1 rounded-full text-sm font-medium"
                  data-testid="confirmation-profile"
                >
                  {profileLabel}
                </span>
              </div>
            </div>
          </div>
          
          {/* Back Button */}
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full h-12 border-[#D2A53C] text-[#D2A53C] hover:bg-[#D2A53C] hover:text-[#0C0B09] transition-all duration-300"
            data-testid="back-to-home-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToHome')}
          </Button>
        </div>
      </div>
    </div>
  );
};
