import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Coins, ShieldCheck, ArrowUpRight, ArrowDownLeft, TrendingUp, Send, Download, RefreshCw, Plus, ChevronRight, Sparkles, CreditCard } from "lucide-react";

export default function WalletView({ onBack, onSelect, balance, setBalance, transactions, addTransaction, auth, adhesion }) {
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("assets");
  const [activeModal, setActiveModal] = useState(null);
  const [sendAmount, setSendAmount] = useState("");
  const [sendAddress, setSendAddress] = useState("");
  const [swapAmount, setSwapAmount] = useState("");

  const frekId = auth?.frekId || '';
  const kycValidated = false; // TODO: from user profile
  const plafondEur = 150;
  const currentEur = balance * 1.50;
  const plafondPct = Math.min((currentEur / plafondEur) * 100, 100);

  const PACKS = [
    { name: "Decouverte", jcc: 10, price: 10 },
    { name: "Culture", jcc: 25, price: 25 },
    { name: "Diaspora", jcc: 50, price: 50 },
    { name: "VIP", jcc: 100, price: 100 },
  ];

  const handleTopUp = async (packName) => {
    setIsTopUpLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/my-wallet/buy-pack`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_name: packName.toLowerCase() }), credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.checkout_url) {
          window.open(data.checkout_url, '_blank');
        } else {
          setBalance && setBalance(prev => prev);
          addTransaction({ type: "receive", label: `Pack ${packName}`, amount: `+JCC` });
        }
      }
    } catch (e) {} finally { setIsTopUpLoading(false); }
  };

  const handleSend = () => {
    const amount = parseFloat(sendAmount);
    if (amount > 0 && amount <= balance && sendAddress) {
      addTransaction({ type: "send", label: `Envoi vers ${sendAddress.slice(0, 6)}...`, amount: `-${amount} JCC` });
      setActiveModal(null); setSendAmount(""); setSendAddress("");
    }
  };

  const handleSwap = () => {
    const amount = parseFloat(swapAmount);
    if (amount > 0 && amount <= balance) {
      addTransaction({ type: "send", label: "Swap JCC -> EUR", amount: `-${amount} JCC` });
      setActiveModal(null); setSwapAmount("");
    }
  };

  const assets = [
    { name: "Jeton CC", symbol: "JCC", balance: balance, value: `${currentEur.toFixed(2)}EUR`, color: "text-[#f2ca50]" },
    { name: "Kilti Governance", symbol: "KGOV", balance: 150, value: "Voting Power", color: "text-blue-400" },
    { name: "Reputation Score", symbol: "REP", balance: 98, value: "Tier 1", color: "text-green-400" },
  ];

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden relative" style={{ background: '#050505' }} data-testid="wallet-view">
      <header className="h-16 flex items-center justify-between px-6 backdrop-blur-xl z-50 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-gray-400" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <span className="italic text-base uppercase tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Wallet</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-[7px] tracking-widest font-bold uppercase" style={{ color: 'rgba(242,202,80,0.8)' }}>Mainnet</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 pb-24">
        <div className="max-w-md mx-auto space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative aspect-[2/1] w-full rounded-[1.5rem] p-4 overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(to bottom right, #111, #0a0a0a, black)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 right-0 w-full h-full" style={{ background: 'radial-gradient(circle at top right, rgba(242,202,80,0.3) 0%, transparent 60%)' }} />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-[0.4em] font-bold" style={{ color: 'rgba(242,202,80,0.5)' }}>Sovereign Asset</span>
                  <span className="text-[7px] text-white/30 uppercase tracking-widest mt-0.5">Omega Protocol Active</span>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(242,202,80,0.1)', border: '1px solid rgba(242,202,80,0.2)' }}>
                  <CreditCard className="w-4 h-4" style={{ color: 'rgba(242,202,80,0.6)' }} />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white tracking-tighter tabular-nums">{balance}</span>
                  <span className="text-lg italic" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>JCC</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500 font-mono tracking-wider">= {currentEur.toFixed(2)} EUR</span>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <TrendingUp className="w-2 h-2 text-green-400" />
                    <span className="text-[7px] text-green-400 font-bold">+2.4%</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[7px] text-white/20 uppercase tracking-widest">Frek-ID Identity</span>
                  <span className="text-[9px] font-mono text-white/50 tracking-wider">{frekId || '—'}</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-4 bg-white/5 rounded-sm" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div className="w-6 h-4 rounded-sm" style={{ background: 'rgba(242,202,80,0.2)', border: '1px solid rgba(242,202,80,0.3)' }} />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "SEND", icon: Send, bg: "bg-white/5 text-white", action: () => setActiveModal("send") },
              { label: "RECEIVE", icon: Download, bg: "bg-white/5 text-white", action: () => setActiveModal("receive") },
              { label: "SWAP", icon: RefreshCw, bg: "bg-white/5 text-white", action: () => setActiveModal("swap") },
              { label: "TOP UP", icon: Plus, bg: "", action: () => setActiveModal("topup"), special: true }
            ].map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.button key={i} whileTap={{ scale: 0.92 }} onClick={a.action} disabled={isTopUpLoading && a.label === "TOP UP"}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all ${a.bg} ${isTopUpLoading && a.label === "TOP UP" ? "opacity-50" : ""}`}
                  style={a.special ? { background: '#f2ca50', color: 'black', border: '1px solid rgba(255,255,255,0.05)' } : { border: '1px solid rgba(255,255,255,0.05)' }}>
                  {isTopUpLoading && a.label === "TOP UP" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                  <span className="text-[7px] font-bold tracking-widest uppercase">{a.label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 px-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {["assets", "activity"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all relative ${activeTab === tab ? "text-[#f2ca50]" : "text-gray-500"}`}>
                  {tab}
                  {activeTab === tab && <motion.div layoutId="walletTab" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#f2ca50' }} />}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {activeTab === "assets" ? (
                <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  {assets.map((asset, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 flex items-center justify-between hover:bg-white/[0.08] transition-all" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          <Coins className={`w-3.5 h-3.5 ${asset.color}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white">{asset.name}</span>
                          <span className="text-[7px] text-gray-500 uppercase tracking-widest">{asset.symbol}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-bold text-white tabular-nums">{asset.balance}</div>
                        <div className="text-[7px] text-gray-500 uppercase tracking-widest">{asset.value}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  {transactions.length > 0 ? transactions.map((tx) => (
                    <div key={tx.id} className="p-3 rounded-xl bg-white/5 flex items-center gap-3 hover:bg-white/[0.08] transition-all" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'receive' ? 'bg-green-500/10 text-green-500' : 'text-[#f2ca50]'}`} style={tx.type !== 'receive' ? { background: 'rgba(242,202,80,0.1)' } : {}}>
                        {tx.type === 'receive' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-white truncate">{tx.label}</div>
                        <span className="text-[7px] text-gray-500 uppercase tracking-widest">{tx.date}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-[11px] font-mono font-bold ${tx.type === 'receive' ? 'text-green-400' : 'text-white'}`}>{tx.amount}</div>
                      </div>
                    </div>
                  )) : <div className="py-10 text-center text-gray-600 text-[10px] uppercase tracking-widest">Aucune activité</div>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div whileTap={{ scale: 0.98 }} onClick={() => onSelect("frek_id")} className="p-3 rounded-xl flex items-center justify-between group cursor-pointer" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.2)' }}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" style={{ color: '#f2ca50' }} />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Sovereign Security</span>
                <span className="text-[7px] uppercase tracking-tighter" style={{ color: 'rgba(242,202,80,0.6)' }}>Protocol Omega Active</span>
              </div>
            </div>
            <ChevronRight className="w-3 h-3 group-hover:text-[#f2ca50] transition-all" style={{ color: 'rgba(242,202,80,0.4)' }} />
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {activeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 space-y-6" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="italic text-xl uppercase tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>
                  {activeModal === "send" && "Envoyer JCC"}{activeModal === "receive" && "Recevoir JCC"}{activeModal === "swap" && "Swap JCC"}{activeModal === "topup" && "Acheter des JCC"}
                </h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-white"><Plus className="w-6 h-6 rotate-45" /></button>
              </div>
              {activeModal === "topup" && (
                <div className="space-y-3">
                  <p className="text-[9px] text-gray-400 tracking-wider">1 JCC = 1,50EUR de valeur faciale</p>
                  {!kycValidated && (
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
                      <div className="flex justify-between text-[8px] mb-1">
                        <span className="text-gray-400">Plafond reglementaire</span>
                        <span style={{ color: '#f2ca50' }}>{currentEur.toFixed(0)}EUR / {plafondEur}EUR</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${plafondPct}%`, background: plafondPct > 80 ? '#ef4444' : '#f2ca50' }} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {PACKS.map(p => (
                      <motion.button key={p.name} whileTap={{ scale: 0.95 }} onClick={() => handleTopUp(p.name)}
                        className="p-3 rounded-xl text-left" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest">{p.name}</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-lg font-bold" style={{ color: '#f2ca50' }}>{p.jcc}</span>
                          <span className="text-[9px] text-gray-400">JCC</span>
                        </div>
                        <span className="text-xs font-bold text-white">{p.price}EUR</span>
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-[7px] text-gray-600 text-center tracking-wider">Tes JCC n'expirent jamais — Rollover garanti</p>
                </div>
              )}
              {activeModal === "send" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] text-gray-500 uppercase tracking-widest">Adresse de destination</label>
                    <input type="text" value={sendAddress} onChange={e => setSendAddress(e.target.value)} placeholder="0x..." className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] text-gray-500 uppercase tracking-widest">Montant (JCC)</label>
                    <input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <button onClick={handleSend} className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]" style={{ background: '#f2ca50', color: 'black' }}>Confirmer l'envoi</button>
                </div>
              )}
              {activeModal === "receive" && (
                <div className="flex flex-col items-center space-y-6 py-4">
                  <div className="w-48 h-48 bg-white p-4 rounded-2xl"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=99421-MQ&color=000&bgcolor=fff" alt="QR Code" className="w-full h-full" /></div>
                  <div className="text-center space-y-2">
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest">Votre Adresse Kilti</span>
                    <div className="bg-white/5 rounded-xl p-3 font-mono text-[10px] select-all" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#f2ca50' }}>{frekId || 'Non connecte'}</div>
                  </div>
                </div>
              )}
              {activeModal === "swap" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex flex-col"><span className="text-[8px] text-gray-500 uppercase tracking-widest">De</span><span className="text-sm font-bold">JCC</span></div>
                    <input type="number" value={swapAmount} onChange={e => setSwapAmount(e.target.value)} placeholder="0.00" className="bg-transparent text-right text-sm font-bold outline-none w-24" />
                  </div>
                  <div className="flex justify-center"><RefreshCw className="w-5 h-5 rotate-90" style={{ color: '#f2ca50' }} /></div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex flex-col"><span className="text-[8px] text-gray-500 uppercase tracking-widest">Vers</span><span className="text-sm font-bold">EUR</span></div>
                    <span className="text-sm font-bold" style={{ color: '#f2ca50' }}>{(parseFloat(swapAmount || "0") * 1.50).toFixed(2)}EUR</span>
                  </div>
                  <button onClick={handleSwap} className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]" style={{ background: '#f2ca50', color: 'black' }}>Exécuter le Swap</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 p-4 z-50" style={{ background: 'linear-gradient(to top, black, rgba(0,0,0,0.8), transparent)' }}>
        <div className="max-w-md mx-auto">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveModal("topup")} disabled={isTopUpLoading}
            className="w-full py-3 rounded-xl font-bold tracking-[0.2em] text-[9px] uppercase flex items-center justify-center gap-2"
            style={{ background: '#f2ca50', color: 'black', boxShadow: '0 0 20px rgba(242,202,80,0.3)' }}>
            {isTopUpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-black" />}
            {isTopUpLoading ? "Processing..." : "Acheter des JCC"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
