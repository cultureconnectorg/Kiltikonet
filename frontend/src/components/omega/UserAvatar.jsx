import { useState } from "react";

/**
 * UserAvatar — Composant universel pour les avatars utilisateur.
 * Affiche la photo si disponible, sinon les initiales sur fond gold.
 * Fallback automatique si l'image est cassée (404/erreur réseau).
 *
 * Props:
 *   src        — URL de l'avatar (string | null | undefined)
 *   name       — Nom complet ou prénom (pour générer l'initiale)
 *   size       — Taille en px (défaut: 40)
 *   border     — Afficher une bordure gold (défaut: true)
 *   className  — Classes CSS additionnelles
 */
export default function UserAvatar({ src, name = "?", size = 40, border = true, className = "" }) {
  const [imgError, setImgError] = useState(false);
  const hasValidSrc = src && typeof src === "string" && src.length > 1 && !imgError;

  const initial = (name || "?").charAt(0).toUpperCase();

  const containerStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: hasValidSrc ? "transparent" : "rgba(242, 202, 80, 0.1)",
    border: border ? "1.5px solid rgba(242, 202, 80, 0.5)" : "none",
    fontSize: Math.max(size * 0.38, 12),
    fontWeight: 700,
    color: "#f2ca50",
    userSelect: "none",
  };

  return (
    <div style={containerStyle} className={className} data-testid="user-avatar">
      {hasValidSrc ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
