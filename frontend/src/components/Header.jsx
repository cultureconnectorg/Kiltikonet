import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Lock } from 'lucide-react';

export const Header = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-[#0C0B09]/80 backdrop-blur-md border-b border-[#33312E]"
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            data-testid="logo-button"
          >
            <span className="font-serif text-lg sm:text-xl lg:text-2xl font-semibold text-[#D2A53C] tracking-wide">
              {t('eventName')}
            </span>
          </button>
          
          {/* Right side */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#F5F5F0] hover:text-[#D2A53C] transition-colors"
              data-testid="language-toggle"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'fr' ? 'EN' : 'FR'}</span>
            </button>
            
            {/* Admin Access */}
            {!isAdminPage && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#F5F5F0]/60 hover:text-[#D2A53C] transition-colors"
                data-testid="admin-access-button"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">{t('adminAccess')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
