/**
 * Configuration centralisée de l'URL du backend.
 *
 * Usage recommandé dans les composants :
 *   import { BACKEND_URL } from '../config/api';
 *   const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
 */

const _raw = process.env.REACT_APP_BACKEND_URL;

if (!_raw) {
  if (process.env.NODE_ENV === 'production') {
    // En production, une URL manquante est une erreur fatale de déploiement.
    console.error(
      '[Kiltikonet] ERREUR CRITIQUE : REACT_APP_BACKEND_URL est manquante. ' +
      "Définissez cette variable dans votre fichier frontend/.env ou dans les variables d'environnement de déploiement."
    );
  } else {
    // En développement, on utilise localhost avec un avertissement visible.
    console.warn(
      '[Kiltikonet] REACT_APP_BACKEND_URL non définie — ' +
      'utilisation du fallback http://localhost:8001. ' +
      'Créez frontend/.env avec REACT_APP_BACKEND_URL=http://localhost:8001'
    );
  }
}

/** URL de base du backend, sans slash final. */
export const BACKEND_URL = (_raw || 'http://localhost:8001').replace(/\/$/, '');
