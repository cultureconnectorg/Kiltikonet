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
      <div className="md:hidden" style={{ height: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: 'rgba(19,19,20,0.90)',
          backdropFilter: 'blur(32px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          borderTop: 'none',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
        role="navigation"
        aria-label="Navigation mobile"
        data-testid="mobile-navigation"
      >
        <div className="flex items-center justify-around px-4 pt-3 pb-2 max-w-lg mx-auto">
          {TABS.map((tab) => {
            const isActive = activeSection === tab.id || (tab.id === 'brain' && activeSection === 'create');
            const isTapped = tapped === tab.id;
            const badge = tab.id === 'feed' ? feedBadge : tab.id === 'network' ? networkBadge : 0;

            // BRAIN center — Gradient pill when active (Stitch: gradient + glow)
            if (tab.id === 'brain') {
              return (
                <button key={tab.id} onClick={() => handleTap(tab)}
                  className="flex flex-col items-center justify-center relative"
                  style={{
                    minHeight: 52, minWidth: 52,
                    transform: isTapped ? 'scale(0.9)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.2,0,0,1)',
                  }}
                  aria-label="CVL BRAIN" data-testid="mobile-nav-brain">
                  {isActive ? (
                    <div className="flex items-center justify-center rounded-full w-14 h-14"
                      style={{
                        background: 'linear-gradient(135deg, #e5c363, #c8a84b)',
                        boxShadow: '0 0 20px rgba(200,168,75,0.4)',
                      }}>
                      <span className="material-symbols-outlined"
                        style={{ color: '#131313', fontSize: 26, fontVariationSettings: "'FILL' 1, 'wght' 400" }}>psychology</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined"
                        style={{ color: 'rgba(229,226,227,0.4)', fontSize: 26, fontVariationSettings: "'FILL' 0, 'wght' 300", transition: 'all 0.3s' }}>psychology</span>
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(229,226,227,0.4)', marginTop: 2 }}>{tab.label}</span>
                    </>
                  )}
                </button>
              );
            }

            // Other tabs — active state: gold icon + dot indicator
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
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -top-0.5 w-1 h-1 rounded-full" style={{ background: '#E8D5A0' }} />
                )}
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
