import { motion } from "motion/react";
import { Wallet, Zap, Wrench, Gauge, ShoppingCart, MessageSquare, Coins } from "lucide-react";

export default function OrbitalMenu({ onSelect, balance, frekId }) {
  const menuItems = [
    { id: "wallet", label: "WALLET", icon: Wallet, pos: "top-0 left-0 translate-x-[40px] translate-y-[40px]" },
    { id: "shop", label: "SHOP", icon: ShoppingCart, pos: "top-0 right-0 -translate-x-[40px] translate-y-[40px]" },
    { id: "feed", label: "FEED", icon: Zap, pos: "top-1/2 left-0 -translate-x-[20px] -translate-y-1/2" },
    { id: "inbox", label: "INBOX", icon: MessageSquare, pos: "top-1/2 right-0 translate-x-[20px] -translate-y-1/2" },
    { id: "build", label: "BUILD", icon: Wrench, pos: "bottom-0 left-0 translate-x-[40px] -translate-y-[40px]" },
    { id: "cockpit", label: "COCKPIT", icon: Gauge, pos: "bottom-0 right-0 -translate-x-[40px] -translate-y-[40px]" },
  ];

  return (
    <div className="relative h-screen w-full flex items-center justify-center z-10 p-4" data-testid="orbital-menu">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-20" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }} data-testid="omega-header">
        <div className="italic text-2xl tracking-wider cursor-default" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50', textShadow: '0 2px 8px rgba(242,202,80,0.3)' }}>
          Kiltikonet
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05, borderColor: "rgba(242, 202, 80, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("wallet")}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 cursor-pointer transition-all"
            style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}
            data-testid="omega-jcc-badge"
          >
            <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#f2ca50', boxShadow: '0 0 8px #f2ca50' }} />
            <span className="font-mono text-[9px] tracking-widest font-bold" style={{ color: 'rgba(242,202,80,0.8)' }}>{balance ?? 0} JCC</span>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, borderColor: "rgba(242, 202, 80, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("frek_id")}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 cursor-pointer transition-all"
            style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}
            data-testid="omega-frek-badge"
          >
            <span className="font-mono text-[9px] tracking-widest font-bold uppercase" style={{ color: 'rgba(242,202,80,0.8)' }}>FREK-ID: {frekId || '—'}</span>
          </motion.div>
        </div>
      </header>

      {/* Orbital Path Visual — Double ring for depth */}
      <div className="absolute w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full pointer-events-none" style={{ border: '1px solid rgba(242,202,80,0.3)' }} data-testid="orbital-ring" />
      <div className="absolute w-[360px] h-[360px] sm:w-[410px] sm:h-[410px] rounded-full pointer-events-none" style={{ border: '1px solid rgba(242,202,80,0.1)' }} data-testid="orbital-ring-outer" />

      {/* Rotating Menu */}
      <div className="absolute w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] omega-animate-orbit flex items-center justify-center">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
              className={`absolute flex flex-col items-center gap-2 group cursor-pointer omega-animate-counter-orbit z-20 ${item.pos}`}
              onClick={() => onSelect(item.id)}
              data-testid={`orbital-item-${item.id}`}
            >
              <motion.div
                whileHover={{ scale: 1.1, borderColor: "rgba(242, 202, 80, 0.6)" }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full omega-glass flex items-center justify-center shadow-lg transition-all"
                style={{ border: '1px solid rgba(242,202,80,0.2)' }}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#f2ca50' }} />
              </motion.div>
              <span className="text-[7px] sm:text-[8px] tracking-[0.2em] uppercase group-hover:text-[#f2ca50] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'rgb(156,163,175)' }}>
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Central Node */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-30 cursor-pointer group"
        onClick={() => onSelect("brain")}
        data-testid="orbital-brain-node"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full -z-10"
          style={{ filter: 'blur(60px)', background: '#f2ca50' }}
        />
        <div className="w-32 h-32 rounded-full flex items-center justify-center p-3 omega-glass shadow-2xl transition-all duration-300 overflow-hidden" style={{ border: '2px solid rgba(242,202,80,0.3)', animation: 'pulse 8s ease-in-out infinite' }}>
          <div className="w-full h-full rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(242,202,80,0.6)', background: 'rgba(0,0,0,0.5)' }}>
            <div className="flex flex-col items-center">
              <Coins className="w-8 h-8 mb-1" style={{ color: '#f2ca50', fill: '#f2ca50' }} />
              <span className="italic font-bold text-[10px] tracking-widest text-center uppercase" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>
                CVL BRAIN
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -inset-2 rounded-full" style={{ border: '1px solid rgba(242,202,80,0.15)', animation: 'spin 25s linear infinite' }} />
      </motion.div>
    </div>
  );
}
