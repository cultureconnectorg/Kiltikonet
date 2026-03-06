import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Protected Route Component
 * Vérifie l'authentification avant d'autoriser l'accès aux routes protégées
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
  
  if (workspaceUser) {
    try {
      return { isAuthenticated: true, user: JSON.parse(workspaceUser), type: 'workspace' };
    } catch (e) {
      return { isAuthenticated: false, user: null, type: null };
    }
  }
  
  if (adminAuth) {
    return { isAuthenticated: true, user: { name: 'Admin', role: 'admin' }, type: 'admin' };
  }
  
  return { isAuthenticated: false, user: null, type: null };
};

export default ProtectedRoute;
