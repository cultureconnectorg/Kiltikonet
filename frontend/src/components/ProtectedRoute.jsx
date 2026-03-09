import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

// Session expiration times
const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 hours for regular session
const PERSISTENT_SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for "remember me"

// Storage key for persistent sessions
const PERSISTENT_SESSION_KEY = 'cc2026_session';

/**
 * Get session from storage (localStorage for persistent, sessionStorage for temporary)
 */
export const getSession = () => {
  // First try localStorage (persistent session)
  const persistentSession = localStorage.getItem(PERSISTENT_SESSION_KEY);
  if (persistentSession) {
    try {
      const session = JSON.parse(persistentSession);
      // Check if persistent session is still valid (30 days)
      if (session.createdAt && (Date.now() - session.createdAt) < PERSISTENT_SESSION_EXPIRY_MS) {
        return { session, persistent: true };
      }
      // Expired, remove it
      localStorage.removeItem(PERSISTENT_SESSION_KEY);
    } catch {
      localStorage.removeItem(PERSISTENT_SESSION_KEY);
    }
  }
  
  // Then try sessionStorage (temporary session)
  const tempSession = sessionStorage.getItem('workspace_user');
  if (tempSession) {
    try {
      return { session: JSON.parse(tempSession), persistent: false };
    } catch {
      sessionStorage.removeItem('workspace_user');
    }
  }
  
  return { session: null, persistent: false };
};

/**
 * Save session to storage
 * @param {Object} sessionData - Session data
 * @param {boolean} rememberMe - If true, save to localStorage for persistence
 */
export const saveSession = (sessionData, rememberMe = false) => {
  const session = {
    ...sessionData,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    rememberMe
  };
  
  if (rememberMe) {
    localStorage.setItem(PERSISTENT_SESSION_KEY, JSON.stringify(session));
    // Also keep in sessionStorage for backward compatibility
    sessionStorage.setItem('workspace_user', JSON.stringify(session));
  } else {
    sessionStorage.setItem('workspace_user', JSON.stringify(session));
  }
};

/**
 * Check if session is expired
 * @returns {boolean} true if expired
 */
export const isSessionExpired = () => {
  const { session, persistent } = getSession();
  if (!session) return true;
  
  const now = Date.now();
  const maxAge = persistent ? PERSISTENT_SESSION_EXPIRY_MS : SESSION_EXPIRY_MS;
  
  // Check if session is older than allowed
  if (session.createdAt && (now - session.createdAt) > maxAge) {
    return true;
  }
  
  // Check inactivity timeout (8h for non-persistent, skip for persistent)
  if (!persistent && session.lastActivity && (now - session.lastActivity) > SESSION_EXPIRY_MS) {
    return true;
  }
  
  return false;
};

/**
 * Update last activity timestamp
 */
export const updateSessionActivity = () => {
  const { session, persistent } = getSession();
  if (!session) return;
  
  session.lastActivity = Date.now();
  
  if (persistent) {
    localStorage.setItem(PERSISTENT_SESSION_KEY, JSON.stringify(session));
  }
  sessionStorage.setItem('workspace_user', JSON.stringify(session));
};

/**
 * Clear session and redirect to login
 */
export const expireSession = (message = "Session expirée, reconnectez-vous") => {
  sessionStorage.removeItem('workspace_user');
  localStorage.removeItem(PERSISTENT_SESSION_KEY);
  localStorage.removeItem('kk_admin_auth');
  if (message) {
    toast.error(message);
  }
};

/**
 * Protected Route Component
 * Vérifie l'authentification et l'expiration avant d'autoriser l'accès
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  
  // Get session from either storage
  const { session } = getSession();
  const adminAuth = localStorage.getItem('kk_admin_auth');
  
  // Si pas d'auth du tout, rediriger vers login
  if (!session && !adminAuth) {
    return <Navigate to="/admin" state={{ from: location, requireAuth: true }} replace />;
  }
  
  // Vérifier l'expiration de session
  if (session && isSessionExpired()) {
    expireSession();
    return <Navigate to="/admin" state={{ from: location, sessionExpired: true }} replace />;
  }
  
  // Mettre à jour l'activité
  if (session) {
    updateSessionActivity();
  }
  
  // Vérifier le rôle si spécifié
  if (allowedRoles.length > 0 && session) {
    if (!allowedRoles.includes(session.role)) {
      return <Navigate to="/admin" state={{ from: location, unauthorized: true }} replace />;
    }
  }
  
  return children;
};

/**
 * Hook pour vérifier si l'utilisateur est authentifié
 */
export const useAuth = () => {
  const { session, persistent } = getSession();
  const adminAuth = localStorage.getItem('kk_admin_auth');
  
  // Vérifier expiration
  if (session && isSessionExpired()) {
    expireSession();
    return { isAuthenticated: false, user: null, type: null, expired: true, persistent: false };
  }
  
  if (session) {
    updateSessionActivity();
    return { 
      isAuthenticated: true, 
      user: session, 
      type: 'workspace', 
      expired: false,
      persistent,
      isFounder: session.role === 'founder',
      isAdmin: session.role === 'admin'
    };
  }
  
  if (adminAuth) {
    return { 
      isAuthenticated: true, 
      user: { name: 'Admin', role: 'admin' }, 
      type: 'admin', 
      expired: false,
      persistent: false,
      isFounder: false,
      isAdmin: true
    };
  }
  
  return { isAuthenticated: false, user: null, type: null, expired: false, persistent: false };
};

export default ProtectedRoute;
