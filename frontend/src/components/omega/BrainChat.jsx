import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, ArrowLeft, ShieldCheck, Sparkles, Paperclip, Plus, MessageSquare, History, Copy, RotateCcw, ThumbsUp, ThumbsDown, PanelLeftClose, PanelLeftOpen, Terminal, Layout, Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useBrain } from "../../hooks/useBrain";

export default function BrainChat({ onBack, onSelect, balance, auth }) {
  const { messages: brainMessages, isThinking, error, send, reset, sessionId } = useBrain();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [useWeb, setUseWeb] = useState(false);
  const messagesEndRef = useRef(null);

  // Transform brain messages for display
  const messages = brainMessages.map((m, i) => ({
    id: i.toString(),
    role: m.role,
    content: m.content,
    timestamp: i === 0 ? "Session" : "Maintenant",
    meta: m.meta,
  }));

  const history = [
    { id: "h1", title: "Session actuelle", date: "Maintenant" },
  ];

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages, isThinking]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isThinking) return;
    const text = input;
    setInput("");
    await send(text, {
      useWeb,
      userName: auth?.userName || 'utilisateur',
      userContext: auth?.user ? { email: auth.user.email } : null,
      langue: 'fr',
      frekId: auth?.frekId || '',
    });
  }, [input, isThinking, send, useWeb, auth]);

  return (
    <div className="flex h-screen w-full overflow-hidden text-white" style={{ background: '#0a0a0b' }} data-testid="brain-chat">
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="h-full flex flex-col z-40" style={{ background: '#0d0d0e', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="p-4 flex flex-col h-full">
              <button onClick={reset} className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all mb-6" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <Plus className="w-4 h-4" style={{ color: '#f2ca50' }} />
                <span className="text-xs font-bold tracking-widest uppercase">Nouveau Chat</span>
              </button>
              <div className="flex-1 overflow-y-auto space-y-1">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest px-3 mb-2">Historique</div>
                {history.map((item) => (
                  <button key={item.id} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5 transition-all text-left group">
                    <MessageSquare className="w-4 h-4 text-gray-600 group-hover:text-[#f2ca50] transition-colors" />
                    <div className="flex-1 truncate">
                      <div className="text-xs text-gray-300 truncate">{item.title}</div>
                      <div className="text-[8px] text-gray-600 uppercase mt-0.5">{item.date}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-auto pt-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5 transition-all text-left">
                  <History className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-400">Activité Récente</span>
                </button>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] uppercase tracking-widest" style={{ color: '#f2ca50' }}>Plan Pro</span>
                    <Sparkles className="w-3 h-3" style={{ color: '#f2ca50' }} />
                  </div>
                  <div className="text-[10px]" style={{ color: 'rgba(242,202,80,0.8)' }}>Accès illimité au Core Engine v2.4</div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col relative h-full min-w-0">
        <header className="h-16 flex items-center justify-between px-6 backdrop-blur-xl z-30 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-all">
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-gray-400" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <div className="flex flex-col">
              <span className="italic text-base" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>CVL BRAIN</span>
              <span className="font-mono text-[7px] tracking-[0.2em] text-gray-500 uppercase">Claude 3.5 Sonnet · Core Engine</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} onClick={() => onSelect("wallet")} className="flex items-center gap-1.5 rounded-full px-3 py-1 cursor-pointer" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#f2ca50' }} />
              <span className="font-mono text-[9px] font-bold" style={{ color: 'rgba(242,202,80,0.8)' }}>{balance} JCC</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} onClick={() => onSelect("frek_id")} className="flex items-center gap-1.5 rounded-full px-3 py-1 cursor-pointer" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
              <span className="font-mono text-[9px] font-bold uppercase" style={{ color: 'rgba(242,202,80,0.8)' }}>{auth?.frekId || '---'}</span>
            </motion.div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-6 ${msg.role === "assistant" ? "items-start" : "items-start flex-row-reverse"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${msg.role === "assistant" ? "text-[#f2ca50]" : "text-white"}`} style={{ background: msg.role === "assistant" ? 'rgba(242,202,80,0.1)' : 'rgba(255,255,255,0.1)', border: msg.role === "assistant" ? '1px solid rgba(242,202,80,0.2)' : '1px solid rgba(255,255,255,0.1)' }}>
                  {msg.role === "assistant" ? <Sparkles className="w-4 h-4" /> : <div className="text-[10px] font-bold">BA</div>}
                </div>
                <div className={`flex-1 min-w-0 space-y-2 ${msg.role === "user" ? "text-right" : ""}`}>
                  <div className={`inline-block text-sm leading-relaxed max-w-full text-left ${msg.role === "user" ? "bg-white/5 p-4 rounded-2xl rounded-tr-none" : ""}`} style={msg.role === "user" ? { border: '1px solid rgba(255,255,255,0.1)' } : {}}>
                    <div className="omega-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}
                        components={{
                          code({ inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            return !inline && match ? (
                              <div className="relative group my-4">
                                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-gray-400"><Copy className="w-3 h-3" /></button>
                                </div>
                                <SyntaxHighlighter style={atomDark} language={match[1]} PreTag="div" className="rounded-xl !bg-black/40 !border !border-white/10 !p-4" {...props}>
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs" style={{ color: '#f2ca50' }} {...props}>{children}</code>
                            );
                          },
                          table({ children }) { return (<div className="overflow-x-auto my-4"><table className="w-full border-collapse text-xs" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>{children}</table></div>); },
                          th({ children }) { return <th className="p-2 bg-white/5 uppercase font-bold" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#f2ca50' }}>{children}</th>; },
                          td({ children }) { return <td className="p-2" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>{children}</td>; }
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isThinking && !messages.some(m => m.isStreaming) && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-6 items-start">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(242,202,80,0.1)', color: '#f2ca50', border: '1px solid rgba(242,202,80,0.2)' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Sparkles className="w-4 h-4" /></motion.div>
                </div>
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex gap-1">
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full" style={{ background: '#f2ca50' }} />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full" style={{ background: '#f2ca50' }} />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full" style={{ background: '#f2ca50' }} />
                  </div>
                  <span className="text-[8px] uppercase tracking-widest font-bold" style={{ color: 'rgba(242,202,80,0.4)' }}>Le Core Engine analyse...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="p-6 shrink-0">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative rounded-2xl p-2 focus-within:border-[rgba(242,202,80,0.3)] transition-all shadow-2xl" style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.1)' }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Posez une question au CVL Brain..." className="w-full bg-transparent border-none outline-none px-4 py-3 text-sm text-white placeholder-gray-600 resize-none min-h-[60px] max-h-48" />
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-all"><Paperclip className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-all"><Globe className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-all"><Layout className="w-4 h-4" /></button>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSend} disabled={!input.trim() || isThinking}
                  className="p-2.5 rounded-xl transition-all"
                  style={input.trim() && !isThinking ? { background: '#f2ca50', color: 'black', boxShadow: '0 0 15px rgba(242,202,80,0.3)' } : { background: 'rgba(255,255,255,0.05)', color: 'rgb(75,85,99)' }}>
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-[9px] text-gray-600 uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 opacity-50" /><span>Souveraineté Active</span></div>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <span>1 JCC par requête</span>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <div className="flex items-center gap-1.5"><Terminal className="w-3 h-3 opacity-50" /><span>Core v2.4</span></div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
