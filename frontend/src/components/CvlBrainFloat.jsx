import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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

const CvlBrainFloat = ({ session, externalOpen, onExternalClose }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const scrollRef = useRef(null);

  // Sync with external open state (from bottom nav Brain tab)
  useEffect(() => {
    if (externalOpen && !open) {
      handleOpen();
    }
  }, [externalOpen]);

  const handleClose = () => {
    setOpen(false);
    if (onExternalClose) onExternalClose();
  };

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
        <div className="fixed bottom-28 right-6 z-[90] max-w-xs animate-slideUp cursor-pointer" onClick={handleOpen} data-testid="brain-notification">
          <div className="p-3 rounded-2xl text-xs leading-relaxed" style={{ background: '#1b1b1c', boxShadow: '0 12px 48px rgba(0,0,0,0.6)', color: '#e5e2e3' }}>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: '#E8D5A0' }}>CVL BRAIN : </span>
            <span style={{ fontFamily: "'Manrope', sans-serif" }}>{notification}</span>
          </div>
        </div>
      )}

      {/* Floating button — Sovereign glow */}
      {!open && (
        <button onClick={handleOpen} data-testid="cvl-brain-float-btn"
          className="fixed bottom-24 md:bottom-6 right-4 z-[90] w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{
            background: 'rgba(232,213,160,0.12)',
            boxShadow: '0 0 32px rgba(232,213,160,0.15), 0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
          }}
          aria-label="Parle à CVL BRAIN">
          <span className="material-symbols-outlined" style={{ color: '#E8D5A0', fontSize: 26, fontVariationSettings: "'FILL' 0, 'wght' 300" }}>psychology</span>
        </button>
      )}

      {/* Chat panel — Sovereign Onyx */}
      {open && (
        <div className="fixed bottom-24 md:bottom-6 right-4 z-[95] w-[340px] sm:w-96 rounded-3xl overflow-hidden flex flex-col"
          style={{ background: '#131314', boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(232,213,160,0.05)', maxHeight: '520px' }}
          data-testid="cvl-brain-chat">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: 'rgba(232,213,160,0.03)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,213,160,0.08)' }}>
                <span className="material-symbols-outlined" style={{ color: '#E8D5A0', fontSize: 20, fontVariationSettings: "'FILL' 0, 'wght' 300" }}>psychology</span>
              </div>
              <div>
                <p style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 16, fontWeight: 400, color: '#e5e2e3' }}>CVL BRAIN</p>
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5D4E' }}>Intelligence Souveraine</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={handleClose} aria-label="Réduire" className="p-2 rounded-lg hover:bg-white/5">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#555' }}>remove</span>
              </button>
              <button onClick={() => { handleClose(); setMessages([]); }} aria-label="Fermer" className="p-2 rounded-lg hover:bg-white/5">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#555' }}>close</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 200, maxHeight: 360 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-4 py-3 rounded-2xl leading-relaxed"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 13,
                    background: msg.role === 'user' ? '#E8D5A0' : '#1b1b1c',
                    color: msg.role === 'user' ? '#0a0a0b' : '#e5e2e3',
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 20,
                    borderBottomLeftRadius: msg.role === 'user' ? 20 : 4,
                  }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl" style={{ background: '#1b1b1c' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#E8D5A0', animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#E8D5A0', animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#E8D5A0', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input — Sovereign style */}
          <div className="px-4 pb-4 pt-2">
            <div className="flex gap-2 items-center rounded-full px-1" style={{ background: '#1b1b1c' }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez à CVL BRAIN..."
                aria-label="Message pour CVL BRAIN"
                className="flex-1 h-11 px-4 rounded-full text-sm" data-testid="brain-chat-input"
                style={{ background: 'transparent', border: 'none', color: '#e5e2e3', outline: 'none', fontFamily: "'Manrope', sans-serif" }} />
              <button onClick={sendMessage} disabled={!input.trim() || loading} data-testid="brain-send-btn"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: input.trim() ? '#E8D5A0' : 'transparent', opacity: input.trim() ? 1 : 0.3 }}
                aria-label="Envoyer">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: input.trim() ? '#0a0a0b' : '#555' }}>send</span>
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
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.2,0,0,1); }
      `}</style>
    </>
  );
};

export default CvlBrainFloat;
