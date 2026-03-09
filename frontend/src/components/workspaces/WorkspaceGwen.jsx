import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Music, Users, FileText, CheckSquare, Square, Plus, Calendar, Clock, 
  AlertTriangle, Upload, Save, Truck, Edit2, Trash2, Phone, Mail, DollarSign,
  Check, X, Send, Download, Eye, Settings, Bell
} from 'lucide-react';
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
  
  // Modal states
  const [showAddArtiste, setShowAddArtiste] = useState(false);
  const [showAddPrestataire, setShowAddPrestataire] = useState(false);
  const [showAddPlanning, setShowAddPlanning] = useState(false);
  const [editingArtiste, setEditingArtiste] = useState(null);
  const [editingPrestataire, setEditingPrestataire] = useState(null);
  
  // Form states
  const [newArtiste, setNewArtiste] = useState({ name: '', genre: '', cachet: '', horaire: '' });
  const [newPrestataire, setNewPrestataire] = useState({ name: '', type: '', devis: '', contact: '', email: '' });
  const [newPlanningItem, setNewPlanningItem] = useState({ time: '', event: '', responsable: '' });
  
  // Artistes data
  const [artistes, setArtistes] = useState([
    { id: 1, name: 'Kathy', genre: 'DJ Set', status: 'Confirmé', contrat: 'Signé', cachet: '2500€', rider: true, horaire: '22h', email: 'kathy@music.com', phone: '+596 696 00 00 00' },
    { id: 2, name: 'Artiste 2', genre: 'Zouk', status: 'En négociation', contrat: 'Envoyé', cachet: '3000€', rider: false, horaire: 'TBD', email: '', phone: '' },
    { id: 3, name: 'Artiste 3', genre: 'Kompa', status: 'À contacter', contrat: 'Non signé', cachet: '-', rider: false, horaire: 'TBD', email: '', phone: '' },
  ]);

  // Prestataires data
  const [prestataires, setPrestataires] = useState([
    { id: 1, name: 'SonoPlus Martinique', type: 'Son', status: 'Devis en attente', devis: '4500€', contact: 'Jean-Marc', email: 'contact@sonoplus.mq', phone: '+596 696 11 11 11', validated: false },
    { id: 2, name: 'LightShow Caraïbes', type: 'Lumière', status: 'Devis en attente', devis: '3200€', contact: 'Marie', email: 'info@lightshow.mq', phone: '+596 696 22 22 22', validated: false },
    { id: 3, name: 'Sécurité Antilles', type: 'Sécurité', status: 'À contacter', devis: '-', contact: '', email: '', phone: '', validated: false },
  ]);

  // Budget tracking
  const [budget, setBudget] = useState({
    total: 25000,
    artistes: 5500,
    prestataires: 7700,
    logistique: 3000,
    communication: 2000,
    divers: 1500
  });

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

  // === GESTION ARTISTES ===
  const handleAddArtiste = async () => {
    if (!newArtiste.name || !newArtiste.genre) {
      toast.error('Nom et genre requis');
      return;
    }
    
    const artiste = {
      id: Date.now(),
      ...newArtiste,
      status: 'À contacter',
      contrat: 'Non signé',
      rider: false,
      email: '',
      phone: ''
    };
    
    setArtistes(prev => [...prev, artiste]);
    setNewArtiste({ name: '', genre: '', cachet: '', horaire: '' });
    setShowAddArtiste(false);
    
    await axios.post(`${API}/workspace/log`, {
      user: 'Gwen',
      role: 'event',
      action: 'artiste_added',
      details: `Nouvel artiste ajouté: ${artiste.name}`
    });
    
    toast.success(`${artiste.name} ajouté au line-up`);
  };

  const handleDeleteArtiste = async (artiste) => {
    if (window.confirm(`Supprimer ${artiste.name} du line-up ?`)) {
      setArtistes(prev => prev.filter(a => a.id !== artiste.id));
      toast.success(`${artiste.name} supprimé`);
    }
  };

  const sendContrat = async (artiste) => {
    setArtistes(prev => prev.map(a => 
      a.id === artiste.id ? { ...a, contrat: 'Envoyé', status: 'En négociation' } : a
    ));
    
    await sendNotification({
      sender: 'Gwen',
      senderRole: 'event',
      type: 'contract_sent',
      title: 'Contrat envoyé',
      message: `Contrat envoyé à ${artiste.name}`,
      target: 'laurent'
    });
    
    toast.success(`Contrat envoyé à ${artiste.name}`);
  };

  // === GESTION PRESTATAIRES ===
  const handleAddPrestataire = async () => {
    if (!newPrestataire.name || !newPrestataire.type) {
      toast.error('Nom et type requis');
      return;
    }
    
    const prestataire = {
      id: Date.now(),
      ...newPrestataire,
      status: 'À contacter',
      validated: false
    };
    
    setPrestataires(prev => [...prev, prestataire]);
    setNewPrestataire({ name: '', type: '', devis: '', contact: '', email: '' });
    setShowAddPrestataire(false);
    
    toast.success(`Prestataire ${prestataire.name} ajouté`);
  };

  const validateDevis = async (prestataire) => {
    setPrestataires(prev => prev.map(p => 
      p.id === prestataire.id ? { ...p, validated: true, status: 'Validé' } : p
    ));
    
    await sendNotification({
      sender: 'Gwen',
      senderRole: 'event',
      type: 'devis_validated',
      title: 'Devis validé',
      message: `Devis ${prestataire.type} validé: ${prestataire.devis}`,
      target: 'wudy'
    });
    
    toast.success(`Devis ${prestataire.type} validé - Notification envoyée à Wudy`);
  };

  const contactPrestataire = async (prestataire) => {
    setPrestataires(prev => prev.map(p => 
      p.id === prestataire.id ? { ...p, status: 'Contacté' } : p
    ));
    toast.success(`${prestataire.name} marqué comme contacté`);
  };

  // === GESTION PLANNING ===
  const handleAddPlanningItem = () => {
    if (!newPlanningItem.time || !newPlanningItem.event) {
      toast.error('Heure et événement requis');
      return;
    }
    
    const item = {
      ...newPlanningItem,
      status: 'todo'
    };
    
    // Insert in sorted order
    const newPlanning = [...planning, item].sort((a, b) => a.time.localeCompare(b.time));
    setPlanning(newPlanning);
    setNewPlanningItem({ time: '', event: '', responsable: '' });
    setShowAddPlanning(false);
    
    toast.success('Créneau ajouté au planning');
  };

  const togglePlanningStatus = (index) => {
    setPlanning(prev => prev.map((item, i) => 
      i === index ? { ...item, status: item.status === 'done' ? 'todo' : 'done' } : item
    ));
  };

  const deletePlanningItem = (index) => {
    setPlanning(prev => prev.filter((_, i) => i !== index));
    toast.success('Créneau supprimé');
  };

  // === NOTIFICATIONS ÉQUIPE ===
  const notifyTeam = async (message, target = 'all') => {
    await sendNotification({
      sender: 'Gwen',
      senderRole: 'event',
      type: 'team_update',
      title: 'Mise à jour événement',
      message: message,
      target: target
    });
    toast.success('Notification envoyée à l\'équipe');
  };

  // Calculate budget spent
  const budgetSpent = budget.artistes + budget.prestataires + budget.logistique + budget.communication + budget.divers;
  const budgetRemaining = budget.total - budgetSpent;

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
            { id: 'technique', label: 'Prestataires', icon: Truck },
            { id: 'budget', label: 'Budget', icon: DollarSign },
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold" style={{ color: COLORS.forest }}>Line-up Artistes</h2>
                  <Button onClick={() => setShowAddArtiste(true)} style={{ background: COLORS.forest }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter artiste
                  </Button>
                </div>

                {/* Modal Ajouter Artiste */}
                {showAddArtiste && (
                  <div className="p-4 rounded-lg mb-4" style={{ background: 'rgba(74,93,78,0.2)', border: `1px solid ${COLORS.forest}` }}>
                    <h3 className="font-bold text-white mb-3">Nouvel artiste</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input 
                        placeholder="Nom de l'artiste *"
                        value={newArtiste.name}
                        onChange={(e) => setNewArtiste({...newArtiste, name: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input 
                        placeholder="Genre musical *"
                        value={newArtiste.genre}
                        onChange={(e) => setNewArtiste({...newArtiste, genre: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input 
                        placeholder="Cachet proposé"
                        value={newArtiste.cachet}
                        onChange={(e) => setNewArtiste({...newArtiste, cachet: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input 
                        placeholder="Horaire prévu"
                        value={newArtiste.horaire}
                        onChange={(e) => setNewArtiste({...newArtiste, horaire: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={handleAddArtiste} style={{ background: COLORS.forest }}>
                        <Check className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddArtiste(false)} style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {artistes.map(artiste => (
                    <div key={artiste.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: COLORS.forest }}>
                            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-base sm:text-lg">{artiste.name}</div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{artiste.genre} - {artiste.horaire}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded text-xs font-bold ${
                            artiste.status === 'Confirmé' ? 'bg-green-500/20 text-green-400' : 
                            artiste.status === 'En négociation' ? 'bg-yellow-500/20 text-yellow-400' : 
                            'bg-white/10 text-white/40'
                          }`}>
                            {artiste.status}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteArtiste(artiste)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                        <div>
                          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Contrat</div>
                          <div className={artiste.contrat === 'Signé' ? 'text-green-400' : artiste.contrat === 'Envoyé' ? 'text-yellow-400' : 'text-white/50'}>{artiste.contrat}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Cachet</div>
                          <div className="text-white">{artiste.cachet}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Rider</div>
                          <div className={artiste.rider ? 'text-green-400' : 'text-red-400'}>{artiste.rider ? 'Reçu' : 'En attente'}</div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Actions</div>
                          <div className="flex flex-wrap gap-1">
                            {artiste.status === 'À contacter' && (
                              <Button size="sm" onClick={() => sendContrat(artiste)} style={{ background: COLORS.gold, color: COLORS.charbon }} className="text-xs px-2 py-1 h-auto">
                                <Send className="w-3 h-3 mr-1" />
                                Contrat
                              </Button>
                            )}
                            {artiste.status !== 'Confirmé' && artiste.contrat === 'Envoyé' && (
                              <Button size="sm" onClick={() => confirmArtiste(artiste)} style={{ background: COLORS.forest }} className="text-xs px-2 py-1 h-auto">
                                <Check className="w-3 h-3 mr-1" />
                                Confirmer
                              </Button>
                            )}
                            {!artiste.rider && artiste.status === 'Confirmé' && (
                              <Button size="sm" variant="outline" onClick={() => markRiderReceived(artiste)} style={{ borderColor: `${COLORS.gold}50`, color: COLORS.gold }} className="text-xs px-2 py-1 h-auto">
                                Rider reçu
                              </Button>
                            )}
                          </div>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold" style={{ color: COLORS.forest }}>Planning Jour J - 22 mai 2026</h2>
                  <Button onClick={() => setShowAddPlanning(true)} style={{ background: COLORS.forest }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter créneau
                  </Button>
                </div>

                {/* Modal Ajouter créneau */}
                {showAddPlanning && (
                  <div className="p-4 rounded-lg mb-4" style={{ background: 'rgba(74,93,78,0.2)', border: `1px solid ${COLORS.forest}` }}>
                    <h3 className="font-bold text-white mb-3">Nouveau créneau</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input 
                        type="time"
                        placeholder="Heure *"
                        value={newPlanningItem.time}
                        onChange={(e) => setNewPlanningItem({...newPlanningItem, time: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input 
                        placeholder="Événement *"
                        value={newPlanningItem.event}
                        onChange={(e) => setNewPlanningItem({...newPlanningItem, event: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input 
                        placeholder="Responsable"
                        value={newPlanningItem.responsable}
                        onChange={(e) => setNewPlanningItem({...newPlanningItem, responsable: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={handleAddPlanningItem} style={{ background: COLORS.forest }}>
                        <Check className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddPlanning(false)} style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {planning.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/10" 
                      style={{ background: item.status === 'done' ? `${COLORS.forest}15` : 'rgba(255,255,255,0.05)' }}
                      onClick={() => togglePlanningStatus(idx)}
                    >
                      <div className="text-base sm:text-lg font-bold" style={{ color: COLORS.gold, minWidth: '50px' }}>{item.time}</div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${item.status === 'done' ? 'border-green-400 bg-green-400' : 'border-white/30'}`}>
                        {item.status === 'done' && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className={`flex-1 text-sm sm:text-base ${item.status === 'done' ? 'text-white/50 line-through' : 'text-white'}`}>{item.event}</div>
                      <div className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.responsable}</div>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deletePlanningItem(idx); }} className="text-red-400 hover:text-red-300 p-1 h-auto">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'technique' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold" style={{ color: COLORS.forest }}>Gestion des Prestataires</h2>
                  <Button onClick={() => setShowAddPrestataire(true)} style={{ background: COLORS.forest }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter prestataire
                  </Button>
                </div>

                {/* Modal Ajouter Prestataire */}
                {showAddPrestataire && (
                  <div className="p-4 rounded-lg mb-4" style={{ background: 'rgba(74,93,78,0.2)', border: `1px solid ${COLORS.forest}` }}>
                    <h3 className="font-bold text-white mb-3">Nouveau prestataire</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input 
                        placeholder="Nom société *"
                        value={newPrestataire.name}
                        onChange={(e) => setNewPrestataire({...newPrestataire, name: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <select 
                        value={newPrestataire.type}
                        onChange={(e) => setNewPrestataire({...newPrestataire, type: e.target.value})}
                        className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white"
                      >
                        <option value="">Type de prestation *</option>
                        <option value="Son">Son</option>
                        <option value="Lumière">Lumière</option>
                        <option value="Sécurité">Sécurité</option>
                        <option value="Scène">Scène</option>
                        <option value="Traiteur">Traiteur</option>
                        <option value="Autre">Autre</option>
                      </select>
                      <Input 
                        placeholder="Montant devis"
                        value={newPrestataire.devis}
                        onChange={(e) => setNewPrestataire({...newPrestataire, devis: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input 
                        placeholder="Contact"
                        value={newPrestataire.contact}
                        onChange={(e) => setNewPrestataire({...newPrestataire, contact: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input 
                        placeholder="Email"
                        value={newPrestataire.email}
                        onChange={(e) => setNewPrestataire({...newPrestataire, email: e.target.value})}
                        className="bg-white/5 border-white/10 text-white col-span-1 sm:col-span-2"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={handleAddPrestataire} style={{ background: COLORS.forest }}>
                        <Check className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddPrestataire(false)} style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {prestataires.map(presta => (
                    <div key={presta.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${COLORS.terracotta}20` }}>
                            <Truck className="w-5 h-5" style={{ color: COLORS.terracotta }} />
                          </div>
                          <div>
                            <div className="font-bold text-white">{presta.name}</div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{presta.type} • {presta.contact}</div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded text-xs font-bold ${
                          presta.status === 'Validé' ? 'bg-green-500/20 text-green-400' : 
                          presta.status === 'Contacté' || presta.status === 'Devis en attente' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {presta.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Devis</div>
                          <div className="text-white font-bold">{presta.devis || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Email</div>
                          <div className="text-white/70 text-xs truncate">{presta.email || '-'}</div>
                        </div>
                        <div className="col-span-2 flex flex-wrap gap-2 items-end">
                          {presta.status === 'À contacter' && (
                            <Button size="sm" onClick={() => contactPrestataire(presta)} style={{ background: COLORS.gold, color: COLORS.charbon }} className="text-xs px-2 py-1 h-auto">
                              <Phone className="w-3 h-3 mr-1" />
                              Contacter
                            </Button>
                          )}
                          {presta.status === 'Devis en attente' && !presta.validated && (
                            <Button size="sm" onClick={() => validateDevis(presta)} style={{ background: COLORS.forest }} className="text-xs px-2 py-1 h-auto">
                              <Check className="w-3 h-3 mr-1" />
                              Valider devis
                            </Button>
                          )}
                          {presta.email && (
                            <Button size="sm" variant="outline" style={{ borderColor: 'rgba(255,255,255,0.2)' }} className="text-xs px-2 py-1 h-auto">
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'budget' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.forest }}>Budget Événement</h2>
                
                {/* Budget Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(74,93,78,0.2)', border: `1px solid ${COLORS.forest}30` }}>
                    <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Budget Total</div>
                    <div className="text-2xl font-bold" style={{ color: COLORS.forest }}>{budget.total.toLocaleString()}€</div>
                  </div>
                  <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(212,168,75,0.1)', border: `1px solid ${COLORS.gold}30` }}>
                    <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Engagé</div>
                    <div className="text-2xl font-bold" style={{ color: COLORS.gold }}>{budgetSpent.toLocaleString()}€</div>
                  </div>
                  <div className="p-4 rounded-lg text-center" style={{ background: budgetRemaining > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${budgetRemaining > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Restant</div>
                    <div className="text-2xl font-bold" style={{ color: budgetRemaining > 0 ? '#22c55e' : '#ef4444' }}>{budgetRemaining.toLocaleString()}€</div>
                  </div>
                </div>

                {/* Budget Breakdown */}
                <div className="space-y-3">
                  {[
                    { label: 'Artistes (cachets)', amount: budget.artistes, color: COLORS.forest },
                    { label: 'Prestataires techniques', amount: budget.prestataires, color: COLORS.terracotta },
                    { label: 'Logistique', amount: budget.logistique, color: COLORS.gold },
                    { label: 'Communication', amount: budget.communication, color: '#3b82f6' },
                    { label: 'Divers', amount: budget.divers, color: '#6b7280' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">{item.label}</span>
                        <span className="font-bold text-white">{item.amount.toLocaleString()}€</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ 
                            width: `${(item.amount / budget.total) * 100}%`,
                            background: item.color 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(212,168,75,0.1)', border: `1px solid ${COLORS.gold}30` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: COLORS.gold }} />
                    <span className="text-sm font-bold" style={{ color: COLORS.gold }}>Note</span>
                  </div>
                  <p className="text-xs text-white/60">
                    Les modifications de budget doivent être validées par Wudy (finances). Utilisez le bouton ci-dessous pour soumettre une demande.
                  </p>
                  <Button className="mt-3" size="sm" onClick={() => notifyTeam('Demande de révision du budget événement', 'wudy')} style={{ background: COLORS.gold, color: COLORS.charbon }}>
                    <Send className="w-4 h-4 mr-2" />
                    Demander révision
                  </Button>
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
