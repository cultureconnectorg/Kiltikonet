import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Lock, ArrowLeft } from 'lucide-react';

export const Header = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isRegisterPage = location.pathname === '/register';
  const isConfirmationPage = location.pathname === '/confirmation';
  const showBackButton = isRegisterPage || isConfirmationPage;

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-[#0C0B09]/80 backdrop-blur-md border-b border-[#2A2825]"
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left side - Logo or Back button */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-[#EDE8DC]/60 hover:text-[#D2A53C] transition-colors"
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">{language === 'fr' ? 'Retour' : 'Back'}</span>
              </button>
            )}
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              data-testid="logo-button"
            >
              <img 
                src="/logo.png" 
                alt="Culture Connect" 
                className="h-10 sm:h-12 w-auto"
              />
              <span className="font-serif text-base sm:text-lg lg:text-xl font-semibold text-[#D2A53C] tracking-wide hidden sm:inline">
                2026
              </span>
            </button>
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#EDE8DC] hover:text-[#D2A53C] transition-colors"
              data-testid="language-toggle"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'fr' ? 'EN' : 'FR'}</span>
            </button>
            
            {/* Admin Access */}
            {!isAdminPage && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#EDE8DC]/50 hover:text-[#D2A53C] transition-colors"
                data-testid="admin-access-button"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'fr' ? 'Admin' : 'Admin'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
