import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Users, CreditCard, ShieldCheck, Zap, Smartphone, Calendar, TrendingUp, Search, ChevronRight, Ban, Trash2, Shield, Loader2, AlertTriangle, MessageSquare, RefreshCw, X } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function CC2026Dashboard({ onBack }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/cc2026/stats`, { credentials: 'include' });
      if (r.ok) setStats(await r.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); const i = setInterval(loadStats, 30000); return () => clearInterval(i); }, [loadStats]);

  const tabs = [
    { id: 'stats', label: 'Dashboard', icon: TrendingUp },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col h-screen text-white" style={{ background: '#0a0a0b' }} data-testid="cc2026-dashboard">
      <header className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/5"><ArrowLeft className="w-4 h-4 text-gray-400" /></button>
          <span className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: '#f2ca50' }}>CC2026 Admin</span>
        </div>
        <div className="flex gap-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all ${tab === t.id ? 'text-[#f2ca50]' : 'text-gray-500'}`} style={tab === t.id ? { background: 'rgba(242,202,80,0.1)' } : {}} data-testid={`admin-tab-${t.id}`}>
                <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
        {tab === 'stats' && <StatsPanel stats={stats} loading={loading} />}
        {tab === 'users' && <UsersPanel />}
        {tab === 'moderation' && <ModerationPanel />}
      </div>
    </div>
  );
}

function StatsPanel({ stats, loading }) {
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#f2ca50' }} /></div>;
  if (!stats) return <div className="text-center py-20 text-gray-600">Erreur de chargement</div>;

  const kpis = [
    { label: 'Badges emis', value: stats.badges_emis, icon: ShieldCheck },
    { label: 'Badges valides', value: stats.badges_valides, icon: ShieldCheck },
    { label: 'NFC actifs', value: stats.nfc_actifs, icon: Smartphone },
    { label: 'JCC vendus', value: stats.jcc_vendus, icon: CreditCard },
    { label: 'Revenus', value: `${stats.revenus_total || 0} EUR`, icon: TrendingUp },
    { label: 'Inscriptions 24h', value: stats.inscriptions_24h, icon: Users },
    { label: 'Scans NFC 24h', value: stats.scans_nfc_24h, icon: Zap },
    { label: 'Artistes', value: stats.artistes_confirmes, icon: Users },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Countdown */}
      <div className="text-center py-6 rounded-2xl" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.15)' }}>
        <div className="text-5xl font-bold font-mono" style={{ color: '#f2ca50' }}>J-{stats.countdown_jours}</div>
        <div className="text-xs text-gray-500 mt-2 tracking-widest uppercase">20 Mai 2026 — Culture Connect</div>
      </div>
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} data-testid={`kpi-${i}`}>
              <div className="flex items-center gap-2 mb-2"><Icon className="w-3.5 h-3.5" style={{ color: '#f2ca50' }} /><span className="text-[9px] text-gray-500 tracking-widest uppercase">{k.label}</span></div>
              <div className="text-2xl font-bold font-mono text-white">{k.value ?? 0}</div>
            </div>
          );
        })}
      </div>
      {/* Badges by type */}
      {stats.badges_by_type && Object.keys(stats.badges_by_type).length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] text-gray-500 tracking-widest uppercase mb-3">Badges par type</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {Object.entries(stats.badges_by_type).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400 uppercase">{type}</span>
                <span className="text-sm font-bold font-mono" style={{ color: '#f2ca50' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setUsers(d.users); setTotal(d.total); }
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const changeRole = async (frekId, role) => {
    setActionLoading(frekId);
    await fetch(`${API}/api/admin/users/${frekId}/role`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    loadUsers();
    setActionLoading(null);
  };

  const suspendUser = async (frekId) => {
    if (!window.confirm('Suspendre cet utilisateur ?')) return;
    setActionLoading(frekId);
    await fetch(`${API}/api/admin/users/${frekId}/suspend`, { method: 'POST', credentials: 'include' });
    loadUsers();
    setActionLoading(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher FREK-ID, nom, email..." className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/5 outline-none text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="admin-user-search" />
        </div>
        <button onClick={loadUsers} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
      </div>
      <div className="text-[9px] text-gray-500">{total} utilisateurs</div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#f2ca50]" /></div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.frek_id || u.email} className="p-3 rounded-xl flex items-center justify-between gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} data-testid={`admin-user-${u.frek_id}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{u.name || u.full_name || u.email}</div>
                <div className="text-[9px] text-gray-500 font-mono">{u.frek_id || '—'} · {u.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold" style={{ background: 'rgba(242,202,80,0.1)', color: '#f2ca50' }}>{u.role || 'user'}</span>
                  {u.suspended && <span className="text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold bg-red-500/20 text-red-400">Suspendu</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {actionLoading === u.frek_id ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : (
                  <>
                    <select value={u.role || 'user'} onChange={e => changeRole(u.frek_id, e.target.value)} className="bg-black/40 text-[9px] text-gray-400 px-2 py-1 rounded outline-none" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      <option value="user">User</option><option value="pro">Pro</option><option value="admin">Admin</option>
                    </select>
                    <button onClick={() => suspendUser(u.frek_id)} className="p-1.5 rounded-lg hover:bg-red-500/10" title="Suspendre"><Ban className="w-3.5 h-3.5 text-red-400" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 rounded text-[10px] text-gray-400 disabled:opacity-30 bg-white/5">Precedent</button>
        <span className="text-[10px] text-gray-500">Page {page}</span>
        <button onClick={() => setPage(page + 1)} disabled={users.length < 20} className="px-3 py-1 rounded text-[10px] text-gray-400 disabled:opacity-30 bg-white/5">Suivant</button>
      </div>
    </div>
  );
}

function ModerationPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReported = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/feed/reported`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setPosts(d.posts || []); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadReported(); }, [loadReported]);

  const deletePost = async (postId) => {
    await fetch(`${API}/api/admin/feed/posts/${postId}`, { method: 'DELETE', credentials: 'include' });
    loadReported();
  };

  const restorePost = async (postId) => {
    await fetch(`${API}/api/admin/feed/posts/${postId}/restore`, { method: 'POST', credentials: 'include' });
    loadReported();
  };

  const banUser = async (frekId) => {
    if (!window.confirm('Bannir cet utilisateur du feed ?')) return;
    await fetch(`${API}/api/admin/users/${frekId}/ban`, { method: 'POST', credentials: 'include' });
    loadReported();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-400" />
        <span className="text-xs text-gray-400">Posts signales ({posts.length})</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#f2ca50]" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun post signale</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} data-testid={`reported-${p.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white mb-1">{(p.content || '').slice(0, 200)}</div>
                  <div className="text-[9px] text-gray-500">Par {p.author_name || p.author_frek_id || '?'} · {p.reports_count} signalement(s)</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.deleted ? (
                    <button onClick={() => restorePost(p.id)} className="px-2 py-1 rounded text-[9px] text-green-400 bg-green-500/10">Restaurer</button>
                  ) : (
                    <button onClick={() => deletePost(p.id)} className="px-2 py-1 rounded text-[9px] text-red-400 bg-red-500/10">Supprimer</button>
                  )}
                  <button onClick={() => banUser(p.author_frek_id)} className="px-2 py-1 rounded text-[9px] text-orange-400 bg-orange-500/10">Bannir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
