import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Monitor, Send, Play, Pause, Edit2, Plus, Clock, RefreshCw, Camera, Upload, CheckSquare, Square, AlertTriangle, Radio, Image, Calendar } from 'lucide-react';
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
  purple: '#9C27B0',
  red: '#ef4444'
};

// Style unifié du bouton CC2026
const CC2026_BUTTON = {
  background: 'transparent',
  border: '1px solid rgba(201, 147, 58, 0.5)',
  color: '#C9933A',
  fontWeight: '600',
};

const WorkspaceFabrice = () => {
  const navigate = useNavigate();
  const sendNotification = useSendNotification();
  const [currentCaption, setCurrentCaption] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState('regie');
  
  // Quick captions
  const [captions, setCaptions] = useState([
    { id: 1, text: 'BIENVENUE À CULTURE CONNECT 2026', type: 'annonce', active: false },
    { id: 2, text: '1ER MARCHÉ PROFESSIONNEL DES INDUSTRIES CULTURELLES', type: 'annonce', active: false },
    { id: 3, text: 'PROCHAINEMENT SUR SCÈNE...', type: 'transition', active: false },
    { id: 4, text: '', type: 'artiste', active: false },
    { id: 5, text: 'MERCI À NOS PARTENAIRES', type: 'sponsors', active: false },
    { id: 6, text: 'CTM • SACEM • ISCA • SKILLFOR', type: 'sponsors', active: false },
    { id: 7, text: 'PAUSE - RETOUR DANS QUELQUES INSTANTS', type: 'pause', active: false },
    { id: 8, text: 'MERCI ET À BIENTÔT !', type: 'fin', active: false }
  ]);

  // Sequence programmer
  const [sequence, setSequence] = useState([
    { time: '18:00', artiste: 'Ouverture', text: 'BIENVENUE À CULTURE CONNECT 2026', sent: false },
    { time: '19:00', artiste: 'Discours', text: 'DISCOURS D\'OUVERTURE - LAURENT CŒURVOLAN', sent: false },
    { time: '20:00', artiste: 'Artiste 1', text: 'SUR SCÈNE : ARTISTE 1', sent: false },
    { time: '21:00', artiste: 'Pause', text: 'PAUSE - RETOUR DANS 15 MINUTES', sent: false },
    { time: '22:00', artiste: 'Kathy', text: 'SUR SCÈNE : KATHY - DJ SET', sent: false },
    { time: '00:00', artiste: 'Fin', text: 'MERCI ET À BIENTÔT !', sent: false }
  ]);

  // Captation checklist
  const [captation, setCaptation] = useState([
    { id: 1, label: 'Caméra 1 - Face scène', status: 'OK', checked: true },
    { id: 2, label: 'Caméra 2 - Public', status: 'OK', checked: true },
    { id: 3, label: 'Caméra 3 - Coulisses', status: 'En attente', checked: false },
    { id: 4, label: 'Live stream activé', status: 'Inactif', checked: false },
    { id: 5, label: 'Enregistrement local', status: 'En cours', checked: true }
  ]);

  // Photos
  const [photos, setPhotos] = useState([]);

  const [artisteEnCours, setArtisteEnCours] = useState('');
  const [messageUrgent, setMessageUrgent] = useState('');
  const [history, setHistory] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Fabrice',
      role: 'captions',
      action: 'login',
      details: 'Accès workspace captions'
    });
    
    // Try WebSocket connection
    try {
      wsRef.current = new WebSocket(`${BACKEND_URL.replace('http', 'ws')}/ws/captions`);
      wsRef.current.onopen = () => console.log('Caption WS connected');
      wsRef.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'caption') {
          setCurrentCaption(data.text);
        }
      };
    } catch (error) {
      console.log('WebSocket not available');
    }
    
    return () => wsRef.current?.close();
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Fabrice', role: 'captions' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const sendCaption = async (text, notify = false) => {
    setCurrentCaption(text);
    
    // Add to history
    setHistory(prev => [{
      text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }, ...prev].slice(0, 20));
    
    // Log action
    await axios.post(`${API}/workspace/log`, {
      user: 'Fabrice',
      role: 'captions',
      action: 'caption_send',
      details: text.substring(0, 50)
    });
    
    // WebSocket or HTTP
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'caption', text }));
    }
    
    toast.success('Caption envoyée');

    // Notify Laurent if this is a live activation
    if (notify) {
      await sendNotification({
        sender: 'Fabrice',
        senderRole: 'captions',
        type: 'live_active',
        title: 'Régie live activée',
        message: `Écrans actifs: "${text}"`,
        target: 'laurent'
      });
    }
  };

  const activateLive = async () => {
    setIsLive(true);
    sendCaption('BIENVENUE À CULTURE CONNECT 2026', true);
    toast.success('Mode live activé - LC notifié');
  };

  const deactivateLive = () => {
    setIsLive(false);
    sendCaption('');
    toast.success('Mode live désactivé');
  };

  const setActiveCaption = (id) => {
    setCaptions(prev => prev.map(c => ({
      ...c,
      active: c.id === id
    })));
    const caption = captions.find(c => c.id === id);
    if (caption && caption.text) {
      sendCaption(caption.text);
    }
  };

  const sendArtiste = () => {
    if (!artisteEnCours) return;
    sendCaption(`SUR SCÈNE : ${artisteEnCours.toUpperCase()}`);
    setArtisteEnCours('');
  };

  const sendUrgent = async () => {
    if (!messageUrgent) return;
    const text = `⚠️ ${messageUrgent.toUpperCase()}`;
    sendCaption(text);
    
    // Always notify Laurent for urgent messages
    await sendNotification({
      sender: 'Fabrice',
      senderRole: 'captions',
      type: 'urgent_message',
      title: '⚠️ Message urgent diffusé',
      message: messageUrgent,
      target: 'laurent'
    });
    
    setMessageUrgent('');
    toast.success('Message urgent envoyé + LC notifié');
  };

  const toggleCaptation = (id) => {
    setCaptation(prev => prev.map(c => 
      c.id === id ? { ...c, checked: !c.checked, status: !c.checked ? 'OK' : 'En attente' } : c
    ));
  };

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header Fabrice - Spécial avec mode Live */}
      <header 
        className="sticky top-0 z-50 px-4 sm:px-6"
        style={{ 
          background: '#2A2820', 
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          {/* Identité */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm"
              style={{ background: COLORS.purple, color: '#fff', boxShadow: `0 2px 8px ${COLORS.purple}40` }}
            >
              FB
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm tracking-wide" style={{ color: COLORS.purple }}>FABRICE</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>CFA M.A.N.S - Régie Live</div>
            </div>
          </div>
          
          {/* Actions avec statut live */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Indicateur Live */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isLive ? 'animate-pulse' : ''}`}
              style={{ background: isLive ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', color: isLive ? COLORS.red : 'rgba(255,255,255,0.4)' }}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500' : 'bg-white/30'}`} />
              <span className="hidden sm:inline">{isLive ? 'EN DIRECT' : 'HORS LIGNE'}</span>
            </div>
            
            {/* Bouton Live */}
            {!isLive ? (
              <Button onClick={activateLive} size="sm" style={{ background: COLORS.red }}>
                <Play className="w-3.5 h-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Activer Live</span>
              </Button>
            ) : (
              <Button onClick={deactivateLive} size="sm" variant="outline" style={{ borderColor: COLORS.red, color: COLORS.red }}>
                <Pause className="w-3.5 h-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Arrêter</span>
              </Button>
            )}
            
            {/* Bouton CC2026 */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard-cc2026/fabrice')}
              className="hidden sm:flex items-center gap-2"
              style={CC2026_BUTTON}
              data-testid="dashboard-cc2026-link"
            >
              <Calendar className="w-3.5 h-3.5" />
              CC2026
            </Button>
            
            {/* Déconnexion */}
            <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.4)' }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.purple}30, transparent)` }} />
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 pb-20 sm:pb-6">
        {/* Current display preview */}
        <div className="rounded-lg p-4 sm:p-8 mb-4 sm:mb-6 text-center" style={{ background: '#000', border: `2px solid ${isLive ? COLORS.red : COLORS.purple}` }}>
          <div className="text-xs uppercase tracking-widest mb-2 sm:mb-4" style={{ color: isLive ? COLORS.red : COLORS.purple }}>
            <Monitor className="w-4 h-4 inline mr-2" />
            {isLive ? 'ÉCRAN EN DIRECT' : 'APERÇU ÉCRAN'}
          </div>
          <div className="text-xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", minHeight: '40px' }}>
            {currentCaption || 'Aucune caption active'}
          </div>
        </div>

        {/* Tabs - Scroll horizontal sur mobile */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {[
            { id: 'regie', label: 'Régie', fullLabel: 'Régie principale', icon: Monitor },
            { id: 'sequence', label: 'Séquence', fullLabel: 'Séquenceur', icon: Clock },
            { id: 'captation', label: 'Captation', fullLabel: 'Captation', icon: Camera },
            { id: 'photos', label: 'Photos', fullLabel: 'Photos', icon: Image }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap flex-shrink-0"
              style={{ 
                background: activeTab === tab.id ? COLORS.purple : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)'
              }}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.fullLabel}</span>
              <span className="sm:hidden text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {activeTab === 'regie' && (
            <>
              {/* Quick captions */}
              <div className="lg:col-span-2 rounded-lg p-4 sm:p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.purple}20` }}>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3 sm:mb-4" style={{ color: COLORS.purple }}>
                  Captions Rapides
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {captions.map(caption => (
                    <button
                      key={caption.id}
                      onClick={() => caption.text && setActiveCaption(caption.id)}
                      disabled={!caption.text}
                      className="flex items-center justify-between p-3 rounded-lg transition-all disabled:opacity-30"
                      style={{ 
                        background: caption.active ? `${COLORS.purple}30` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${caption.active ? COLORS.purple : 'rgba(255,255,255,0.1)'}`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${caption.active ? 'bg-green-400' : 'bg-white/20'}`} />
                        <span className="text-sm text-left" style={{ color: caption.active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                          {caption.text || `[${caption.type.toUpperCase()}]`}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                        {caption.type}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Artiste control */}
                <div className="mt-6 p-4 rounded-lg" style={{ background: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}30` }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.gold }}>Artiste en cours</h3>
                  <div className="flex gap-3">
                    <Input 
                      value={artisteEnCours}
                      onChange={(e) => setArtisteEnCours(e.target.value)}
                      placeholder="Nom de l'artiste..."
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    />
                    <Button onClick={sendArtiste} style={{ background: COLORS.gold, color: COLORS.charbon }}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Urgent message */}
                <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.red }}>
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Message Urgent
                  </h3>
                  <div className="flex gap-3">
                    <Input 
                      value={messageUrgent}
                      onChange={(e) => setMessageUrgent(e.target.value)}
                      placeholder="Message d'urgence..."
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,68,68,0.3)', color: '#fff' }}
                    />
                    <Button onClick={sendUrgent} style={{ background: COLORS.red }}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="lg:col-span-1 rounded-lg p-4 sm:p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.purple}20` }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.gold }}>
                  Historique
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Aucun envoi
                    </div>
                  ) : (
                    history.map((item, idx) => (
                      <div key={idx} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="text-xs font-bold" style={{ color: COLORS.gold }}>{item.time}</div>
                        <div className="text-sm text-white truncate">{item.text}</div>
                      </div>
                    ))
                  )}
                </div>
                
                <Button onClick={() => sendCaption('')} variant="outline" className="w-full mt-4" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  Effacer écran
                </Button>
              </div>
            </>
          )}

          {activeTab === 'sequence' && (
            <div className="lg:col-span-3 rounded-lg p-4 sm:p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.purple}20` }}>
              <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: COLORS.purple }}>Séquenceur d'écrans - 22 mai 2026</h2>
              <div className="space-y-2 sm:space-y-3">
                {sequence.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-lg sm:text-xl font-bold" style={{ color: COLORS.gold, minWidth: '60px' }}>{item.time}</div>
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.sent ? 'bg-green-400' : 'bg-white/20'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm sm:text-base">{item.artiste}</div>
                        <div className="text-xs sm:text-sm truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.text}</div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => sendCaption(item.text)}
                      style={{ background: item.sent ? 'rgba(255,255,255,0.1)' : COLORS.purple }}
                      className="w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0"
                    >
                      {item.sent ? 'Envoyé' : 'Envoyer'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'captation' && (
            <div className="lg:col-span-3 rounded-lg p-4 sm:p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.purple}20` }}>
              <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: COLORS.purple }}>Checklist Captation</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {captation.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleCaptation(item.id)}
                    className="flex items-center gap-3 p-4 rounded-lg transition-all"
                    style={{ background: item.checked ? `${COLORS.purple}20` : 'rgba(255,255,255,0.05)' }}
                  >
                    {item.checked ? (
                      <CheckSquare className="w-5 h-5" style={{ color: COLORS.purple }} />
                    ) : (
                      <Square className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    )}
                    <div className="flex-1 text-left">
                      <div className="text-white">{item.label}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === 'OK' ? 'bg-green-500/20 text-green-400' : 
                      item.status === 'En cours' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-white/10 text-white/40'
                    }`}>
                      {item.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="lg:col-span-3 rounded-lg p-4 sm:p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.purple}20` }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-base sm:text-lg font-bold" style={{ color: COLORS.purple }}>Photos officielles</h2>
                <Button style={{ background: COLORS.purple }} className="w-full sm:w-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload photo
                </Button>
              </div>
              <div className="border-2 border-dashed rounded-lg p-8 sm:p-12 text-center" style={{ borderColor: `${COLORS.purple}40` }}>
                <Camera className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" style={{ color: COLORS.purple }} />
                <p className="text-sm mb-3 sm:mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Uploadez les photos depuis le terrain
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Les photos seront automatiquement uploadées sur Cloudinary
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Internal Messaging */}
      <InternalMessaging 
        currentUser={{ id: 'fabrice', name: 'Fabrice', role: 'captions' }} 
        isFounder={false} 
      />
    </div>
  );
};

export default WorkspaceFabrice;
