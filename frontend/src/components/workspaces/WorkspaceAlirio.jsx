import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, Calendar, FileText, Send, Loader2, Bot, User, Briefcase, Clock, Plus, Users, Search, Edit2, Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useSendNotification } from './NotificationSystem';
import InternalMessaging from '../InternalMessaging';
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

const WorkspaceAlirio = () => {
  const navigate = useNavigate();
  const sendNotification = useSendNotification();
  const [activeTab, setActiveTab] = useState('assistant');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', type: 'Bronze', contact: '', email: '', phone: '' });
  const [searchPartners, setSearchPartners] = useState('');
  const messagesEndRef = useRef(null);

  // Agenda
  const [agenda, setAgenda] = useState([
    { id: 1, title: 'Réunion équipe CC2026', date: '2026-03-10', time: '10:00', type: 'reunion', participants: 'Toute l\'équipe' },
    { id: 2, title: 'Call CTM - Subvention', date: '2026-03-11', time: '14:00', type: 'call', participants: 'Laurent, Alirio' },
    { id: 3, title: 'Deadline dossier SACEM', date: '2026-03-15', time: '09:00', type: 'deadline', participants: '' },
    { id: 4, title: 'Rendez-vous partenaire Or', date: '2026-03-18', time: '11:00', type: 'rdv', participants: 'Laurent, Alirio' }
  ]);

  // Registre partenaires
  const [partners, setPartners] = useState([
    { id: 1, name: 'CTM', type: 'Institutionnel', status: 'En négociation', contact: 'M. Directeur', email: 'contact@ctm.mq', phone: '0596 XX XX XX', lastAction: '05/03/2026', nextAction: 'Relance dossier' },
    { id: 2, name: 'SACEM', type: 'Institutionnel', status: 'Signé', contact: 'Responsable Antilles', email: 'antilles@sacem.fr', phone: '', lastAction: '01/03/2026', nextAction: 'Versement' },
    { id: 3, name: 'Entreprise XYZ', type: 'Or', status: 'Prospect', contact: 'DG', email: 'dg@xyz.com', phone: '0696 XX XX XX', lastAction: null, nextAction: 'Premier contact' },
    { id: 4, name: 'Société ABC', type: 'Silver', status: 'Contacté', contact: 'Resp. Com', email: 'com@abc.fr', phone: '', lastAction: '28/02/2026', nextAction: 'Envoi dossier' }
  ]);

  // Notes de réunion
  const [notes, setNotes] = useState([
    { id: 1, date: '05/03/2026', title: 'Réunion équipe - Point budget', participants: 'Laurent, Gwen, Wudy', decisions: ['Budget validé', 'Artiste Kathy confirmée'], actions: ['Wudy: Mise à jour fichier dépenses', 'Gwen: Confirmer sono'] },
    { id: 2, date: '01/03/2026', title: 'Call SACEM', participants: 'Laurent, Alirio', decisions: ['Dossier accepté'], actions: ['Alirio: Suivi versement'] }
  ]);

  // Carnet de contacts global
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Kathy', role: 'Artiste', org: 'DJ', email: 'kathy@email.com', phone: '0696 XX XX XX' },
    { id: 2, name: 'M. Directeur CTM', role: 'Institution', org: 'CTM', email: 'dir@ctm.mq', phone: '0596 XX XX XX' },
    { id: 3, name: 'SonoCaraïbes', role: 'Prestataire', org: 'Son & Lumière', email: 'contact@sonocaraibes.fr', phone: '0596 XX XX XX' }
  ]);

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Alirio',
      role: 'business',
      action: 'login',
      details: 'Accès workspace business'
    });
    
    // Welcome message
    setMessages([{
      role: 'assistant',
      content: `Bonjour Alirio ! Je suis l'assistant IA de Culture Connect 2026.

Je connais tous les détails du projet : partenaires, budget (97 750€ HT), programme, équipe, deadlines...

Exemples de questions :
• "Quels partenaires n'ont pas encore signé ?"
• "Rédige un email de relance pour CTM"
• "Prépare l'ordre du jour de la réunion de demain"
• "Quel est le budget com prévu ?"

Comment puis-je vous aider ?`
    }]);
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Alirio', role: 'business' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/ai/assistant`, {
        message: userMessage,
        user: 'Alirio',
        context: 'business_secretary'
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      
      await axios.post(`${API}/workspace/log`, {
        user: 'Alirio',
        role: 'business',
        action: 'ai_chat',
        details: userMessage.substring(0, 50) + '...'
      });
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const addPartner = async () => {
    if (!newPartner.name) {
      toast.error('Nom requis');
      return;
    }

    const partner = {
      id: Date.now(),
      ...newPartner,
      status: 'Prospect',
      lastAction: new Date().toLocaleDateString('fr-FR'),
      nextAction: 'Premier contact'
    };

    setPartners(prev => [...prev, partner]);

    await axios.post(`${API}/workspace/log`, {
      user: 'Alirio',
      role: 'business',
      action: 'partner_added',
      details: `Nouveau partenaire: ${partner.name} (${partner.type})`
    });

    // Send notification to Laurent
    await sendNotification({
      sender: 'Alirio',
      senderRole: 'business',
      type: 'partner_added',
      title: 'Nouveau partenaire ajouté',
      message: `${partner.name} - Type: ${partner.type}`,
      target: 'laurent'
    });

    toast.success(`Partenaire ajouté - LC notifié`);
    setShowAddPartner(false);
    setNewPartner({ name: '', type: 'Bronze', contact: '', email: '', phone: '' });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredPartners = partners.filter(p => 
    searchPartners === '' || 
    p.name.toLowerCase().includes(searchPartners.toLowerCase()) ||
    p.type.toLowerCase().includes(searchPartners.toLowerCase())
  );

  const getStatusStyle = (status) => {
    const styles = {
      'Signé': { bg: 'rgba(77,191,138,0.2)', color: '#4DBF8A' },
      'En négociation': { bg: `${COLORS.gold}20`, color: COLORS.gold },
      'Contacté': { bg: `${COLORS.terracotta}20`, color: COLORS.terracotta },
      'Prospect': { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' },
      'Refusé': { bg: 'rgba(239,68,68,0.2)', color: '#ef4444' }
    };
    return styles[status] || styles['Prospect'];
  };

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.terracotta}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: COLORS.terracotta, color: '#fff' }}>
              AL
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: COLORS.terracotta }}>ALIRIO</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Business & Secrétariat CC2026</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'assistant', label: 'Assistant IA', icon: Bot },
            { id: 'partenaires', label: 'Partenaires', icon: Users },
            { id: 'agenda', label: 'Agenda', icon: Calendar },
            { id: 'notes', label: 'Notes réunion', icon: FileText },
            { id: 'contacts', label: 'Contacts', icon: Briefcase }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              style={{ 
                background: activeTab === tab.id ? COLORS.terracotta : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)'
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'assistant' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Chat panel */}
            <div className="col-span-2 rounded-lg overflow-hidden" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
              <div className="p-4" style={{ background: `${COLORS.terracotta}15`, borderBottom: `1px solid ${COLORS.terracotta}20` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: COLORS.terracotta }}>
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Assistant CC2026</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>IA contextuelle - Claude</div>
                  </div>
                </div>
              </div>
              
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className="max-w-[80%] p-4 rounded-lg"
                      style={{ background: msg.role === 'user' ? COLORS.terracotta : 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" style={{ color: COLORS.gold }} />}
                        <span className="text-xs font-bold" style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : COLORS.gold }}>
                          {msg.role === 'user' ? 'Vous' : 'Assistant'}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap text-white">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.gold }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex gap-3">
                  <Input 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Posez votre question..."
                    className="flex-1"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                  <Button onClick={sendMessage} disabled={loading || !inputMessage.trim()} style={{ background: COLORS.terracotta }}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="col-span-1 space-y-4">
              <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.gold }}>Questions fréquentes</h3>
                <div className="space-y-2">
                  {[
                    "Quels partenaires n'ont pas signé ?",
                    "Quel est le budget com prévu ?",
                    "Rédige un email de relance CTM",
                    "Prépare l'ordre du jour demain",
                    "Liste les actions en attente"
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(q)}
                      className="w-full text-left p-2 rounded text-sm transition-all hover:bg-white/5"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.terracotta }}>Prochains RDV</h3>
                <div className="space-y-2">
                  {agenda.slice(0, 3).map(item => (
                    <div key={item.id} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="text-xs" style={{ color: COLORS.gold }}>{item.date} - {item.time}</div>
                      <div className="text-sm text-white">{item.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'partenaires' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: COLORS.terracotta }}>Registre Partenaires</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <Input 
                    value={searchPartners}
                    onChange={(e) => setSearchPartners(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-10 w-48"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                </div>
                <Button onClick={() => setShowAddPartner(true)} style={{ background: COLORS.terracotta }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {filteredPartners.map(partner => {
                const statusStyle = getStatusStyle(partner.status);
                return (
                  <div key={partner.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${COLORS.terracotta}20`, color: COLORS.terracotta }}>
                          {partner.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">{partner.name}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Type: {partner.type}</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded text-xs font-bold" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        {partner.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Contact</div>
                        <div className="text-white">{partner.contact || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Email</div>
                        <div className="text-white truncate">{partner.email || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Dernière action</div>
                        <div style={{ color: COLORS.gold }}>{partner.lastAction || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Prochaine action</div>
                        <div style={{ color: COLORS.terracotta }}>{partner.nextAction}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: COLORS.gold }}>Agenda CC2026</h2>
              <Button style={{ background: COLORS.gold, color: COLORS.charbon }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel événement
              </Button>
            </div>
            <div className="space-y-3">
              {agenda.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="w-16 text-center">
                    <div className="text-lg font-bold" style={{ color: COLORS.gold }}>{item.time}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.date}</div>
                  </div>
                  <div className="w-3 h-3 rounded-full" style={{ 
                    background: item.type === 'reunion' ? COLORS.terracotta : 
                               item.type === 'deadline' ? '#ef4444' : 
                               item.type === 'call' ? COLORS.gold : COLORS.forest 
                  }} />
                  <div className="flex-1">
                    <div className="font-bold text-white">{item.title}</div>
                    {item.participants && (
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.participants}</div>
                    )}
                  </div>
                  <span className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.forest}20` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: COLORS.forest }}>Notes de réunion</h2>
              <Button style={{ background: COLORS.forest }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle note
              </Button>
            </div>
            <div className="space-y-4">
              {notes.map(note => (
                <div key={note.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-bold text-white">{note.title}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{note.date} - {note.participants}</div>
                    </div>
                    <Button size="sm" variant="ghost"><Edit2 className="w-4 h-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-bold mb-2" style={{ color: COLORS.gold }}>Décisions</div>
                      <ul className="space-y-1">
                        {note.decisions.map((d, i) => (
                          <li key={i} className="text-sm text-white">• {d}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-bold mb-2" style={{ color: COLORS.terracotta }}>Actions</div>
                      <ul className="space-y-1">
                        {note.actions.map((a, i) => (
                          <li key={i} className="text-sm text-white">• {a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
            <h2 className="text-lg font-bold mb-6" style={{ color: COLORS.terracotta }}>Carnet de contacts global</h2>
            <div className="space-y-3">
              {contacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: COLORS.terracotta, color: '#fff' }}>
                      {contact.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white">{contact.name}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{contact.role} - {contact.org}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>{contact.email}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)' }}>{contact.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add partner modal */}
        {showAddPartner && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="rounded-lg p-6 w-full max-w-md" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: COLORS.terracotta }}>Ajouter partenaire</h3>
                <button onClick={() => setShowAddPartner(false)}><X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} /></button>
              </div>
              <div className="space-y-3">
                <Input 
                  value={newPartner.name}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom *"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <select 
                  value={newPartner.type}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  {['Bronze', 'Silver', 'Or', 'Institutionnel'].map(t => (
                    <option key={t} value={t} style={{ background: '#2A2820' }}>{t}</option>
                  ))}
                </select>
                <Input 
                  value={newPartner.contact}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="Contact principal"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <Input 
                  value={newPartner.email}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                  type="email"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <Input 
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Téléphone"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowAddPartner(false)} variant="outline" className="flex-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  Annuler
                </Button>
                <Button onClick={addPartner} className="flex-1" style={{ background: COLORS.terracotta }}>
                  Ajouter
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Internal Messaging */}
      <InternalMessaging 
        currentUser={{ id: 'alirio', name: 'Alirio', role: 'business' }} 
        isFounder={false} 
      />
    </div>
  );
};

export default WorkspaceAlirio;
