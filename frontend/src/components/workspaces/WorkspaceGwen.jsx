import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Music, Users, FileText, CheckSquare, Square, Plus, Calendar, Clock, AlertTriangle } from 'lucide-react';
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
  forest: '#4A5D4E'
};

const WorkspaceGwen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('artistes');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Confirmer line-up Chimin Savann', status: 'todo', priority: 'high', due: '2026-03-15' },
    { id: 2, title: 'Contrats GUSO artistes', status: 'progress', priority: 'high', due: '2026-03-20' },
    { id: 3, title: 'Autorisation Prefecture', status: 'todo', priority: 'critical', due: '2026-03-08' },
    { id: 4, title: 'Dossier SACEM', status: 'done', priority: 'normal', due: '2026-02-28' },
    { id: 5, title: 'Planning securite jour J', status: 'todo', priority: 'high', due: '2026-04-01' }
  ]);
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Autorisation Mairie Fort-de-France', checked: false, category: 'admin' },
    { id: 2, label: 'Declaration Prefecture', checked: false, category: 'admin' },
    { id: 3, label: 'Assurance RC evenementielle', checked: false, category: 'admin' },
    { id: 4, label: 'Contrat societe securite CNAPS', checked: false, category: 'securite' },
    { id: 5, label: 'Declaration SACEM', checked: true, category: 'legal' },
    { id: 6, label: 'Declaration GUSO', checked: false, category: 'legal' },
    { id: 7, label: 'Plan evacuation valide', checked: false, category: 'securite' },
    { id: 8, label: 'Sono / Backline confirme', checked: false, category: 'technique' }
  ]);

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Gwen',
      role: 'event',
      action: 'view',
      details: 'Acces workspace evenementiel'
    });
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Gwen', role: 'event' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const toggleCheck = async (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
    await axios.post(`${API}/workspace/log`, {
      user: 'Gwen',
      role: 'event',
      action: 'update',
      details: `Checklist item ${id}`
    });
  };

  const getPriorityColor = (priority) => {
    const colors = { critical: '#ef4444', high: COLORS.terracotta, normal: COLORS.gold };
    return colors[priority] || COLORS.gold;
  };

  const completedCount = checklist.filter(c => c.checked).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.forest}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: COLORS.forest, color: '#fff' }}>
              GW
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: COLORS.forest }}>GWEN</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Evenementiel - Chimin Savann</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Event info */}
        <div className="rounded-lg p-6 mb-6" style={{ background: `linear-gradient(135deg, ${COLORS.forest}20, ${COLORS.charbon})`, border: `1px solid ${COLORS.forest}30` }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>CHIMIN SAVANN</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Concert Culture Connect 2026</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: COLORS.gold }}>22 MAI 2026</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>La Savane - Fort-de-France</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'artistes', label: 'Artistes', icon: Music },
            { id: 'formalites', label: 'Formalites', icon: FileText },
            { id: 'planning', label: 'Planning', icon: Calendar },
            { id: 'production', label: 'Notes Prod', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              style={{ 
                background: activeTab === tab.id ? COLORS.forest : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)'
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.forest}20` }}>
            {activeTab === 'artistes' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold" style={{ color: COLORS.forest }}>Line-up Artistes</h2>
                <div className="space-y-3">
                  {[
                    { name: 'Artiste 1', status: 'Confirme', genre: 'Zouk' },
                    { name: 'Artiste 2', status: 'En attente', genre: 'Kompa' },
                    { name: 'Artiste 3', status: 'Confirme', genre: 'Reggae' },
                  ].map((artist, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: COLORS.forest }}>
                          <Music className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-white">{artist.name}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{artist.genre}</div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${artist.status === 'Confirme' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {artist.status}
                      </span>
                    </div>
                  ))}
                </div>
                <Button style={{ background: COLORS.forest }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter artiste
                </Button>
              </div>
            )}

            {activeTab === 'formalites' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold" style={{ color: COLORS.forest }}>Checklist Formalites</h2>
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
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
                      style={{ background: item.checked ? `${COLORS.forest}20` : 'rgba(255,255,255,0.05)' }}
                    >
                      {item.checked ? (
                        <CheckSquare className="w-5 h-5" style={{ color: COLORS.forest }} />
                      ) : (
                        <Square className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      )}
                      <span className={`text-sm ${item.checked ? 'line-through' : ''}`} style={{ color: item.checked ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                        {item.label}
                      </span>
                      <span className="ml-auto text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                        {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'planning' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold" style={{ color: COLORS.forest }}>Planning Jour J</h2>
                <div className="space-y-3">
                  {[
                    { time: '14:00', event: 'Installation technique', status: 'pending' },
                    { time: '16:00', event: 'Balances artistes', status: 'pending' },
                    { time: '18:00', event: 'Ouverture portes', status: 'pending' },
                    { time: '19:00', event: 'Debut concert', status: 'pending' },
                    { time: '23:00', event: 'Fin programmation', status: 'pending' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="text-lg font-bold" style={{ color: COLORS.gold, width: '60px' }}>{item.time}</div>
                      <div className="flex-1 text-white">{item.event}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'production' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold" style={{ color: COLORS.forest }}>Notes de Production</h2>
                <textarea 
                  className="w-full h-64 p-4 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none' }}
                  placeholder="Ajoutez vos notes de production ici..."
                />
                <Button style={{ background: COLORS.forest }}>
                  Enregistrer les notes
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar - Tasks */}
          <div className="col-span-1 rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.forest}20` }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.gold }}>Taches urgentes</h3>
            <div className="space-y-3">
              {tasks.filter(t => t.status !== 'done').sort((a, b) => a.priority === 'critical' ? -1 : 1).map(task => (
                <div key={task.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${getPriorityColor(task.priority)}` }}>
                  <div className="text-sm text-white mb-1">{task.title}</div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{task.due}</span>
                    {task.priority === 'critical' && (
                      <AlertTriangle className="w-3 h-3 ml-auto" style={{ color: '#ef4444' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkspaceGwen;
