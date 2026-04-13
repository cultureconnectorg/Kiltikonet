/**
 * KKAvatar — Avatar universel Kiltikonet
 * Niveaux de fallback :
 *   1. Image source (src) avec onError
 *   2. Initiales + gradient coloré calculé depuis name
 *   3. Icône person (Material Symbols)
 */
import React, { useState } from 'react';

// Gradients pour les initiales — rotation selon premier caractère
const GRADIENTS = [
  'linear-gradient(135deg, #8B1A4A, #C2185B)',
  'linear-gradient(135deg, #1A3A8B, #1565C0)',
  'linear-gradient(135deg, #1A6B3A, #2E7D32)',
  'linear-gradient(135deg, #6B1A8B, #7B1FA2)',
  'linear-gradient(135deg, #8B5A1A, #E65100)',
  'linear-gradient(135deg, #1A6B6B, #00695C)',
  'linear-gradient(135deg, #6B3A1A, #4E342E)',
  'linear-gradient(135deg, #3A1A6B, #311B92)',
];

const SIZES = { sm: 28, md: 36, lg: 44, xl: 52, '2xl': 64 };

function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getGradient(name) {
  if (!name) return GRADIENTS[0];
  const code = name.charCodeAt(0) || 0;
  return GRADIENTS[code % GRADIENTS.length];
}

/**
 * @param {string}  src         — URL de l'image
 * @param {string}  name        — Nom complet (pour initiales + gradient)
 * @param {number|string} size  — Taille en px ou clé 'sm'|'md'|'lg'|'xl'|'2xl'
 * @param {boolean} ring        — Ajoute un anneau doré autour de l'avatar
 * @param {string}  className   — Classes CSS additionnelles
 * @param {object}  style       — Styles inline additionnels
 */
const KKAvatar = ({ src, name, size = 'lg', ring = false, className = '', style = {} }) => {
  const [imgError, setImgError] = useState(false);

  const px = typeof size === 'number' ? size : (SIZES[size] || 44);
  const fontSize = Math.round(px * 0.36);

  const ringStyle = ring
    ? { border: '2px solid rgba(232,213,160,0.4)' }
    : {};

  const containerStyle = {
    width: px,
    height: px,
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...ringStyle,
    ...style,
  };

  const showImage = src && !imgError;
  const initials = getInitials(name);

  return (
    <div className={className} style={containerStyle} aria-label={name || 'Avatar'}>
      {showImage ? (
        <img
          src={src}
          alt={name || ''}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      ) : initials ? (
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: getGradient(name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.02em',
            userSelect: 'none',
          }}>
            {initials}
          </span>
        </div>
      ) : (
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(232,213,160,0.12), rgba(200,168,75,0.08))',
          border: '1px solid rgba(232,213,160,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span
            className="material-symbols-outlined"
            style={{ color: '#E8D5A0', fontSize: Math.round(px * 0.45) }}
          >
            person
          </span>
        </div>
      )}
    </div>
  );
};

export default KKAvatar;
