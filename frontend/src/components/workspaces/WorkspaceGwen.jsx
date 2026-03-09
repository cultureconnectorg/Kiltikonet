import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Music, Users, FileText, CheckSquare, Square, Plus, Calendar, Clock, AlertTriangle, Upload, Save, Truck } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useSendNotification } from './NotificationSystem';
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
  forest: '#4A5D4E'
};

const WorkspaceGwen = () => {
  const navigate = useNavigate();
  const sendNotification = useSendNotification();
  const [activeTab, setActiveTab] = useState('artistes');
  
  // Artistes data
  const [artistes, setArtistes] = useState([
    { id: 1, name: 'Kathy', genre: 'DJ Set', status: 'Confirmé', contrat: 'Signé', cachet: '2500€', rider: true, horaire: '22h' },
    { id: 2, name: 'Artiste 2', genre: 'Zouk', status: 'En négociation', contrat: 'Envoyé', cachet: '3000€', rider: false, horaire: 'TBD' },
    { id: 3, name: 'Artiste 3', genre: 'Kompa', status: 'À contacter', contrat: 'Non signé', cachet: '-', rider: false, horaire: 'TBD' },
  ]);

  // Checklist formalités
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Déclaration Préfecture', checked: false, category: 'admin', date: null },
    { id: 2, label: 'Courrier Mairie Fort-de-France', checked: false, category: 'admin', date: null },
    { id: 3, label: 'Réponse Mairie reçue', checked: false, category: 'admin', date: null },
    { id: 4, label: 'Dossier SACEM déposé', checked: true, category: 'legal', date: '28/02/2026' },
    { id: 5, label: 'Dossier GUSO déposé', checked: false, category: 'legal', date: null },
    { id: 6, label: 'Assurance RC événementielle', checked: false, category: 'admin', date: null },
    { id: 7, label: 'Autorisation La Savane', checked: false, category: 'admin', date: null },
    { id: 8, label: 'Contrat société sécurité CNAPS', checked: false, category: 'securite', date: null },
    { id: 9, label: 'Plan évacuation validé', checked: false, category: 'securite', date: null },
    { id: 10, label: 'Sono / Backline confirmé', checked: false, category: 'technique', date: null }
  ]);

  // Planning jour J
  const [planning, setPanning] = useState([
    { time: '08:00', event: 'Arrivée équipe technique', responsable: 'Fabrice', status: 'todo' },
    { time: '09:00', event: 'Montage scène', responsable: 'Prestataire son', status: 'todo' },
    { time: '14:00', event: 'Installation technique', responsable: 'Fabrice', status: 'todo' },
    { time: '16:00', event: 'Soundcheck artistes', responsable: 'Gwen', status: 'todo' },
    { time: '18:00', event: 'Ouverture portes', responsable: 'Sécurité', status: 'todo' },
    { time: '19:00', event: 'Début concert', responsable: 'Gwen', status: 'todo' },
    { time: '22:00', event: 'DJ Set Kathy', responsable: 'Gwen', status: 'todo' },
    { time: '00:00', event: 'Fin programmation', responsable: 'Gwen', status: 'todo' },
    { time: '01:00', event: 'Démontage', responsable: 'Prestataire', status: 'todo' }
  ]);

  const [productionNotes, setProductionNotes] = useState('');

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Gwen',
      role: 'event',
      action: 'login',
      details: 'Accès workspace événementiel'
    });
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Gwen', role: 'event' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const toggleCheck = async (id) => {
    const item = checklist.find(c => c.id === id);
    const newChecked = !item.checked;
    
    setChecklist(prev => prev.map(c => 
      c.id === id ? { ...c, checked: newChecked, date: newChecked ? new Date().toLocaleDateString('fr-FR') : null } : c
    ));
    
    await axios.post(`${API}/workspace/log`, {
      user: 'Gwen',
      role: 'event',
      action: 'update',
      details: `Checklist: ${item.label} - ${newChecked ? 'Fait' : 'À faire'}`
    });

    // Send notification to Laurent
    if (newChecked) {
      await sendNotification({
        sender: 'Gwen',
        senderRole: 'event',
        type: 'checklist_done',
        title: `Formalité validée`,
        message: `${item.label} est maintenant complété`,
        target: 'laurent'
      });
    }
  };

  const confirmArtiste = async (artiste) => {
    setArtistes(prev => prev.map(a => 
      a.id === artiste.id ? { ...a, status: 'Confirmé', contrat: 'Signé' } : a
    ));

    await axios.post(`${API}/workspace/log`, {
      user: 'Gwen',
      role: 'event',
      action: 'artiste_confirmed',
      details: `Artiste confirmé: ${artiste.name}`
    });

    // Send notification to Laurent
    await sendNotification({
      sender: 'Gwen',
      senderRole: 'event',
      type: 'artiste_confirmed',
      title: `Artiste confirmé`,
      message: `${artiste.name} (${artiste.genre}) est maintenant confirmé pour le 22 mai`,
      target: 'laurent'
    });

    toast.success(`${artiste.name} confirmé - Notification envoyée à LC`);
  };

  const markRiderReceived = async (artiste) => {
    setArtistes(prev => prev.map(a => 
      a.id === artiste.id ? { ...a, rider: true } : a
    ));
    toast.success(`Rider technique de ${artiste.name} marqué comme reçu`);
  };

  const completedCount = checklist.filter(c => c.checked).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header unifié */}
      <WorkspaceHeader
        userName="Gwen"
        userRole="event"
        subtitle="Événementiel - Chimin Savann"
        dashboardPath="/dashboard-cc2026/gwen"
        onLogout={handleLogout}
        showNotifications={true}
        notificationTarget="gwen"
      />

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Event info banner */}
        <div className="rounded-lg p-4 sm:p-6 mb-4 sm:mb-6" style={{ background: `linear-gradient(135deg, ${COLORS.forest}20, ${COLORS.charbon})`, border: `1px solid ${COLORS.forest}30` }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>CHIMIN SAVANN</h1>
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Concert Culture Connect 2026</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-3xl font-bold" style={{ color: COLORS.gold }}>22 MAI 2026</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>La Savane - Fort-de-France</div>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4" style={{ color: COLORS.gold }} />
              <span className="text-xs sm:text-sm text-white">{artistes.filter(a => a.status === 'Confirmé').length} artiste(s) confirmé(s)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" style={{ color: COLORS.forest }} />
              <span className="text-xs sm:text-sm text-white">{progress}% formalités</span>
            </div>
          </div>
        </div>

        {/* Tabs - Scroll horizontal sur mobile */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {[
            { id: 'artistes', label: 'Artistes', icon: Music },
            { id: 'formalites', label: 'Formalités', icon: FileText },
            { id: 'planning', label: 'Planning', icon: Calendar },
            { id: 'technique', label: 'Logistique', icon: Users },
            { id: 'notes', label: 'Notes', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap flex-shrink-0"
              style={{ 
                background: activeTab === tab.id ? COLORS.forest : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)'
              }}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-xs sm:text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content - Mobile: single column, Desktop: 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main content - Toujours en premier sur mobile et desktop */}
          <div className="lg:col-span-2 rounded-lg p-4 sm:p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.forest}20` }}>
            {activeTab === 'artistes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold" style={{ color: COLORS.forest }}>Line-up Artistes</h2>
                  <Button style={{ background: COLORS.forest }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter artiste
                  </Button>
                </div>
                <div className="space-y-3">
                  {artistes.map(artiste => (
                    <div key={artiste.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: COLORS.forest }}>
                            <Music className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{artiste.name}</div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{artiste.genre} - {artiste.horaire}</div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded text-xs font-bold ${
                          artiste.status === 'Confirmé' ? 'bg-green-500/20 text-green-400' : 
                          artiste.status === 'En négociation' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-white/10 text-white/40'
                        }`}>
                          {artiste.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Contrat</div>
                          <div className={artiste.contrat === 'Signé' ? 'text-green-400' : 'text-yellow-400'}>{artiste.contrat}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Cachet</div>
                          <div className="text-white">{artiste.cachet}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Rider technique</div>
                          <div className={artiste.rider ? 'text-green-400' : 'text-red-400'}>{artiste.rider ? 'Reçu' : 'En attente'}</div>
                        </div>
                        <div className="flex items-end gap-2">
                          {artiste.status !== 'Confirmé' && (
                            <Button size="sm" onClick={() => confirmArtiste(artiste)} style={{ background: COLORS.forest }}>
                              Confirmer
                            </Button>
                          )}
                          {!artiste.rider && (
                            <Button size="sm" variant="outline" onClick={() => markRiderReceived(artiste)} style={{ borderColor: `${COLORS.gold}50`, color: COLORS.gold }}>
                              Rider reçu
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'formalites' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold" style={{ color: COLORS.forest }}>Checklist Formalités</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full transition-all" style={{ width: `${progress}%`, background: COLORS.forest }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: COLORS.forest }}>{progress}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {checklist.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className="w-full flex items-center gap-3 p-4 rounded-lg transition-all hover:bg-white/5"
                      style={{ background: item.checked ? `${COLORS.forest}20` : 'rgba(255,255,255,0.05)' }}
                    >
                      {item.checked ? (
                        <CheckSquare className="w-5 h-5" style={{ color: COLORS.forest }} />
                      ) : (
                        <Square className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      )}
                      <span className={`text-sm flex-1 text-left ${item.checked ? 'line-through' : ''}`} style={{ color: item.checked ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                        {item.label}
                      </span>
                      <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                        {item.category}
                      </span>
                      {item.date && (
                        <span className="text-xs" style={{ color: COLORS.forest }}>{item.date}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'planning' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.forest }}>Planning Jour J - 22 mai 2026</h2>
                <div className="space-y-2">
                  {planning.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="text-lg font-bold" style={{ color: COLORS.gold, width: '60px' }}>{item.time}</div>
                      <div className="w-3 h-3 rounded-full" style={{ background: item.status === 'done' ? COLORS.forest : 'rgba(255,255,255,0.2)' }} />
                      <div className="flex-1 text-white">{item.event}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.responsable}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'technique' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.forest }}>Logistique Technique</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <h3 className="font-bold text-white mb-3">Prestataires</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.5)' }}>Son</span><span className="text-yellow-400">Devis en attente</span></div>
                      <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.5)' }}>Lumière</span><span className="text-yellow-400">Devis en attente</span></div>
                      <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.5)' }}>Sécurité</span><span className="text-red-400">À contacter</span></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <h3 className="font-bold text-white mb-3">Matériel scène</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.5)' }}>Scène</span><span className="text-green-400">Confirmé</span></div>
                      <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.5)' }}>Backline</span><span className="text-yellow-400">En cours</span></div>
                      <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.5)' }}>Écrans LED</span><span className="text-red-400">À voir</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.forest }}>Notes de Production</h2>
                <textarea 
                  className="w-full h-64 p-4 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none' }}
                  placeholder="Ajoutez vos notes de production ici..."
                  value={productionNotes}
                  onChange={(e) => setProductionNotes(e.target.value)}
                />
                <Button style={{ background: COLORS.forest }}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar - Urgent tasks - Après le contenu principal sur mobile */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.gold }}>Tâches urgentes</h3>
              <div className="space-y-3">
                {[
                  { title: 'Autorisation Préfecture', date: '2026-03-08', priority: 'critical' },
                  { title: 'Confirmer line-up', date: '2026-03-15', priority: 'high' },
                  { title: 'Contrats GUSO', date: '2026-03-20', priority: 'high' },
                  { title: 'Planning sécurité', date: '2026-04-01', priority: 'normal' }
                ].map((task, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    borderLeft: `3px solid ${task.priority === 'critical' ? '#ef4444' : task.priority === 'high' ? COLORS.terracotta : COLORS.gold}` 
                  }}>
                    <div className="text-sm text-white mb-1">{task.title}</div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{task.date}</span>
                      {task.priority === 'critical' && (
                        <AlertTriangle className="w-3 h-3 ml-auto" style={{ color: '#ef4444' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.forest}20` }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.forest }}>Documents</h3>
              <div className="space-y-2">
                <button className="w-full p-3 rounded-lg text-left hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-sm text-white">Dossier sécurité</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>PDF - À uploader</div>
                </button>
                <button className="w-full p-3 rounded-lg text-left hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-sm text-white">Plan de masse</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>PDF - À uploader</div>
                </button>
                <Button variant="outline" className="w-full mt-2" style={{ borderColor: `${COLORS.forest}50`, color: COLORS.forest }}>
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader document
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Internal Messaging */}
      <InternalMessaging 
        currentUser={{ id: 'gwen', name: 'Gwen', role: 'event' }} 
        isFounder={false} 
      />
    </div>
  );
};

export default WorkspaceGwen;
