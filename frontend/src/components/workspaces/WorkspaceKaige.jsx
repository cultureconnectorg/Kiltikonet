import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Newspaper, Users, Send, FileText, Plus, Edit2, Eye, CheckCircle, Clock, Search, Filter, Save, Calendar } from 'lucide-react';
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
  teal: '#00BCD4'
};

const WorkspaceKaige = () => {
  const navigate = useNavigate();
  const sendNotification = useSendNotification();
  const [activeTab, setActiveTab] = useState('communiques');
  const [searchContacts, setSearchContacts] = useState('');
  const [filterTerritory, setFilterTerritory] = useState('all');
  const [showNewCommunique, setShowNewCommunique] = useState(false);
  const [newCommunique, setNewCommunique] = useState({ title: '', content: '' });
  
  // Communiqués de presse
  const [communiques, setCommuniques] = useState([
    { id: 1, title: 'Annonce officielle CC2026', status: 'Envoyé', date: '15/11/2025', medias: 12, views: 450 },
    { id: 2, title: 'Line-up Chimin Savann - Kathy confirmée', status: 'Brouillon', date: null, medias: 0, views: 0 },
    { id: 3, title: 'Partenariats institutionnels CC2026', status: 'Relu par LC', date: null, medias: 0, views: 0 },
    { id: 4, title: 'Ouverture inscriptions professionnels', status: 'Planifié', date: '01/02/2026', medias: 0, views: 0 }
  ]);

  // Contacts médias
  const [contacts, setContacts] = useState([
    { id: 1, name: 'RCI Martinique', type: 'Radio', email: 'redaction@rci.fm', phone: '0596 63 63 63', status: 'Confirmé couverture', territory: 'Martinique', lastContact: '05/03/2026' },
    { id: 2, name: 'France-Antilles', type: 'Presse', email: 'culture@martinique.franceantilles.fr', phone: '0596 59 08 00', status: 'Intéressé', territory: 'Martinique', lastContact: '01/03/2026' },
    { id: 3, name: 'Martinique 1ère', type: 'TV/Radio', email: 'info@martinique.la1ere.fr', phone: '0596 59 52 52', status: 'Contacté', territory: 'Martinique', lastContact: '28/02/2026' },
    { id: 4, name: 'Trace TV', type: 'TV', email: 'press@trace.tv', phone: '', status: 'Froid', territory: 'International', lastContact: null },
    { id: 5, name: 'Guadeloupe 1ère', type: 'TV/Radio', email: 'redaction@guadeloupe.la1ere.fr', phone: '', status: 'À contacter', territory: 'Guadeloupe', lastContact: null },
    { id: 6, name: 'Le Monde Afrique', type: 'Presse', email: 'afrique@lemonde.fr', phone: '', status: 'Potentiel', territory: 'France hexagonale', lastContact: null }
  ]);

  // Accréditations presse
  const [accreditations, setAccreditations] = useState([
    { id: 1, journaliste: 'Marie Dubois', media: 'France-Antilles', status: 'Généré', badge: true },
    { id: 2, journaliste: 'Jean-Marc Céline', media: 'RCI', status: 'Demandé', badge: false }
  ]);

  // Couverture médiatique
  const [coverage, setCoverage] = useState([
    { id: 1, title: 'CC2026 : La Martinique au cœur des industries culturelles', media: 'France-Antilles', date: '20/11/2025', type: 'Article web', tonality: 'Positif', url: '#' },
    { id: 2, title: 'Interview Laurent Cœurvolan - Culture Connect', media: 'RCI', date: '18/11/2025', type: 'Radio', tonality: 'Positif', url: '#' }
  ]);

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Kaïge-Jean',
      role: 'press',
      action: 'login',
      details: 'Accès workspace presse'
    });
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Kaïge-Jean', role: 'press' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const sendCommunique = async (communique) => {
    setCommuniques(prev => prev.map(c => 
      c.id === communique.id ? { ...c, status: 'Envoyé', date: new Date().toLocaleDateString('fr-FR') } : c
    ));

    await axios.post(`${API}/workspace/log`, {
      user: 'Kaïge-Jean',
      role: 'press',
      action: 'communique_sent',
      details: `Communiqué envoyé: ${communique.title}`
    });

    // Send notification to Laurent
    await sendNotification({
      sender: 'Kaïge-Jean',
      senderRole: 'press',
      type: 'communique_sent',
      title: 'Communiqué envoyé',
      message: `"${communique.title}" envoyé aux ${contacts.filter(c => c.status !== 'Froid').length} contacts médias`,
      target: 'laurent'
    });

    toast.success(`Communiqué envoyé - Notification à LC`);
  };

  const createCommunique = async () => {
    if (!newCommunique.title) {
      toast.error('Titre requis');
      return;
    }

    const communique = {
      id: Date.now(),
      title: newCommunique.title,
      status: 'Brouillon',
      date: null,
      medias: 0,
      views: 0,
      content: newCommunique.content
    };

    setCommuniques(prev => [...prev, communique]);
    setShowNewCommunique(false);
    setNewCommunique({ title: '', content: '' });
    toast.success('Communiqué créé');
  };

  const markContactSent = async (contact) => {
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, lastContact: new Date().toLocaleDateString('fr-FR'), status: 'Contacté' } : c
    ));
    toast.success(`Communiqué envoyé à ${contact.name}`);
  };

  const filteredContacts = contacts.filter(c => {
    const searchMatch = searchContacts === '' || 
      c.name.toLowerCase().includes(searchContacts.toLowerCase()) ||
      c.type.toLowerCase().includes(searchContacts.toLowerCase());
    const territoryMatch = filterTerritory === 'all' || c.territory === filterTerritory;
    return searchMatch && territoryMatch;
  });

  const getStatusStyle = (status) => {
    const styles = {
      'Envoyé': { bg: 'rgba(77,191,138,0.2)', color: '#4DBF8A' },
      'Brouillon': { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' },
      'Relu par LC': { bg: `${COLORS.gold}20`, color: COLORS.gold },
      'Planifié': { bg: `${COLORS.teal}20`, color: COLORS.teal }
    };
    return styles[status] || styles['Brouillon'];
  };

  const getContactStatusStyle = (status) => {
    const styles = {
      'Confirmé couverture': { bg: 'rgba(77,191,138,0.2)', color: '#4DBF8A' },
      'Intéressé': { bg: `${COLORS.teal}20`, color: COLORS.teal },
      'Contacté': { bg: `${COLORS.gold}20`, color: COLORS.gold },
      'Froid': { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
      'À contacter': { bg: `${COLORS.terracotta}20`, color: COLORS.terracotta },
      'Potentiel': { bg: 'rgba(156,39,176,0.2)', color: '#9C27B0' }
    };
    return styles[status] || styles['Froid'];
  };

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header unifié */}
      <WorkspaceHeader
        userName="Kaïge-Jean"
        userRole="press"
        subtitle="Attachée de Presse CC2026"
        dashboardPath="/dashboard-cc2026/kaige"
        onLogout={handleLogout}
        showNotifications={false}
      />

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.teal}20` }}>
            <div className="text-2xl font-bold" style={{ color: COLORS.teal }}>{communiques.length}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Communiqués</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="text-2xl font-bold" style={{ color: COLORS.gold }}>{contacts.length}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Contacts médias</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid rgba(77,191,138,0.3)` }}>
            <div className="text-2xl font-bold text-green-400">{communiques.filter(c => c.status === 'Envoyé').length}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Envoyés</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
            <div className="text-2xl font-bold" style={{ color: COLORS.terracotta }}>{coverage.length}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Retombées</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'communiques', label: 'Communiqués', icon: Newspaper },
            { id: 'contacts', label: 'Contacts Médias', icon: Users },
            { id: 'accreditations', label: 'Accréditations Presse', icon: FileText },
            { id: 'couverture', label: 'Couverture', icon: Eye }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              style={{ 
                background: activeTab === tab.id ? COLORS.teal : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)'
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.teal}20` }}>
          {activeTab === 'communiques' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: COLORS.teal }}>Communiqués de Presse</h2>
                <Button onClick={() => setShowNewCommunique(true)} style={{ background: COLORS.teal }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau communiqué
                </Button>
              </div>
              
              <div className="space-y-3">
                {communiques.map(cp => {
                  const statusStyle = getStatusStyle(cp.status);
                  return (
                    <div key={cp.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: `${COLORS.teal}20` }}>
                          <Newspaper className="w-6 h-6" style={{ color: COLORS.teal }} />
                        </div>
                        <div>
                          <div className="font-bold text-white">{cp.title}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {cp.date ? `Envoyé: ${cp.date}` : 'Non envoyé'}
                            {cp.medias > 0 && ` • ${cp.medias} médias`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded text-xs font-bold" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          {cp.status}
                        </span>
                        {cp.status === 'Relu par LC' && (
                          <Button size="sm" onClick={() => sendCommunique(cp)} style={{ background: COLORS.teal }}>
                            <Send className="w-4 h-4 mr-1" />
                            Envoyer
                          </Button>
                        )}
                        <Button size="sm" variant="ghost"><Edit2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: COLORS.teal }}>Carnet de Contacts Médias</h2>
                <Button style={{ background: COLORS.teal }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter contact
                </Button>
              </div>

              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <Input 
                    value={searchContacts}
                    onChange={(e) => setSearchContacts(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-10"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                </div>
                <select 
                  value={filterTerritory}
                  onChange={(e) => setFilterTerritory(e.target.value)}
                  className="px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  <option value="all" style={{ background: '#2A2820' }}>Tous territoires</option>
                  <option value="Martinique" style={{ background: '#2A2820' }}>Martinique</option>
                  <option value="Guadeloupe" style={{ background: '#2A2820' }}>Guadeloupe</option>
                  <option value="France hexagonale" style={{ background: '#2A2820' }}>France hexagonale</option>
                  <option value="International" style={{ background: '#2A2820' }}>International</option>
                </select>
              </div>
              
              <div className="space-y-3">
                {filteredContacts.map(contact => {
                  const statusStyle = getContactStatusStyle(contact.status);
                  return (
                    <div key={contact.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" 
                          style={{ background: COLORS.teal, color: '#fff' }}>
                          {contact.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white">{contact.name}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {contact.type} • {contact.territory}
                          </div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{contact.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="px-2 py-1 rounded text-xs" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {contact.status}
                          </span>
                          {contact.lastContact && (
                            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              Dernier: {contact.lastContact}
                            </div>
                          )}
                        </div>
                        <Button size="sm" onClick={() => markContactSent(contact)} variant="outline" style={{ borderColor: `${COLORS.teal}50`, color: COLORS.teal }}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'accreditations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: COLORS.teal }}>Accréditations Presse</h2>
                <Button onClick={() => navigate('/admin/accreditation')} style={{ background: COLORS.teal }}>
                  Système complet
                </Button>
              </div>
              
              <div className="space-y-3">
                {accreditations.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="font-bold text-white">{acc.journaliste}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{acc.media}</div>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs ${acc.badge ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {acc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'couverture' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.teal }}>Tableau de Couverture Médiatique</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-3xl font-bold" style={{ color: COLORS.teal }}>8</div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Articles web</div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-3xl font-bold" style={{ color: COLORS.gold }}>3</div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Passages radio</div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-3xl font-bold" style={{ color: COLORS.terracotta }}>1</div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Reportages TV</div>
                </div>
              </div>

              <div className="space-y-3">
                {coverage.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="font-bold text-white">{item.title}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {item.media} • {item.type} • {item.date}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs ${
                      item.tonality === 'Positif' ? 'bg-green-500/20 text-green-400' : 
                      item.tonality === 'Neutre' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {item.tonality}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* New communique modal */}
        {showNewCommunique && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="rounded-lg p-6 w-full max-w-lg" style={{ background: '#2A2820', border: `1px solid ${COLORS.teal}20` }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.teal }}>Nouveau communiqué</h3>
              <div className="space-y-3">
                <Input 
                  value={newCommunique.title}
                  onChange={(e) => setNewCommunique(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre du communiqué *"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <textarea 
                  value={newCommunique.content}
                  onChange={(e) => setNewCommunique(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Contenu..."
                  className="w-full h-40 p-3 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none' }}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowNewCommunique(false)} variant="outline" className="flex-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  Annuler
                </Button>
                <Button onClick={createCommunique} className="flex-1" style={{ background: COLORS.teal }}>
                  Créer
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Internal Messaging */}
      <InternalMessaging 
        currentUser={{ id: 'kaige', name: 'Kaige', role: 'press' }} 
        isFounder={false} 
      />
    </div>
  );
};

export default WorkspaceKaige;
