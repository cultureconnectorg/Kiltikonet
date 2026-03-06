import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Send, 
  X, 
  Users, 
  Hash, 
  Bell, 
  BellOff,
  Paperclip,
  Image,
  FileText,
  ChevronDown,
  ChevronUp,
  Circle,
  Loader2,
  Check,
  CheckCheck,
  Smile
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const API = process.env.REACT_APP_BACKEND_URL || '';

// Canaux disponibles
const CHANNELS = [
  { id: 'general', name: 'Général', icon: Hash, color: '#C4714A' },
  { id: 'urgences', name: 'Urgences', icon: Bell, color: '#DC2626' },
  { id: 'logistique', name: 'Logistique', icon: Hash, color: '#059669' },
  { id: 'communication', name: 'Communication', icon: Hash, color: '#7C3AED' },
  { id: 'presse', name: 'Presse', icon: Hash, color: '#0891B2' },
];

// Liste des membres de l'équipe
const TEAM_MEMBERS = [
  { id: 'laurent', name: 'Laurent', role: 'founder', color: '#C4714A' },
  { id: 'twina', name: 'Twina', role: 'design', color: '#7C3AED' },
  { id: 'gwen', name: 'Gwen', role: 'event', color: '#059669' },
  { id: 'kaige', name: 'Kaige', role: 'press', color: '#0891B2' },
  { id: 'alirio', name: 'Alirio', role: 'business', color: '#F59E0B' },
  { id: 'wudy', name: 'Wudy', role: 'finance', color: '#EC4899' },
  { id: 'fabrice', name: 'Fabrice', role: 'captions', color: '#8B5CF6' },
  { id: 'analyst', name: 'Data Analyst', role: 'analyst', color: '#6B7280' },
];

const InternalMessaging = ({ currentUser, isFounder = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('channels'); // 'channels' | 'direct' | 'all' (founder only)
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [selectedDM, setSelectedDM] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const notificationSound = useRef(null);
  
  // Initialiser le son de notification
  useEffect(() => {
    notificationSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JgoN0bnJ3dYCKi4aDbm5vdHuCiYmEfXVybnR8g4iJg310cm11e4OHiIF8dnRyd32DiYZ/enZ0dHl+g4eGgHt2dXR3e4CFh4F9eHZ1dHl9gYSEf3x4dnV3en2Bg4J+e3d2dnh6foGCgH17eHd3eXt+gIGAfnt4d3d5e31/gH98enh4eHl7fX9/fnt5eHh5ent9fn58e3l4eXl6e31+fnx7eXl5eXp7fH19fHt6enl5ent7fHx8e3p6enp6ent7fHx7e3p6enp6ent7e3t7e3p6e3t6ent7e3t7e3p6');
  }, []);
  
  // Connexion WebSocket
  useEffect(() => {
    if (!currentUser) return;
    
    const wsUrl = API.replace('https://', 'wss://').replace('http://', 'ws://') + '/api/ws/chat';
    let reconnectTimeout = null;
    let isClosing = false;
    
    const connectWS = () => {
      if (isClosing) return;
      
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log('Chat WebSocket connected');
          // Attendre que la connexion soit vraiment prête avant d'envoyer
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'auth',
              user: currentUser.name,
              userId: currentUser.id || currentUser.name.toLowerCase(),
              role: currentUser.role
            }));
          }
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Traiter les messages inline
            switch (data.type) {
              case 'message':
                setMessages(prev => [...prev, data.message]);
                if (data.message.sender !== currentUser?.name && soundEnabled && !isOpen) {
                  if (notificationSound.current) {
                    notificationSound.current.play().catch(() => {});
                  }
                  setUnreadCount(prev => prev + 1);
                }
                break;
              case 'typing':
                setIsTyping(prev => ({
                  ...prev,
                  [data.userId]: data.isTyping
                }));
                break;
              case 'online_users':
                setOnlineUsers(data.users || []);
                break;
              case 'history':
                setMessages(data.messages || []);
                break;
              default:
                break;
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };
        
        wsRef.current.onclose = () => {
          console.log('Chat WebSocket disconnected');
          if (!isClosing) {
            reconnectTimeout = setTimeout(connectWS, 3000);
          }
        };
        
        wsRef.current.onerror = (error) => {
          console.log('Chat WebSocket error, will reconnect...');
        };
      } catch (e) {
        console.error('WebSocket connection error:', e);
        if (!isClosing) {
          reconnectTimeout = setTimeout(connectWS, 3000);
        }
      }
    };
    
    connectWS();
    
    return () => {
      isClosing = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser, soundEnabled, isOpen]);
  
  // Jouer le son de notification
  const playNotificationSound = () => {
    if (notificationSound.current && soundEnabled) {
      notificationSound.current.play().catch(() => {});
    }
  };
  
  // Scroll vers le bas des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Charger les messages du canal/DM sélectionné
  useEffect(() => {
    if (!isOpen) return;
    
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const endpoint = selectedDM 
          ? `${API}/api/chat/messages/dm/${selectedDM}`
          : `${API}/api/chat/messages/channel/${selectedChannel}`;
        
        const params = isFounder ? { include_all: true } : {};
        const response = await axios.get(endpoint, { params });
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
    setUnreadCount(0);
  }, [isOpen, selectedChannel, selectedDM, isFounder]);
  
  // Envoyer un message
  const sendMessage = async () => {
    if (!newMessage.trim() && !fileInputRef.current?.files?.length) return;
    
    const message = {
      id: Date.now().toString(),
      sender: currentUser.name,
      senderId: currentUser.id || currentUser.name.toLowerCase(),
      senderRole: currentUser.role,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      channel: selectedDM ? null : selectedChannel,
      dmTo: selectedDM || null,
      attachments: []
    };
    
    // Upload files if any
    if (fileInputRef.current?.files?.length) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        for (const file of fileInputRef.current.files) {
          formData.append('files', file);
        }
        
        const uploadResponse = await axios.post(`${API}/api/chat/upload`, formData);
        message.attachments = uploadResponse.data.files || [];
      } catch (error) {
        toast.error('Erreur lors de l\'upload');
      } finally {
        setIsUploading(false);
        fileInputRef.current.value = '';
      }
    }
    
    // Envoyer via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        message
      }));
    }
    
    // Aussi envoyer via API pour persistence
    try {
      await axios.post(`${API}/api/chat/messages`, message);
    } catch (error) {
      console.error('Error saving message:', error);
    }
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };
  
  // Indicateur "en train d'écrire"
  const handleTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        userId: currentUser.id || currentUser.name.toLowerCase(),
        userName: currentUser.name,
        channel: selectedDM ? null : selectedChannel,
        dmTo: selectedDM,
        isTyping: true
      }));
      
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        wsRef.current?.send(JSON.stringify({
          type: 'typing',
          userId: currentUser.id || currentUser.name.toLowerCase(),
          isTyping: false
        }));
      }, 2000);
    }
  };
  
  // Filtrer les messages
  const filteredMessages = messages.filter(msg => {
    if (isFounder && activeTab === 'all') return true;
    if (selectedDM) {
      return (msg.senderId === selectedDM && msg.dmTo === currentUser.name.toLowerCase()) ||
             (msg.senderId === currentUser.name.toLowerCase() && msg.dmTo === selectedDM);
    }
    return msg.channel === selectedChannel;
  });
  
  // Obtenir les indicateurs "en train d'écrire"
  const typingUsers = Object.entries(isTyping)
    .filter(([userId, typing]) => typing && userId !== currentUser?.id)
    .map(([userId]) => TEAM_MEMBERS.find(m => m.id === userId)?.name || userId);
  
  if (!currentUser) return null;
  
  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => { setIsOpen(true); setUnreadCount(0); }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-terracotta text-white shadow-lg flex items-center justify-center hover:bg-terracotta/90 transition-all ${isOpen ? 'hidden' : ''}`}
        data-testid="chat-toggle-button"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Fenêtre de chat */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 z-50 bg-charcoal border border-lightborder rounded-lg shadow-2xl flex flex-col transition-all ${isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'}`}
          data-testid="chat-window"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-lightborder bg-charcoal/80 rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-terracotta" />
              <span className="font-semibold text-paper">Messages</span>
              <span className="text-xs text-paper/50">({onlineUsers.length} en ligne)</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 hover:bg-white/10 rounded"
                title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
              >
                {soundEnabled ? <Bell className="w-4 h-4 text-paper/70" /> : <BellOff className="w-4 h-4 text-paper/50" />}
              </button>
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/10 rounded"
              >
                {isMinimized ? <ChevronUp className="w-4 h-4 text-paper/70" /> : <ChevronDown className="w-4 h-4 text-paper/70" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4 text-paper/70" />
              </button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-lightborder">
                <button
                  onClick={() => { setActiveTab('channels'); setSelectedDM(null); }}
                  className={`flex-1 py-2 text-sm font-medium ${activeTab === 'channels' ? 'text-terracotta border-b-2 border-terracotta' : 'text-paper/60 hover:text-paper'}`}
                >
                  <Hash className="w-4 h-4 inline mr-1" />
                  Canaux
                </button>
                <button
                  onClick={() => { setActiveTab('direct'); setSelectedChannel(null); }}
                  className={`flex-1 py-2 text-sm font-medium ${activeTab === 'direct' ? 'text-terracotta border-b-2 border-terracotta' : 'text-paper/60 hover:text-paper'}`}
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  Direct
                </button>
                {isFounder && (
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-2 text-sm font-medium ${activeTab === 'all' ? 'text-terracotta border-b-2 border-terracotta' : 'text-paper/60 hover:text-paper'}`}
                  >
                    Tout voir
                  </button>
                )}
              </div>
              
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Canaux ou Contacts */}
                <div className="w-28 border-r border-lightborder overflow-y-auto bg-charcoal/50">
                  {activeTab === 'channels' && CHANNELS.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`w-full px-2 py-2 text-left text-xs flex items-center gap-1 hover:bg-white/5 ${selectedChannel === channel.id ? 'bg-white/10 text-terracotta' : 'text-paper/70'}`}
                    >
                      <channel.icon className="w-3 h-3" style={{ color: channel.color }} />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  ))}
                  
                  {activeTab === 'direct' && TEAM_MEMBERS.filter(m => m.id !== currentUser?.id?.toLowerCase() && m.id !== currentUser?.name?.toLowerCase()).map(member => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedDM(member.id)}
                      className={`w-full px-2 py-2 text-left text-xs flex items-center gap-1 hover:bg-white/5 ${selectedDM === member.id ? 'bg-white/10 text-terracotta' : 'text-paper/70'}`}
                    >
                      <Circle 
                        className={`w-2 h-2 ${onlineUsers.includes(member.id) ? 'text-green-500 fill-green-500' : 'text-gray-500'}`} 
                      />
                      <span className="truncate">{member.name}</span>
                    </button>
                  ))}
                  
                  {activeTab === 'all' && isFounder && (
                    <div className="p-2 text-xs text-paper/50 text-center">
                      Tous les messages
                    </div>
                  )}
                </div>
                
                {/* Zone de messages */}
                <div className="flex-1 flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-terracotta animate-spin" />
                      </div>
                    ) : filteredMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-paper/50 text-sm">
                        Aucun message
                      </div>
                    ) : (
                      filteredMessages.map((msg, idx) => (
                        <div 
                          key={msg.id || idx}
                          className={`flex flex-col ${msg.senderId === currentUser?.id || msg.sender === currentUser?.name ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-medium" style={{ color: TEAM_MEMBERS.find(m => m.id === msg.senderId)?.color || '#C4714A' }}>
                              {msg.sender}
                            </span>
                            {msg.channel && (
                              <span className="text-xs text-paper/40">
                                dans #{msg.channel}
                              </span>
                            )}
                            {msg.dmTo && (
                              <span className="text-xs text-paper/40">
                                → {TEAM_MEMBERS.find(m => m.id === msg.dmTo)?.name || msg.dmTo}
                              </span>
                            )}
                          </div>
                          <div 
                            className={`max-w-[220px] px-3 py-2 rounded-lg text-sm ${
                              msg.senderId === currentUser?.id || msg.sender === currentUser?.name
                                ? 'bg-terracotta text-white'
                                : 'bg-white/10 text-paper'
                            }`}
                          >
                            {msg.content}
                            {msg.attachments?.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {msg.attachments.map((att, i) => (
                                  <a 
                                    key={i}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs underline"
                                  >
                                    {att.type?.includes('image') ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                    {att.name}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-paper/40 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Indicateur "en train d'écrire" */}
                  {typingUsers.length > 0 && (
                    <div className="px-3 py-1 text-xs text-paper/50 italic">
                      {typingUsers.join(', ')} {typingUsers.length > 1 ? 'écrivent' : 'écrit'}...
                    </div>
                  )}
                  
                  {/* Input */}
                  <div className="p-3 border-t border-lightborder">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,.pdf"
                        className="hidden"
                        multiple
                        onChange={() => {}}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 hover:bg-white/10 rounded text-paper/70"
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                      </button>
                      <Input
                        value={newMessage}
                        onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Votre message..."
                        className="flex-1 bg-white/5 border-lightborder text-paper text-sm"
                      />
                      <Button
                        onClick={sendMessage}
                        size="sm"
                        className="bg-terracotta hover:bg-terracotta/90"
                        disabled={!newMessage.trim() && !fileInputRef.current?.files?.length}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default InternalMessaging;
