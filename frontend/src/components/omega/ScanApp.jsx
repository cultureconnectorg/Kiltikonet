import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QrCode, Camera, Check, X, ShieldCheck, AlertTriangle, Loader2, LogIn, MapPin, Scan } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const ZONES = [
  { id: "ENTREE_GENERALE", label: "Entree Generale", color: "#22c55e" },
  { id: "SCENE_PRINCIPALE", label: "Scene Principale", color: "#f2ca50" },
  { id: "VIP_LOUNGE", label: "VIP Lounge", color: "#a855f7" },
  { id: "BACKSTAGE", label: "Backstage", color: "#ef4444" },
  { id: "EXPOSANTS", label: "Exposants", color: "#3b82f6" },
  { id: "PRESSE", label: "Presse", color: "#f97316" },
  { id: "ATELIERS_PREMIUM", label: "Ateliers Premium", color: "#14b8a6" },
];

export default function ScanApp() {
  const [authed, setAuthed] = useState(false);
  const [agentCode, setAgentCode] = useState("");
  const [authError, setAuthError] = useState("");

  // Scan state
  const [selectedZone, setSelectedZone] = useState("ENTREE_GENERALE");
  const [scanMode, setScanMode] = useState("manual"); // manual or camera
  const [manualBadgeId, setManualBadgeId] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState([]);

  // Agent auth
  const handleAuth = () => {
    if (agentCode === "CC2026agent" || agentCode === "000000") {
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Code agent invalide");
    }
  };

  // Scan badge
  const handleScan = async (badgeId) => {
    if (!badgeId) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch(`${API}/api/badges/scan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge_id: badgeId, zone: selectedZone }),
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult({ ...data, success: true });
        setHistory(prev => [{ ...data, timestamp: new Date().toISOString(), zone: selectedZone }, ...prev.slice(0, 49)]);
      } else {
        setScanResult({ success: false, reason: data.detail || "Erreur de scan" });
        setHistory(prev => [{ badge_id: badgeId, access: false, reason: data.detail, timestamp: new Date().toISOString(), zone: selectedZone }, ...prev.slice(0, 49)]);
      }
    } catch (e) {
      setScanResult({ success: false, reason: "Erreur reseau" });
    }
    finally { setScanning(false); setManualBadgeId(""); }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#050505' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center" data-testid="scan-auth">
          <Scan className="w-16 h-16 mx-auto mb-4" style={{ color: '#f2ca50' }} />
          <h1 className="text-xl font-bold text-white mb-1">NFC Scan — CC2026</h1>
          <p className="text-xs text-gray-500 mb-6">Application Agent Terrain</p>
          <input value={agentCode} onChange={e => setAgentCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} type="password" placeholder="Code agent..." className="w-full bg-white/5 text-sm px-4 py-3 rounded-xl outline-none text-white mb-3 text-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="scan-code-input" />
          {authError && <p className="text-xs text-red-400 mb-3">{authError}</p>}
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleAuth} className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase" style={{ background: '#f2ca50', color: 'black' }} data-testid="scan-auth-btn">
            <LogIn className="w-4 h-4 inline mr-2" />Connexion Agent
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#050505' }} data-testid="scan-app">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#f2ca50' }}>NFC Scan</h1>
          <p className="text-[9px] text-gray-500 tracking-widest uppercase">Agent Terrain CC2026</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-2 py-1 rounded-full font-bold tracking-wider" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>EN LIGNE</span>
          <span className="text-[9px] text-gray-600">{history.length} scans</span>
        </div>
      </header>

      <div className="px-5 py-4 space-y-4">
        {/* Zone selector */}
        <div>
          <label className="text-[10px] text-gray-500 tracking-widest uppercase mb-2 block">Zone active</label>
          <div className="grid grid-cols-2 gap-2">
            {ZONES.map(z => (
              <motion.button key={z.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedZone(z.id)} className="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2" style={{
                background: selectedZone === z.id ? `${z.color}20` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedZone === z.id ? z.color + '50' : 'rgba(255,255,255,0.06)'}`,
                color: selectedZone === z.id ? z.color : '#999',
              }} data-testid={`zone-${z.id}`}>
                <MapPin className="w-3 h-3" /> {z.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Manual scan */}
        <div>
          <label className="text-[10px] text-gray-500 tracking-widest uppercase mb-2 block">Scanner un badge</label>
          <div className="flex gap-2">
            <input value={manualBadgeId} onChange={e => setManualBadgeId(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleScan(manualBadgeId)} placeholder="CC26-XXX-XXXXX" className="flex-1 bg-white/5 text-sm px-4 py-3 rounded-xl outline-none text-white font-mono tracking-wider" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="scan-badge-input" />
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleScan(manualBadgeId)} disabled={scanning || !manualBadgeId} className="px-6 py-3 rounded-xl font-bold text-sm tracking-widest" style={{ background: '#f2ca50', color: 'black' }} data-testid="scan-submit-btn">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Scan result */}
        <AnimatePresence>
          {scanResult && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 rounded-2xl" style={{
              background: scanResult.access ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `2px solid ${scanResult.access ? '#22c55e' : '#ef4444'}`,
            }} data-testid="scan-result">
              <div className="flex items-center gap-3 mb-3">
                {scanResult.access ? (
                  <Check className="w-8 h-8 text-green-400" />
                ) : (
                  <X className="w-8 h-8 text-red-400" />
                )}
                <div>
                  <div className="text-lg font-bold" style={{ color: scanResult.access ? '#22c55e' : '#ef4444' }}>
                    {scanResult.access ? 'ACCES AUTORISE' : 'ACCES REFUSE'}
                  </div>
                  <div className="text-xs text-gray-400">{scanResult.reason}</div>
                </div>
              </div>
              {scanResult.badge_id && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Badge:</span> <span className="text-white font-mono">{scanResult.badge_id}</span></div>
                  <div><span className="text-gray-500">Type:</span> <span className="text-white">{scanResult.type_label}</span></div>
                  <div><span className="text-gray-500">Zone:</span> <span className="text-white">{scanResult.zone}</span></div>
                  <div><span className="text-gray-500">Statut:</span> <span className="text-white">{scanResult.statut}</span></div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan history */}
        {history.length > 0 && (
          <div>
            <label className="text-[10px] text-gray-500 tracking-widest uppercase mb-2 block">Historique des scans ({history.length})</label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {history.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${h.access ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="font-mono text-gray-400">{h.badge_id || '?'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{h.zone}</span>
                    <span className="text-gray-700">{new Date(h.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
