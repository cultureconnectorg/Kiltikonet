/**
 * KKEmptyState — État vide standardisé Kiltikonet
 */
import React from 'react';

/**
 * @param {string} icon        — Nom d'icône Material Symbols
 * @param {string} title       — Titre principal
 * @param {string} description — Description optionnelle
 * @param {{ label: string, onClick: function }} action — Bouton d'action optionnel
 * @param {string} className   — Classes CSS additionnelles
 */
const KKEmptyState = ({ icon = 'inbox', title, description, action, className = '' }) => (
  <div
    className={className}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      gap: 12,
    }}
    role="status"
    aria-live="polite"
  >
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: 'rgba(232,213,160,0.06)',
      border: '1px solid rgba(232,213,160,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span
        className="material-symbols-outlined"
        style={{ color: '#E8D5A0', fontSize: 28, fontVariationSettings: "'FILL' 0, 'wght' 200" }}
      >
        {icon}
      </span>
    </div>

    {title && (
      <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600, color: '#e5e2e3', margin: 0 }}>
        {title}
      </p>
    )}

    {description && (
      <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#72727a', margin: 0, maxWidth: 280, lineHeight: 1.5 }}>
        {description}
      </p>
    )}

    {action && (
      <button
        onClick={action.onClick}
        style={{
          marginTop: 8,
          padding: '8px 20px',
          borderRadius: 20,
          background: 'rgba(232,213,160,0.1)',
          border: '1px solid rgba(232,213,160,0.2)',
          color: '#E8D5A0',
          fontFamily: "'Manrope', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.05em',
        }}
      >
        {action.label}
      </button>
    )}
  </div>
);

export default KKEmptyState;
