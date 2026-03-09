// ═══════════════════════════════════════════════════════════════
// USE PERMISSIONS HOOK - Culture Connect 2026
// Hook React pour vérifier les permissions de l'utilisateur courant
// ═══════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { getSession } from '../components/ProtectedRoute';
import { 
  PERMISSIONS,
  getUserPermissions, 
  hasPermission as checkPermission,
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
} from './permissions';

/**
 * Hook pour accéder aux permissions de l'utilisateur courant
 * 
 * Usage:
 * const { can, canAll, canAny, permissions, role } = usePermissions();
 * 
 * if (can(PERMISSIONS.DELETE_REGISTRATIONS)) {
 *   // Afficher le bouton supprimer
 * }
 */
export const usePermissions = () => {
  // Récupérer la session courante
  const { session } = getSession();
  const role = session?.role || 'guest';
  
  // Mémoriser les permissions pour éviter les recalculs
  const permissions = useMemo(() => {
    return getUserPermissions(role);
  }, [role]);
  
  // Vérifier une permission unique
  const can = useCallback((permission) => {
    return permissions.includes(permission);
  }, [permissions]);
  
  // Vérifier plusieurs permissions (toutes requises)
  const canAll = useCallback((requiredPermissions) => {
    return requiredPermissions.every(p => permissions.includes(p));
  }, [permissions]);
  
  // Vérifier plusieurs permissions (au moins une)
  const canAny = useCallback((requiredPermissions) => {
    return requiredPermissions.some(p => permissions.includes(p));
  }, [permissions]);
  
  // Raccourcis pour les permissions courantes
  const shortcuts = useMemo(() => ({
    // Données
    canViewRegistrations: permissions.includes(PERMISSIONS.VIEW_REGISTRATIONS),
    canEditRegistrations: permissions.includes(PERMISSIONS.EDIT_REGISTRATIONS),
    canDeleteRegistrations: permissions.includes(PERMISSIONS.DELETE_REGISTRATIONS),
    canExportData: permissions.includes(PERMISSIONS.EXPORT_DATA),
    
    // Contacts
    canViewContacts: permissions.includes(PERMISSIONS.VIEW_CONTACTS),
    canEditContacts: permissions.includes(PERMISSIONS.EDIT_CONTACTS),
    canDeleteContacts: permissions.includes(PERMISSIONS.DELETE_CONTACTS),
    
    // Finances
    canViewFinances: permissions.includes(PERMISSIONS.VIEW_FINANCES),
    canEditFinances: permissions.includes(PERMISSIONS.EDIT_FINANCES),
    canApproveExpenses: permissions.includes(PERMISSIONS.APPROVE_EXPENSES),
    
    // Accréditations
    canViewAccreditations: permissions.includes(PERMISSIONS.VIEW_ACCREDITATIONS),
    canEditAccreditations: permissions.includes(PERMISSIONS.EDIT_ACCREDITATIONS),
    canPrintBadges: permissions.includes(PERMISSIONS.PRINT_BADGES),
    canScanBadges: permissions.includes(PERMISSIONS.SCAN_BADGES),
    
    // Événementiel
    canViewArtistes: permissions.includes(PERMISSIONS.VIEW_ARTISTES),
    canEditArtistes: permissions.includes(PERMISSIONS.EDIT_ARTISTES),
    canManagePlanning: permissions.includes(PERMISSIONS.MANAGE_PLANNING),
    
    // Communication
    canSendCommuniques: permissions.includes(PERMISSIONS.SEND_COMMUNIQUES),
    canManagePress: permissions.includes(PERMISSIONS.MANAGE_PRESS),
    canEditCMS: permissions.includes(PERMISSIONS.EDIT_CMS),
    
    // Dashboard
    canViewDashboard: permissions.includes(PERMISSIONS.VIEW_DASHBOARD),
    canEditOwnTasks: permissions.includes(PERMISSIONS.EDIT_OWN_TASKS),
    canEditAllTasks: permissions.includes(PERMISSIONS.EDIT_ALL_TASKS),
    
    // Administration
    canViewTeamActivity: permissions.includes(PERMISSIONS.VIEW_TEAM_ACTIVITY),
    canManageWorkspaces: permissions.includes(PERMISSIONS.MANAGE_WORKSPACES),
    canChangePasswords: permissions.includes(PERMISSIONS.CHANGE_PASSWORDS),
    canViewAllMessages: permissions.includes(PERMISSIONS.VIEW_ALL_MESSAGES),
    canImpersonateUser: permissions.includes(PERMISSIONS.IMPERSONATE_USER),
    
    // Live
    canActivateLive: permissions.includes(PERMISSIONS.ACTIVATE_LIVE),
    canSendLiveCaptions: permissions.includes(PERMISSIONS.SEND_LIVE_CAPTIONS),
    
    // Rôles spéciaux
    isFounder: role === 'founder',
    isAdmin: role === 'admin' || role === 'founder',
  }), [permissions, role]);
  
  return {
    role,
    permissions,
    can,
    canAll,
    canAny,
    ...shortcuts,
  };
};

/**
 * Composant wrapper pour le rendu conditionnel basé sur les permissions
 * 
 * Usage:
 * <PermissionGate permission={PERMISSIONS.DELETE_REGISTRATIONS}>
 *   <DeleteButton />
 * </PermissionGate>
 */
export const PermissionGate = ({ 
  permission,  // Permission unique requise
  permissions, // OU liste de permissions (toutes requises)
  any,         // OU liste de permissions (au moins une)
  fallback = null, // Composant à afficher si non autorisé
  children 
}) => {
  const { can, canAll, canAny } = usePermissions();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = can(permission);
  } else if (permissions) {
    hasAccess = canAll(permissions);
  } else if (any) {
    hasAccess = canAny(any);
  }
  
  return hasAccess ? children : fallback;
};

export default usePermissions;
