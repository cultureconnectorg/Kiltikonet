import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, Calendar, FileText, Send, Loader2, Bot, User, Briefcase, Clock, Plus } from 'lucide-react';
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

const WorkspaceAlirio = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assistant');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agenda, setAgenda] = useState([
    { id: 1, title: 'Reunion partenaires', date: '2026-03-10', time: '10:00', type: 'reunion' },
    { id: 2, title: 'Appel CTM', date: '2026-03-11', time: '14:00', type: 'call' },
    { id: 3, title: 'Envoi dossier SACEM', date: '2026-03-15', time: '09:00', type: 'task' }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Alirio',
      role: 'business',
      action: 'view',
      details: 'Acces workspace business'
    });
    
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: "Bonjour Alirio ! Je suis l'assistant IA de Culture Connect 2026. Je connais tous les details du projet et je peux repondre a vos questions sur l'evenement, les partenaires, le programme, les formalites administratives, etc.\n\nQue puis-je faire pour vous aujourd'hui ?"
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
      
      // Log the AI interaction
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
        content: "Desole, je n'ai pas pu traiter votre demande. Veuillez reessayer." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Business & Secretariat</div>
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
            { id: 'agenda', label: 'Agenda', icon: Calendar },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'messagerie', label: 'Messagerie', icon: MessageSquare }
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
              {/* Chat header */}
              <div className="p-4" style={{ background: `${COLORS.terracotta}15`, borderBottom: `1px solid ${COLORS.terracotta}20` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: COLORS.terracotta }}>
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Assistant CC2026</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>IA contextuelle - Projet Culture Connect</div>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className="max-w-[80%] p-4 rounded-lg"
                      style={{ 
                        background: msg.role === 'user' ? COLORS.terracotta : 'rgba(255,255,255,0.05)',
                        color: '#fff'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {msg.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" style={{ color: COLORS.gold }} />
                        )}
                        <span className="text-xs font-bold" style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : COLORS.gold }}>
                          {msg.role === 'user' ? 'Vous' : 'Assistant CC2026'}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
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
              
              {/* Input */}
              <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex gap-3">
                  <Input 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Posez votre question sur CC2026..."
                    className="flex-1"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    data-testid="ai-input"
                  />
                  <Button onClick={sendMessage} disabled={loading || !inputMessage.trim()} style={{ background: COLORS.terracotta }} data-testid="ai-send-btn">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="col-span-1 space-y-4">
              <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.gold }}>Questions frequentes</h3>
                <div className="space-y-2">
                  {[
                    "Quels sont les partenaires officiels ?",
                    "Quel est le budget previsionnel ?",
                    "Qui contacter pour les subventions ?",
                    "Quelles sont les prochaines echeances ?",
                    "Ou en est le dossier SACEM ?"
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
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: COLORS.terracotta }}>Agenda & Taches</h2>
              <Button style={{ background: COLORS.terracotta }}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
            <div className="space-y-3">
              {agenda.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${COLORS.terracotta}20` }}>
                    {item.type === 'reunion' && <Briefcase className="w-5 h-5" style={{ color: COLORS.terracotta }} />}
                    {item.type === 'call' && <MessageSquare className="w-5 h-5" style={{ color: COLORS.terracotta }} />}
                    {item.type === 'task' && <FileText className="w-5 h-5" style={{ color: COLORS.terracotta }} />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white">{item.title}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.date} - {item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.terracotta }}>Documents CC2026</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Gestion des documents administratifs et contrats.</p>
          </div>
        )}

        {activeTab === 'messagerie' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.terracotta }}>Messagerie Interne</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Communication interne avec l'equipe CC2026.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkspaceAlirio;
