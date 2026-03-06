import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Palette, Image, FileText, Upload, Eye, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
    loadCMS();
    
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
    { id: 'partners', label: 'Logos Partenaires', icon: Palette },
    { id: 'program', label: 'Programme', icon: FileText },
    { id: 'visuals', label: 'Visuels & Medias', icon: Upload }
  ];

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.pink}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: COLORS.pink, color: '#fff' }}>
              TW
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: COLORS.pink }}>TWINA</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Design - CMS Visuel</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/cms')} style={{ borderColor: `${COLORS.gold}50`, color: COLORS.gold }}>
              CMS Complet
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Info banner */}
        <div className="rounded-lg p-4 mb-6 flex items-center gap-3" style={{ background: `${COLORS.pink}15`, border: `1px solid ${COLORS.pink}30` }}>
          <Palette className="w-5 h-5" style={{ color: COLORS.pink }} />
          <div>
            <div className="text-sm font-bold text-white">Espace Design</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Modifiez les visuels du site directement sans passer par Canva. Toutes les modifications sont enregistrees automatiquement.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar - Sections */}
          <div className="col-span-1 space-y-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  logAction('navigate', `Section ${section.label}`);
                }}
                className="w-full p-3 rounded-lg flex items-center gap-3 transition-all"
                style={{ 
                  background: activeSection === section.id ? `${COLORS.pink}20` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeSection === section.id ? COLORS.pink : 'rgba(255,255,255,0.1)'}` 
                }}
              >
                <section.icon className="w-4 h-4" style={{ color: activeSection === section.id ? COLORS.pink : 'rgba(255,255,255,0.4)' }} />
                <span className="text-sm" style={{ color: activeSection === section.id ? COLORS.pink : 'rgba(255,255,255,0.6)' }}>
                  {section.label}
                </span>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="col-span-3 rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.pink}20` }}>
            {loading ? (
              <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Chargement...
              </div>
            ) : (
              <>
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
                      {(cmsContent?.partners || []).slice(0, 6).map((partner, idx) => (
                        <div key={idx} className="p-4 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
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
    </div>
  );
};

export default WorkspaceTwina;
