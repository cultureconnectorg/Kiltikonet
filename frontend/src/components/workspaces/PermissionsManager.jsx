// ═══════════════════════════════════════════════════════════════
// GESTIONNAIRE DE PERMISSIONS - Culture Connect 2026
// Interface pour gérer les permissions de chaque rôle
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  Shield, Check, X, RefreshCw, Save, ChevronDown, ChevronRight,
  Eye, Edit2, Trash2, Download, Users, DollarSign, Calendar,
  Newspaper, Palette, Radio, BarChart3, Lock, Unlock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_CATEGORIES,
  DEFAULT_ROLE_PERMISSIONS,
  getUserPermissions,
  saveCustomPermissions,
  resetPermissions,
} from '../../lib/permissions';

const COLORS = {
  charbon: '#1C1A14',
  card: '#2A2820',
  gold: '#D4A84B',
  success: '#4DA860',
  danger: '#ef4444',
};

// Icônes par catégorie
const CATEGORY_ICONS = {
  'Données': Download,
  'Business': Users,
  'Finances': DollarSign,
  'Accréditations': Shield,
  'Événementiel': Calendar,
  'Communication': Newspaper,
  'Dashboard': BarChart3,
  'Administration': Lock,
  'Régie': Radio,
};

// Couleurs des rôles
const ROLE_COLORS = {
  founder: '#D4A84B',
  admin: '#8B1A4A',
  event: '#4A5D4E',
  press: '#00BCD4',
  design: '#E91E63',
  business: '#C4714A',
  finance: '#4CAF50',
  captions: '#9C27B0',
  analyst: '#607D8B',
};

const ROLE_LABELS = {
  founder: 'Fondateur (Laurent)',
  admin: 'Admin',
  event: 'Événementiel (Gwen)',
  press: 'Presse (Kaïge)',
  design: 'Design (Twina)',
  business: 'Business (Alirio)',
  finance: 'Finance (Wudy)',
  captions: 'Régie (Fabrice)',
  analyst: 'Analyste',
};

const PermissionsManager = ({ onClose }) => {
  const [selectedRole, setSelectedRole] = useState('event');
  const [permissions, setPermissions] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(['Données', 'Dashboard']);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Charger les permissions quand le rôle change
  useEffect(() => {
    const rolePerms = getUserPermissions(selectedRole);
    const permsObj = {};
    Object.values(PERMISSIONS).forEach(p => {
      permsObj[p] = rolePerms.includes(p);
    });
    setPermissions(permsObj);
    setHasChanges(false);
  }, [selectedRole]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const togglePermission = (permission) => {
    if (selectedRole === 'founder') {
      toast.error('Le fondateur a toujours toutes les permissions');
      return;
    }
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
    setHasChanges(true);
  };

  const toggleAllInCategory = (category, enable) => {
    if (selectedRole === 'founder') return;
    
    const categoryPerms = Object.entries(PERMISSION_LABELS)
      .filter(([_, info]) => info.category === category)
      .map(([perm]) => perm);
    
    setPermissions(prev => {
      const updated = { ...prev };
      categoryPerms.forEach(p => {
        updated[p] = enable;
      });
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const enabledPerms = Object.entries(permissions)
      .filter(([_, enabled]) => enabled)
      .map(([perm]) => perm);
    
    const success = saveCustomPermissions(selectedRole, enabledPerms);
    
    if (success) {
      toast.success(`Permissions mises à jour pour ${ROLE_LABELS[selectedRole]}`);
      setHasChanges(false);
    } else {
      toast.error('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  const handleReset = () => {
    if (window.confirm(`Réinitialiser les permissions de ${ROLE_LABELS[selectedRole]} aux valeurs par défaut ?`)) {
      resetPermissions(selectedRole);
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[selectedRole] || [];
      const permsObj = {};
      Object.values(PERMISSIONS).forEach(p => {
        permsObj[p] = defaultPerms.includes(p);
      });
      setPermissions(permsObj);
      setHasChanges(false);
      toast.success('Permissions réinitialisées');
    }
  };

  // Grouper les permissions par catégorie
  const permissionsByCategory = PERMISSION_CATEGORIES.map(category => ({
    category,
    permissions: Object.entries(PERMISSION_LABELS)
      .filter(([_, info]) => info.category === category)
      .map(([perm, info]) => ({ id: perm, ...info }))
  }));

  const countEnabled = (category) => {
    return permissionsByCategory
      .find(c => c.category === category)?.permissions
      .filter(p => permissions[p.id])
      .length || 0;
  };

  const totalInCategory = (category) => {
    return permissionsByCategory.find(c => c.category === category)?.permissions.length || 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl"
        style={{ background: COLORS.charbon, border: `1px solid ${COLORS.gold}30` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between" style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.gold}20` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${COLORS.gold}20` }}>
              <Shield className="w-5 h-5" style={{ color: COLORS.gold }} />
            </div>
            <div>
              <h2 className="font-bold text-white">Gestion des Permissions</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Définir ce que chaque membre peut voir/modifier</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Role Selector */}
        <div className="p-4 flex gap-2 flex-wrap" style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.gold}10` }}>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedRole === role ? 'ring-2' : ''}`}
              style={{ 
                background: selectedRole === role ? `${ROLE_COLORS[role]}30` : 'rgba(255,255,255,0.05)',
                color: selectedRole === role ? ROLE_COLORS[role] : 'rgba(255,255,255,0.5)',
                ringColor: ROLE_COLORS[role],
              }}
            >
              {label.split('(')[0].trim()}
            </button>
          ))}
        </div>

        {/* Current Role Info */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: `${ROLE_COLORS[selectedRole]}10` }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: ROLE_COLORS[selectedRole], color: '#fff' }}>
              {ROLE_LABELS[selectedRole].substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: ROLE_COLORS[selectedRole] }}>{ROLE_LABELS[selectedRole]}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {Object.values(permissions).filter(Boolean).length} permissions actives
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleReset} style={{ color: 'rgba(255,255,255,0.5)' }}>
              <RefreshCw className="w-3 h-3 mr-2" />
              Réinitialiser
            </Button>
            {hasChanges && (
              <Button size="sm" onClick={handleSave} disabled={saving} style={{ background: COLORS.success }}>
                <Save className="w-3 h-3 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            )}
          </div>
        </div>

        {/* Permissions List */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {selectedRole === 'founder' && (
            <div className="mb-4 p-3 rounded-lg flex items-center gap-2" style={{ background: `${COLORS.gold}20`, border: `1px solid ${COLORS.gold}40` }}>
              <Lock className="w-4 h-4" style={{ color: COLORS.gold }} />
              <span className="text-sm" style={{ color: COLORS.gold }}>Le fondateur a toujours accès à toutes les fonctionnalités</span>
            </div>
          )}

          {permissionsByCategory.map(({ category, permissions: categoryPerms }) => {
            const CategoryIcon = CATEGORY_ICONS[category] || Shield;
            const isExpanded = expandedCategories.includes(category);
            const enabled = countEnabled(category);
            const total = totalInCategory(category);

            return (
              <div key={category} className="mb-3">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-white/5"
                  style={{ background: COLORS.card }}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />}
                    <CategoryIcon className="w-4 h-4" style={{ color: COLORS.gold }} />
                    <span className="font-medium text-white">{category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded" style={{ 
                      background: enabled === total ? `${COLORS.success}20` : enabled > 0 ? `${COLORS.gold}20` : 'rgba(255,255,255,0.1)',
                      color: enabled === total ? COLORS.success : enabled > 0 ? COLORS.gold : 'rgba(255,255,255,0.4)'
                    }}>
                      {enabled}/{total}
                    </span>
                    {selectedRole !== 'founder' && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAllInCategory(category, true); }}
                          className="p-1 rounded hover:bg-white/10"
                          title="Tout activer"
                        >
                          <Check className="w-3 h-3" style={{ color: COLORS.success }} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAllInCategory(category, false); }}
                          className="p-1 rounded hover:bg-white/10"
                          title="Tout désactiver"
                        >
                          <X className="w-3 h-3" style={{ color: COLORS.danger }} />
                        </button>
                      </div>
                    )}
                  </div>
                </button>

                {/* Permissions in Category */}
                {isExpanded && (
                  <div className="mt-2 ml-6 space-y-1">
                    {categoryPerms.map(perm => (
                      <div
                        key={perm.id}
                        className="flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-white/5"
                      >
                        <Checkbox
                          checked={permissions[perm.id] || false}
                          onCheckedChange={() => togglePermission(perm.id)}
                          disabled={selectedRole === 'founder'}
                          className="border-white/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                        />
                        <span className="text-sm" style={{ color: permissions[perm.id] ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                          {perm.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 flex items-center justify-between" style={{ background: COLORS.card, borderTop: `1px solid ${COLORS.gold}10` }}>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Les modifications sont appliquées immédiatement après sauvegarde
          </div>
          <Button variant="outline" size="sm" onClick={onClose} style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsManager;
