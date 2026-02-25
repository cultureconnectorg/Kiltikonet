import React, { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Download, QrCode, Sparkles, Users, Crown } from 'lucide-react';
import { profileTypes } from '../lib/translations';

const tierConfig = {
  emerging: { 
    name: 'ÉMERGENT', 
    nameEn: 'EMERGING', 
    color: '#00d4ff', 
    borderColor: '#00d4ff',
    icon: Sparkles 
  },
  professional: { 
    name: 'PROFESSIONNEL', 
    nameEn: 'PROFESSIONAL', 
    color: '#D2A53C', 
    borderColor: '#D2A53C',
    icon: Users 
  },
  institutional: { 
    name: 'INSTITUTIONNEL', 
    nameEn: 'INSTITUTIONAL', 
    color: '#a855f7', 
    borderColor: '#a855f7',
    icon: Crown 
  }
};

export const BadgeGenerator = ({ participant, onClose }) => {
  const { language, t } = useLanguage();
  const badgeRef = useRef(null);
  
  const tier = tierConfig[participant?.tier] || tierConfig.professional;
  const TierIcon = tier.icon;
  
  // Generate QR code data (would link to participant profile)
  const qrData = `https://cultureconnect2026.com/p/${participant?.id || 'demo'}`;
  
  // Simple QR code SVG pattern (in production, use a proper QR library)
  const generateQRPattern = () => {
    const size = 80;
    const modules = 21;
    const moduleSize = size / modules;
    const pattern = [];
    
    // Generate pseudo-random pattern based on ID
    const seed = (participant?.id || 'demo').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        // Position detection patterns (corners)
        const isPositionPattern = 
          (row < 7 && col < 7) || 
          (row < 7 && col >= modules - 7) || 
          (row >= modules - 7 && col < 7);
        
        // Timing patterns
        const isTimingPattern = (row === 6 || col === 6);
        
        // Random data pattern
        const isData = ((seed * (row + 1) * (col + 1)) % 3) === 0;
        
        if (isPositionPattern || isTimingPattern || isData) {
          pattern.push(
            <rect
              key={`${row}-${col}`}
              x={col * moduleSize}
              y={row * moduleSize}
              width={moduleSize}
              height={moduleSize}
              fill="white"
            />
          );
        }
      }
    }
    
    return pattern;
  };

  const getProfileLabel = (type) => {
    const profile = profileTypes.find(p => p.value === type);
    return profile ? t(profile.labelKey) : type;
  };

  const handleDownload = () => {
    // In production, use html2canvas or similar to generate image
    alert(language === 'fr' 
      ? 'Fonctionnalité de téléchargement - En production, ceci générerait un PDF/PNG du badge'
      : 'Download feature - In production, this would generate a PDF/PNG of the badge'
    );
  };

  if (!participant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-lg w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/60 hover:text-white"
        >
          {language === 'fr' ? 'Fermer ✕' : 'Close ✕'}
        </button>

        {/* Badge Card */}
        <div 
          ref={badgeRef}
          className="relative overflow-hidden rounded-2xl"
          style={{
            aspectRatio: '3/4',
            background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)',
            border: `3px solid ${tier.borderColor}`,
            boxShadow: `0 0 40px ${tier.borderColor}40, inset 0 0 60px ${tier.borderColor}10`
          }}
        >
          {/* Glow effect at top */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1"
            style={{
              background: `linear-gradient(90deg, transparent, ${tier.borderColor}, transparent)`,
              boxShadow: `0 0 20px ${tier.borderColor}`
            }}
          />

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <pattern id="badge-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="white" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#badge-pattern)" />
            </svg>
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col p-6">
            {/* Header - Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-2">
                <img 
                  src="/logo.png" 
                  alt="Culture Connect" 
                  className="h-12 w-auto"
                  style={{ filter: `drop-shadow(0 0 10px ${tier.borderColor})` }}
                />
              </div>
              <p className="text-white/40 text-xs tracking-widest uppercase">
                Fort-de-France · 20-23 Mai 2026
              </p>
            </div>

            {/* Photo Section */}
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Photo frame */}
              <div 
                className="relative w-32 h-32 rounded-xl overflow-hidden mb-4"
                style={{
                  border: `2px solid ${tier.borderColor}40`,
                  boxShadow: `0 0 30px ${tier.borderColor}30`
                }}
              >
                <img
                  src={participant.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop'}
                  alt={participant.full_name}
                  className="w-full h-full object-cover"
                />
                {/* Photo overlay gradient */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, transparent 60%, ${tier.borderColor}20 100%)`
                  }}
                />
              </div>

              {/* Name */}
              <h2 
                className="text-2xl font-bold text-white text-center mb-1"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {participant.full_name}
              </h2>

              {/* Organization */}
              <p className="text-white/60 text-sm text-center mb-4">
                {participant.organization_name}
              </p>

              {/* Tier Badge */}
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: `${tier.borderColor}20`,
                  border: `1px solid ${tier.borderColor}50`
                }}
              >
                <TierIcon className="w-4 h-4" style={{ color: tier.borderColor }} />
                <span 
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: tier.borderColor }}
                >
                  {language === 'fr' ? tier.name : tier.nameEn}
                </span>
              </div>

              {/* Profile Type */}
              <p className="text-white/40 text-xs mt-3 uppercase tracking-wider">
                {getProfileLabel(participant.profile_type)}
              </p>
            </div>

            {/* Footer - QR Code & Info */}
            <div className="flex items-end justify-between pt-4 border-t border-white/10">
              {/* Left - ID & Stand info */}
              <div>
                <p className="text-white/30 text-xs mb-1">ID: {participant.id?.slice(0, 8) || 'CC2026'}</p>
                {participant.stand_request && (
                  <div 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                    style={{ background: `${tier.borderColor}30`, color: tier.borderColor }}
                  >
                    Stand {participant.stand_category || ''}
                  </div>
                )}
              </div>

              {/* Right - QR Code */}
              <div 
                className="w-20 h-20 rounded-lg p-1.5"
                style={{
                  background: 'white',
                  boxShadow: `0 0 20px ${tier.borderColor}30`
                }}
              >
                <svg viewBox="0 0 80 80" className="w-full h-full">
                  <rect width="80" height="80" fill="#0a0a0f" />
                  {generateQRPattern()}
                  {/* Center logo placeholder */}
                  <rect x="30" y="30" width="20" height="20" fill="#0a0a0f" />
                  <text x="40" y="43" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">CC</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Corner decorations */}
          <div 
            className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 rounded-tl-lg"
            style={{ borderColor: `${tier.borderColor}40` }}
          />
          <div 
            className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 rounded-tr-lg"
            style={{ borderColor: `${tier.borderColor}40` }}
          />
          <div 
            className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 rounded-bl-lg"
            style={{ borderColor: `${tier.borderColor}40` }}
          />
          <div 
            className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 rounded-br-lg"
            style={{ borderColor: `${tier.borderColor}40` }}
          />
        </div>

        {/* Download Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleDownload}
            className="h-12 px-8"
            style={{
              background: tier.borderColor,
              color: '#0a0a0f'
            }}
          >
            <Download className="w-5 h-5 mr-2" />
            {language === 'fr' ? 'Télécharger le badge' : 'Download badge'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Standalone badge preview component for the catalog
export const BadgePreview = ({ participant, size = 'small' }) => {
  const tier = tierConfig[participant?.tier] || tierConfig.professional;
  
  if (!participant) return null;
  
  const isSmall = size === 'small';
  
  return (
    <div 
      className={`relative overflow-hidden rounded-lg ${isSmall ? 'w-24 h-32' : 'w-48 h-64'}`}
      style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)',
        border: `2px solid ${tier.borderColor}40`,
      }}
    >
      <div className="h-full flex flex-col p-2">
        <div className="text-center mb-1">
          <p className="text-[8px] text-white/40 tracking-wider">CULTURE CONNECT</p>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <img
            src={participant.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'}
            alt={participant.full_name}
            className={`rounded object-cover mb-1 ${isSmall ? 'w-12 h-12' : 'w-20 h-20'}`}
          />
          <p className={`text-white font-semibold text-center truncate w-full ${isSmall ? 'text-[8px]' : 'text-xs'}`}>
            {participant.full_name}
          </p>
          <p className={`truncate w-full text-center ${isSmall ? 'text-[6px] text-white/40' : 'text-[10px] text-white/50'}`}>
            {participant.organization_name}
          </p>
        </div>
        
        <div 
          className="text-center py-0.5 rounded text-[6px] font-bold uppercase"
          style={{ background: `${tier.borderColor}30`, color: tier.borderColor }}
        >
          {tier.name}
        </div>
      </div>
    </div>
  );
};
