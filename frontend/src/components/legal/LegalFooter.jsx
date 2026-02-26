import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { resetCookieConsent } from './CookieBanner';

export const LegalFooter = () => {
  const { language } = useLanguage();
  
  const handleManageCookies = (e) => {
    e.preventDefault();
    resetCookieConsent();
  };
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-charcoal/40">
      <Link to="/mentions-legales" className="hover:text-terracotta transition-colors">
        {language === 'fr' ? 'Mentions légales' : 'Legal Notice'}
      </Link>
      <span className="hidden sm:inline">·</span>
      <Link to="/confidentialite" className="hover:text-terracotta transition-colors">
        {language === 'fr' ? 'Confidentialité' : 'Privacy'}
      </Link>
      <span className="hidden sm:inline">·</span>
      <Link to="/cgu" className="hover:text-terracotta transition-colors">
        {language === 'fr' ? 'CGU' : 'Terms'}
      </Link>
      <span className="hidden sm:inline">·</span>
      <Link to="/cookies" className="hover:text-terracotta transition-colors">
        Cookies
      </Link>
      <span className="hidden sm:inline">·</span>
      <button 
        onClick={handleManageCookies}
        className="hover:text-terracotta transition-colors"
      >
        {language === 'fr' ? 'Gérer les cookies' : 'Manage cookies'}
      </button>
    </div>
  );
};
