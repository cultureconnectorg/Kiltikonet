import React, { useState } from 'react';

const TABS = [
  { id: 'feed', label: 'Feed', icon: 'dynamic_feed' },
  { id: 'reels', label: 'Reels', icon: 'play_circle' },
  { id: 'brain', label: 'BRAIN', icon: 'psychology' },
  { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet' },
  { id: 'profile', label: 'Profil', icon: 'person' },
];

const MobileNavigation = ({ activeSection, onNavigate }) => {
  const [tapped, setTapped] = useState(null);

  const handleTap = (tab) => {
    setTapped(tab.id);
    setTimeout(() => setTapped(null), 200);
    onNavigate(tab.id);
  };

  return (
    <>
      <div className="md:hidden" style={{ height: 'calc(76px + env(safe-area-inset-bottom, 0px))' }} />
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: 'rgba(10,10,11,0.92)',
          backdropFilter: 'blur(32px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
        }}
        data-testid="mobile-navigation">
        <div className="flex items-center justify-around px-2 pt-2 pb-1.5 max-w-lg mx-auto">
          {TABS.map((tab) => {
            const isActive = activeSection === tab.id;
            const isTapped = tapped === tab.id;

            if (tab.id === 'brain') {
              return (
                <button key={tab.id} onClick={() => handleTap(tab)}
                  className="flex flex-col items-center justify-center relative -mt-5"
                  style={{ transform: isTapped ? 'scale(0.9)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.2,0,0,1)' }}
                  data-testid="mobile-nav-brain">
                  <div className="flex items-center justify-center rounded-full"
                    style={{
                      width: isActive ? 56 : 48, height: isActive ? 56 : 48,
                      background: isActive ? 'linear-gradient(135deg, #e5c363, #c8a84b)' : 'linear-gradient(135deg, #E8D5A0, #d8c591)',
                      boxShadow: isActive ? '0 0 24px rgba(200,168,75,0.5), 0 4px 16px rgba(0,0,0,0.4)' : '0 0 12px rgba(200,168,75,0.2), 0 4px 8px rgba(0,0,0,0.3)',
                      transition: 'all 0.3s cubic-bezier(0.2,0,0,1)',
                      border: '3px solid #0a0a0b',
                    }}>
                    <span className="material-symbols-outlined"
                      style={{ color: '#3a2f09', fontSize: isActive ? 26 : 22, fontVariationSettings: "'FILL' 1, 'wght' 400" }}>psychology</span>
                  </div>
                </button>
              );
            }

            return (
              <button key={tab.id} onClick={() => handleTap(tab)}
                className="relative flex flex-col items-center justify-center flex-1"
                style={{ minHeight: 48, transform: isTapped ? 'scale(0.88)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.2,0,0,1)' }}
                data-testid={`mobile-nav-${tab.id}`}>
                {isActive && <span className="absolute -top-0.5 w-5 h-0.5 rounded-full" style={{ background: '#E8D5A0' }} />}
                <span className="material-symbols-outlined"
                  style={{
                    color: isActive ? '#E8D5A0' : 'rgba(229,226,227,0.35)',
                    fontSize: 22,
                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 300",
                    transition: 'all 0.3s',
                  }}>{tab.icon}</span>
                <span style={{
                  fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: isActive ? '#E8D5A0' : 'rgba(229,226,227,0.35)',
                  marginTop: 1, transition: 'color 0.3s',
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
