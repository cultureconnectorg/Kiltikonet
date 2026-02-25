import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Download, X } from 'lucide-react';
import { profileTypes } from '../lib/translations';

const tierConfig = {
  emerging: { name: 'ÉMERGENT', nameEn: 'EMERGING', color: '#4A5D4E' },
  professional: { name: 'PROFESSIONNEL', nameEn: 'PROFESSIONAL', color: '#A65D47' },
  institutional: { name: 'INSTITUTIONNEL', nameEn: 'INSTITUTIONAL', color: '#1A1A1A' }
};

export const BadgeGenerator = ({ participant, onClose }) => {
  const { language, t } = useLanguage();
  
  const tier = tierConfig[participant?.tier] || tierConfig.professional;
  
  const getProfileLabel = (type) => {
    const p = profileTypes.find(x => x.value === type);
    return p ? t(p.labelKey) : type;
  };

  const handleDownload = () => {
    alert(language === 'fr' 
      ? 'Le badge sera disponible au téléchargement après validation'
      : 'Badge will be available for download after validation'
    );
  };

  if (!participant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80">
      <div className="relative max-w-sm w-full">
        <button onClick={onClose} className="absolute -top-10 right-0 text-paper/60 hover:text-paper flex items-center gap-2">
          {language === 'fr' ? 'Fermer' : 'Close'} <X className="w-4 h-4" />
        </button>

        {/* Badge */}
        <div 
          className="bg-paper overflow-hidden"
          style={{ aspectRatio: '3/4', border: `4px solid ${tier.color}` }}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="py-4 px-6 text-center border-b border-lightborder">
              <img src="/logo.png" alt="Culture Connect" className="h-10 mx-auto mb-2" />
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

            {/* Footer */}
            <div className="py-4 px-6 border-t border-lightborder flex items-center justify-between">
              <div>
                <p className="text-xs text-charcoal/40">ID</p>
                <p className="text-xs text-charcoal font-mono">{participant.id?.slice(0, 8) || 'CC2026'}</p>
              </div>
              
              {/* QR placeholder */}
              <div className="w-16 h-16 bg-charcoal flex items-center justify-center">
                <span className="text-paper text-xs font-syne">QR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Download */}
        <div className="mt-6 flex justify-center">
          <Button onClick={handleDownload} className="h-12 px-8 font-syne text-sm rounded-none" style={{ backgroundColor: tier.color, color: '#F4F1EA' }}>
            <Download className="w-4 h-4 mr-2" />
            {language === 'fr' ? 'Télécharger' : 'Download'}
          </Button>
        </div>
      </div>
    </div>
  );
};
