// ═══════════════════════════════════════════════════════════
// IMMERSIVE INBOX — Style Instagram DMs
// Design System: Sovereign Onyx · Material Symbols Only · NO LUCIDE
// Fullscreen experience with ghost conversations for proof of life
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

// Ghost conversation seeds for proof of life
const GHOST_CONVERSATIONS = [
  { id: 'ghost_simone', name: 'Simone Ogundimu', type: 'artist', status: 'online', lastMsg: 'Merci pour le retour sur ma composition ! On en reparle au CC2026.', time: '2m', unread: 2 },
  { id: 'ghost_mateo', name: 'Mateo Diop', type: 'label', status: 'online', lastMsg: "J'ai finalisé le contrat de distribution. Tu peux le consulter dans l'espace dédié.", time: '15m', unread: 1 },
  { id: 'ghost_chiamaka', name: 'Chiamaka Grandisson', type: 'institution', status: 'offline', lastMsg: "La subvention est validée. L'équipe de la préfecture sera présente le 20 mai.", time: '1h', unread: 0 },
  { id: 'ghost_diego', name: 'Diego Asante', type: 'press', status: 'online', lastMsg: "L'article sera publié demain matin. Tu veux relire avant ?", time: '3h', unread: 0 },
  { id: 'ghost_amara', name: 'Amara Césaire', type: 'booking_agency', status: 'offline', lastMsg: 'Booking confirmé pour le showcase du 21 mai. Loge VIP réservée.', time: '5h', unread: 0 },
  { id: 'ghost_yael', name: 'Yaël Fanon', type: 'artist', status: 'offline', lastMsg: 'Mon nouveau single sort vendredi. Tu fais un post de soutien ?', time: '1j', unread: 0 },
  { id: 'ghost_nadia', name: 'Nadia Glissant', type: 'label', status: 'offline', lastMsg: 'Les chiffres du streaming de Q4 sont impressionnants. Bravo !', time: '2j', unread: 0 },
];

const STATUS_COLORS = { online: '#4ADE80', offline: '#555' };
const TYPE_COLORS = { artist: '#C4714A', label: '#E8D5A0', booking_agency: '#2DD4BF', institution: '#4A5D4E', press: '#5B9BD5' };

const GHOST_MESSAGES = {
  ghost_simone: [
    { id: 'gs1', from: 'ghost_simone', content: 'Salut ! Tu as écouté le morceau que je t\'ai envoyé ?', time: '10:30' },
    { id: 'gs2', from: 'me', content: 'Oui c\'est magnifique ! Le pont en créole est sublime.', time: '10:35' },
    { id: 'gs3', from: 'ghost_simone', content: 'Merci pour le retour sur ma composition ! On en reparle au CC2026.', time: '10:42' },
  ],
  ghost_mateo: [
    { id: 'gm1', from: 'ghost_mateo', content: 'Hey ! J\'ai des nouvelles du contrat.', time: '09:15' },
    { id: 'gm2', from: 'me', content: 'Dis-moi tout !', time: '09:20' },
    { id: 'gm3', from: 'ghost_mateo', content: 'J\'ai finalisé le contrat de distribution. Tu peux le consulter dans l\'espace dédié.', time: '09:28' },
  ],
  ghost_chiamaka: [
    { id: 'gc1', from: 'ghost_chiamaka', content: 'Bonjour, je vous contacte au sujet de la demande de subvention CC2026.', time: 'Hier 14:00' },
    { id: 'gc2', from: 'me', content: 'Bonjour Chiamaka, merci. Le dossier est complet ?', time: 'Hier 14:15' },
    { id: 'gc3', from: 'ghost_chiamaka', content: 'La subvention est validée. L\'équipe de la préfecture sera présente le 20 mai.', time: 'Hier 16:30' },
  ],
};

const Avatar = ({ name, type, size = 48, status }) => {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const typeColor = TYPE_COLORS[type] || G;
  return (
    <div className="relative flex-shrink-0">
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size, height: size,
          background: `linear-gradient(135deg, ${typeColor}20, ${typeColor}08)`,
          border: `1.5px solid ${typeColor}30`,
        }}
      >
        <span style={{ fontSize: size * 0.35, fontWeight: 700, color: typeColor, fontFamily: "'Manrope', sans-serif" }}>{initials}</span>
      </div>
      {status && (
        <span
          className="absolute bottom-0 right-0 rounded-full"
          style={{ width: size * 0.25, height: size * 0.25, background: STATUS_COLORS[status], border: '2px solid #0a0a0b' }}
        />
      )}
    </div>
  );
};

const ImmersiveInbox = ({ session, isOpen, onClose }) => {
  const [conversations, setConversations] = useState(GHOST_CONVERSATIONS);
  const [activeConv, setActiveConv] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [entered, setEntered] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setEntered(true));
      // Load real conversations on top
      if (session?.id) {
        axios.get(`${API}/pro/messages/${session.id}`)
          .then(r => {
            const msgs = r.data.messages || [];
            const realConvos = {};
            msgs.forEach(m => {
              const otherId = m.from === session.id ? m.to : m.from;
              const otherName = m.from === session.id ? m.toName : m.fromName;
              if (!realConvos[otherId]) {
                realConvos[otherId] = { id: otherId, name: otherName || 'Utilisateur', type: 'other', status: 'online', lastMsg: '', time: '', unread: 0, isReal: true };
              }
              if (!m.read && m.to === session.id) realConvos[otherId].unread++;
              realConvos[otherId].lastMsg = m.content;
              realConvos[otherId].time = formatTimeShort(m.timestamp);
            });
            setConversations([...Object.values(realConvos), ...GHOST_CONVERSATIONS]);
          }).catch(() => {});
      }
    } else {
      setEntered(false);
    }
  }, [isOpen, session?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (activeConv) {
      // Load ghost messages or real messages
      if (activeConv.startsWith('ghost_')) {
        setChatMessages(GHOST_MESSAGES[activeConv] || []);
      } else if (session?.id) {
        axios.get(`${API}/pro/messages/${session.id}`)
          .then(r => {
            const msgs = (r.data.messages || []).filter(m => m.from === activeConv || m.to === activeConv);
            setChatMessages(msgs.map(m => ({
              id: m.id, from: m.from === session.id ? 'me' : m.from,
              content: m.content, time: formatTimeShort(m.timestamp), read: m.read,
            })));
          }).catch(() => {});
      }
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [activeConv, session?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { if (activeConv) setActiveConv(null); else onClose(); } };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, activeConv]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);

    const tempMsg = { id: `temp_${Date.now()}`, from: 'me', content: newMsg, time: 'maintenant' };
    setChatMessages(prev => [...prev, tempMsg]);
    setNewMsg('');

    if (!activeConv.startsWith('ghost_') && session?.id) {
      try {
        await axios.post(`${API}/pro/messages`, { from: session.id, to: activeConv, content: newMsg.trim() });
      } catch { toast.error("Erreur d'envoi"); }
    }

    // Ghost auto-reply after delay
    if (activeConv.startsWith('ghost_')) {
      const ghostReplies = [
        'Merci pour ce message ! Je te réponds dès que possible.',
        'Excellente idée, on en discute au CC2026 !',
        "C'est noté. Je reviens vers toi rapidement.",
        'Parfait, ça me convient. On avance ensemble.',
      ];
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: `ghost_reply_${Date.now()}`,
          from: activeConv,
          content: ghostReplies[Math.floor(Math.random() * ghostReplies.length)],
          time: 'maintenant',
        }]);
      }, 1500 + Math.random() * 2000);
    }

    setSending(false);
  };

  const filteredConvs = conversations.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const activeConversation = conversations.find(c => c.id === activeConv);

  if (!isOpen && !entered) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex"
      style={{ opacity: entered ? 1 : 0, transition: 'opacity 0.3s ease' }}
      data-testid="immersive-inbox"
    >
      {/* Full background */}
      <div className="absolute inset-0" style={{ background: '#0a0a0b' }} />

      {/* === CONVERSATIONS LIST === */}
      <div
        className={`relative flex flex-col ${activeConv ? 'hidden sm:flex' : 'flex'}`}
        style={{
          width: activeConv ? 360 : '100%',
          maxWidth: activeConv ? 360 : 480,
          borderRight: '1px solid rgba(75,70,59,0.12)',
          background: '#0a0a0b',
          transition: 'width 0.3s cubic-bezier(0.25,0.1,0.25,1)',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(75,70,59,0.1)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              data-testid="inbox-back-btn"
            >
              <span className="material-symbols-outlined" style={{ color: '#72727a', fontSize: 20 }}>arrow_back</span>
            </button>
            <div>
              <h1 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 22, fontWeight: 400, color: '#e5e2e3' }}>
                Messages
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,213,160,0.1)', color: G, fontSize: 10, fontWeight: 700, fontFamily: "'Manrope', sans-serif" }}>
                {totalUnread} nouveau{totalUnread > 1 ? 'x' : ''}
              </span>
            )}
            <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" data-testid="inbox-compose-btn">
              <span className="material-symbols-outlined" style={{ color: G, fontSize: 20 }}>edit_square</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#555', fontSize: 18 }}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une conversation..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
              style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.1)', color: '#e5e2e3', outline: 'none', fontFamily: "'Manrope', sans-serif" }}
              data-testid="inbox-search"
            />
          </div>
        </div>

        {/* Online now bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {conversations.filter(c => c.status === 'online').slice(0, 6).map(c => (
              <button
                key={c.id}
                onClick={() => setActiveConv(c.id)}
                className="flex flex-col items-center gap-1 flex-shrink-0 group"
              >
                <div className="relative">
                  <Avatar name={c.name} type={c.type} size={48} status="online" />
                  {c.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: G, color: '#3a2f09', fontSize: 8, fontWeight: 700 }}>
                      {c.unread}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-[56px]" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 600, color: '#72727a' }}>
                  {c.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map((conv, idx) => {
            const isActive = activeConv === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all hover:bg-white/[0.02]"
                style={{
                  background: isActive ? 'rgba(232,213,160,0.04)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${G}` : '3px solid transparent',
                  animation: `fadeSlideIn 0.3s cubic-bezier(0.2,0,0,1) both`,
                  animationDelay: `${idx * 30}ms`,
                }}
                data-testid={`inbox-conv-${conv.id}`}
              >
                <Avatar name={conv.name} type={conv.type} size={50} status={conv.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: conv.unread > 0 ? 700 : 500, color: conv.unread > 0 ? '#e5e2e3' : '#a0a0a5' }}>
                      {conv.name}
                    </span>
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: conv.unread > 0 ? G : '#555', flexShrink: 0, marginLeft: 8 }}>
                      {conv.time}
                    </span>
                  </div>
                  <p className="truncate mt-0.5" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: conv.unread > 0 ? '#a0a0a5' : '#555' }}>
                    {conv.lastMsg}
                  </p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: G, color: '#3a2f09', fontSize: 9, fontWeight: 700 }}>
                    {conv.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* === CHAT AREA === */}
      <div className={`relative flex-1 flex flex-col ${!activeConv ? 'hidden sm:flex' : 'flex'}`} style={{ background: '#0e0e0f' }}>
        {!activeConv ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(232,213,160,0.04)', border: '1px solid rgba(232,213,160,0.08)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: G, opacity: 0.4 }}>chat</span>
              </div>
              <p style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 18, color: '#72727a' }}>Sélectionnez une conversation</p>
              <p className="mt-1" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#555' }}>Vos messages apparaîtront ici</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div
              className="flex items-center gap-3 px-5 h-16 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(75,70,59,0.1)', background: 'rgba(14,14,15,0.95)', backdropFilter: 'blur(16px)' }}
            >
              <button
                onClick={() => setActiveConv(null)}
                className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5"
                data-testid="chat-back-btn"
              >
                <span className="material-symbols-outlined" style={{ color: '#72727a', fontSize: 20 }}>arrow_back</span>
              </button>
              <Avatar name={activeConversation?.name} type={activeConversation?.type} size={40} status={activeConversation?.status} />
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, color: '#e5e2e3' }}>{activeConversation?.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[activeConversation?.status] }} />
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#72727a' }}>
                    {activeConversation?.status === 'online' ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5" data-testid="chat-call-btn">
                  <span className="material-symbols-outlined" style={{ color: '#72727a', fontSize: 20 }}>call</span>
                </button>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5" data-testid="chat-video-btn">
                  <span className="material-symbols-outlined" style={{ color: '#72727a', fontSize: 20 }}>videocam</span>
                </button>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5" data-testid="chat-info-btn">
                  <span className="material-symbols-outlined" style={{ color: '#72727a', fontSize: 20 }}>info</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4" data-testid="inbox-chat-messages">
              {/* Date separator */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(75,70,59,0.1)' }} />
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>Aujourd'hui</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(75,70,59,0.1)' }} />
              </div>

              {chatMessages.map((msg) => {
                const isMine = msg.from === 'me';
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                    {!isMine && <Avatar name={activeConversation?.name} type={activeConversation?.type} size={28} />}
                    <div className={`max-w-[70%] ${!isMine ? 'ml-2' : ''}`}>
                      <div
                        className="px-4 py-3 text-sm leading-relaxed"
                        style={{
                          background: isMine ? 'linear-gradient(135deg, #E8D5A0, #d8c591)' : '#1c1b1c',
                          color: isMine ? '#3a2f09' : '#e5e2e3',
                          borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                        <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, color: '#555' }}>{msg.time}</span>
                        {isMine && (
                          <span className="material-symbols-outlined" style={{ fontSize: 12, color: msg.read ? G : '#555' }}>
                            {msg.read ? 'done_all' : 'done'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: '1px solid rgba(75,70,59,0.1)', background: 'rgba(14,14,15,0.95)' }}>
              {/* Quick actions */}
              <div className="flex items-center gap-1 mb-2">
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined" style={{ color: '#72727a', fontSize: 20 }}>add_circle</span>
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined" style={{ color: '#72727a', fontSize: 20 }}>image</span>
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined" style={{ color: '#72727a', fontSize: 20 }}>mic</span>
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined" style={{ color: '#72727a', fontSize: 20 }}>mood</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Écrivez un message..."
                  className="flex-1 px-4 py-3 rounded-2xl text-sm"
                  style={{ background: '#1c1b1c', border: '1px solid rgba(75,70,59,0.15)', color: '#e5e2e3', outline: 'none', fontFamily: "'Manrope', sans-serif" }}
                  data-testid="inbox-message-input"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMsg.trim() || sending}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                  style={{ background: newMsg.trim() ? G : '#2a2a2b' }}
                  data-testid="inbox-send-btn"
                >
                  <span className="material-symbols-outlined" style={{ color: newMsg.trim() ? '#3a2f09' : '#555', fontSize: 20 }}>send</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const formatTimeShort = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "à l'instant";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400000)}j`;
};

export default ImmersiveInbox;
