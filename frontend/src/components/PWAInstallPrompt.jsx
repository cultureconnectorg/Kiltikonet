/**
 * PWA Install Prompt Component - CC2026
 * Gère l'installation de l'application sur mobile
 */

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt (Android/Desktop)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a delay (not immediately on page load)
      const dismissed = localStorage.getItem('cc2026_pwa_dismissed');
      const lastDismissed = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed > 3) { // Show again after 3 days
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    // For iOS, show manual instructions after delay
    if (isIOSDevice) {
      const dismissed = localStorage.getItem('cc2026_pwa_dismissed');
      const lastDismissed = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 8000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('cc2026_pwa_dismissed', Date.now().toString());
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || (!showPrompt && !showIOSInstructions)) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      {showPrompt && !showIOSInstructions && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-bottom"
          style={{ background: 'linear-gradient(to top, #1A1A14, #1A1A14ee)' }}
        >
          <div className="max-w-lg mx-auto">
            <div 
              className="rounded-2xl p-4 flex items-start gap-4"
              style={{ background: '#2A2820', border: '1px solid #D4A84B30' }}
            >
              {/* Icon */}
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#D4A84B20' }}
              >
                <Smartphone className="w-6 h-6" style={{ color: '#D4A84B' }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm mb-1" style={{ color: '#F4F1EA' }}>
                  Installer l'application
                </h3>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Accédez à CC2026 directement depuis votre écran d'accueil, même hors-ligne.
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleInstall}
                    size="sm"
                    className="flex-1"
                    style={{ background: '#D4A84B', color: '#1A1A14' }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Installer
                  </Button>
                  <Button 
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Plus tard
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <button 
                onClick={handleDismiss}
                className="p-1 -mt-1 -mr-1"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4">
          <div 
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#1A1A14', border: '1px solid #D4A84B30' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: '#F4F1EA' }}>
                Installer sur iPhone
              </h3>
              <button onClick={handleDismiss} style={{ color: 'rgba(255,255,255,0.4)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: '#D4A84B', color: '#1A1A14' }}
                >
                  1
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#F4F1EA' }}>
                    Appuyez sur le bouton <strong>Partager</strong>
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    (icône carrée avec flèche vers le haut)
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: '#D4A84B', color: '#1A1A14' }}
                >
                  2
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#F4F1EA' }}>
                    Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: '#D4A84B', color: '#1A1A14' }}
                >
                  3
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#F4F1EA' }}>
                    Confirmez en appuyant sur <strong>"Ajouter"</strong>
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleDismiss}
              className="w-full mt-6"
              style={{ background: '#D4A84B', color: '#1A1A14' }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              J'ai compris
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
