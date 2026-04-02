import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Palette, Image, FileText, Upload, Eye, Plus, Save, Trash2, Settings, Printer, Download, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import InternalMessaging from '../InternalMessaging';
import WorkspaceHeader from './WorkspaceHeader';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  forest: '#4A5D4E',
  pink: '#E91E63'
};

const WorkspaceTwina = () => {
  const navigate = useNavigate();
  const [cmsContent, setCmsContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');
  const [badgeStats, setBadgeStats] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadCMS = async () => {
      try {
        const res = await axios.get(`${API}/cms/content`);
        setCmsContent(res.data);
      } catch (error) {
        console.error('Error loading CMS:', error);
      } finally {
        setLoading(false);
      }
    };
    const loadBadgeStats = async () => {
      try {
        const res = await axios.get(`${API}/badges/export-stats`);
        setBadgeStats(res.data);
      } catch (error) {
        console.error('Error loading badge stats:', error);
      }
    };
    loadCMS();
    loadBadgeStats();
    
    // Log activity
    axios.post(`${API}/workspace/log`, {
      user: 'Twina',
      role: 'design',
      action: 'view',
      details: 'Acces workspace design'
    });
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Twina', role: 'design' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const logAction = async (action, details) => {
    await axios.post(`${API}/workspace/log`, {
      user: 'Twina',
      role: 'design',
      action,
      details
    });
  };

  const sections = [
    { id: 'hero', label: 'Hero / Accueil', icon: Image },
    { id: 'badges', label: 'Export Badges PDF', icon: Printer },
    { id: 'partners', label: 'Logos Partenaires', icon: Palette },
    { id: 'program', label: 'Programme', icon: FileText },
    { id: 'visuals', label: 'Visuels & Medias', icon: Upload }
  ];

  const handleExportBadges = async (tier = null) => {
    setExporting(true);
    try {
      const params = tier ? `?tier=${tier}` : '';
      const res = await fetch(`${API}/badges/export-pdf-batch${params}`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail || 'Erreur export');
        setExporting(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `badges_cc2026_${tier || 'all'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export PDF termine !');
      logAction('export', `Export badges PDF ${tier || 'tous'}`);
    } catch (e) {
      toast.error('Erreur lors de l\'export');
    }
    setExporting(false);
  };

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header unifié */}
      <WorkspaceHeader
        userName="Twina"
        userRole="design"
        subtitle="Design - CMS Visuel"
        dashboardPath="/dashboard-cc2026"
        onLogout={handleLogout}
        showNotifications={false}
        extraButtons={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/admin/cms')} 
            className="hidden sm:flex"
            style={{ borderColor: `${COLORS.gold}40`, color: COLORS.gold }}
          >
            <Settings className="w-3.5 h-3.5 mr-2" />
            CMS
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Info banner */}
        <div className="rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start sm:items-center gap-3" style={{ background: `${COLORS.pink}15`, border: `1px solid ${COLORS.pink}30` }}>
          <Palette className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" style={{ color: COLORS.pink }} />
          <div>
            <div className="text-sm font-bold text-white">Espace Design</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Modifiez les visuels du site directement. Toutes les modifications sont enregistrees automatiquement.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar - Sections - En haut horizontal sur mobile */}
          <div className="md:col-span-1">
            <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 md:space-y-2 scrollbar-hide">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    logAction('navigate', `Section ${section.label}`);
                  }}
                  className="flex-shrink-0 p-3 rounded-lg flex items-center gap-3 transition-all whitespace-nowrap"
                  style={{ 
                    background: activeSection === section.id ? `${COLORS.pink}20` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeSection === section.id ? COLORS.pink : 'rgba(255,255,255,0.1)'}` 
                  }}
                >
                  <section.icon className="w-4 h-4" style={{ color: activeSection === section.id ? COLORS.pink : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-xs sm:text-sm" style={{ color: activeSection === section.id ? COLORS.pink : 'rgba(255,255,255,0.6)' }}>
                    {section.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-3 rounded-lg p-4 sm:p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.pink}20` }}>
            {loading ? (
              <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Chargement...
              </div>
            ) : (
              <>
                {activeSection === 'badges' && (
                  <div className="space-y-6" data-testid="badges-export-section">
                    <h2 className="text-lg font-bold" style={{ color: COLORS.pink }}>Export Badges PDF</h2>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Generez les badges en PDF pour impression. Format A6, 4 badges par page A4.
                    </p>

                    {/* Stats */}
                    {badgeStats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p className="text-xl font-bold text-white">{badgeStats.total_approved}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Total approuves</p>
                        </div>
                        {Object.entries(badgeStats.by_tier || {}).map(([tier, count]) => (
                          <div key={tier} className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <p className="text-xl font-bold" style={{ color: tier === 'emerging' ? '#4A5D4E' : tier === 'professional' ? '#C4714A' : tier === 'institutional' ? '#D4A84B' : '#fff' }}>{count}</p>
                            <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{tier}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Export buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={() => handleExportBadges()}
                        disabled={exporting || !badgeStats?.total_approved}
                        className="w-full p-4 rounded-lg flex items-center justify-between transition-colors disabled:opacity-40"
                        style={{ background: `${COLORS.pink}20`, border: `1px solid ${COLORS.pink}40` }}
                        data-testid="export-all-badges-btn"
                      >
                        <div className="flex items-center gap-3">
                          {exporting ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.pink }} /> : <Printer className="w-5 h-5" style={{ color: COLORS.pink }} />}
                          <div className="text-left">
                            <p className="text-sm font-bold text-white">Exporter TOUS les badges</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{badgeStats?.total_approved || 0} badges - Format A4 (4 par page)</p>
                          </div>
                        </div>
                        <Download className="w-5 h-5" style={{ color: COLORS.pink }} />
                      </button>

                      {['emerging', 'professional', 'institutional'].map(tier => {
                        const count = badgeStats?.by_tier?.[tier] || 0;
                        const labels = { emerging: 'Emergent', professional: 'Professionnel', institutional: 'Institutionnel' };
                        const colors = { emerging: '#4A5D4E', professional: '#C4714A', institutional: '#D4A84B' };
                        return (
                          <button
                            key={tier}
                            onClick={() => handleExportBadges(tier)}
                            disabled={exporting || count === 0}
                            className="w-full p-3 rounded-lg flex items-center justify-between transition-colors disabled:opacity-30"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            data-testid={`export-${tier}-btn`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ background: colors[tier] }} />
                              <span className="text-sm text-white">{labels[tier]}</span>
                            </div>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{count} badges</span>
                          </button>
                        );
                      })}
                    </div>

                    {(!badgeStats || badgeStats.total_approved === 0) && (
                      <div className="p-6 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <Printer className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Aucun badge approuve pour le moment. Les badges seront disponibles apres approbation des inscriptions.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'hero' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold" style={{ color: COLORS.pink }}>Section Hero / Accueil</h2>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Modifiez le titre, sous-titre et image principale de la page d'accueil.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Titre principal</label>
                        <Input 
                          defaultValue={cmsContent?.hero?.title || 'Culture Connect 2026'}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Sous-titre</label>
                        <Input 
                          defaultValue={cmsContent?.hero?.subtitle || '1er marche professionnel'}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        />
                      </div>
                    </div>
                    
                    <Button onClick={() => { logAction('save', 'Section Hero'); toast.success('Modifications enregistrees'); }} style={{ background: COLORS.pink }}>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </Button>
                  </div>
                )}

                {activeSection === 'partners' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold" style={{ color: COLORS.pink }}>Logos Partenaires</h2>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Gerez les logos des partenaires affiches sur le site.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {(cmsContent?.partners || []).slice(0, 6).map((partner) => (
                        <div key={partner.company_name || partner.logo_url} className="p-4 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          {partner.logo_url ? (
                            <img src={partner.logo_url} alt={partner.company_name} className="h-12 mx-auto object-contain mb-2" />
                          ) : (
                            <div className="h-12 flex items-center justify-center mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                              <Image className="w-8 h-8" />
                            </div>
                          )}
                          <div className="text-xs text-white truncate">{partner.company_name || 'Partenaire'}</div>
                        </div>
                      ))}
                      <button className="p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2"
                        style={{ borderColor: `${COLORS.pink}40` }}>
                        <Plus className="w-6 h-6" style={{ color: COLORS.pink }} />
                        <span className="text-xs" style={{ color: COLORS.pink }}>Ajouter</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 'program' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold" style={{ color: COLORS.pink }}>Programme</h2>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Modifiez le programme et les evenements.
                    </p>
                    <div className="p-8 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Section programme - Utilisez le CMS complet pour des modifications avancees
                      </p>
                      <Button onClick={() => navigate('/admin/cms')} variant="outline" className="mt-4" style={{ borderColor: `${COLORS.pink}50`, color: COLORS.pink }}>
                        Ouvrir CMS Complet
                      </Button>
                    </div>
                  </div>
                )}

                {activeSection === 'visuals' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold" style={{ color: COLORS.pink }}>Visuels & Medias</h2>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Uploadez et gerez les images et visuels du site.
                    </p>
                    
                    <div className="border-2 border-dashed rounded-lg p-12 text-center" style={{ borderColor: `${COLORS.pink}40` }}>
                      <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.pink }} />
                      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Glissez vos fichiers ici ou cliquez pour uploader
                      </p>
                      <Button style={{ background: COLORS.pink }}>
                        Choisir des fichiers
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      
      {/* Internal Messaging */}
      <InternalMessaging 
        currentUser={{ id: 'twina', name: 'Twina', role: 'design' }} 
        isFounder={false} 
      />
    </div>
  );
};

export default WorkspaceTwina;
