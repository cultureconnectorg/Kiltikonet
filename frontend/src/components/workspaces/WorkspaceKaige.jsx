import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Newspaper, Users, Send, FileText, Plus, Edit2, Eye, CheckCircle, Clock } from 'lucide-react';
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
  teal: '#00BCD4'
};

const WorkspaceKaige = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('communiques');
  const [communiques, setCommuniques] = useState([
    { id: 1, title: 'Annonce officielle CC2026', status: 'envoye', date: '2025-11-15', medias: 12 },
    { id: 2, title: 'Line-up Chimin Savann', status: 'brouillon', date: null, medias: 0 },
    { id: 3, title: 'Partenariats institutionnels', status: 'planifie', date: '2026-02-01', medias: 0 }
  ]);
  const [contacts, setContacts] = useState([
    { id: 1, name: 'RCI Martinique', type: 'Radio', email: 'redaction@rci.fm', status: 'actif' },
    { id: 2, name: 'France-Antilles', type: 'Presse', email: 'culture@martinique.franceantilles.fr', status: 'actif' },
    { id: 3, name: 'Martinique 1ere', type: 'TV/Radio', email: 'info@martinique.la1ere.fr', status: 'actif' },
    { id: 4, name: 'Trace TV', type: 'TV', email: 'press@trace.tv', status: 'potentiel' }
  ]);

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Kaige-Jean',
      role: 'press',
      action: 'view',
      details: 'Acces workspace presse'
    });
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Kaige-Jean', role: 'press' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const getStatusStyle = (status) => {
    const styles = {
      envoye: { bg: 'rgba(77,191,138,0.2)', color: '#4DBF8A' },
      brouillon: { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' },
      planifie: { bg: `${COLORS.teal}20`, color: COLORS.teal }
    };
    return styles[status] || styles.brouillon;
  };

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.teal}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: COLORS.teal, color: '#fff' }}>
              KJ
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: COLORS.teal }}>KAIGE-JEAN</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Attachee de Presse</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.teal}20` }}>
            <div className="text-2xl font-bold" style={{ color: COLORS.teal }}>{communiques.length}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Communiques</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.teal}20` }}>
            <div className="text-2xl font-bold" style={{ color: COLORS.gold }}>{contacts.length}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Contacts medias</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.teal}20` }}>
            <div className="text-2xl font-bold text-green-400">{communiques.filter(c => c.status === 'envoye').length}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Envoyes</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.teal}20` }}>
            <div className="text-2xl font-bold" style={{ color: COLORS.terracotta }}>12</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Retombees</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'communiques', label: 'Communiques', icon: Newspaper },
            { id: 'contacts', label: 'Contacts Medias', icon: Users },
            { id: 'accreditations', label: 'Accreditations Presse', icon: FileText },
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
                <h2 className="text-lg font-bold" style={{ color: COLORS.teal }}>Communiques de Presse</h2>
                <Button style={{ background: COLORS.teal }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau communique
                </Button>
              </div>
              
              <div className="space-y-3">
                {communiques.map(cp => {
                  const statusStyle = getStatusStyle(cp.status);
                  return (
                    <div key={cp.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${COLORS.teal}20` }}>
                          <Newspaper className="w-5 h-5" style={{ color: COLORS.teal }} />
                        </div>
                        <div>
                          <div className="font-bold text-white">{cp.title}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {cp.date ? `Planifie: ${cp.date}` : 'Non planifie'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded text-xs font-bold" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          {cp.status}
                        </span>
                        {cp.medias > 0 && (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{cp.medias} medias</span>
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
                <h2 className="text-lg font-bold" style={{ color: COLORS.teal }}>Contacts Medias</h2>
                <Button style={{ background: COLORS.teal }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter contact
                </Button>
              </div>
              
              <div className="space-y-3">
                {contacts.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" 
                        style={{ background: contact.status === 'actif' ? COLORS.teal : 'rgba(255,255,255,0.1)', color: '#fff' }}>
                        {contact.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white">{contact.name}</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{contact.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{contact.email}</span>
                      <Button size="sm" variant="outline" style={{ borderColor: `${COLORS.teal}50`, color: COLORS.teal }}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'accreditations' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold" style={{ color: COLORS.teal }}>Accreditations Presse</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Gerez les demandes d'accreditation presse pour l'evenement.
              </p>
              <Button onClick={() => navigate('/admin/accreditation')} style={{ background: COLORS.teal }}>
                Acceder au systeme d'accreditation
              </Button>
            </div>
          )}

          {activeTab === 'couverture' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold" style={{ color: COLORS.teal }}>Tableau de Couverture Mediatique</h2>
              <div className="grid grid-cols-3 gap-4">
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkspaceKaige;
