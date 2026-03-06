import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

// Session expiration time: 8 hours in milliseconds
const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000;

/**
 * Check if session is expired
 * @returns {boolean} true if expired
 */
export const isSessionExpired = () => {
  const workspaceUser = sessionStorage.getItem('workspace_user');
  if (!workspaceUser) return true;
  
  try {
    const session = JSON.parse(workspaceUser);
    const now = Date.now();
    
    // Check if session is older than 8 hours
    if (session.createdAt && (now - session.createdAt) > SESSION_EXPIRY_MS) {
      return true;
    }
    
    // Also check last activity (8h inactivity timeout)
    if (session.lastActivity && (now - session.lastActivity) > SESSION_EXPIRY_MS) {
      return true;
    }
    
    return false;
  } catch {
    return true;
  }
};

/**
 * Update last activity timestamp
 */
export const updateSessionActivity = () => {
  const workspaceUser = sessionStorage.getItem('workspace_user');
  if (!workspaceUser) return;
  
  try {
    const session = JSON.parse(workspaceUser);
    session.lastActivity = Date.now();
    sessionStorage.setItem('workspace_user', JSON.stringify(session));
  } catch {
    // Ignore errors
  }
};

/**
 * Clear session and redirect to login
 */
export const expireSession = (message = "Session expirée, reconnectez-vous") => {
  sessionStorage.removeItem('workspace_user');
  localStorage.removeItem('kk_admin_auth');
  toast.error(message);
};

/**
 * Protected Route Component
 * Vérifie l'authentification et l'expiration avant d'autoriser l'accès
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  
  // Vérifier l'authentification dans sessionStorage
  const workspaceUser = sessionStorage.getItem('workspace_user');
  const adminAuth = localStorage.getItem('kk_admin_auth');
  
  // Si pas d'auth du tout, rediriger vers login
  if (!workspaceUser && !adminAuth) {
    return <Navigate to="/admin" state={{ from: location, requireAuth: true }} replace />;
  }
  
  // Vérifier l'expiration de session
  if (workspaceUser && isSessionExpired()) {
    expireSession();
    return <Navigate to="/admin" state={{ from: location, sessionExpired: true }} replace />;
  }
  
  // Mettre à jour l'activité
  if (workspaceUser) {
    updateSessionActivity();
  }
  
  // Vérifier le rôle si spécifié
  if (allowedRoles.length > 0 && workspaceUser) {
    try {
      const user = JSON.parse(workspaceUser);
      if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/admin" state={{ from: location, unauthorized: true }} replace />;
      }
    } catch (e) {
      return <Navigate to="/admin" replace />;
    }
  }
  
  return children;
};

/**
 * Hook pour vérifier si l'utilisateur est authentifié
 */
export const useAuth = () => {
  const workspaceUser = sessionStorage.getItem('workspace_user');
  const adminAuth = localStorage.getItem('kk_admin_auth');
  
  // Vérifier expiration
  if (workspaceUser && isSessionExpired()) {
    expireSession();
    return { isAuthenticated: false, user: null, type: null, expired: true };
  }
  
  if (workspaceUser) {
    try {
      const user = JSON.parse(workspaceUser);
      updateSessionActivity();
      return { isAuthenticated: true, user, type: 'workspace', expired: false };
    } catch (e) {
      return { isAuthenticated: false, user: null, type: null, expired: false };
    }
  }
  
  if (adminAuth) {
    return { isAuthenticated: true, user: { name: 'Admin', role: 'admin' }, type: 'admin', expired: false };
  }
  
  return { isAuthenticated: false, user: null, type: null, expired: false };
};

export default ProtectedRoute;
