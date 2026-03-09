// ═══════════════════════════════════════════════════════════════
// WORKSPACE HEADER UNIFIÉ - Culture Connect 2026
// Composant partagé pour tous les espaces de travail
// RESPONSIVE: Adapté mobile + desktop
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Menu, X, Home, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { NotificationBell } from './NotificationSystem';
import { BRAND_COLORS, ROLE_COLORS, CC2026_BUTTON_STYLE } from '../../lib/design-tokens';

/**
 * Header unifié pour tous les workspaces - RESPONSIVE
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const roleStyle = ROLE_COLORS[userRole] || ROLE_COLORS.admin;
  
  // Générer les initiales
  const initials = roleStyle.icon || userName.substring(0, 2).toUpperCase();
  
  return (
    <>
      <header 
        className="sticky top-0 z-50 px-3 sm:px-6 safe-area-top"
        style={{ 
          background: BRAND_COLORS.card, 
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
        }}
        data-testid="workspace-header"
      >
        <div className="max-w-7xl mx-auto h-14 sm:h-16 flex items-center justify-between">
          {/* Identité utilisateur */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Avatar avec couleur du rôle */}
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm"
              style={{ 
                background: roleStyle.primary, 
                color: '#fff',
                boxShadow: `0 2px 8px ${roleStyle.primary}40`
              }}
            >
              {initials}
            </div>
            
            {/* Nom et rôle - Visible même sur mobile */}
            <div>
              <div 
                className="font-bold text-xs sm:text-sm tracking-wide"
                style={{ color: roleStyle.primary }}
              >
                {userName.toUpperCase()}
              </div>
              <div 
                className="text-[10px] sm:text-xs hidden xs:block"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {subtitle}
              </div>
            </div>
          </div>
          
          {/* Actions Desktop */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
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
                className="flex items-center gap-2 transition-all hover:scale-[1.02]"
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
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions Mobile */}
          <div className="flex md:hidden items-center gap-2">
            {/* Notifications Mobile */}
            {showNotifications && notificationTarget && (
              <NotificationBell target={notificationTarget} />
            )}
            
            {/* Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Ligne de progression subtile */}
        <div 
          className="h-px w-full"
          style={{ 
            background: `linear-gradient(90deg, transparent, ${roleStyle.primary}30, transparent)` 
          }}
        />
      </header>

      {/* Menu Mobile Slide */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="absolute right-0 top-14 w-64 h-auto rounded-bl-2xl shadow-xl overflow-hidden"
            style={{ background: BRAND_COLORS.card, border: `1px solid ${roleStyle.primary}30` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Items */}
            <div className="p-3 space-y-1">
              {/* Accueil Admin */}
              <button
                onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-white/5"
              >
                <Home className="w-4 h-4" style={{ color: roleStyle.primary }} />
                <span className="text-sm text-white">Admin</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-40" style={{ color: 'white' }} />
              </button>

              {/* Dashboard CC2026 */}
              {dashboardPath && (
                <button
                  onClick={() => { navigate(dashboardPath); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors"
                  style={{ background: `${BRAND_COLORS.gold}15` }}
                >
                  <Calendar className="w-4 h-4" style={{ color: BRAND_COLORS.gold }} />
                  <span className="text-sm font-semibold" style={{ color: BRAND_COLORS.gold }}>Dashboard CC2026</span>
                  <ChevronRight className="w-4 h-4 ml-auto" style={{ color: BRAND_COLORS.gold }} />
                </button>
              )}

              {/* Séparateur */}
              <div className="h-px my-2" style={{ background: 'rgba(255,255,255,0.1)' }} />

              {/* Déconnexion */}
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkspaceHeader;
