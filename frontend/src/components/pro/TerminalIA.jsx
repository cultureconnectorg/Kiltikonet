// ═══════════════════════════════════════════════════════════
// ÉCRAN 13 — TERMINAL IA + API DÉPLOIEMENT
// Console style Claude.ai / VS Code avec exécution de code,
// exploration d'APIs CC2026, et déploiement de microservices
// Design System: Sovereign Onyx · Material Symbols Only
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

// ─── API Explorer endpoints (masque les sensibles) ─────
const CC2026_APIS = [
  { method: 'GET', path: '/api/pro/feed', desc: 'Flux reseau culturel', category: 'Feed' },
  { method: 'GET', path: '/api/pro/feed/reels', desc: 'Flux Reels culturel', category: 'Feed' },
  { method: 'POST', path: '/api/pro/feed/post', desc: 'Publier un contenu', category: 'Feed' },
  { method: 'GET', path: '/api/my-wallet/me', desc: 'Mon portefeuille', category: 'Wallet' },
  { method: 'GET', path: '/api/my-wallet/history', desc: 'Historique transactions', category: 'Wallet' },
  { method: 'POST', path: '/api/brain/chat', desc: 'Chat avec CVL BRAIN', category: 'Brain' },
  { method: 'GET', path: '/api/health', desc: 'Etat du serveur', category: 'Systeme' },
];

const METHOD_COLORS = { GET: '#4ADE80', POST: '#5B9BD5', PUT: '#E8D5A0', DELETE: '#ffb4ab', PATCH: '#C4714A' };

// ─── Syntax highlight (lightweight) ─────────────────────
const highlight = (code) => {
  if (!code) return '';
  return code
    .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span style="color:#C4714A">$&</span>')
    .replace(/\b(true|false|null|None|undefined)\b/g, '<span style="color:#8B5CF6">$&</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#2DD4BF">$&</span>')
    .replace(/\b(def|class|import|from|return|if|else|for|while|try|except|async|await|const|let|var|function)\b/g, '<span style="color:#5B9BD5">$&</span>')
    .replace(/(#.*$)/gm, '<span style="color:#555">$&</span>')
    .replace(/(\/\/.*$)/gm, '<span style="color:#555">$&</span>');
};

// ─── Deployed microservices (mock) ──────────────────────
const DEPLOYED_SERVICES = [
  { id: 'svc-001', name: 'ghost-seeder', status: 'running', port: 8081, uptime: '12j 4h', cpu: '2.1%', mem: '48MB' },
  { id: 'svc-002', name: 'brain-memory', status: 'running', port: 8082, uptime: '8j 22h', cpu: '1.4%', mem: '64MB' },
  { id: 'svc-003', name: 'kt-indexer', status: 'stopped', port: 8083, uptime: '-', cpu: '-', mem: '-' },
];

const TABS = [
  { id: 'terminal', icon: 'terminal', label: 'Terminal' },
  { id: 'api', icon: 'api', label: 'API Explorer' },
  { id: 'deploy', icon: 'deployed_code', label: 'Déploiement' },
];

const TerminalIA = ({ session }) => {
  const [activeTab, setActiveTab] = useState('terminal');
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [selectedApi, setSelectedApi] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [services, setServices] = useState(DEPLOYED_SERVICES);
  const termRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines]);

  // Welcome message
  useEffect(() => {
    setLines([
      { type: 'system', content: '╔══════════════════════════════════════╗' },
      { type: 'system', content: '║  CVL BRAIN Terminal v2.4             ║' },
      { type: 'system', content: '║  Sovereign Runtime Environment       ║' },
      { type: 'system', content: '╚══════════════════════════════════════╝' },
      { type: 'info', content: 'Tapez "help" pour la liste des commandes.' },
      { type: 'info', content: 'Tapez "api list" pour explorer les endpoints CC2026.' },
    ]);
  }, []);

  // ─── COMMAND EXECUTION ────────────────────────────────
  const executeCommand = useCallback(async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setCmdHistory(prev => [...prev, trimmed]);
    setHistoryIdx(-1);
    setLines(prev => [...prev, { type: 'input', content: `$ ${trimmed}` }]);
    setRunning(true);

    const args = trimmed.split(/\s+/);
    const command = args[0].toLowerCase();

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

    switch (command) {
      case 'help':
        setLines(prev => [...prev,
          { type: 'output', content: 'Commandes disponibles :' },
          { type: 'output', content: '  help              — Afficher cette aide' },
          { type: 'output', content: '  clear             — Vider le terminal' },
          { type: 'output', content: '  status            — État du système' },
          { type: 'output', content: '  api list          — Lister les endpoints CC2026' },
          { type: 'output', content: '  api call <path>   — Appeler un endpoint' },
          { type: 'output', content: '  brain <question>  — Interroger CVL BRAIN' },
          { type: 'output', content: '  deploy list       — Services déployés' },
          { type: 'output', content: '  deploy start <id> — Démarrer un service' },
          { type: 'output', content: '  deploy stop <id>  — Arrêter un service' },
          { type: 'output', content: '  echo <text>       — Afficher du texte' },
          { type: 'output', content: '  date              — Date et heure actuelles' },
          { type: 'output', content: '  whoami            — Informations utilisateur' },
          { type: 'output', content: '  neofetch          — Infos système' },
          { type: 'output', content: '  run <code>        — Exécuter du code (simulé)' },
        ]);
        break;

      case 'clear':
        setLines([]);
        break;

      case 'status':
        setLines(prev => [...prev,
          { type: 'success', content: '● Backend API ........... ONLINE' },
          { type: 'success', content: '● MongoDB ............... ONLINE' },
          { type: 'success', content: '● CVL BRAIN ............. ONLINE' },
          { type: 'success', content: '● Ghost Engine .......... ACTIVE (69 en ligne)' },
          { type: 'info', content: `● Session ............... ${session?.name || 'Admin'} (${session?.id?.slice(0, 8) || '00000000'})` },
          { type: 'info', content: `● Uptime ................ 48j 12h 33m` },
        ]);
        break;

      case 'api':
        if (args[1] === 'list') {
          setLines(prev => [...prev,
            { type: 'output', content: '┌─────────┬────────────────────────────────┬────────────────────┐' },
            { type: 'output', content: '│ Méthode │ Endpoint                       │ Description        │' },
            { type: 'output', content: '├─────────┼────────────────────────────────┼────────────────────┤' },
            ...CC2026_APIS.map(a => ({
              type: 'output',
              content: `│ ${a.method.padEnd(7)} │ ${a.path.padEnd(30)} │ ${a.desc.slice(0, 18).padEnd(18)} │`,
            })),
            { type: 'output', content: '└─────────┴────────────────────────────────┴────────────────────┘' },
          ]);
        } else if (args[1] === 'call' && args[2]) {
          const endpoint = args[2].startsWith('/') ? args[2] : `/${args[2]}`;
          try {
            setLines(prev => [...prev, { type: 'info', content: `Appel ${endpoint}...` }]);
            const baseUrl = process.env.REACT_APP_BACKEND_URL;
            const res = await axios.get(`${baseUrl}${endpoint}`, { timeout: 5000 });
            const json = JSON.stringify(res.data, null, 2).split('\n').slice(0, 20);
            setLines(prev => [...prev,
              { type: 'success', content: `HTTP ${res.status} OK` },
              ...json.map(l => ({ type: 'json', content: l })),
              json.length >= 20 ? { type: 'info', content: '... (réponse tronquée)' } : null,
            ].filter(Boolean));
          } catch (e) {
            setLines(prev => [...prev, { type: 'error', content: `Erreur: ${e.response?.status || 'timeout'} — ${e.message}` }]);
          }
        } else {
          setLines(prev => [...prev, { type: 'error', content: 'Usage: api list | api call <path>' }]);
        }
        break;

      case 'brain': {
        const question = args.slice(1).join(' ');
        if (!question) {
          setLines(prev => [...prev, { type: 'error', content: 'Usage: brain <votre question>' }]);
          break;
        }
        setLines(prev => [...prev, { type: 'info', content: 'CVL BRAIN reflechit...' }]);
        
        // Thought process display
        const thoughts = [
          'Analyse de la question...',
          'Consultation de la base de connaissances culturelle...',
          'Synthese des informations pertinentes...',
        ];
        for (const thought of thoughts) {
          await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
          setLines(prev => [...prev, { type: 'system', content: `  > ${thought}` }]);
        }
        
        try {
          const res = await axios.post(`${API}/brain/chat`, {
            message: question,
            session_id: `terminal_${session?.id || 'anon'}_${Date.now()}`,
            user_id: session?.id || '',
          }, { timeout: 30000 });
          const reply = res.data.reply || res.data.response || 'Pas de reponse.';
          setLines(prev => [...prev, { type: 'brain', content: `BRAIN: ${reply}` }]);
        } catch {
          setLines(prev => [...prev, { type: 'error', content: 'CVL BRAIN indisponible.' }]);
        }
        break;
      }

      case 'deploy':
        if (args[1] === 'list') {
          setLines(prev => [...prev,
            { type: 'output', content: '─── Services Déployés ───' },
            ...services.map(s => ({
              type: s.status === 'running' ? 'success' : 'warning',
              content: `${s.status === 'running' ? '●' : '○'} ${s.name.padEnd(16)} ${s.status.padEnd(8)} Port:${s.port}  CPU:${s.cpu}  Mem:${s.mem}  Up:${s.uptime}`,
            })),
          ]);
        } else if ((args[1] === 'start' || args[1] === 'stop') && args[2]) {
          const svc = services.find(s => s.id === args[2] || s.name === args[2]);
          if (svc) {
            const newStatus = args[1] === 'start' ? 'running' : 'stopped';
            setServices(prev => prev.map(s => s.id === svc.id ? { ...s, status: newStatus, uptime: newStatus === 'running' ? '0m' : '-', cpu: newStatus === 'running' ? '0.1%' : '-', mem: newStatus === 'running' ? '12MB' : '-' } : s));
            setLines(prev => [...prev, { type: newStatus === 'running' ? 'success' : 'warning', content: `Service ${svc.name} ${args[1] === 'start' ? 'démarré' : 'arrêté'}.` }]);
          } else {
            setLines(prev => [...prev, { type: 'error', content: `Service "${args[2]}" non trouvé. Utilisez "deploy list".` }]);
          }
        } else {
          setLines(prev => [...prev, { type: 'error', content: 'Usage: deploy list | deploy start <name> | deploy stop <name>' }]);
        }
        break;

      case 'echo':
        setLines(prev => [...prev, { type: 'output', content: args.slice(1).join(' ') }]);
        break;

      case 'date':
        setLines(prev => [...prev, { type: 'output', content: new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' }) }]);
        break;

      case 'whoami':
        setLines(prev => [...prev,
          { type: 'output', content: `Utilisateur: ${session?.name || 'Admin CC2026'}` },
          { type: 'output', content: `Email: ${session?.email || 'admin@kiltikonet.fr'}` },
          { type: 'output', content: `Rôle: Sovereign Administrator` },
          { type: 'output', content: `Session: ${session?.id?.slice(0, 12) || '000000000000'}...` },
        ]);
        break;

      case 'neofetch':
        setLines(prev => [...prev,
          { type: 'output', content: '' },
          { type: 'brain', content: '   ██╗  ██╗██╗██╗  ████████╗██╗' },
          { type: 'brain', content: '   ██║ ██╔╝██║██║  ╚══██╔══╝██║' },
          { type: 'brain', content: '   █████╔╝ ██║██║     ██║   ██║' },
          { type: 'brain', content: '   ██╔═██╗ ██║██║     ██║   ██║' },
          { type: 'brain', content: '   ██║  ██╗██║███████╗██║   ██║' },
          { type: 'brain', content: '   ╚═╝  ╚═╝╚═╝╚══════╝╚═╝   ╚═╝' },
          { type: 'output', content: '' },
          { type: 'output', content: `  OS: Kiltikonet Sovereign OS v2.4` },
          { type: 'output', content: `  Kernel: CVL BRAIN Runtime` },
          { type: 'output', content: `  Shell: Sovereign Terminal` },
          { type: 'output', content: `  CPU: 4 vCPU @ 2.8GHz` },
          { type: 'output', content: `  Memory: 2.4GB / 8GB` },
          { type: 'output', content: `  Disk: 14.2GB / 50GB` },
          { type: 'output', content: `  Network: 45ms latency` },
          { type: 'output', content: `  Theme: Sovereign Onyx` },
        ]);
        break;

      case 'run': {
        const code = args.slice(1).join(' ');
        if (!code) {
          setLines(prev => [...prev, { type: 'error', content: 'Usage: run <code>' }]);
          break;
        }
        setLines(prev => [...prev, { type: 'info', content: 'Exécution...' }]);
        await new Promise(r => setTimeout(r, 800));
        // Simulate simple eval
        try {
          if (code.includes('print')) {
            const match = code.match(/print\(["'](.*)["']\)/);
            setLines(prev => [...prev, { type: 'output', content: match ? match[1] : code }]);
          } else if (code.match(/^\d[\d\s+\-*/().]*$/)) {
            // eslint-disable-next-line no-eval
            setLines(prev => [...prev, { type: 'output', content: `=> ${eval(code)}` }]);
          } else {
            setLines(prev => [...prev, { type: 'output', content: `=> Code exécuté (simulation)` }]);
          }
        } catch (e) {
          setLines(prev => [...prev, { type: 'error', content: `Erreur: ${e.message}` }]);
        }
        break;
      }

      default:
        setLines(prev => [...prev, { type: 'error', content: `Commande inconnue: "${command}". Tapez "help".` }]);
    }

    setRunning(false);
  }, [session, services]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !running) {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = historyIdx < cmdHistory.length - 1 ? historyIdx + 1 : historyIdx;
        setHistoryIdx(newIdx);
        setInput(cmdHistory[cmdHistory.length - 1 - newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(cmdHistory[cmdHistory.length - 1 - newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  // ─── API EXPLORER TAB ─────────────────────────────────
  const callApi = async (api) => {
    setSelectedApi(api);
    setApiLoading(true);
    setApiResponse(null);
    try {
      const baseUrl = process.env.REACT_APP_BACKEND_URL;
      const res = api.method === 'GET'
        ? await axios.get(`${baseUrl}${api.path}`, { timeout: 5000 })
        : await axios.post(`${baseUrl}${api.path}`, {}, { timeout: 5000 });
      setApiResponse({ status: res.status, data: JSON.stringify(res.data, null, 2), time: Date.now() });
    } catch (e) {
      setApiResponse({ status: e.response?.status || 0, data: e.message, time: Date.now(), error: true });
    }
    setApiLoading(false);
  };

  const LINE_COLORS = {
    input: '#E8D5A0',
    output: '#a0a0a5',
    error: '#ffb4ab',
    success: '#4ADE80',
    warning: '#E8D5A0',
    info: '#5B9BD5',
    system: '#72727a',
    brain: '#C4714A',
    json: '#2DD4BF',
  };

  const categories = [...new Set(CC2026_APIS.map(a => a.category))];

  return (
    <div className="max-w-5xl mx-auto pb-16" data-testid="terminal-ia">
      {/* Header */}
      <header className="pt-4 space-y-3 mb-4 px-4">
        <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: G }}>Console Souveraine</span>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 300, letterSpacing: '-0.02em', color: '#e5e2e3', lineHeight: 1 }}>
          Terminal <span style={{ color: G }}>IA</span>
        </h1>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 mx-4 p-1 rounded-xl mb-4" style={{ background: '#131314' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(232,213,160,0.08)' : 'transparent',
              color: activeTab === tab.id ? G : '#72727a',
            }}
            data-testid={`terminal-tab-${tab.id}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── TERMINAL TAB ──────────────────────────────── */}
      {activeTab === 'terminal' && (
        <div className="mx-4 rounded-xl overflow-hidden" style={{ background: '#0e0e0f', border: '1px solid rgba(75,70,59,0.12)' }} data-testid="terminal-panel">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#1c1b1c', borderBottom: '1px solid rgba(75,70,59,0.08)' }}>
            <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            <span className="ml-3" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, color: '#72727a' }}>CVL BRAIN Terminal — sovereign@kiltikonet</span>
          </div>

          {/* Terminal output */}
          <div
            ref={termRef}
            className="overflow-y-auto p-4 cursor-text"
            style={{ height: 400, fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace", fontSize: 12, lineHeight: 1.7 }}
            onClick={() => inputRef.current?.focus()}
            data-testid="terminal-output"
          >
            {lines.map((line, i) => (
              <div key={i} style={{ color: LINE_COLORS[line.type] || '#a0a0a5' }}>
                {line.type === 'json' ? (
                  <span dangerouslySetInnerHTML={{ __html: highlight(line.content) }} />
                ) : (
                  line.content
                )}
              </div>
            ))}

            {/* Input line */}
            <div className="flex items-center gap-2 mt-1">
              <span style={{ color: G }}>$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none"
                style={{ color: '#e5e2e3', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12 }}
                placeholder={running ? 'Exécution en cours...' : 'Tapez une commande...'}
                disabled={running}
                autoFocus
                data-testid="terminal-input"
              />
              {running && <span className="animate-pulse" style={{ color: G }}>|</span>}
            </div>
          </div>
        </div>
      )}

      {/* ─── API EXPLORER TAB ──────────────────────────── */}
      {activeTab === 'api' && (
        <div className="mx-4 space-y-4" data-testid="api-explorer">
          <div className="flex gap-4">
            {/* API list */}
            <div className="w-72 flex-shrink-0 space-y-4">
              {categories.map(cat => (
                <div key={cat}>
                  <h4 className="mb-2 px-1" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#72727a' }}>{cat}</h4>
                  <div className="space-y-1">
                    {CC2026_APIS.filter(a => a.category === cat).map(api => (
                      <button
                        key={api.path}
                        onClick={() => callApi(api)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/[0.03]"
                        style={{
                          background: selectedApi?.path === api.path ? 'rgba(232,213,160,0.06)' : 'transparent',
                          border: selectedApi?.path === api.path ? '1px solid rgba(232,213,160,0.1)' : '1px solid transparent',
                        }}
                        data-testid={`api-endpoint-${api.path.replace(/\//g, '-')}`}
                      >
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: `${METHOD_COLORS[api.method]}15`, color: METHOD_COLORS[api.method] }}>
                          {api.method}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#a0a0a5' }}>{api.path}</p>
                          <p className="truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, color: '#555' }}>{api.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Response panel */}
            <div className="flex-1 rounded-xl overflow-hidden" style={{ background: '#0e0e0f', border: '1px solid rgba(75,70,59,0.12)' }}>
              {!selectedApi ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#2a2a2b' }}>api</span>
                    <p className="mt-3" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#555' }}>Sélectionnez un endpoint</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Request header */}
                  <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(75,70,59,0.08)', background: '#1c1b1c' }}>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: `${METHOD_COLORS[selectedApi.method]}15`, color: METHOD_COLORS[selectedApi.method] }}>
                      {selectedApi.method}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#e5e2e3' }}>{selectedApi.path}</span>
                    {apiResponse && (
                      <span className="ml-auto px-2 py-0.5 rounded" style={{
                        background: apiResponse.error ? 'rgba(255,180,171,0.1)' : 'rgba(74,222,128,0.1)',
                        color: apiResponse.error ? '#ffb4ab' : '#4ADE80',
                        fontSize: 10, fontWeight: 700,
                      }}>
                        {apiResponse.status || 'ERR'}
                      </span>
                    )}
                  </div>

                  {/* Response body */}
                  <div className="p-4 overflow-y-auto" style={{ height: 350, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 11, lineHeight: 1.6 }}>
                    {apiLoading ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin material-symbols-outlined" style={{ fontSize: 16, color: G }}>progress_activity</span>
                        <span style={{ color: '#72727a' }}>Chargement...</span>
                      </div>
                    ) : apiResponse ? (
                      <pre style={{ color: '#a0a0a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: highlight(apiResponse.data) }} />
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── DEPLOY TAB ────────────────────────────────── */}
      {activeTab === 'deploy' && (
        <div className="mx-4 space-y-6" data-testid="deploy-panel">
          {/* Services grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 18, color: '#e5e2e3' }}>Microservices Actifs</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(232,213,160,0.08)', color: G, fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, border: '1px solid rgba(232,213,160,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                Nouveau service
              </button>
            </div>

            {services.map(svc => (
              <div key={svc.id} className="rounded-xl p-5 flex items-center gap-4" style={{ background: '#131314', border: '1px solid rgba(75,70,59,0.08)' }} data-testid={`service-${svc.id}`}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                  background: svc.status === 'running' ? 'rgba(74,222,128,0.08)' : 'rgba(255,180,171,0.08)',
                  border: `1px solid ${svc.status === 'running' ? 'rgba(74,222,128,0.15)' : 'rgba(255,180,171,0.15)'}`,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: svc.status === 'running' ? '#4ADE80' : '#ffb4ab' }}>
                    {svc.status === 'running' ? 'check_circle' : 'cancel'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: '#e5e2e3' }}>{svc.name}</span>
                    <span className="px-1.5 py-0.5 rounded" style={{ fontSize: 8, fontWeight: 700, background: svc.status === 'running' ? 'rgba(74,222,128,0.1)' : 'rgba(255,180,171,0.1)', color: svc.status === 'running' ? '#4ADE80' : '#ffb4ab' }}>
                      {svc.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#555' }}>Port: {svc.port}</span>
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#555' }}>CPU: {svc.cpu}</span>
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#555' }}>Mem: {svc.mem}</span>
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#555' }}>Uptime: {svc.uptime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setServices(prev => prev.map(s => s.id === svc.id ? {
                        ...s,
                        status: s.status === 'running' ? 'stopped' : 'running',
                        uptime: s.status === 'running' ? '-' : '0m',
                        cpu: s.status === 'running' ? '-' : '0.1%',
                        mem: s.status === 'running' ? '-' : '12MB',
                      } : s));
                    }}
                    className="px-3 py-1.5 rounded-lg"
                    style={{
                      background: svc.status === 'running' ? 'rgba(255,180,171,0.08)' : 'rgba(74,222,128,0.08)',
                      color: svc.status === 'running' ? '#ffb4ab' : '#4ADE80',
                      fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700,
                    }}
                    data-testid={`service-toggle-${svc.id}`}
                  >
                    {svc.status === 'running' ? 'Arrêter' : 'Démarrer'}
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/5">
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#72727a' }}>terminal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Logs preview */}
          <div className="rounded-xl overflow-hidden" style={{ background: '#0e0e0f', border: '1px solid rgba(75,70,59,0.12)' }}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: '#1c1b1c', borderBottom: '1px solid rgba(75,70,59,0.08)' }}>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#72727a' }}>Logs en temps réel</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4ADE80' }} />
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, color: '#555' }}>En direct</span>
              </span>
            </div>
            <div className="p-4 space-y-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, lineHeight: 1.8, maxHeight: 200, overflowY: 'auto' }}>
              {[
                { time: '14:32:01', level: 'INFO', msg: 'ghost-seeder: 3 nouveaux posts générés' },
                { time: '14:31:58', level: 'INFO', msg: 'brain-memory: Session sauvegardée (user_id: 8a2f...)' },
                { time: '14:31:45', level: 'WARN', msg: 'kt-indexer: Service arrêté — en attente de redémarrage' },
                { time: '14:31:30', level: 'INFO', msg: 'ghost-seeder: Profil vérifié: Simone Ogundimu' },
                { time: '14:31:15', level: 'INFO', msg: 'brain-memory: Index mémoire mis à jour (14,208 entrées)' },
                { time: '14:31:00', level: 'INFO', msg: 'ghost-seeder: Reel culturel publié (#gwoka-moderne)' },
              ].map((log, i) => (
                <div key={i}>
                  <span style={{ color: '#555' }}>[{log.time}]</span>{' '}
                  <span style={{ color: log.level === 'WARN' ? '#E8D5A0' : log.level === 'ERROR' ? '#ffb4ab' : '#4ADE80' }}>{log.level}</span>{' '}
                  <span style={{ color: '#a0a0a5' }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalIA;
