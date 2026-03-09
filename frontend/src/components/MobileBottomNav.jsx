/**
 * Mobile Bottom Navigation - CC2026
 * Navigation fixe en bas pour l'expérience mobile
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, Briefcase, User } from 'lucide-react';

const MobileBottomNav = ({ userType = 'public' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on certain pages
  const hiddenPaths = ['/admin', '/workspace', '/dashboard-cc2026'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  
  if (shouldHide) return null;

  // Navigation items based on user type
  const publicNav = [
    { id: 'home', icon: Home, label: 'Accueil', path: '/' },
    { id: 'catalogue', icon: Users, label: 'Catalogue', path: '/catalogue' },
    { id: 'programme', icon: Calendar, label: 'Programme', path: '/programme' },
    { id: 'pro', icon: Briefcase, label: 'Espace Pro', path: '/espace-pro/connexion' },
  ];

  const proNav = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/espace-pro' },
    { id: 'network', icon: Users, label: 'Réseau', path: '/espace-pro', state: { section: 'network' } },
    { id: 'opportunities', icon: Briefcase, label: 'Opportunités', path: '/espace-pro', state: { section: 'opportunities' } },
    { id: 'agenda', icon: Calendar, label: 'Agenda', path: '/espace-pro', state: { section: 'events' } },
    { id: 'profile', icon: User, label: 'Profil', path: '/espace-pro', state: { section: 'profile' } },
  ];

  const navItems = userType === 'pro' ? proNav : publicNav;

  const isActive = (item) => {
    if (item.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-bottom"
      style={{ 
        background: 'linear-gradient(to top, #1A1A14 85%, #1A1A14dd)',
        borderTop: '1px solid rgba(212, 168, 75, 0.15)'
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path, { state: item.state })}
              className="flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all"
              style={{ 
                color: active ? '#D4A84B' : 'rgba(255,255,255,0.5)',
                background: active ? 'rgba(212, 168, 75, 0.1)' : 'transparent'
              }}
              data-testid={`mobile-nav-${item.id}`}
            >
              <Icon 
                className="w-5 h-5 mb-1" 
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
