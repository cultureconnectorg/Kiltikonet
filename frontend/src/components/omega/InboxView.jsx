import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, MessageSquare, Search, Send, CheckCheck, Bell, X, Loader2, Plus } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function InboxView({ onBack, onSelect, auth }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewConv, setShowNewConv] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [newFirstMsg, setNewFirstMsg] = useState("");
  const msgEndRef = useRef(null);
  const pollingRef = useRef(null);

  const userEmail = auth?.user?.email || '';

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/messages/conversations`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) { console.error("Conversations fetch error:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Polling 5s
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchConversations();
      if (selectedConv) fetchMessages(selectedConv);
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [fetchConversations, selectedConv]);

  // Fetch messages
  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`${API}/api/messages/${convId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
  };

  const openConversation = (convId) => {
    setSelectedConv(convId);
    fetchMessages(convId);
  };

  // Auto-scroll to bottom
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    setSendingMessage(true);
    const conv = conversations.find(c => c.conversation_id === selectedConv);
    const recipientEmail = conv?.other_email;
    if (!recipientEmail) return;

    try {
      const res = await fetch(`${API}/api/messages/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_email: recipientEmail, content: newMessage }),
        credentials: 'include',
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages(selectedConv);
        fetchConversations();
      }
    } catch {}
    finally { setSendingMessage(false); }
  };

  // Start new conversation
  const handleNewConversation = async () => {
    if (!newRecipient.trim() || !newFirstMsg.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`${API}/api/messages/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_email: newRecipient, content: newFirstMsg }),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setShowNewConv(false);
        setNewRecipient("");
        setNewFirstMsg("");
        fetchConversations();
        openConversation(data.conversation_id);
      }
    } catch {}
    finally { setSendingMessage(false); }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread || 0), 0);

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden" style={{ background: '#050505' }} data-testid="inbox-view">
      <header className="h-14 flex items-center justify-between px-5 backdrop-blur-xl z-50 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.6)' }}>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={selectedConv ? () => setSelectedConv(null) : onBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50]" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="inbox-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <span className="italic text-base uppercase tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>
              {selectedConv ? conversations.find(c => c.conversation_id === selectedConv)?.other_name || 'Messages' : 'Messages'}
            </span>
            {!selectedConv && totalUnread > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#f2ca50', color: 'black' }}>{totalUnread}</span>
            )}
          </div>
        </div>
        {!selectedConv && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowNewConv(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f2ca50', color: 'black' }} data-testid="new-conv-btn">
            <Plus className="w-4 h-4" />
          </motion.button>
        )}
      </header>

      {!selectedConv ? (
        /* Conversations list */
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#f2ca50]" /></div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
              <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">Aucune conversation</p>
              <p className="text-xs text-gray-700 mt-1">Commencez une discussion !</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <motion.div key={conv.conversation_id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }} onClick={() => openConversation(conv.conversation_id)} className="flex items-center gap-3 px-5 py-4 cursor-pointer border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }} data-testid={`conv-${conv.conversation_id}`}>
                <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: conv.other_avatar ? 'transparent' : 'linear-gradient(135deg, #f2ca50, #d4a84b)', color: 'black' }}>
                  {conv.other_avatar ? (
                    <img src={conv.other_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (conv.other_name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white truncate">{conv.other_name}</span>
                    <span className="text-[10px] text-gray-600 shrink-0">{conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                    {conv.unread > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: '#f2ca50', color: 'black' }}>{conv.unread}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        /* Messages view */
        <>
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {messages.map((msg) => {
              const isMine = msg.sender === userEmail;
              return (
                <div key={msg.message_id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%] px-4 py-2.5 rounded-2xl" style={{
                    background: isMine ? 'rgba(242,202,80,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isMine ? 'rgba(242,202,80,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    <p className="text-sm text-white">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-[9px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMine && msg.read && <CheckCheck className="w-3 h-3 text-[#f2ca50]" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={msgEndRef} />
          </div>
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="px-5 py-3 border-t flex gap-2 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Votre message..." className="flex-1 bg-white/5 text-sm px-4 py-2.5 rounded-xl outline-none text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="dm-input" />
            <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={sendingMessage} className="p-2.5 rounded-xl" style={{ background: '#f2ca50', color: 'black' }} data-testid="dm-send-btn">
              {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </motion.button>
          </form>
        </>
      )}

      {/* New Conversation Modal */}
      <AnimatePresence>
        {showNewConv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full rounded-t-3xl p-5" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)' }} data-testid="new-conv-modal">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold tracking-wider uppercase" style={{ color: '#f2ca50' }}>Nouvelle Conversation</span>
                <button onClick={() => setShowNewConv(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <input value={newRecipient} onChange={e => setNewRecipient(e.target.value)} placeholder="Email du destinataire..." className="w-full bg-white/5 text-sm px-4 py-2.5 rounded-xl outline-none text-white mb-3" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="new-conv-email" />
              <textarea value={newFirstMsg} onChange={e => setNewFirstMsg(e.target.value)} placeholder="Premier message..." rows={3} className="w-full bg-white/5 text-sm px-4 py-3 rounded-xl outline-none text-white resize-none mb-3" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="new-conv-message" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleNewConversation} disabled={sendingMessage || !newRecipient.trim() || !newFirstMsg.trim()} className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase" style={{ background: sendingMessage ? '#333' : '#f2ca50', color: 'black' }} data-testid="new-conv-send-btn">
                {sendingMessage ? 'Envoi...' : 'Envoyer'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
