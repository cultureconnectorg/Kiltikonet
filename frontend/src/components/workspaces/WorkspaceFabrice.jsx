import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Monitor, Send, Play, Pause, Volume2, VolumeX, Edit2, Trash2, Plus, Clock, RefreshCw } from 'lucide-react';
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
  purple: '#9C27B0'
};

const WorkspaceFabrice = () => {
  const navigate = useNavigate();
  const [currentCaption, setCurrentCaption] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [captions, setCaptions] = useState([
    { id: 1, text: 'BIENVENUE A CULTURE CONNECT 2026', type: 'annonce', active: false },
    { id: 2, text: 'PROCHAINEMENT SUR SCENE...', type: 'transition', active: false },
    { id: 3, text: '', type: 'artiste', active: false },
    { id: 4, text: 'MERCI A NOS PARTENAIRES', type: 'sponsors', active: false }
  ]);
  const [artisteEnCours, setArtisteEnCours] = useState('');
  const [messageUrgent, setMessageUrgent] = useState('');
  const wsRef = useRef(null);

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Fabrice',
      role: 'captions',
      action: 'view',
      details: 'Acces workspace captions'
    });
    
    // Try to connect to WebSocket for live captions
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
      console.log('WebSocket not available, using HTTP fallback');
    }
    
    return () => wsRef.current?.close();
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Fabrice', role: 'captions' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const sendCaption = async (text) => {
    setCurrentCaption(text);
    
    // Log the action
    await axios.post(`${API}/workspace/log`, {
      user: 'Fabrice',
      role: 'captions',
      action: 'caption_send',
      details: text.substring(0, 30)
    });
    
    // Try WebSocket first, fallback to HTTP
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'caption', text }));
    } else {
      // HTTP fallback
      try {
        await axios.post(`${API}/captions/broadcast`, { text });
      } catch (error) {
        console.log('Caption sent locally');
      }
    }
    
    toast.success('Caption diffusee');
  };

  const setActiveCaption = (id) => {
    setCaptions(prev => prev.map(c => ({
      ...c,
      active: c.id === id
    })));
    const caption = captions.find(c => c.id === id);
    if (caption) {
      sendCaption(caption.text);
    }
  };

  const sendArtiste = () => {
    if (!artisteEnCours) return;
    sendCaption(`SUR SCENE : ${artisteEnCours.toUpperCase()}`);
  };

  const sendUrgent = () => {
    if (!messageUrgent) return;
    sendCaption(`⚠️ ${messageUrgent.toUpperCase()}`);
    setMessageUrgent('');
  };

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.purple}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: COLORS.purple, color: '#fff' }}>
              FB
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: COLORS.purple }}>FABRICE</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>CFA M.A.N.S - Captions Live</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isLive ? 'animate-pulse' : ''}`}
              style={{ background: isLive ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', color: isLive ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500' : 'bg-white/30'}`} />
              {isLive ? 'EN DIRECT' : 'HORS LIGNE'}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsLive(!isLive)} style={{ color: isLive ? '#ef4444' : COLORS.purple }}>
              {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Current display preview */}
        <div className="rounded-lg p-8 mb-6 text-center" style={{ background: '#000', border: `2px solid ${COLORS.purple}` }}>
          <div className="text-xs uppercase tracking-widest mb-4" style={{ color: COLORS.purple }}>
            <Monitor className="w-4 h-4 inline mr-2" />
            APERCU ECRAN
          </div>
          <div className="text-3xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", minHeight: '60px' }}>
            {currentCaption || 'Aucune caption active'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Quick captions */}
          <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.purple}20` }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.purple }}>
              Captions Rapides
            </h2>
            <div className="space-y-2">
              {captions.map(caption => (
                <button
                  key={caption.id}
                  onClick={() => setActiveCaption(caption.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg transition-all"
                  style={{ 
                    background: caption.active ? `${COLORS.purple}30` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${caption.active ? COLORS.purple : 'rgba(255,255,255,0.1)'}`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${caption.active ? 'bg-green-400' : 'bg-white/20'}`} />
                    <span className="text-sm" style={{ color: caption.active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                      {caption.text || `[${caption.type.toUpperCase()}]`}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                    {caption.type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Artiste controls */}
          <div className="space-y-4">
            <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.gold }}>
                Artiste en cours
              </h2>
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

            <div className="rounded-lg p-5" style={{ background: '#2A2820', border: '1px solid rgba(239,68,68,0.3)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#ef4444' }}>
                Message Urgent
              </h2>
              <div className="flex gap-3">
                <Input 
                  value={messageUrgent}
                  onChange={(e) => setMessageUrgent(e.target.value)}
                  placeholder="Message d'urgence..."
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,68,68,0.3)', color: '#fff' }}
                />
                <Button onClick={sendUrgent} style={{ background: '#ef4444' }}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.terracotta }}>
                Controles
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => sendCaption('')} variant="outline" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  Effacer ecran
                </Button>
                <Button onClick={() => sendCaption('PAUSE - DE RETOUR DANS QUELQUES INSTANTS')} style={{ background: COLORS.terracotta }}>
                  Pause
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkspaceFabrice;
