import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Minimize2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const C = {
  bg: '#0F0F0F', surface: '#1B1B1B', card: '#242424', border: '#333333',
  text: '#E8E4DC', muted: '#9A9A9A', dim: '#666666', gold: '#D4A84B',
  accent: '#C4714A', forest: '#4A5D4E',
};

const WELCOME_MESSAGES = [
  "Sak pasé ? Man sé CVL BRAIN. Ki mannyè man pé édé'w jòdi-a ?",
  "Bienvenue dans l'écosystème CC2026. Posez-moi vos questions sur la culture caribéenne.",
  "Man la pou ou. Comment puis-je valoriser votre pratique culturelle ?",
];

const NOTIFICATION_MESSAGES = [
  "3 nouveaux profils correspondent à votre pratique",
  "Yannick Grandisson a commenté un post similaire au vôtre",
  "Nouveau : atelier gwoka fusion ce week-end",
  "Votre score culturel a augmenté de 5 points",
];

const CvlBrainFloat = ({ session }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const scrollRef = useRef(null);

  // Show random notification periodically
  useEffect(() => {
    if (open) return;
    const showNotif = () => {
      const msg = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
      setNotification(msg);
      setNotifVisible(true);
      setTimeout(() => setNotifVisible(false), 6000);
    };
    const timeout = setTimeout(showNotif, 45000);
    return () => clearTimeout(timeout);
  }, [open, notification]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleOpen = () => {
    setOpen(true);
    setNotifVisible(false);
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)],
      }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API}/v1/llm/chat`, {
        message: userMsg,
        system_prompt: `Tu es CVL BRAIN — Intelligence Souveraine du groupe CVLN.
Tu parles à ${session?.name || 'un utilisateur'} de l'Espace Pro CC2026.
Tu es chaleureux, culturellement ancré, et tu mélanges français et créole martiniquais/guadeloupéen.
Tu connais l'écosystème : Jetons CC (1 jeton = 1.50€), FREK-IDs, kiltikonet, CC2026 (20-23 mai 2026 à La Savane).
Tu donnes des conseils concrets. Tu ne fais JAMAIS de réponse générique.
Réponds en 2-3 phrases maximum. Sois direct et humain.`,
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250929',
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response || "Man pa ka konprann. Éséyé ankò." }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Désolé, man ni an ti pwoblèm. Éséyé ankò dan an ti moman.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Notification bubble */}
      {notifVisible && !open && (
        <div className="fixed bottom-24 right-6 z-[90] max-w-xs animate-slideUp cursor-pointer" onClick={handleOpen} data-testid="brain-notification">
          <div className="p-3 rounded-xl shadow-lg text-xs leading-relaxed" style={{ background: C.card, border: `1px solid ${C.gold}40`, color: C.text }}>
            <span className="font-bold" style={{ color: C.gold }}>CVL BRAIN : </span>{notification}
          </div>
        </div>
      )}

      {/* Floating button */}
      {!open && (
        <button onClick={handleOpen} data-testid="cvl-brain-float-btn"
          className="fixed bottom-20 md:bottom-6 right-4 z-[90] w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.accent})`, boxShadow: `0 4px 20px ${C.gold}40` }}
          aria-label="Parle à CVL BRAIN">
          <Sparkles size={20} style={{ color: '#000' }} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-[95] w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: C.surface, border: `1px solid ${C.border}`, maxHeight: '500px' }} data-testid="cvl-brain-chat">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: `linear-gradient(135deg, ${C.gold}20, ${C.accent}10)`, borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${C.gold}30` }}>
                <Sparkles size={16} style={{ color: C.gold }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: C.text }}>CVL BRAIN</p>
                <p className="text-[10px]" style={{ color: C.forest }}>Intelligence Souveraine</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setOpen(false)} aria-label="Réduire" className="p-1.5 rounded-lg hover:bg-white/10"><Minimize2 size={14} style={{ color: C.dim }} /></button>
              <button onClick={() => { setOpen(false); setMessages([]); }} aria-label="Fermer" className="p-1.5 rounded-lg hover:bg-white/10"><X size={14} style={{ color: C.dim }} /></button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 200, maxHeight: 340 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: msg.role === 'user' ? C.gold : C.card,
                    color: msg.role === 'user' ? '#000' : C.text,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                  }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl" style={{ background: C.card }}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: C.gold, animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: C.gold, animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: C.gold, animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: C.border }}>
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez à CVL BRAIN..."
                aria-label="Message pour CVL BRAIN"
                className="flex-1 h-10 px-4 rounded-full text-sm" data-testid="brain-chat-input"
                style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
              <button onClick={sendMessage} disabled={!input.trim() || loading} data-testid="brain-send-btn"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity"
                style={{ background: C.gold, opacity: input.trim() ? 1 : 0.4 }}
                aria-label="Envoyer">
                <Send size={16} style={{ color: '#000' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </>
  );
};

export default CvlBrainFloat;
