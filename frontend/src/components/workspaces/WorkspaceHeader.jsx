// ═══════════════════════════════════════════════════════════════
// WORKSPACE HEADER UNIFIÉ - Culture Connect 2026
// Composant partagé pour tous les espaces de travail
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, HelpCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { NotificationBell } from './NotificationSystem';
import { BRAND_COLORS, ROLE_COLORS, CC2026_BUTTON_STYLE } from '../../lib/design-tokens';

/**
 * Header unifié pour tous les workspaces
 * @param {Object} props
 * @param {string} props.userName - Nom de l'utilisateur (ex: "Gwen", "Laurent")
 * @param {string} props.userRole - Rôle (ex: "event", "founder", "press")
 * @param {string} props.subtitle - Sous-titre du workspace
 * @param {string} props.dashboardPath - Chemin vers le dashboard CC2026 (ex: "/dashboard-cc2026/gwen")
 * @param {Function} props.onLogout - Callback de déconnexion
 * @param {React.ReactNode} props.extraButtons - Boutons supplémentaires à afficher
 * @param {boolean} props.showNotifications - Afficher la cloche de notifications
 * @param {string} props.notificationTarget - Cible pour les notifications (ex: "gwen")
 */
const WorkspaceHeader = ({ 
  userName, 
  userRole, 
  subtitle,
  dashboardPath,
  onLogout,
  extraButtons,
  showNotifications = true,
  notificationTarget
}) => {
  const navigate = useNavigate();
  const roleStyle = ROLE_COLORS[userRole] || ROLE_COLORS.admin;
  
  // Générer les initiales
  const initials = roleStyle.icon || userName.substring(0, 2).toUpperCase();
  
  return (
    <header 
      className="sticky top-0 z-50 px-4 sm:px-6"
      style={{ 
        background: BRAND_COLORS.card, 
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
        {/* Identité utilisateur */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Avatar avec couleur du rôle */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm"
            style={{ 
              background: roleStyle.primary, 
              color: '#fff',
              boxShadow: `0 2px 8px ${roleStyle.primary}40`
            }}
          >
            {initials}
          </div>
          
          {/* Nom et rôle */}
          <div className="hidden sm:block">
            <div 
              className="font-bold text-sm tracking-wide"
              style={{ color: roleStyle.primary }}
            >
              {userName.toUpperCase()}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              {subtitle}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          {showNotifications && notificationTarget && (
            <NotificationBell target={notificationTarget} />
          )}
          
          {/* Bouton Dashboard CC2026 - Style unifié */}
          {dashboardPath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(dashboardPath)}
              className="hidden sm:flex items-center gap-2 transition-all hover:scale-[1.02]"
              style={{
                background: 'transparent',
                border: CC2026_BUTTON_STYLE.border,
                color: CC2026_BUTTON_STYLE.color,
                fontWeight: CC2026_BUTTON_STYLE.fontWeight,
                fontSize: CC2026_BUTTON_STYLE.fontSize,
              }}
              data-testid="dashboard-cc2026-link"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>CC2026</span>
            </Button>
          )}
          
          {/* Boutons supplémentaires */}
          {extraButtons}
          
          {/* Déconnexion */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="transition-all hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Ligne de progression subtile (optionnel) */}
      <div 
        className="h-px w-full"
        style={{ 
          background: `linear-gradient(90deg, transparent, ${roleStyle.primary}30, transparent)` 
        }}
      />
    </header>
  );
};

export default WorkspaceHeader;
