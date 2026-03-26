import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Users, Building2, Hotel, DollarSign,
  FileText, BarChart3, Calendar, Plus, Mail, Phone, Globe, MapPin
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const C = { bg: '#F4F0E8', card: '#FFFFFF', warm: '#E8E0D0', dark: '#1A1510', muted: '#6B6560', gold: '#C9A84C', terra: '#A65D47', sage: '#4A5D4E' };

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="p-4 rounded-xl border" style={{ background: C.card, borderColor: C.warm }}>
    <Icon className="w-5 h-5 mb-2" style={{ color: color || C.terra }} />
    <p className="text-2xl font-bold" style={{ color: C.dark }}>{value}</p>
    <p className="text-xs" style={{ color: C.muted }}>{label}</p>
  </div>
);

export default function ColeenWorkspace() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', type: 'hotel', status: 'prospect', contact: '', email: '', phone: '', notes: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, eRes, aRes] = await Promise.all([
        fetch(`${API}/api/shared/partners`).then(r => r.json()).catch(() => []),
        fetch(`${API}/api/shared/contacts`).then(r => r.json()).catch(() => []),
        fetch(`${API}/api/shared/expenses`).then(r => r.json()).catch(() => []),
        fetch(`${API}/api/analytics/jetons/overview`).then(r => r.json()).catch(() => null),
      ]);
      setPartners(Array.isArray(pRes) ? pRes : []);
      setContacts(Array.isArray(cRes) ? cRes : []);
      setExpenses(Array.isArray(eRes) ? eRes : []);
      setAnalytics(aRes);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addPartner = async () => {
    try {
      const res = await fetch(`${API}/api/shared/partners`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPartner, created_by: 'Coleen', created_at: new Date().toISOString() }),
      });
      if (res.ok) { toast.success('Partenaire ajouté'); setShowAddPartner(false); setNewPartner({ name: '', type: 'hotel', status: 'prospect', contact: '', email: '', phone: '', notes: '' }); fetchAll(); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur réseau'); }
  };

  const hotels = partners.filter(p => p.type === 'hotel' || p.type === 'hébergement');
  const sponsors = partners.filter(p => p.type === 'sponsor' || p.type === 'partenaire');
  const partnerExpenses = expenses.filter(e => e.category === 'partenariat' || e.category === 'hébergement' || e.category === 'hotel');
  const totalBudget = partnerExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
    { id: 'partners', label: 'Partenaires', icon: Building2 },
    { id: 'hotels', label: 'Hôtels', icon: Hotel },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'budget', label: 'Budget', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.bg }} data-testid="coleen-workspace">
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(244,240,232,0.95)', backdropFilter: 'blur(8px)', borderColor: C.warm }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} style={{ color: C.muted }}><ArrowLeft className="w-4 h-4" /></button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: C.dark }}>Espace Coleen</h1>
              <p className="text-xs" style={{ color: C.muted }}>Dir. Partenariats Hôtels & Sponsors</p>
            </div>
          </div>
          <Button size="sm" onClick={fetchAll} variant="outline"><RefreshCw className="w-4 h-4" /></Button>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
              style={{ background: tab === t.id ? `${C.terra}15` : 'transparent', color: tab === t.id ? C.terra : C.muted }}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: C.gold }} /></div>
        ) : (
          <>
            {/* DASHBOARD */}
            {tab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Building2} label="Partenaires" value={partners.length} color={C.terra} />
                  <StatCard icon={Hotel} label="Hôtels" value={hotels.length} color={C.gold} />
                  <StatCard icon={Users} label="Contacts" value={contacts.length} color={C.sage} />
                  <StatCard icon={DollarSign} label="Budget engagé" value={`${totalBudget.toLocaleString()}€`} color={C.terra} />
                </div>
                {analytics && (
                  <div className="rounded-xl p-5 border" style={{ background: C.card, borderColor: C.warm }}>
                    <h3 className="font-bold text-sm mb-3" style={{ color: C.dark }}>Analytics CC2026</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div><p className="text-xl font-bold" style={{ color: C.terra }}>{analytics.summary?.total_badges || 0}</p><p className="text-xs" style={{ color: C.muted }}>Badges créés</p></div>
                      <div><p className="text-xl font-bold" style={{ color: C.gold }}>{analytics.summary?.holders_count || 0}</p><p className="text-xs" style={{ color: C.muted }}>Détenteurs jetons</p></div>
                      <div><p className="text-xl font-bold" style={{ color: C.sage }}>{analytics.summary?.total_revenue_eur || 0}€</p><p className="text-xs" style={{ color: C.muted }}>Revenus</p></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PARTNERS */}
            {tab === 'partners' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold" style={{ color: C.dark }}>Partenaires & Sponsors</h2>
                  <Button size="sm" onClick={() => setShowAddPartner(!showAddPartner)} style={{ background: C.terra, color: '#fff' }}>
                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                  </Button>
                </div>
                {showAddPartner && (
                  <div className="p-4 rounded-xl border space-y-3" style={{ background: C.card, borderColor: C.warm }}>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={newPartner.name} onChange={e => setNewPartner({ ...newPartner, name: e.target.value })} placeholder="Nom du partenaire" className="px-3 py-2 rounded-lg text-sm" style={{ background: C.bg, border: `1px solid ${C.warm}` }} />
                      <select value={newPartner.type} onChange={e => setNewPartner({ ...newPartner, type: e.target.value })} className="px-3 py-2 rounded-lg text-sm" style={{ background: C.bg, border: `1px solid ${C.warm}` }}>
                        <option value="hotel">Hôtel</option><option value="sponsor">Sponsor</option><option value="partenaire">Partenaire</option><option value="média">Média</option>
                      </select>
                      <input value={newPartner.contact} onChange={e => setNewPartner({ ...newPartner, contact: e.target.value })} placeholder="Contact principal" className="px-3 py-2 rounded-lg text-sm" style={{ background: C.bg, border: `1px solid ${C.warm}` }} />
                      <input value={newPartner.email} onChange={e => setNewPartner({ ...newPartner, email: e.target.value })} placeholder="Email" className="px-3 py-2 rounded-lg text-sm" style={{ background: C.bg, border: `1px solid ${C.warm}` }} />
                    </div>
                    <textarea value={newPartner.notes} onChange={e => setNewPartner({ ...newPartner, notes: e.target.value })} placeholder="Notes" className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: C.bg, border: `1px solid ${C.warm}` }} rows={2} />
                    <Button onClick={addPartner} size="sm" style={{ background: C.sage, color: '#fff' }}>Enregistrer</Button>
                  </div>
                )}
                {sponsors.length > 0 ? sponsors.map((p, i) => (
                  <PartnerRow key={i} partner={p} />
                )) : <EmptyState text="Aucun sponsor pour l'instant" />}
              </div>
            )}

            {/* HOTELS */}
            {tab === 'hotels' && (
              <div className="space-y-4">
                <h2 className="font-bold" style={{ color: C.dark }}>Pipeline Hôtels & Hébergement</h2>
                {hotels.length > 0 ? hotels.map((p, i) => (
                  <PartnerRow key={i} partner={p} />
                )) : <EmptyState text="Aucun hôtel dans le pipeline" />}
              </div>
            )}

            {/* CONTACTS */}
            {tab === 'contacts' && (
              <div className="space-y-4">
                <h2 className="font-bold" style={{ color: C.dark }}>Contacts</h2>
                {contacts.length > 0 ? contacts.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl border" style={{ background: C.card, borderColor: C.warm }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm" style={{ color: C.dark }}>{c.name || c.nom || 'Contact'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {c.email && <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}><Mail className="w-3 h-3" />{c.email}</span>}
                          {c.phone && <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}><Phone className="w-3 h-3" />{c.phone}</span>}
                        </div>
                      </div>
                      {c.type && <span className="text-xs px-2 py-1 rounded" style={{ background: `${C.gold}15`, color: C.gold }}>{c.type}</span>}
                    </div>
                  </div>
                )) : <EmptyState text="Aucun contact" />}
              </div>
            )}

            {/* BUDGET */}
            {tab === 'budget' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold" style={{ color: C.dark }}>Budget Hébergement & Partenariats</h2>
                  <span className="text-lg font-bold" style={{ color: C.terra }}>{totalBudget.toLocaleString()}€</span>
                </div>
                {partnerExpenses.length > 0 ? partnerExpenses.map((e, i) => (
                  <div key={i} className="p-4 rounded-xl border flex items-center justify-between" style={{ background: C.card, borderColor: C.warm }}>
                    <div>
                      <p className="font-bold text-sm" style={{ color: C.dark }}>{e.description || e.label}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{e.category} — {e.date || ''}</p>
                    </div>
                    <span className="font-bold" style={{ color: C.terra }}>{parseFloat(e.amount || 0).toLocaleString()}€</span>
                  </div>
                )) : <EmptyState text="Aucune dépense enregistrée" />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PartnerRow({ partner }) {
  const statusColors = { prospect: '#C9A84C', confirmed: '#4A5D4E', active: '#4A5D4E', pending: '#6B6560' };
  return (
    <div className="p-4 rounded-xl border" style={{ background: '#FFFFFF', borderColor: '#E8E0D0' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-sm" style={{ color: '#1A1510' }}>{partner.name || partner.nom}</p>
          <div className="flex items-center gap-3 mt-1">
            {partner.contact && <span className="text-xs" style={{ color: '#6B6560' }}>{partner.contact}</span>}
            {partner.email && <span className="flex items-center gap-1 text-xs" style={{ color: '#6B6560' }}><Mail className="w-3 h-3" />{partner.email}</span>}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs px-2 py-1 rounded" style={{ background: `${statusColors[partner.status] || '#6B6560'}20`, color: statusColors[partner.status] || '#6B6560' }}>
            {partner.status || 'prospect'}
          </span>
          <p className="text-xs mt-1" style={{ color: '#6B6560' }}>{partner.type}</p>
        </div>
      </div>
      {partner.notes && <p className="text-xs mt-2 pt-2 border-t" style={{ color: '#6B6560', borderColor: '#E8E0D0' }}>{partner.notes}</p>}
    </div>
  );
}

function EmptyState({ text }) {
  return <p className="text-center py-8 text-sm" style={{ color: '#6B6560' }}>{text}</p>;
}
