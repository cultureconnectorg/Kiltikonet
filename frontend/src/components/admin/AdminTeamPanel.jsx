import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UserPlus, Copy, Check, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const C = { bg: '#0a0a0b', card: '#131315', gold: '#E8D5A0', text: '#FFFFFF', muted: '#72727a', border: 'rgba(255,255,255,0.06)', dim: '#3a3a42' };

const ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'viewer', label: 'Viewer (lecture seule)' },
  { value: 'admin', label: 'Admin (reserve Laurent)' },
];

const AdminTeamPanel = () => {
  const [invitations, setInvitations] = useState([]);
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [role, setRole] = useState('staff');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/admin/invitations`, { withCredentials: true });
      setInvitations(res.data.invitations || []);
    } catch {}
  }, []);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email || !nom) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/admin/invite`, { email, nom, role }, { withCredentials: true });
      if (res.data.success) {
        toast.success(`Invitation envoyee a ${email}`);
        setEmail(''); setNom('');
        fetchInvitations();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
    setLoading(false);
  };

  const copyLink = async (url) => {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const statusBadge = (status) => {
    const styles = {
      pending: { bg: 'rgba(232,213,160,0.1)', color: '#E8D5A0', icon: Clock, label: 'En attente' },
      used: { bg: 'rgba(74,222,128,0.1)', color: '#4ade80', icon: CheckCircle, label: 'Utilisee' },
      expired: { bg: 'rgba(122,26,26,0.2)', color: '#f08080', icon: XCircle, label: 'Expiree' },
    };
    const s = styles[status] || styles.pending;
    const Icon = s.icon;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.color }}>
        <Icon size={10} />{s.label}
      </span>
    );
  };

  return (
    <div data-testid="admin-team-panel">
      <div className="flex items-center gap-3 mb-4">
        <Users size={18} style={{ color: C.gold }} />
        <h3 className="text-lg font-bold" style={{ color: C.text }}>Equipe</h3>
      </div>

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="rounded-xl p-4 mb-4 space-y-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="email" placeholder="email@equipe.com" value={email} onChange={e => setEmail(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm" data-testid="invite-email-input"
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
          <input type="text" placeholder="Nom complet" value={nom} onChange={e => setNom(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm" data-testid="invite-name-input"
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
          <select value={role} onChange={e => setRole(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm" data-testid="invite-role-select"
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading || !email || !nom}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.97]"
          data-testid="invite-submit-btn"
          style={{ background: C.gold, color: '#0a0a0b', opacity: loading || !email || !nom ? 0.5 : 1, width: '100%' }}>
          <UserPlus size={16} />{loading ? 'Envoi...' : 'Generer le lien d\'invitation'}
        </button>
      </form>

      {/* Invitations List */}
      <div className="space-y-2">
        {invitations.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: C.dim }}>Aucune invitation envoyee</p>
        )}
        {invitations.map((inv, i) => {
          const frontendUrl = window.location.origin;
          const inviteUrl = `${frontendUrl}/invite/${inv.token}`;
          return (
            <div key={inv.token || i} className="rounded-xl p-3 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{inv.nom}</p>
                <p className="text-xs truncate" style={{ color: C.muted }}>{inv.email} — {inv.role}</p>
              </div>
              {statusBadge(inv.status)}
              {inv.status === 'pending' && (
                <button onClick={() => copyLink(inviteUrl)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors" data-testid={`copy-invite-${i}`}>
                  {copied === inviteUrl ? <Check size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} style={{ color: C.muted }} />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTeamPanel;
