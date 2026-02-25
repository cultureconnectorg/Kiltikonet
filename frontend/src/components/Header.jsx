import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Menu, X } from 'lucide-react';

export const Header = () => {
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: language === 'fr' ? 'Accueil' : 'Home' },
    { path: '/pricing', label: language === 'fr' ? 'Accréditation' : 'Accreditation' },
    { path: '/catalog', label: language === 'fr' ? 'Catalogue' : 'Catalog' },
    { path: '/partnership', label: language === 'fr' ? 'Partenaires' : 'Partners' },
  ];

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-paper border-b border-lightborder"
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
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
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`text-sm font-body tracking-wide transition-colors ${
                  isActive(link.path)
                    ? 'text-terracotta'
                    : 'text-charcoal/70 hover:text-charcoal'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
          
          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 text-sm text-charcoal/70 hover:text-charcoal transition-colors"
              data-testid="language-toggle"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'fr' ? 'EN' : 'FR'}</span>
            </button>
            
            {/* Admin link - subtle */}
            <button
              onClick={() => navigate('/admin')}
              className="hidden sm:block text-sm text-charcoal/40 hover:text-charcoal transition-colors"
              data-testid="admin-access-button"
            >
              Admin
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-charcoal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-paper border-t border-lightborder">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left py-2 text-base ${
                  isActive(link.path) ? 'text-terracotta' : 'text-charcoal/70'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                navigate('/admin');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-base text-charcoal/40"
            >
              Admin
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
