// ═══════════════════════════════════════════════════════════════
// SYSTÈME DE PERMISSIONS GRANULAIRES - Culture Connect 2026
// Définit ce que chaque rôle peut voir/modifier
// ═══════════════════════════════════════════════════════════════

// Permissions disponibles
export const PERMISSIONS = {
  // Inscriptions & Données
  VIEW_REGISTRATIONS: 'view_registrations',
  EDIT_REGISTRATIONS: 'edit_registrations',
  DELETE_REGISTRATIONS: 'delete_registrations',
  EXPORT_DATA: 'export_data',
  
  // Contacts & Business
  VIEW_CONTACTS: 'view_contacts',
  EDIT_CONTACTS: 'edit_contacts',
  DELETE_CONTACTS: 'delete_contacts',
  PROMOTE_PARTNERS: 'promote_partners',
  
  // Finances
  VIEW_FINANCES: 'view_finances',
  EDIT_FINANCES: 'edit_finances',
  APPROVE_EXPENSES: 'approve_expenses',
  
  // Accréditations
  VIEW_ACCREDITATIONS: 'view_accreditations',
  EDIT_ACCREDITATIONS: 'edit_accreditations',
  PRINT_BADGES: 'print_badges',
  SCAN_BADGES: 'scan_badges',
  
  // Événementiel
  VIEW_ARTISTES: 'view_artistes',
  EDIT_ARTISTES: 'edit_artistes',
  MANAGE_PLANNING: 'manage_planning',
  
  // Communication
  SEND_COMMUNIQUES: 'send_communiques',
  MANAGE_PRESS: 'manage_press',
  EDIT_CMS: 'edit_cms',
  
  // Dashboard CC2026
  VIEW_DASHBOARD: 'view_dashboard',
  EDIT_OWN_TASKS: 'edit_own_tasks',
  EDIT_ALL_TASKS: 'edit_all_tasks',
  
  // Administration
  VIEW_TEAM_ACTIVITY: 'view_team_activity',
  MANAGE_WORKSPACES: 'manage_workspaces',
  CHANGE_PASSWORDS: 'change_passwords',
  VIEW_ALL_MESSAGES: 'view_all_messages',
  IMPERSONATE_USER: 'impersonate_user',
  
  // Live/Régie
  ACTIVATE_LIVE: 'activate_live',
  SEND_LIVE_CAPTIONS: 'send_live_captions',
};

// Labels pour l'interface
export const PERMISSION_LABELS = {
  [PERMISSIONS.VIEW_REGISTRATIONS]: { label: 'Voir les inscriptions', category: 'Données' },
  [PERMISSIONS.EDIT_REGISTRATIONS]: { label: 'Modifier les inscriptions', category: 'Données' },
  [PERMISSIONS.DELETE_REGISTRATIONS]: { label: 'Supprimer les inscriptions', category: 'Données' },
  [PERMISSIONS.EXPORT_DATA]: { label: 'Exporter les données', category: 'Données' },
  
  [PERMISSIONS.VIEW_CONTACTS]: { label: 'Voir les contacts', category: 'Business' },
  [PERMISSIONS.EDIT_CONTACTS]: { label: 'Modifier les contacts', category: 'Business' },
  [PERMISSIONS.DELETE_CONTACTS]: { label: 'Supprimer les contacts', category: 'Business' },
  [PERMISSIONS.PROMOTE_PARTNERS]: { label: 'Promouvoir en partenaire', category: 'Business' },
  
  [PERMISSIONS.VIEW_FINANCES]: { label: 'Voir les finances', category: 'Finances' },
  [PERMISSIONS.EDIT_FINANCES]: { label: 'Modifier les finances', category: 'Finances' },
  [PERMISSIONS.APPROVE_EXPENSES]: { label: 'Approuver les dépenses', category: 'Finances' },
  
  [PERMISSIONS.VIEW_ACCREDITATIONS]: { label: 'Voir les accréditations', category: 'Accréditations' },
  [PERMISSIONS.EDIT_ACCREDITATIONS]: { label: 'Modifier les accréditations', category: 'Accréditations' },
  [PERMISSIONS.PRINT_BADGES]: { label: 'Imprimer les badges', category: 'Accréditations' },
  [PERMISSIONS.SCAN_BADGES]: { label: 'Scanner les badges', category: 'Accréditations' },
  
  [PERMISSIONS.VIEW_ARTISTES]: { label: 'Voir les artistes', category: 'Événementiel' },
  [PERMISSIONS.EDIT_ARTISTES]: { label: 'Modifier les artistes', category: 'Événementiel' },
  [PERMISSIONS.MANAGE_PLANNING]: { label: 'Gérer le planning', category: 'Événementiel' },
  
  [PERMISSIONS.SEND_COMMUNIQUES]: { label: 'Envoyer des communiqués', category: 'Communication' },
  [PERMISSIONS.MANAGE_PRESS]: { label: 'Gérer la presse', category: 'Communication' },
  [PERMISSIONS.EDIT_CMS]: { label: 'Modifier le CMS', category: 'Communication' },
  
  [PERMISSIONS.VIEW_DASHBOARD]: { label: 'Voir le dashboard CC2026', category: 'Dashboard' },
  [PERMISSIONS.EDIT_OWN_TASKS]: { label: 'Modifier ses tâches', category: 'Dashboard' },
  [PERMISSIONS.EDIT_ALL_TASKS]: { label: 'Modifier toutes les tâches', category: 'Dashboard' },
  
  [PERMISSIONS.VIEW_TEAM_ACTIVITY]: { label: 'Voir l\'activité équipe', category: 'Administration' },
  [PERMISSIONS.MANAGE_WORKSPACES]: { label: 'Gérer les workspaces', category: 'Administration' },
  [PERMISSIONS.CHANGE_PASSWORDS]: { label: 'Changer les mots de passe', category: 'Administration' },
  [PERMISSIONS.VIEW_ALL_MESSAGES]: { label: 'Voir tous les messages', category: 'Administration' },
  [PERMISSIONS.IMPERSONATE_USER]: { label: 'Se connecter en tant que', category: 'Administration' },
  
  [PERMISSIONS.ACTIVATE_LIVE]: { label: 'Activer le live', category: 'Régie' },
  [PERMISSIONS.SEND_LIVE_CAPTIONS]: { label: 'Envoyer des sous-titres', category: 'Régie' },
};

// Permissions par défaut selon le rôle
export const DEFAULT_ROLE_PERMISSIONS = {
  founder: Object.values(PERMISSIONS), // Toutes les permissions
  
  admin: [
    PERMISSIONS.VIEW_REGISTRATIONS, PERMISSIONS.EDIT_REGISTRATIONS, PERMISSIONS.DELETE_REGISTRATIONS, PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_CONTACTS, PERMISSIONS.EDIT_CONTACTS,
    PERMISSIONS.VIEW_FINANCES,
    PERMISSIONS.VIEW_ACCREDITATIONS, PERMISSIONS.EDIT_ACCREDITATIONS, PERMISSIONS.PRINT_BADGES, PERMISSIONS.SCAN_BADGES,
    PERMISSIONS.VIEW_ARTISTES,
    PERMISSIONS.EDIT_CMS,
    PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.EDIT_ALL_TASKS,
    PERMISSIONS.VIEW_TEAM_ACTIVITY, PERMISSIONS.MANAGE_WORKSPACES,
  ],
  
  event: [ // Gwen
    PERMISSIONS.VIEW_REGISTRATIONS,
    PERMISSIONS.VIEW_CONTACTS,
    PERMISSIONS.VIEW_ACCREDITATIONS, PERMISSIONS.PRINT_BADGES, PERMISSIONS.SCAN_BADGES,
    PERMISSIONS.VIEW_ARTISTES, PERMISSIONS.EDIT_ARTISTES, PERMISSIONS.MANAGE_PLANNING,
    PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.EDIT_OWN_TASKS,
  ],
  
  press: [ // Kaige
    PERMISSIONS.VIEW_REGISTRATIONS,
    PERMISSIONS.VIEW_CONTACTS, PERMISSIONS.EDIT_CONTACTS,
    PERMISSIONS.VIEW_ACCREDITATIONS, PERMISSIONS.PRINT_BADGES,
    PERMISSIONS.VIEW_ARTISTES,
    PERMISSIONS.SEND_COMMUNIQUES, PERMISSIONS.MANAGE_PRESS,
    PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.EDIT_OWN_TASKS,
  ],
  
  design: [ // Twina
    PERMISSIONS.VIEW_REGISTRATIONS,
    PERMISSIONS.VIEW_ACCREDITATIONS, PERMISSIONS.PRINT_BADGES,
    PERMISSIONS.EDIT_CMS,
    PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.EDIT_OWN_TASKS,
  ],
  
  business: [ // Alirio
    PERMISSIONS.VIEW_REGISTRATIONS, PERMISSIONS.EDIT_REGISTRATIONS,
    PERMISSIONS.VIEW_CONTACTS, PERMISSIONS.EDIT_CONTACTS, PERMISSIONS.DELETE_CONTACTS, PERMISSIONS.PROMOTE_PARTNERS,
    PERMISSIONS.VIEW_ACCREDITATIONS,
    PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.EDIT_OWN_TASKS,
  ],
  
  finance: [ // Wudy
    PERMISSIONS.VIEW_REGISTRATIONS, PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_FINANCES, PERMISSIONS.EDIT_FINANCES, PERMISSIONS.APPROVE_EXPENSES,
    PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.EDIT_OWN_TASKS,
  ],
  
  captions: [ // Fabrice
    PERMISSIONS.VIEW_ACCREDITATIONS,
    PERMISSIONS.VIEW_ARTISTES,
    PERMISSIONS.ACTIVATE_LIVE, PERMISSIONS.SEND_LIVE_CAPTIONS,
    PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.EDIT_OWN_TASKS,
  ],
  
  analyst: [
    PERMISSIONS.VIEW_REGISTRATIONS, PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_CONTACTS,
    PERMISSIONS.VIEW_FINANCES,
    PERMISSIONS.VIEW_ACCREDITATIONS,
    PERMISSIONS.VIEW_ARTISTES,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TEAM_ACTIVITY,
  ],
};

// Catégories de permissions pour l'interface
export const PERMISSION_CATEGORIES = [
  'Données',
  'Business', 
  'Finances',
  'Accréditations',
  'Événementiel',
  'Communication',
  'Dashboard',
  'Administration',
  'Régie',
];

// Storage key pour les permissions personnalisées
const CUSTOM_PERMISSIONS_KEY = 'cc2026_custom_permissions';

/**
 * Récupère les permissions d'un utilisateur
 * Vérifie d'abord les permissions personnalisées, sinon utilise les défauts
 */
export const getUserPermissions = (role) => {
  // Vérifier les permissions personnalisées dans localStorage
  try {
    const customPerms = localStorage.getItem(CUSTOM_PERMISSIONS_KEY);
    if (customPerms) {
      const parsed = JSON.parse(customPerms);
      if (parsed[role]) {
        return parsed[role];
      }
    }
  } catch (e) {
    console.warn('Error reading custom permissions');
  }
  
  // Retourner les permissions par défaut
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
};

/**
 * Sauvegarde les permissions personnalisées pour un rôle
 */
export const saveCustomPermissions = (role, permissions) => {
  try {
    const existing = localStorage.getItem(CUSTOM_PERMISSIONS_KEY);
    const customPerms = existing ? JSON.parse(existing) : {};
    customPerms[role] = permissions;
    localStorage.setItem(CUSTOM_PERMISSIONS_KEY, JSON.stringify(customPerms));
    return true;
  } catch (e) {
    console.error('Error saving custom permissions', e);
    return false;
  }
};

/**
 * Réinitialise les permissions d'un rôle aux valeurs par défaut
 */
export const resetPermissions = (role) => {
  try {
    const existing = localStorage.getItem(CUSTOM_PERMISSIONS_KEY);
    if (existing) {
      const customPerms = JSON.parse(existing);
      delete customPerms[role];
      localStorage.setItem(CUSTOM_PERMISSIONS_KEY, JSON.stringify(customPerms));
    }
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export const hasPermission = (role, permission) => {
  const permissions = getUserPermissions(role);
  return permissions.includes(permission);
};

/**
 * Vérifie si un utilisateur a toutes les permissions spécifiées
 */
export const hasAllPermissions = (role, requiredPermissions) => {
  const permissions = getUserPermissions(role);
  return requiredPermissions.every(p => permissions.includes(p));
};

/**
 * Vérifie si un utilisateur a au moins une des permissions spécifiées
 */
export const hasAnyPermission = (role, requiredPermissions) => {
  const permissions = getUserPermissions(role);
  return requiredPermissions.some(p => permissions.includes(p));
};

export default {
  PERMISSIONS,
  PERMISSION_LABELS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  getUserPermissions,
  saveCustomPermissions,
  resetPermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
};
