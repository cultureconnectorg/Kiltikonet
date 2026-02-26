import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { X } from 'lucide-react';

const CONSENT_KEY = 'cc_cookie_consent';

export const CookieBanner = () => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay before showing banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ 
      essential: true, 
      analytics: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };
  
  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ 
      essential: true, 
      analytics: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };
  
  const handleClose = () => {
    // Close without saving = will show again on next visit
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-charcoal border-t border-charcoal/50 shadow-lg"
      role="dialog"
      aria-label={language === 'fr' ? 'Bannière de consentement aux cookies' : 'Cookie consent banner'}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-paper text-sm leading-relaxed">
              {language === 'fr' 
                ? 'Ce site utilise des cookies pour améliorer votre expérience. En continuant, vous acceptez notre '
                : 'This site uses cookies to improve your experience. By continuing, you accept our '
              }
              <Link to="/cookies" className="text-terracotta hover:underline">
                {language === 'fr' ? 'politique de cookies' : 'cookie policy'}
              </Link>
              {language === 'fr' ? ' et notre ' : ' and our '}
              <Link to="/confidentialite" className="text-terracotta hover:underline">
                {language === 'fr' ? 'politique de confidentialité' : 'privacy policy'}
              </Link>.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm text-paper/70 hover:text-paper border border-paper/30 hover:border-paper/50 transition-colors"
            >
              {language === 'fr' ? 'Refuser' : 'Decline'}
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm bg-terracotta text-paper hover:bg-terracotta/90 transition-colors"
            >
              {language === 'fr' ? 'Accepter' : 'Accept'}
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-paper/50 hover:text-paper transition-colors"
              aria-label={language === 'fr' ? 'Fermer' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to check consent status (can be used in other components)
export const getCookieConsent = () => {
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent ? JSON.parse(consent) : null;
  } catch {
    return null;
  }
};

// Helper to reset consent (for "Manage cookies" link)
export const resetCookieConsent = () => {
  localStorage.removeItem(CONSENT_KEY);
  window.location.reload();
};
