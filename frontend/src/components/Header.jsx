import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Menu, X, ChevronDown, User, Users, Settings } from 'lucide-react';

export const Header = () => {
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const accountRef = React.useRef(null);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: language === 'fr' ? 'Accueil' : 'Home' },
    { path: '/programme', label: 'Programme' },
    { path: '/concert', label: 'Concert' },
    { path: '/pricing', label: language === 'fr' ? 'Tarifs' : 'Pricing' },
    { path: '/partnership', label: language === 'fr' ? 'Partenariat' : 'Partnership' },
    { path: '/jetons', label: 'Jetons' },
    { path: '/catalogue', label: 'Catalogue' },
    { path: '/appel-2026', label: language === 'fr' ? 'Appel 2026' : 'Call 2026' },
  ];

  const accountLinks = [
    { path: '/mon-espace', label: language === 'fr' ? 'Mon Espace' : 'My Space', icon: User },
    { path: '/espace-pro/connexion', label: language === 'fr' ? 'Espace Pro' : 'Pro Space', icon: Users },
    { path: '/admin', label: 'Admin', icon: Settings },
  ];

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-paper border-b border-lightborder" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity" data-testid="logo-button">
            <img src="/logo.png" alt="Culture Connect" className="h-10 sm:h-12 w-auto" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`text-sm font-body tracking-wide transition-colors ${
                  isActive(link.path) ? 'text-terracotta' : 'text-charcoal/70 hover:text-charcoal'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Account Dropdown */}
            <div className="relative hidden sm:block" ref={accountRef}>
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-terracotta border border-terracotta/30 rounded-md hover:bg-terracotta/10 transition-colors"
                data-testid="account-dropdown-btn"
              >
                <User className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" style={{ transform: accountOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {accountOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border overflow-hidden"
                  style={{ background: '#FFFFFF', borderColor: 'rgba(26,21,16,0.1)' }}
                  data-testid="account-dropdown-menu"
                >
                  {accountLinks.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setAccountOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors hover:bg-terracotta/5"
                      style={{ color: isActive(item.path) ? '#A65D47' : '#1A1510' }}
                      data-testid={`dropdown-${item.path.replace(/\//g, '-')}`}
                    >
                      <item.icon className="w-4 h-4" style={{ color: '#6B6560' }} />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 text-sm text-charcoal/70 hover:text-charcoal transition-colors"
              data-testid="language-toggle"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'fr' ? 'EN' : 'FR'}</span>
            </button>

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-charcoal">
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
                onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                className={`block w-full text-left py-2 text-base ${isActive(link.path) ? 'text-terracotta' : 'text-charcoal/70'}`}
              >
                {link.label}
              </button>
            ))}
            <div className="border-t border-lightborder pt-3 mt-3 space-y-2">
              {accountLinks.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 w-full text-left py-2 text-base text-charcoal/60"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
