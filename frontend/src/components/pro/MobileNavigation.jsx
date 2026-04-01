import React, { useState } from 'react';
import { Compass, Users, PlusCircle, Calendar, User } from 'lucide-react';

const TABS = [
  { id: 'feed', label: 'Feed', icon: Compass },
  { id: 'network', label: 'Réseau', icon: Users },
  { id: 'create', label: 'Créer', icon: PlusCircle },
  { id: 'events', label: 'Agenda', icon: Calendar },
  { id: 'profile', label: 'Moi', icon: User },
];

const MobileNavigation = ({ activeSection, onNavigate, feedBadge = 0, networkBadge = 0 }) => {
  const [tapped, setTapped] = useState(null);

  const handleTap = (id) => {
    setTapped(id);
    setTimeout(() => setTapped(null), 200);
    onNavigate(id);
  };

  return (
    <>
      <div className="md:hidden" style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: '#0a0a0a',
          borderTop: '1px solid #1e1e1e',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        role="navigation"
        aria-label="Navigation mobile"
        data-testid="mobile-navigation"
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {TABS.map((tab) => {
            const isActive = activeSection === tab.id;
            const isTapped = tapped === tab.id;
            const badge = tab.id === 'feed' ? feedBadge : tab.id === 'network' ? networkBadge : 0;
            const Icon = tab.icon;

            if (tab.id === 'create') {
              return (
                <button key={tab.id} onClick={() => handleTap(tab.id)}
                  className="relative flex items-center justify-center -mt-4"
                  style={{ minHeight: 44, minWidth: 44, transform: isTapped ? 'scale(0.9)' : 'scale(1)', transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  aria-label="Créer" data-testid="mobile-nav-create">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: '#C8A84B', boxShadow: '0 4px 16px rgba(200,168,75,0.3)' }}>
                    <Icon size={24} style={{ color: '#0a0a0a' }} strokeWidth={2.5} />
                  </div>
                </button>
              );
            }

            return (
              <button key={tab.id} onClick={() => handleTap(tab.id)}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1"
                style={{ minHeight: 44, minWidth: 44, transform: isTapped ? 'scale(0.88)' : 'scale(1)', transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                aria-current={isActive ? 'page' : undefined} aria-label={tab.label}
                data-testid={`mobile-nav-${tab.id}`}>
                <div className="relative">
                  <Icon size={22} style={{ color: isActive ? '#C8A84B' : '#444', transition: 'color 0.15s' }} strokeWidth={isActive ? 2.2 : 1.6} />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold px-1"
                      style={{ background: '#E85A4F', color: '#fff' }}>{badge > 9 ? '9+' : badge}</span>
                  )}
                </div>
                <span className="text-[10px] font-medium" style={{ color: isActive ? '#C8A84B' : '#444', transition: 'color 0.15s', fontFamily: "'Inter', sans-serif" }}>
                  {tab.label}
                </span>
                {isActive && <div className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ background: '#C8A84B' }} />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileNavigation;
