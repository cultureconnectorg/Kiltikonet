import React, { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Download, X, ExternalLink } from 'lucide-react';
import { profileTypes } from '../lib/translations';
import QRCode from 'react-qr-code';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const FRONTEND_URL = window.location.origin;

const tierConfig = {
  emerging: { name: 'ÉMERGENT', nameEn: 'EMERGING', color: '#4A5D4E' },
  professional: { name: 'PROFESSIONNEL', nameEn: 'PROFESSIONAL', color: '#A65D47' },
  institutional: { name: 'INSTITUTIONNEL', nameEn: 'INSTITUTIONAL', color: '#1A1A1A' }
};

export const BadgeGenerator = ({ participant, onClose }) => {
  const { language, t } = useLanguage();
  const badgeRef = useRef(null);
  
  const tier = tierConfig[participant?.tier] || tierConfig.professional;
  
  const getProfileLabel = (type) => {
    const p = profileTypes.find(x => x.value === type);
    return p ? t(p.labelKey) : type;
  };

  // URL for QR code - points to participant profile page
  const profileUrl = `${FRONTEND_URL}/participant/${participant?.id}`;

  const handleDownloadPDF = () => {
    // Download PDF badge from backend
    window.open(`${API}/participant/${participant.id}/badge`, '_blank');
  };

  const handleViewProfile = () => {
    window.open(profileUrl, '_blank');
  };

  if (!participant) return null;

  const isApproved = participant.status === 'approved';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80">
      <div className="relative max-w-sm w-full">
        <button onClick={onClose} className="absolute -top-10 right-0 text-paper/60 hover:text-paper flex items-center gap-2">
          {language === 'fr' ? 'Fermer' : 'Close'} <X className="w-4 h-4" />
        </button>

        {/* Badge Preview */}
        <div 
          ref={badgeRef}
          className="bg-paper overflow-hidden"
          style={{ aspectRatio: '3/4', border: `4px solid ${tier.color}` }}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="py-4 px-6 text-center border-b border-lightborder">
              <p className="font-serif text-lg text-charcoal font-bold">CULTURE CONNECT 2026</p>
              <p className="text-xs text-charcoal/50 tracking-widest uppercase">
                Fort-de-France · Mai 2026
              </p>
            </div>

            {/* Photo */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="w-28 h-28 border-2 border-lightborder overflow-hidden mb-4">
                <img
                  src={participant.logo_url || participant.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'}
                  alt={participant.full_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="font-serif text-xl text-charcoal text-center mb-1">
                {participant.full_name}
              </h2>
              <p className="text-charcoal/60 text-sm text-center mb-4">
                {participant.organization_name}
              </p>

              {/* Tier Badge */}
              <div 
                className="px-4 py-2 text-xs font-syne tracking-wider uppercase"
                style={{ backgroundColor: tier.color, color: '#F4F1EA' }}
              >
                {language === 'fr' ? tier.name : tier.nameEn}
              </div>

              <p className="text-charcoal/40 text-xs mt-3 uppercase tracking-wider">
                {getProfileLabel(participant.profile_type)}
              </p>
            </div>

            {/* Footer with QR Code */}
            <div className="py-4 px-6 border-t border-lightborder flex items-center justify-between">
              <div>
                <p className="text-xs text-charcoal/40">ID</p>
                <p className="text-xs text-charcoal font-mono">{participant.id?.slice(0, 8).toUpperCase() || 'CC2026'}</p>
                {participant.stand_request && (
                  <p className="text-xs text-sage font-syne mt-1">STAND</p>
                )}
              </div>
              
              {/* Real QR Code */}
              <div className="bg-white p-1">
                <QRCode 
                  value={profileUrl}
                  size={56}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#1A1A1A"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {isApproved ? (
            <>
              <Button 
                onClick={handleDownloadPDF} 
                className="w-full h-12 px-8 font-syne text-sm rounded-none" 
                style={{ backgroundColor: tier.color, color: '#F4F1EA' }}
                data-testid="download-badge-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Télécharger le Badge PDF' : 'Download PDF Badge'}
              </Button>
              <Button 
                onClick={handleViewProfile}
                variant="outline"
                className="w-full h-10 px-8 font-syne text-xs rounded-none border-lightborder text-charcoal/70"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                {language === 'fr' ? 'Voir le profil public' : 'View public profile'}
              </Button>
            </>
          ) : (
            <div className="text-center p-4 border border-amber-200 bg-amber-50">
              <p className="text-amber-700 text-sm font-syne">
                {language === 'fr' 
                  ? 'Badge disponible après validation de l\'accréditation'
                  : 'Badge available after accreditation approval'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
