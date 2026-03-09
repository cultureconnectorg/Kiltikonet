// ═══════════════════════════════════════════════════════════════
// CULTURE CONNECT 2026 - DESIGN TOKENS PARTAGÉS
// Système de design unifié pour tous les workspaces
// ═══════════════════════════════════════════════════════════════

// Palette principale - Identité visuelle CC2026
export const BRAND_COLORS = {
  // Couleurs fondamentales
  charbon: '#1C1A14',      // Fond principal
  card: '#2A2820',         // Cartes et surfaces
  border: '#3A352D',       // Bordures subtiles
  
  // Accents principaux
  gold: '#D4A84B',         // Or - Action principale, highlights
  goldLight: '#E8C060',    // Or clair - Hover states
  terracotta: '#C4714A',   // Terracotta - Alerts, urgence modérée
  
  // Couleurs secondaires
  forest: '#4A5D4E',       // Forêt - Succès, validation
  burgundy: '#8B1A4A',     // Bordeaux - Admin, premium
  cream: '#F4F1EA',        // Crème - Texte sur dark
  
  // États
  success: '#4DA860',      // Vert succès
  warning: '#E8A83A',      // Orange warning
  urgent: '#E85A4F',       // Rouge urgent
  info: '#5B9BD5',         // Bleu info
};

// Couleurs par rôle/workspace - Permet l'identification visuelle
export const ROLE_COLORS = {
  admin:    { primary: '#8B1A4A', name: 'Admin',      icon: 'AD' },
  founder:  { primary: '#D4A84B', name: 'Fondateur',  icon: 'LC' },
  event:    { primary: '#4A5D4E', name: 'Événement',  icon: 'GW' },
  press:    { primary: '#00BCD4', name: 'Presse',     icon: 'KJ' },
  design:   { primary: '#E91E63', name: 'Design',     icon: 'TW' },
  business: { primary: '#C4714A', name: 'Business',   icon: 'AL' },
  finance:  { primary: '#4CAF50', name: 'Finance',    icon: 'WD' },
  captions: { primary: '#9C27B0', name: 'Régie',      icon: 'FB' },
  analyst:  { primary: '#607D8B', name: 'Analyste',   icon: 'DA' },
};

// Typographie
export const TYPOGRAPHY = {
  fontPrimary: "'Syne', sans-serif",
  fontDisplay: "'Bebas Neue', sans-serif",
  fontSerif: "'Cormorant Garamond', serif",
  
  // Tailles harmonisées
  sizes: {
    xs: '0.625rem',    // 10px
    sm: '0.75rem',     // 12px
    base: '0.875rem',  // 14px
    lg: '1rem',        // 16px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '2rem',     // 32px
  }
};

// Espacement - Système cohérent
export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
};

// Animations douces - Pour le confort visuel
export const TRANSITIONS = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '400ms ease',
};

// Opacités - Pour les états et overlays
export const OPACITY = {
  muted: 0.5,
  subtle: 0.3,
  hover: 0.8,
  disabled: 0.4,
};

// Styles de header communs
export const HEADER_STYLES = {
  height: '64px',
  background: '#2A2820',
  borderColor: 'rgba(255,255,255,0.08)',
};

// Styles de bouton CC2026 unifié
export const CC2026_BUTTON_STYLE = {
  background: 'transparent',
  border: '1px solid rgba(201, 147, 58, 0.5)',
  color: '#C9933A',
  fontWeight: '600',
  fontSize: '0.75rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.375rem',
  transition: 'all 150ms ease',
  hover: {
    background: 'rgba(201, 147, 58, 0.1)',
    borderColor: 'rgba(201, 147, 58, 0.8)',
  }
};

// Ombres subtiles
export const SHADOWS = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 4px 6px rgba(0,0,0,0.3)',
  lg: '0 10px 15px rgba(0,0,0,0.3)',
  glow: (color) => `0 0 20px ${color}30`,
};

// Helper pour obtenir les couleurs d'un rôle
export const getRoleStyle = (role) => {
  return ROLE_COLORS[role] || ROLE_COLORS.admin;
};

// Helper pour créer un style de bordure subtile
export const subtleBorder = (color, opacity = 0.2) => {
  return `1px solid ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export default {
  BRAND_COLORS,
  ROLE_COLORS,
  TYPOGRAPHY,
  SPACING,
  TRANSITIONS,
  OPACITY,
  HEADER_STYLES,
  CC2026_BUTTON_STYLE,
  SHADOWS,
  getRoleStyle,
  subtleBorder,
};
