import React, { useState } from 'react';

const TABS = [
  { id: 'feed', label: 'Explore', icon: 'explore' },
  { id: 'network', label: 'Network', icon: 'hub' },
  { id: 'brain', label: 'BRAIN', icon: 'psychology' },
  { id: 'shop', label: 'Shop', icon: 'local_mall' },
  { id: 'settings', label: 'Profile', icon: 'person' },
];

const MobileNavigation = ({ activeSection, onNavigate, feedBadge = 0, networkBadge = 0 }) => {
  const [tapped, setTapped] = useState(null);

  const handleTap = (tab) => {
    setTapped(tab.id);
    setTimeout(() => setTapped(null), 200);
    onNavigate(tab.id);
  };

  return (
    <>
      <div className="md:hidden" style={{ height: 'calc(72px + env(safe-area-inset-bottom, 0px))' }} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: 'rgba(19,19,20,0.90)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          borderTop: 'none',
        }}
        role="navigation"
        aria-label="Navigation mobile"
        data-testid="mobile-navigation"
      >
        <div className="flex items-center justify-around pt-3 pb-2 max-w-lg mx-auto">
          {TABS.map((tab) => {
            const isActive = activeSection === tab.id || (tab.id === 'brain' && activeSection === 'create');
            const isTapped = tapped === tab.id;
            const badge = tab.id === 'feed' ? feedBadge : tab.id === 'network' ? networkBadge : 0;

            if (tab.id === 'brain') {
              return (
                <button key={tab.id} onClick={() => handleTap(tab)}
                  className="flex flex-col items-center justify-center"
                  style={{
                    minHeight: 48, minWidth: 48,
                    transform: isTapped ? 'scale(0.9)' : isActive ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.2,0,0,1)',
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(232,213,160,0.4))' : 'none',
                  }}
                  aria-label="CVL BRAIN" data-testid="mobile-nav-brain">
                  <span className="material-symbols-outlined"
                    style={{
                      color: isActive ? '#E8D5A0' : 'rgba(229,226,227,0.4)',
                      fontSize: 28,
                      fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 300",
                      transition: 'all 0.3s',
                    }}>{tab.icon}</span>
                  <span style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 10, fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: isActive ? '#E8D5A0' : 'rgba(229,226,227,0.4)',
                    marginTop: 2,
                    transition: 'color 0.3s',
                  }}>{tab.label}</span>
                </button>
              );
            }

            return (
              <button key={tab.id} onClick={() => handleTap(tab)}
                className="relative flex flex-col items-center justify-center flex-1"
                style={{
                  minHeight: 48, minWidth: 44,
                  transform: isTapped ? 'scale(0.88)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.2,0,0,1)',
                }}
                aria-current={isActive ? 'page' : undefined} aria-label={tab.label}
                data-testid={`mobile-nav-${tab.id}`}>
                <div className="relative">
                  <span className="material-symbols-outlined"
                    style={{
                      color: isActive ? '#E8D5A0' : 'rgba(229,226,227,0.4)',
                      fontSize: 24,
                      fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 300",
                      transition: 'all 0.3s',
                    }}>{tab.icon}</span>
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold px-1"
                      style={{ background: '#ffb4ab', color: '#690005' }}>{badge > 9 ? '9+' : badge}</span>
                  )}
                </div>
                <span style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 10, fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: isActive ? '#E8D5A0' : 'rgba(229,226,227,0.4)',
                  marginTop: 2,
                  transition: 'color 0.3s',
                }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileNavigation;
