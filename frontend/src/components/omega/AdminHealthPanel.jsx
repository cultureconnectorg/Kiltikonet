import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Activity, Database, Zap, Shield, Mail, CreditCard, Smartphone, Users, Clock, AlertTriangle, CheckCircle, Loader2, RefreshCw, Bell } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

function StatusDot({ value, thresholds }) {
  let color = '#22c55e'; // green
  if (value >= thresholds[1]) color = '#ef4444'; // red
  else if (value >= thresholds[0]) color = '#f59e0b'; // orange
  return <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />;
}

function MetricCard({ icon: Icon, label, value, unit, thresholds, testId }) {
  const numVal = typeof value === 'number' ? value : 0;
  let color = '#22c55e';
  if (thresholds) {
    if (numVal >= thresholds[1]) color = '#ef4444';
    else if (numVal >= thresholds[0]) color = '#f59e0b';
  }
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} data-testid={testId}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color: 'rgba(242,202,80,0.6)' }} />
        <span className="text-[9px] text-gray-500 tracking-widest uppercase">{label}</span>
        {thresholds && <StatusDot value={numVal} thresholds={thresholds} />}
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value ?? '—'}</div>
      {unit && <div className="text-[9px] text-gray-600 mt-1">{unit}</div>}
    </div>
  );
}

function ServiceRow({ name, status, detail }) {
  const ok = status === 'operational' || status === true;
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <span className="text-xs text-gray-400">{name}</span>
      <div className="flex items-center gap-2">
        {detail && <span className="text-[9px] text-gray-500 font-mono">{detail}</span>}
        {ok ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
      </div>
    </div>
  );
}

function formatUptime(s) {
  if (!s) return '—';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}j ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AdminHealthPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/health-stats`, { credentials: 'include' });
      if (!r.ok) { setError('Acces refuse'); setLoading(false); return; }
      const d = await r.json();
      setData(d);
      setError(null);
      setLastRefresh(new Date());
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading && !data) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#f2ca50' }} />
    </div>
  );

  if (error && !data) return (
    <div className="text-center py-12">
      <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-400" />
      <p className="text-sm text-red-400">{error}</p>
    </div>
  );

  return (
    <div className="space-y-4" data-testid="health-panel">
      {/* Refresh indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" style={{ color: '#f2ca50' }} />
          <span className="text-[9px] text-gray-500 tracking-widest uppercase">Sante Systeme</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-gray-600 font-mono">
            {lastRefresh ? `Maj ${lastRefresh.toLocaleTimeString('fr')}` : ''}
          </span>
          <motion.button whileTap={{ scale: 0.9, rotate: 180 }} onClick={fetchHealth} className="p-1 rounded hover:bg-white/5" data-testid="health-refresh-btn">
            <RefreshCw className="w-3 h-3 text-gray-500" />
          </motion.button>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={Zap} label="Latence moy." value={data?.latence_moyenne_ms} unit="ms" thresholds={[200, 500]} testId="health-latency" />
        <MetricCard icon={AlertTriangle} label="Taux erreur" value={data?.taux_erreur_pct} unit="%" thresholds={[5, 15]} testId="health-error-rate" />
        <MetricCard icon={Database} label="Taille DB" value={data?.taille_db_mb} unit="MB" thresholds={[500, 1000]} testId="health-db-size" />
        <MetricCard icon={Clock} label="Uptime" value={formatUptime(data?.uptime_serveur_s)} thresholds={null} testId="health-uptime" />
        <MetricCard icon={Users} label="Sessions" value={data?.sessions_actives} unit="actives" thresholds={null} testId="health-sessions" />
        <MetricCard icon={Shield} label="IPs bloquees" value={data?.requetes_bloquees_rate_limit} unit="rate limit" thresholds={[5, 20]} testId="health-blocked" />
        <MetricCard icon={Mail} label="Emails 24h" value={data?.emails_envoyes_24h} unit="envoyes" thresholds={null} testId="health-emails" />
        <MetricCard icon={Smartphone} label="PWA installs" value={data?.pwa_installations_24h} unit="24h" thresholds={null} testId="health-pwa" />
      </div>

      {/* Services Status */}
      <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[9px] text-gray-500 tracking-widest uppercase mb-2">Services</div>
        <ServiceRow name="Brevo (Emails)" status={data?.brevo_status} detail={data?.brevo_status} />
        <ServiceRow name="Google Auth" status={data?.google_auth_enabled} detail={data?.google_auth_enabled ? 'Actif' : 'Inactif'} />
        <ServiceRow name="Stripe" status={!!data?.derniere_transaction_stripe} detail={data?.derniere_transaction_stripe ? new Date(data.derniere_transaction_stripe).toLocaleDateString('fr') : 'Aucune'} />
      </div>

      {/* Top IPs */}
      {data?.top_ips_actives?.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] text-gray-500 tracking-widest uppercase mb-2">Top IPs actives</div>
          {data.top_ips_actives.map((ip, i) => (
            <div key={i} className="text-[10px] font-mono text-gray-400 py-0.5">{ip}</div>
          ))}
        </div>
      )}

      {/* Broadcast CC2026 */}
      <BroadcastPanel />
    </div>
  );
}

function BroadcastPanel() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`${API}/api/notifications/push/send`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, frek_ids: [] }),
      });
      const d = await r.json();
      setResult(d);
      if (d.sent > 0) { setTitle(''); setBody(''); }
    } catch {}
    setSending(false);
  };

  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }} data-testid="broadcast-panel">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-3.5 h-3.5" style={{ color: '#f2ca50' }} />
        <span className="text-[9px] text-gray-500 tracking-widest uppercase">Broadcast CC2026</span>
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" className="w-full bg-black/40 text-xs px-3 py-2 rounded-lg mb-2 outline-none text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="broadcast-title" />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message..." rows={2} className="w-full bg-black/40 text-xs px-3 py-2 rounded-lg mb-2 outline-none text-white resize-none" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="broadcast-body" />
      <button onClick={handleBroadcast} disabled={sending || !title.trim() || !body.trim()} className="w-full py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold" style={{ background: sending ? '#333' : '#f2ca50', color: '#0a0a0b', opacity: !title.trim() || !body.trim() ? 0.5 : 1 }} data-testid="broadcast-send-btn">
        {sending ? 'Envoi...' : 'Envoyer a tous'}
      </button>
      {result && <div className="text-[9px] mt-2 text-gray-500">Envoye: {result.sent}, Echec: {result.failed}</div>}
    </div>
  );
}

