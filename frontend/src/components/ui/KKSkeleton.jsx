/**
 * KKSkeleton — Skeleton shimmer adapté à la charte Kiltikonet
 * Variantes : 'rect' (default) | 'circle' | 'text'
 */
import React from 'react';

const KKSkeleton = ({ className = '', variant = 'rect', size, width, height, style = {} }) => {
  const baseStyle = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(210,165,60,0.06) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'kk-skeleton-shimmer 1.5s infinite',
    ...style,
  };

  if (variant === 'circle') {
    const s = size || 40;
    return (
      <div
        className={className}
        style={{ width: s, height: s, borderRadius: '50%', flexShrink: 0, ...baseStyle }}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'text') {
    return (
      <div
        className={className}
        style={{ height: height || 14, borderRadius: 4, ...baseStyle }}
        aria-hidden="true"
      />
    );
  }

  // rect (default)
  return (
    <div
      className={className}
      style={{ height: height || 16, borderRadius: 6, ...baseStyle }}
      aria-hidden="true"
    />
  );
};

export default KKSkeleton;
