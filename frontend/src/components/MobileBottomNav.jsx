/**
 * Mobile Bottom Navigation - CC2026
 * Navigation fixe en bas pour l'expérience mobile UNIQUEMENT (< 768px)
 * Avec vérification des rôles pour Admin/Pro
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, Briefcase, User, QrCode, Settings } from 'lucide-react';
import useDeviceDetect from '../hooks/useDeviceDetect';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useDeviceDetect();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when path changes or storage changes
  useEffect(() => {
    const handleStorageChange = () => setForceUpdate(prev => prev + 1);
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on path change
    setForceUpdate(prev => prev + 1);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.pathname]);

  // Get user sessions - recalculate on forceUpdate
  const getAdminSession = () => {
    try {
      // Check persistent session first
      const persistent = localStorage.getItem('cc2026_session');
      if (persistent) {
        const session = JSON.parse(persistent);
        if (session.createdAt && (Date.now() - session.createdAt) < 30 * 24 * 60 * 60 * 1000) {
          return session;
        }
      }
      // Then check temp session
      const temp = sessionStorage.getItem('workspace_user');
      if (temp) return JSON.parse(temp);
    } catch {}
    return {};
  };

  const getProSession = () => {
    try {
      return JSON.parse(localStorage.getItem('cc2026_pro_session') || '{}');
    } catch { return {}; }
  };

  const adminSession = getAdminSession();
  const proSession = getProSession();

  // Determine user role
  const isAdmin = adminSession.role === 'admin' || adminSession.role === 'founder' || adminSession.workspace;
  const isPro = proSession.verified || proSession.id;

  // Don't show on desktop (> 768px)
  if (!isMobile) return null;

  // Don't show on certain pages
  const hiddenPaths = ['/admin/login', '/workspace', '/dashboard-cc2026'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  if (shouldHide) return null;

  // Determine which nav to show based on current path and role
  const isInAdminArea = location.pathname.startsWith('/admin');
  const isInProArea = location.pathname.startsWith('/espace-pro') && !location.pathname.includes('/connexion');

  // Admin navigation (fond clair)
  if (isInAdminArea && isAdmin) {
    const adminNav = [
      { id: 'home', icon: Home, label: 'Accueil', path: '/admin/mobile' },
      { id: 'scan', icon: QrCode, label: 'Scanner', path: '/admin/mobile', action: 'scan' },
      { id: 'users', icon: Users, label: 'Inscrits', path: '/admin/participants' },
      { id: 'settings', icon: Settings, label: 'Config', path: '/admin/settings' },
    ];

    return (
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-bottom"
        style={{ 
          background: '#F4F1EA',
          borderTop: '1px solid #E5E0D8',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
        }}
        data-testid="admin-mobile-nav"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || 
              (item.id === 'home' && location.pathname === '/admin/mobile');
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all"
                style={{ 
                  color: active ? '#D4A84B' : '#6B6B6B',
                  background: active ? 'rgba(212, 168, 75, 0.1)' : 'transparent'
                }}
                data-testid={`admin-nav-${item.id}`}
              >
                <Icon className="w-5 h-5 mb-1" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Pro Space navigation (fond sombre)
  if (isInProArea && isPro) {
    const proNav = [
      { id: 'profile', icon: User, label: 'Profil', section: 'profile' },
      { id: 'network', icon: Users, label: 'Réseau', section: 'network' },
      { id: 'opportunities', icon: Briefcase, label: 'Offres', section: 'opportunities' },
      { id: 'events', icon: Calendar, label: 'Agenda', section: 'events' },
    ];

    return (
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-bottom"
        style={{ 
          background: 'linear-gradient(to top, #1A1A14 85%, #1A1A14dd)',
          borderTop: '1px solid rgba(212, 168, 75, 0.15)'
        }}
        data-testid="pro-mobile-nav"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {proNav.map((item) => {
            const Icon = item.icon;
            const searchParams = new URLSearchParams(location.search);
            const currentSection = searchParams.get('section') || 'profile';
            const active = currentSection === item.section;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/espace-pro?section=${item.section}`)}
                className="flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all"
                style={{ 
                  color: active ? '#D4A84B' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(212, 168, 75, 0.1)' : 'transparent'
                }}
                data-testid={`pro-nav-${item.id}`}
              >
                <Icon className="w-5 h-5 mb-1" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Public navigation (fond clair)
  const publicNav = [
    { id: 'home', icon: Home, label: 'Accueil', path: '/' },
    { id: 'catalogue', icon: Users, label: 'Catalogue', path: '/catalogue' },
    { id: 'programme', icon: Calendar, label: 'Programme', path: '/programme' },
  ];

  // Add admin or pro link based on role
  if (isAdmin) {
    publicNav.push({ id: 'admin', icon: QrCode, label: 'Admin', path: '/admin/mobile' });
  } else if (isPro) {
    publicNav.push({ id: 'pro', icon: Briefcase, label: 'Espace Pro', path: '/espace-pro' });
  } else {
    publicNav.push({ id: 'pro', icon: Briefcase, label: 'Espace Pro', path: '/espace-pro/connexion' });
  }

  const isActive = (item) => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-bottom"
      style={{ 
        background: '#F4F1EA',
        borderTop: '1px solid #E5E0D8',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
      }}
      data-testid="public-mobile-nav"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {publicNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all"
              style={{ 
                color: active ? '#D4A84B' : '#6B6B6B',
                background: active ? 'rgba(212, 168, 75, 0.1)' : 'transparent'
              }}
              data-testid={`mobile-nav-${item.id}`}
            >
              <Icon className="w-5 h-5 mb-1" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
