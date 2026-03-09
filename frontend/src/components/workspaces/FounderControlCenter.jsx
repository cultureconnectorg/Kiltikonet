// ═══════════════════════════════════════════════════════════════
// CENTRE DE CONTRÔLE FONDATEUR - Culture Connect 2026
// Navigation inter-workspaces et contrôle total pour Laurent
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Settings, Eye, EyeOff, Trash2, Plus, Edit2, Save, X, 
  RefreshCw, Shield, Key, Clock, Activity, ChevronRight,
  UserCheck, UserX, Lock, Unlock, AlertTriangle, CheckCircle,
  Calendar, BarChart3, MessageSquare, FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  charbon: '#1C1A14',
  card: '#2A2820',
  gold: '#D4A84B',
  terracotta: '#C4714A',
  success: '#4DA860',
  danger: '#ef4444',
};

// Workspaces configuration
const WORKSPACES = [
  { id: 'laurent', name: 'Laurent', role: 'founder', password: 'LC2026', color: '#D4A84B', path: '/workspace/laurent', icon: '👑' },
  { id: 'gwen', name: 'Gwen', role: 'event', password: 'Gwen2026', color: '#4A5D4E', path: '/workspace/gwen', icon: '🎭' },
  { id: 'fabrice', name: 'Fabrice', role: 'captions', password: 'Fabrice2026', color: '#9C27B0', path: '/workspace/fabrice', icon: '📺' },
  { id: 'kaige', name: 'Kaïge-Jean', role: 'press', password: 'Kaige2026', color: '#00BCD4', path: '/workspace/kaige', icon: '📰' },
  { id: 'alirio', name: 'Alirio', role: 'business', password: 'Alirio2026', color: '#C4714A', path: '/workspace/alirio', icon: '💼' },
  { id: 'wudy', name: 'Wudy', role: 'finance', password: 'Wudy2026', color: '#4CAF50', path: '/workspace/wudy', icon: '💰' },
  { id: 'twina', name: 'Twina', role: 'design', password: 'Twina2026', color: '#E91E63', path: '/workspace/twina', icon: '🎨' },
  { id: 'analyst', name: 'Data Analyst', role: 'analyst', password: 'DataCC2026', color: '#607D8B', path: '/workspace/analyst', icon: '📊' },
];

const FounderControlCenter = ({ onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('navigation');
  const [workspaceStatus, setWorkspaceStatus] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Editing states
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Load data on mount
  useEffect(() => {
    loadActivityLogs();
    loadRegistrations();
  }, []);
  
  const loadActivityLogs = async () => {
    try {
      const res = await axios.get(`${API}/workspace/logs?limit=50`);
      setActivityLogs(res.data.logs || []);
    } catch (e) {
      console.warn('Could not load logs');
    }
  };
  
  const loadRegistrations = async () => {
    try {
      const res = await axios.get(`${API}/registrations`);
      setRegistrations(res.data.registrations || []);
    } catch (e) {
      console.warn('Could not load registrations');
    }
  };
  
  const navigateToWorkspace = (workspace) => {
    // Direct navigation as founder has access to all
    const sessionData = {
      name: workspace.name,
      role: workspace.role,
      impersonatedBy: 'Laurent (Fondateur)',
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    sessionStorage.setItem('workspace_user', JSON.stringify(sessionData));
    localStorage.setItem('cc2026_session', JSON.stringify({ ...sessionData, rememberMe: true }));
    navigate(workspace.path);
    toast.success(`Accès au workspace de ${workspace.name}`);
    onClose?.();
  };
  
  const deleteRegistration = async (id) => {
    if (!window.confirm('Supprimer cette inscription ?')) return;
    try {
      await axios.delete(`${API}/registrations/${id}`);
      setRegistrations(prev => prev.filter(r => r.id !== id));
      toast.success('Inscription supprimée');
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };
  
  const updateWorkspacePassword = async (workspaceId) => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    
    try {
      await axios.post(`${API}/workspace/update-password`, {
        workspace_id: workspaceId,
        new_password: newPassword,
        updated_by: 'Laurent (Fondateur)'
      });
      toast.success(`Mot de passe mis à jour pour ${workspaceId}`);
      setEditingWorkspace(null);
      setNewPassword('');
    } catch (e) {
      toast.error('Erreur lors de la mise à jour');
    }
  };
  
  const tabs = [
    { id: 'navigation', label: 'Navigation', icon: Users },
    { id: 'control', label: 'Contrôle', icon: Shield },
    { id: 'activity', label: 'Activité', icon: Activity },
    { id: 'data', label: 'Données', icon: BarChart3 },
  ];
  
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
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `${COLORS.gold}20` }}>
              👑
            </div>
            <div>
              <h2 className="font-bold text-white">Centre de Contrôle Fondateur</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Laurent Cœurvolan - Accès total</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 p-2" style={{ background: COLORS.card }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
              style={{ 
                background: activeTab === tab.id ? COLORS.gold : 'transparent',
                color: activeTab === tab.id ? COLORS.charbon : 'rgba(255,255,255,0.6)'
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Navigation Tab */}
          {activeTab === 'navigation' && (
            <div className="space-y-4">
              <div className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Accédez directement à n'importe quel workspace de votre équipe
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {WORKSPACES.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => navigateToWorkspace(ws)}
                    className="p-4 rounded-lg text-left transition-all hover:scale-[1.02] group"
                    style={{ background: COLORS.card, border: `1px solid ${ws.color}30` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{ws.icon}</span>
                      <span className="text-sm font-bold text-white">{ws.name}</span>
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{ws.role}</div>
                    <div className="mt-2 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: ws.color }}>
                      <span>Accéder</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Quick actions */}
              <div className="mt-6 p-4 rounded-lg" style={{ background: COLORS.card }}>
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: COLORS.gold }} />
                  Accès rapides
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => { navigate('/dashboard-cc2026'); onClose?.(); }} style={{ background: COLORS.gold, color: COLORS.charbon }}>
                    Dashboard CC2026
                  </Button>
                  <Button size="sm" onClick={() => { navigate('/admin/accreditation'); onClose?.(); }} variant="outline" style={{ borderColor: `${COLORS.terracotta}50`, color: COLORS.terracotta }}>
                    Accréditations
                  </Button>
                  <Button size="sm" onClick={() => { navigate('/admin/cms'); onClose?.(); }} variant="outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
                    CMS Site
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Control Tab */}
          {activeTab === 'control' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Gérez les accès et mots de passe des workspaces
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowPasswords(!showPasswords)}
                  style={{ color: COLORS.gold }}
                >
                  {showPasswords ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showPasswords ? 'Masquer' : 'Afficher'}
                </Button>
              </div>
              
              <div className="space-y-2">
                {WORKSPACES.map(ws => (
                  <div 
                    key={ws.id} 
                    className="p-4 rounded-lg flex items-center justify-between"
                    style={{ background: COLORS.card }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{ws.icon}</span>
                      <div>
                        <div className="font-bold text-white">{ws.name}</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Rôle: {ws.role}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {editingWorkspace === ws.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="Nouveau mot de passe"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-40 h-8 text-sm"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                          />
                          <Button size="sm" onClick={() => updateWorkspacePassword(ws.id)} style={{ background: COLORS.success }}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingWorkspace(null); setNewPassword(''); }}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <code className="px-3 py-1 rounded text-sm" style={{ background: 'rgba(255,255,255,0.1)', color: showPasswords ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                            {showPasswords ? ws.password : '••••••••'}
                          </code>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditingWorkspace(ws.id)}
                            style={{ color: 'rgba(255,255,255,0.5)' }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Danger Zone */}
              <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Zone dangereuse
                </h3>
                <p className="text-xs text-red-300/70 mb-3">Actions irréversibles</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" style={{ borderColor: 'rgba(239,68,68,0.5)', color: '#ef4444' }}>
                    Réinitialiser tous les mots de passe
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Activité récente de tous les workspaces
                </div>
                <Button size="sm" variant="ghost" onClick={loadActivityLogs} style={{ color: COLORS.gold }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityLogs.length === 0 ? (
                  <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Aucune activité récente
                  </div>
                ) : (
                  activityLogs.map((log, idx) => (
                    <div key={idx} className="p-3 rounded-lg flex items-center gap-3" style={{ background: COLORS.card }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${COLORS.gold}20`, color: COLORS.gold }}>
                        {log.user?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white">{log.user} - <span style={{ color: 'rgba(255,255,255,0.5)' }}>{log.action}</span></div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{log.details}</div>
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('fr-FR') : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Inscriptions et données du site public ({registrations.length} entrées)
                </div>
                <Button size="sm" variant="ghost" onClick={loadRegistrations} style={{ color: COLORS.gold }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {registrations.length === 0 ? (
                  <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Aucune inscription
                  </div>
                ) : (
                  registrations.map((reg) => (
                    <div key={reg.id} className="p-3 rounded-lg flex items-center justify-between" style={{ background: COLORS.card }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${COLORS.terracotta}20`, color: COLORS.terracotta }}>
                          {reg.full_name?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{reg.full_name}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{reg.email}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{reg.organization} • {reg.country}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => deleteRegistration(reg.id)}
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FounderControlCenter;
