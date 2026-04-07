import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, MessageSquare, Search, Send, CheckCheck, Bell, Star, MoreVertical } from "lucide-react";

export default function InboxView({ onBack, onSelect }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const messages = [
    { id: 1, user: "Ben ARRIS", lastMessage: "Le nouveau beat est prêt pour la session de demain.", time: "10:42", unread: 2, online: true, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" },
    { id: 2, user: "Kilti Maker", lastMessage: "Tu as vu les stats du Ti' Punch ?", time: "Hier", unread: 0, online: false, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100" },
    { id: 3, user: "Core Engine", lastMessage: "Mise à jour du protocole FREK terminée.", time: "Hier", unread: 0, online: true, avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100" },
    { id: 4, user: "Global Sound", lastMessage: "Proposition de collaboration pour Diaspora Rhythms.", time: "2 jours", unread: 0, online: false, avatar: "https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=100" },
  ];

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden" style={{ background: '#050505' }} data-testid="inbox-view">
      <header className="h-20 flex items-center justify-between px-6 backdrop-blur-xl z-50 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-4">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50] transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex flex-col">
            <span className="italic text-lg uppercase tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Messages</span>
            <span className="text-[7px] tracking-[0.3em] text-gray-500 uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Boîte de Réception Souveraine</span>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50] transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <Bell className="w-4 h-4" />
        </motion.button>
      </header>

      <main className="flex-1 overflow-hidden flex">
        <div className={`w-full lg:w-96 flex flex-col ${selectedChat ? 'hidden lg:flex' : 'flex'}`} style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Rechercher une conversation..." className="w-full bg-white/5 rounded-xl py-2.5 pl-12 pr-4 text-xs outline-none transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {messages.map((chat) => (
              <motion.div key={chat.id} whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }} onClick={() => setSelectedChat(chat.id)}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-all`}
                style={selectedChat === chat.id ? { background: 'rgba(242,202,80,0.05)', borderLeft: '2px solid #f2ca50' } : { borderLeft: '2px solid transparent' }}>
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={chat.avatar} alt={chat.user} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full" style={{ border: '2px solid #050505' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1"><span className="text-sm font-bold text-white truncate">{chat.user}</span><span className="text-[10px] text-gray-500">{chat.time}</span></div>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#f2ca50' }}><span className="text-[10px] font-bold text-black">{chat.unread}</span></div>}
              </motion.div>
            ))}
          </div>
        </div>

        <div className={`flex-1 flex flex-col bg-black/20 ${!selectedChat ? 'hidden lg:flex' : 'flex'}`}>
          {selectedChat ? (
            <>
              <div className="h-16 flex items-center justify-between px-6 bg-black/40" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedChat(null)} className="lg:hidden text-gray-400 mr-2"><ArrowLeft className="w-5 h-5" /></button>
                  <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={messages.find(m => m.id === selectedChat)?.avatar} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col"><span className="text-xs font-bold text-white">{messages.find(m => m.id === selectedChat)?.user}</span><span className="text-[9px] text-green-500 uppercase tracking-widest font-bold">En ligne</span></div>
                </div>
                <div className="flex items-center gap-4">
                  <Star className="w-4 h-4 text-gray-600 hover:text-[#f2ca50] cursor-pointer transition-colors" />
                  <MoreVertical className="w-4 h-4 text-gray-600 hover:text-white cursor-pointer transition-colors" />
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div className="flex flex-col gap-2 max-w-[80%]">
                  <div className="p-4 rounded-2xl rounded-tl-none bg-white/5 text-xs leading-relaxed" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Salut ! Tu as pu regarder le nouveau beat que j'ai envoyé ?</div>
                  <span className="text-[9px] text-gray-600 uppercase tracking-widest ml-1">10:40</span>
                </div>
                <div className="flex flex-col gap-2 max-w-[80%] ml-auto items-end">
                  <div className="p-4 rounded-2xl rounded-tr-none font-medium text-xs leading-relaxed" style={{ background: '#f2ca50', color: 'black' }}>Oui, c'est du lourd ! La basse est incroyable.</div>
                  <div className="flex items-center gap-1 mr-1"><span className="text-[9px] text-gray-600 uppercase tracking-widest">10:42</span><CheckCheck className="w-3 h-3" style={{ color: '#f2ca50' }} /></div>
                </div>
                <div className="flex flex-col gap-2 max-w-[80%]">
                  <div className="p-4 rounded-2xl rounded-tl-none bg-white/5 text-xs leading-relaxed" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Super ! On se voit demain au studio pour finaliser ?</div>
                  <span className="text-[9px] text-gray-600 uppercase tracking-widest ml-1">10:43</span>
                </div>
              </div>
              <div className="p-4 bg-black/40" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <input type="text" placeholder="Écrire un message..." className="flex-1 bg-white/5 rounded-xl py-3 px-4 text-xs outline-none transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: '#f2ca50', color: 'black', boxShadow: '0 4px 15px rgba(242,202,80,0.1)' }}>
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6"><MessageSquare className="w-10 h-10 text-gray-700" /></div>
              <h3 className="text-lg italic text-white mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>Sélectionnez une conversation</h3>
              <p className="text-sm text-gray-500 max-w-xs">Commencez à discuter avec vos collaborateurs et la communauté.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
