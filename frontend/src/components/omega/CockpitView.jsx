import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Terminal, Rocket, Activity, Shield, Code, ArrowLeft, RefreshCw, Server, Network, Lock } from "lucide-react";

export default function CockpitView({ onBack, onSelect }) {
  const [logs, setLogs] = useState([
    { id: "1", timestamp: "13:30:01", type: "info", message: "Initializing Core Engine v2.4.0..." },
    { id: "2", timestamp: "13:30:02", type: "success", message: "FREK-ID Protocol handshake established." },
    { id: "3", timestamp: "13:30:03", type: "info", message: "Connecting to Kiltikonet Mainnet..." },
  ]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [command, setCommand] = useState("");
  const scrollRef = useRef(null);

  const addLog = (message, type = "info") => {
    setLogs(prev => [...prev, { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString([], { hour12: false }), type, message }]);
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [logs]);

  const handleCommand = (e) => {
    e.preventDefault();
    if (!command.trim()) return;
    addLog(command, "cmd");
    const cmd = command.toLowerCase().trim();
    setCommand("");
    setTimeout(() => {
      if (cmd === "deploy") handleDeploy();
      else if (cmd === "clear") setLogs([]);
      else if (cmd === "status") { addLog("System Status: OPTIMIZED", "success"); addLog("Network: 142ms latency", "info"); addLog("Active Nodes: 12", "info"); }
      else if (cmd === "help") addLog("Available commands: deploy, status, clear, help, exit", "info");
      else addLog(`Unknown command: ${cmd}`, "error");
    }, 200);
  };

  const handleDeploy = () => {
    if (isDeploying) return;
    setIsDeploying(true);
    addLog("Starting deployment sequence...", "warning");
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress === 20) addLog("Bundling assets with Luciole Compiler...", "info");
      if (progress === 40) addLog("Injecting FREK signatures into binaries...", "info");
      if (progress === 60) addLog("Uploading to Kiltikonet Edge Nodes...", "info");
      if (progress === 80) addLog("Verifying on-chain metadata...", "info");
      if (progress >= 100) { clearInterval(interval); setIsDeploying(false); addLog("Deployment successful! Production live at kiltikonet.io/main", "success"); }
    }, 800);
  };

  const typeColor = { success: "text-green-400", error: "text-red-400", warning: "text-[#f2ca50]", info: "text-blue-300", cmd: "text-white font-bold" };

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden font-mono" style={{ background: '#050505' }} data-testid="cockpit-view">
      <header className="h-16 flex items-center justify-between px-6 backdrop-blur-md z-50 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.6)' }}>
        <div className="flex items-center gap-4">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50] transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-widest uppercase flex items-center gap-2" style={{ color: '#f2ca50' }}><Terminal className="w-3 h-3" />Cockpit Console</span>
            <span className="text-[8px] text-gray-500 uppercase tracking-widest">Core Engine v2.4.0-stable</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 px-4 py-1.5 bg-white/5 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex flex-col items-end"><span className="text-[7px] text-gray-500 uppercase">CPU Load</span><span className="text-[9px] text-green-500">12.4%</span></div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div className="flex flex-col items-end"><span className="text-[7px] text-gray-500 uppercase">Memory</span><span className="text-[9px]" style={{ color: '#f2ca50' }}>4.2GB / 16GB</span></div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDeploy} disabled={isDeploying}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest flex items-center gap-2 transition-all ${isDeploying ? "bg-white/5 text-gray-500 cursor-not-allowed" : "hover:bg-white"}`}
            style={!isDeploying ? { background: '#f2ca50', color: 'black' } : {}}>
            {isDeploying ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
            {isDeploying ? "DEPLOYING..." : "DEPLOY"}
          </motion.button>
        </div>
      </header>

      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white/5 rounded-2xl p-5 space-y-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2"><Activity className="w-3 h-3" />System Health</h3>
            <div className="space-y-3">
              {[{ label: "API Gateway", status: "Operational", color: "text-green-500" }, { label: "Database Cluster", status: "Operational", color: "text-green-500" }, { label: "FREK Signer", status: "Operational", color: "text-green-500" }, { label: "Edge Cache", status: "Syncing", color: "text-[#f2ca50]" }].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[10px]"><span className="text-gray-400">{item.label}</span><span className={item.color}>{item.status}</span></div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 space-y-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2"><Code className="w-3 h-3" />API Endpoints</h3>
            <div className="space-y-2">
              {[{ method: "GET", path: "/api/v1/user/profile", latency: "42ms" }, { method: "POST", path: "/api/v1/frek/sign", latency: "124ms" }, { method: "GET", path: "/api/v1/shop/assets", latency: "86ms" }, { method: "PUT", path: "/api/v1/core/sync", latency: "210ms" }].map((api, i) => (
                <div key={i} className="group p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer" style={{ border: '1px solid transparent' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${api.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : api.method === 'POST' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>{api.method}</span>
                    <span className="text-[8px] text-gray-500">{api.latency}</span>
                  </div>
                  <div className="text-[10px] text-gray-300 truncate">{api.path}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 space-y-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2"><Shield className="w-3 h-3" />Security Protocol</h3>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.2)' }}>
              <div className="flex items-center gap-3 mb-2"><Lock className="w-4 h-4" style={{ color: '#f2ca50' }} /><span className="text-[10px] font-bold" style={{ color: '#f2ca50' }}>Protocol Omega Active</span></div>
              <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(242,202,80,0.6)' }}>All traffic is encrypted via 256-bit AES. FREK signatures are verified on every request.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col bg-black/40 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="h-10 bg-white/5 flex items-center px-4 gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="h-full flex items-center px-2 text-[10px] font-bold" style={{ borderBottom: '2px solid #f2ca50', color: '#f2ca50' }}>main_console.sh</div>
            <div className="text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer">network_logs.log</div>
            <div className="text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer">build_output.txt</div>
          </div>
          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-2 font-mono text-[11px] leading-relaxed">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3">
                <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                {log.type === "cmd" && <span style={{ color: '#f2ca50' }} className="shrink-0">$</span>}
                <span className={typeColor[log.type] || "text-gray-400"}>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>{log.message}</motion.span>
                </span>
              </div>
            ))}
            {isDeploying && (
              <div className="flex gap-3 items-center">
                <span className="text-gray-600">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 4 }} className="h-full" style={{ background: '#f2ca50' }} />
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleCommand} className="h-12 bg-white/5 flex items-center px-6 gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="font-bold" style={{ color: '#f2ca50' }}>$</span>
            <input type="text" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Type 'help' for commands..." className="flex-1 bg-transparent border-none outline-none text-[11px] text-white placeholder-gray-700" autoFocus />
          </form>
        </div>
      </main>

      <footer className="h-8 flex items-center justify-between px-6 text-[9px] font-bold tracking-widest uppercase" style={{ background: '#f2ca50', color: 'black' }}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Server className="w-3 h-3" />Node: EU-WEST-2</span>
          <span className="flex items-center gap-1"><Network className="w-3 h-3" />Latency: 14ms</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span><span>Ln 1, Col 1</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />Connected</span>
        </div>
      </footer>
    </div>
  );
}
