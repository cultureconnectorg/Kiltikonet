import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Users, Building2, DollarSign,
  BarChart3, Plus, Mail, Phone, Trash2, Edit3, X, Check,
  ChevronDown, Search, FileText, Calendar, Briefcase, Upload, Camera, Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const C = {
  bg: '#F4F0E8', card: '#FFFFFF', warm: '#E8E0D0',
  dark: '#1A1510', muted: '#6B6560', gold: '#C9A84C',
  terra: '#A65D47', sage: '#4A5D4E', light: '#FAF8F4'
};

const PARTNER_TYPES = ['Bronze', 'Silver', 'Or', 'Institutionnel'];
const PARTNER_STATUSES = ['Prospect', 'Contacté', 'Dossier envoyé', 'En négociation', 'Signé'];
const CONTACT_CATEGORIES = ['Partenaire', 'Institutionnel', 'Presse', 'Personnel', 'Hôtel', 'Sponsor'];
const EXPENSE_CATEGORIES = ['partenariat', 'hébergement', 'transport', 'logistique', 'communication', 'autre'];

const statusColor = (s) => {
  const map = { 'Prospect': C.muted, 'Contacté': C.gold, 'Dossier envoyé': '#5B8DEF', 'En négociation': '#E67E22', 'Signé': C.sage };
  return map[s] || C.muted;
};
const typeColor = (t) => {
  const map = { 'Or': '#D4A017', 'Silver': '#8B9DAF', 'Bronze': '#B87333', 'Institutionnel': '#6C63FF' };
  return map[t] || C.terra;
};

/* ────────── STAT CARD ────────── */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`} className="p-4 rounded-xl border" style={{ background: C.card, borderColor: C.warm }}>
    <Icon className="w-5 h-5 mb-2" style={{ color: color || C.terra }} />
    <p className="text-2xl font-bold" style={{ color: C.dark }}>{value}</p>
    <p className="text-xs" style={{ color: C.muted }}>{label}</p>
  </div>
);

/* ────────── MAIN COMPONENT ────────── */
export default function ColeenWorkspace() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');

  // Forms
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // New partner
  const emptyPartner = { name: '', type: 'Bronze', status: 'Prospect', contact: '', email: '', phone: '', lastAction: '', nextAction: 'Premier contact' };
  const [newPartner, setNewPartner] = useState({ ...emptyPartner });

  // New contact
  const emptyContact = { prenom: '', nom: '', email: '', phone: '', organisation: '', fonction: '', categorie: 'Partenaire', notes: '', owner: 'Coleen' };
  const [newContact, setNewContact] = useState({ ...emptyContact });

  // New expense
  const emptyExpense = { label: '', montant: '', category: 'partenariat', fournisseur: '', date: new Date().toISOString().split('T')[0], created_by: 'Coleen' };
  const [newExpense, setNewExpense] = useState({ ...emptyExpense });

  /* ── FETCH ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, eRes, aRes] = await Promise.all([
        fetch(`${API}/api/shared/partners`).then(r => r.json()).catch(() => []),
        fetch(`${API}/api/shared/contacts?owner=Coleen`).then(r => r.json()).catch(() => []),
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

  /* ── PARTNER CRUD ── */
  const addPartner = async () => {
    if (!newPartner.name) { toast.error('Nom obligatoire'); return; }
    try {
      const res = await fetch(`${API}/api/shared/partners`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPartner, created_by: 'Coleen' }),
      });
      if (res.ok) { toast.success('Partenaire ajouté'); setShowAddPartner(false); setNewPartner({ ...emptyPartner }); fetchAll(); }
      else toast.error('Erreur lors de l\'ajout');
    } catch { toast.error('Erreur réseau'); }
  };

  const updatePartner = async (id, updates) => {
    try {
      const res = await fetch(`${API}/api/shared/partners/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) { toast.success('Mis à jour'); setEditingId(null); fetchAll(); }
    } catch { toast.error('Erreur'); }
  };

  const deletePartner = async (id) => {
    if (!window.confirm('Supprimer ce partenaire ?')) return;
    try {
      await fetch(`${API}/api/shared/partners/${id}`, { method: 'DELETE' });
      toast.success('Supprimé'); fetchAll();
    } catch { toast.error('Erreur'); }
  };

  /* ── CONTACT CRUD ── */
  const addContact = async () => {
    if (!newContact.nom) { toast.error('Nom obligatoire'); return; }
    try {
      const res = await fetch(`${API}/api/shared/contacts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });
      if (res.ok) { toast.success('Contact ajouté'); setShowAddContact(false); setNewContact({ ...emptyContact }); fetchAll(); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur réseau'); }
  };

  const deleteContact = async (id) => {
    if (!window.confirm('Supprimer ce contact ?')) return;
    try {
      await fetch(`${API}/api/shared/contacts/${id}`, { method: 'DELETE' });
      toast.success('Supprimé'); fetchAll();
    } catch { toast.error('Erreur'); }
  };

  /* ── EXPENSE CRUD ── */
  const addExpense = async () => {
    if (!newExpense.label || !newExpense.montant) { toast.error('Libellé et montant obligatoires'); return; }
    try {
      const res = await fetch(`${API}/api/shared/expenses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newExpense, montant: parseFloat(newExpense.montant) }),
      });
      if (res.ok) { toast.success('Dépense ajoutée'); setShowAddExpense(false); setNewExpense({ ...emptyExpense }); fetchAll(); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur réseau'); }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    try {
      await fetch(`${API}/api/shared/expenses/${id}`, { method: 'DELETE' });
      toast.success('Supprimé'); fetchAll();
    } catch { toast.error('Erreur'); }
  };

  /* ── COMPUTED ── */
  const totalBudget = expenses.reduce((sum, e) => sum + (parseFloat(e.montant) || 0), 0);
  const signed = partners.filter(p => p.status === 'Signé');
  const inProgress = partners.filter(p => p.status !== 'Signé' && p.status !== 'Prospect');

  const filteredPartners = partners.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (p.name || '').toLowerCase().includes(s) || (p.type || '').toLowerCase().includes(s) || (p.contact || '').toLowerCase().includes(s);
  });

  const filteredContacts = contacts.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return `${c.prenom} ${c.nom}`.toLowerCase().includes(s) || (c.organisation || '').toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s);
  });

  /* ── TABS ── */
  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
    { id: 'partners', label: 'Partenaires', icon: Building2 },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'budget', label: 'Budget', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.bg }} data-testid="coleen-workspace">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(244,240,232,0.95)', backdropFilter: 'blur(8px)', borderColor: C.warm }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} style={{ color: C.muted }} data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: C.dark }}>Espace Coleen</h1>
              <p className="text-xs" style={{ color: C.muted }}>Dir. Partenariats & Sponsors CC2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs w-48"
                style={{ background: C.light, border: `1px solid ${C.warm}`, color: C.dark }}
                data-testid="search-input"
              />
            </div>
            <Button size="sm" onClick={fetchAll} variant="outline" data-testid="refresh-btn"><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
              style={{ background: tab === t.id ? `${C.terra}15` : 'transparent', color: tab === t.id ? C.terra : C.muted }}
              data-testid={`tab-${t.id}`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: C.gold }} /></div>
        ) : (
          <>
            {/* ═══════════ DASHBOARD ═══════════ */}
            {tab === 'dashboard' && (
              <div className="space-y-6" data-testid="dashboard-view">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Building2} label="Partenaires" value={partners.length} color={C.terra} />
                  <StatCard icon={Check} label="Signés" value={signed.length} color={C.sage} />
                  <StatCard icon={Users} label="Contacts" value={contacts.length} color={C.gold} />
                  <StatCard icon={DollarSign} label="Budget engagé" value={`${totalBudget.toLocaleString('fr-FR')}€`} color={C.terra} />
                </div>

                {/* Pipeline */}
                <div className="rounded-xl p-5 border" style={{ background: C.card, borderColor: C.warm }}>
                  <h3 className="font-bold text-sm mb-4" style={{ color: C.dark }}>Pipeline Partenariats</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {PARTNER_STATUSES.map(st => {
                      const count = partners.filter(p => p.status === st).length;
                      return (
                        <div key={st} className="text-center p-3 rounded-lg" style={{ background: `${statusColor(st)}10` }}>
                          <p className="text-xl font-bold" style={{ color: statusColor(st) }}>{count}</p>
                          <p className="text-xs mt-1" style={{ color: C.muted }}>{st}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* En cours */}
                {inProgress.length > 0 && (
                  <div className="rounded-xl p-5 border" style={{ background: C.card, borderColor: C.warm }}>
                    <h3 className="font-bold text-sm mb-3" style={{ color: C.dark }}>En cours de négociation</h3>
                    <div className="space-y-2">
                      {inProgress.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: C.light }}>
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: `${typeColor(p.type)}20`, color: typeColor(p.type) }}>{p.type}</span>
                            <span className="text-sm font-medium" style={{ color: C.dark }}>{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${statusColor(p.status)}15`, color: statusColor(p.status) }}>{p.status}</span>
                            {p.nextAction && <span className="text-xs" style={{ color: C.muted }}>{p.nextAction}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analytics CC2026 */}
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

            {/* ═══════════ PARTENAIRES ═══════════ */}
            {tab === 'partners' && (
              <div className="space-y-4" data-testid="partners-view">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold" style={{ color: C.dark }}>Partenaires & Sponsors ({filteredPartners.length})</h2>
                  <Button size="sm" onClick={() => setShowAddPartner(!showAddPartner)} style={{ background: C.terra, color: '#fff' }} data-testid="add-partner-btn">
                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                  </Button>
                </div>

                {/* ADD FORM */}
                {showAddPartner && (
                  <div className="p-4 rounded-xl border space-y-3" style={{ background: C.card, borderColor: C.warm }} data-testid="add-partner-form">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold" style={{ color: C.dark }}>Nouveau partenaire</p>
                      <button onClick={() => setShowAddPartner(false)}><X className="w-4 h-4" style={{ color: C.muted }} /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Nom *" value={newPartner.name} onChange={v => setNewPartner({ ...newPartner, name: v })} />
                      <Select label="Type" value={newPartner.type} options={PARTNER_TYPES} onChange={v => setNewPartner({ ...newPartner, type: v })} />
                      <Select label="Statut" value={newPartner.status} options={PARTNER_STATUSES} onChange={v => setNewPartner({ ...newPartner, status: v })} />
                      <Input label="Contact principal" value={newPartner.contact} onChange={v => setNewPartner({ ...newPartner, contact: v })} />
                      <Input label="Email" value={newPartner.email} onChange={v => setNewPartner({ ...newPartner, email: v })} type="email" />
                      <Input label="Téléphone" value={newPartner.phone} onChange={v => setNewPartner({ ...newPartner, phone: v })} />
                      <Input label="Dernière action" value={newPartner.lastAction} onChange={v => setNewPartner({ ...newPartner, lastAction: v })} />
                      <Input label="Prochaine action" value={newPartner.nextAction} onChange={v => setNewPartner({ ...newPartner, nextAction: v })} />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button onClick={addPartner} size="sm" style={{ background: C.sage, color: '#fff' }} data-testid="save-partner-btn">Enregistrer</Button>
                      <Button onClick={() => setShowAddPartner(false)} size="sm" variant="outline">Annuler</Button>
                    </div>
                  </div>
                )}

                {/* LIST */}
                {filteredPartners.length > 0 ? filteredPartners.map(p => (
                  <PartnerCard key={p.id} partner={p} onUpdate={updatePartner} onDelete={deletePartner} editingId={editingId} setEditingId={setEditingId} />
                )) : <EmptyState text="Aucun partenaire trouvé" />}
              </div>
            )}

            {/* ═══════════ CONTACTS ═══════════ */}
            {tab === 'contacts' && (
              <div className="space-y-4" data-testid="contacts-view">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold" style={{ color: C.dark }}>Contacts ({filteredContacts.length})</h2>
                  <Button size="sm" onClick={() => setShowAddContact(!showAddContact)} style={{ background: C.terra, color: '#fff' }} data-testid="add-contact-btn">
                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                  </Button>
                </div>

                {showAddContact && (
                  <div className="p-4 rounded-xl border space-y-3" style={{ background: C.card, borderColor: C.warm }} data-testid="add-contact-form">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold" style={{ color: C.dark }}>Nouveau contact</p>
                      <button onClick={() => setShowAddContact(false)}><X className="w-4 h-4" style={{ color: C.muted }} /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Prénom" value={newContact.prenom} onChange={v => setNewContact({ ...newContact, prenom: v })} />
                      <Input label="Nom *" value={newContact.nom} onChange={v => setNewContact({ ...newContact, nom: v })} />
                      <Input label="Email" value={newContact.email} onChange={v => setNewContact({ ...newContact, email: v })} type="email" />
                      <Input label="Téléphone" value={newContact.phone} onChange={v => setNewContact({ ...newContact, phone: v })} />
                      <Input label="Organisation" value={newContact.organisation} onChange={v => setNewContact({ ...newContact, organisation: v })} />
                      <Input label="Fonction" value={newContact.fonction} onChange={v => setNewContact({ ...newContact, fonction: v })} />
                      <Select label="Catégorie" value={newContact.categorie} options={CONTACT_CATEGORIES} onChange={v => setNewContact({ ...newContact, categorie: v })} />
                    </div>
                    <Input label="Notes" value={newContact.notes} onChange={v => setNewContact({ ...newContact, notes: v })} multiline />
                    <div className="flex gap-2 pt-1">
                      <Button onClick={addContact} size="sm" style={{ background: C.sage, color: '#fff' }} data-testid="save-contact-btn">Enregistrer</Button>
                      <Button onClick={() => setShowAddContact(false)} size="sm" variant="outline">Annuler</Button>
                    </div>
                  </div>
                )}

                {filteredContacts.length > 0 ? filteredContacts.map(c => (
                  <div key={c.id} className="p-4 rounded-xl border" style={{ background: C.card, borderColor: C.warm }} data-testid={`contact-${c.id}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm" style={{ color: C.dark }}>{c.prenom} {c.nom}</p>
                        {c.organisation && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{c.fonction ? `${c.fonction} — ` : ''}{c.organisation}</p>}
                        <div className="flex items-center gap-3 mt-1.5">
                          {c.email && <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}><Mail className="w-3 h-3" />{c.email}</span>}
                          {c.phone && <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}><Phone className="w-3 h-3" />{c.phone}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded" style={{ background: `${C.gold}15`, color: C.gold }}>{c.categorie || 'Personnel'}</span>
                        <button onClick={() => deleteContact(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" data-testid={`delete-contact-${c.id}`}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                    {c.notes && <p className="text-xs mt-2 pt-2 border-t" style={{ color: C.muted, borderColor: C.warm }}>{c.notes}</p>}
                  </div>
                )) : <EmptyState text="Aucun contact. Ajoutez vos contacts partenaires ici." />}
              </div>
            )}

            {/* ═══════════ BUDGET ═══════════ */}
            {tab === 'budget' && (
              <div className="space-y-4" data-testid="budget-view">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold" style={{ color: C.dark }}>Budget & Dépenses</h2>
                    <p className="text-sm mt-0.5" style={{ color: C.muted }}>Total engagé : <strong style={{ color: C.terra }}>{totalBudget.toLocaleString('fr-FR')}€</strong></p>
                  </div>
                  <Button size="sm" onClick={() => setShowAddExpense(!showAddExpense)} style={{ background: C.terra, color: '#fff' }} data-testid="add-expense-btn">
                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                  </Button>
                </div>

                {showAddExpense && (
                  <div className="p-4 rounded-xl border space-y-3" style={{ background: C.card, borderColor: C.warm }} data-testid="add-expense-form">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold" style={{ color: C.dark }}>Nouvelle dépense</p>
                      <button onClick={() => setShowAddExpense(false)}><X className="w-4 h-4" style={{ color: C.muted }} /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Libellé *" value={newExpense.label} onChange={v => setNewExpense({ ...newExpense, label: v })} />
                      <Input label="Montant (€) *" value={newExpense.montant} onChange={v => setNewExpense({ ...newExpense, montant: v })} type="number" />
                      <Select label="Catégorie" value={newExpense.category} options={EXPENSE_CATEGORIES} onChange={v => setNewExpense({ ...newExpense, category: v })} />
                      <Input label="Fournisseur" value={newExpense.fournisseur} onChange={v => setNewExpense({ ...newExpense, fournisseur: v })} />
                      <Input label="Date" value={newExpense.date} onChange={v => setNewExpense({ ...newExpense, date: v })} type="date" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button onClick={addExpense} size="sm" style={{ background: C.sage, color: '#fff' }} data-testid="save-expense-btn">Enregistrer</Button>
                      <Button onClick={() => setShowAddExpense(false)} size="sm" variant="outline">Annuler</Button>
                    </div>
                  </div>
                )}

                {/* Expenses by category */}
                {EXPENSE_CATEGORIES.map(cat => {
                  const catExpenses = expenses.filter(e => e.category === cat);
                  if (catExpenses.length === 0) return null;
                  const catTotal = catExpenses.reduce((s, e) => s + (parseFloat(e.montant) || 0), 0);
                  return (
                    <div key={cat} className="rounded-xl border overflow-hidden" style={{ borderColor: C.warm }}>
                      <div className="px-4 py-2 flex items-center justify-between" style={{ background: C.light }}>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>{cat}</p>
                        <p className="text-sm font-bold" style={{ color: C.terra }}>{catTotal.toLocaleString('fr-FR')}€</p>
                      </div>
                      {catExpenses.map(e => (
                        <div key={e.id} className="px-4 py-3 flex items-center justify-between border-t" style={{ background: C.card, borderColor: C.warm }}>
                          <div>
                            <p className="text-sm font-medium" style={{ color: C.dark }}>{e.label}</p>
                            <p className="text-xs" style={{ color: C.muted }}>{e.fournisseur}{e.date ? ` — ${e.date}` : ''}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm" style={{ color: C.terra }}>{parseFloat(e.montant || 0).toLocaleString('fr-FR')}€</span>
                            <button onClick={() => deleteExpense(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" data-testid={`delete-expense-${e.id}`}>
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {expenses.length === 0 && <EmptyState text="Aucune dépense enregistrée. Ajoutez vos premières dépenses." />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════ PARTNER CARD ═══════════ */
function PartnerCard({ partner, onUpdate, onDelete, editingId, setEditingId }) {
  const isEditing = editingId === partner.id;
  const [editData, setEditData] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef(null);

  const startEdit = () => {
    setEditData({ status: partner.status, nextAction: partner.nextAction || '', lastAction: partner.lastAction || '' });
    setEditingId(partner.id);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/shared/partners/${partner.id}/photo`, {
        method: 'POST', body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Photo uploadée');
        onUpdate(partner.id, { logo_url: data.url });
      } else toast.error('Erreur upload');
    } catch { toast.error('Erreur réseau'); }
    setUploading(false);
  };

  return (
    <div className="p-4 rounded-xl border" style={{ background: C.card, borderColor: C.warm }} data-testid={`partner-${partner.id}`}>
      <div className="flex items-start gap-3">
        {/* Photo */}
        <div className="relative flex-shrink-0">
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className="w-14 h-14 rounded-lg overflow-hidden border cursor-pointer flex items-center justify-center transition-colors hover:border-[#A65D47]"
            style={{ borderColor: C.warm, background: C.light }}
            data-testid={`partner-photo-${partner.id}`}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.terra }} />
            ) : partner.logo_url ? (
              <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-5 h-5" style={{ color: C.warm }} />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: `${typeColor(partner.type)}20`, color: typeColor(partner.type) }}>
              {partner.type}
            </span>
            <p className="font-bold text-sm truncate" style={{ color: C.dark }}>{partner.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {partner.contact && <span className="text-xs" style={{ color: C.muted }}>{partner.contact}</span>}
            {partner.email && <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}><Mail className="w-3 h-3" />{partner.email}</span>}
            {partner.phone && <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}><Phone className="w-3 h-3" />{partner.phone}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isEditing && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: `${statusColor(partner.status)}15`, color: statusColor(partner.status) }}>
              {partner.status}
            </span>
          )}
          <button onClick={startEdit} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" data-testid={`edit-partner-${partner.id}`}>
            <Edit3 className="w-3.5 h-3.5" style={{ color: C.muted }} />
          </button>
          <button onClick={() => onDelete(partner.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" data-testid={`delete-partner-${partner.id}`}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Quick edit row */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: C.warm }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select label="Statut" value={editData.status} options={PARTNER_STATUSES} onChange={v => setEditData({ ...editData, status: v })} small />
            <Input label="Dernière action" value={editData.lastAction} onChange={v => setEditData({ ...editData, lastAction: v })} small />
            <Input label="Prochaine action" value={editData.nextAction} onChange={v => setEditData({ ...editData, nextAction: v })} small />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onUpdate(partner.id, editData)} style={{ background: C.sage, color: '#fff' }}><Check className="w-3 h-3 mr-1" /> Sauvegarder</Button>
            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Annuler</Button>
          </div>
        </div>
      )}

      {/* Actions info */}
      {!isEditing && (partner.lastAction || partner.nextAction) && (
        <div className="mt-2 pt-2 border-t flex flex-wrap gap-4" style={{ borderColor: C.warm }}>
          {partner.lastAction && <span className="text-xs" style={{ color: C.muted }}>Dernière : {partner.lastAction}</span>}
          {partner.nextAction && <span className="text-xs font-medium" style={{ color: C.terra }}>Prochaine : {partner.nextAction}</span>}
        </div>
      )}
    </div>
  );
}

/* ═══════════ FORM COMPONENTS ═══════════ */
function Input({ label, value, onChange, type = 'text', multiline = false, small = false }) {
  const style = { background: C.light, border: `1px solid ${C.warm}`, color: C.dark };
  const cls = `w-full px-3 ${small ? 'py-1.5 text-xs' : 'py-2 text-sm'} rounded-lg`;
  return (
    <div>
      {label && <label className="text-xs font-medium mb-1 block" style={{ color: C.muted }}>{label}</label>}
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className={cls} style={style} rows={2} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} style={style} />
      )}
    </div>
  );
}

function Select({ label, value, options, onChange, small = false }) {
  return (
    <div>
      {label && <label className="text-xs font-medium mb-1 block" style={{ color: C.muted }}>{label}</label>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className={`w-full px-3 ${small ? 'py-1.5 text-xs' : 'py-2 text-sm'} rounded-lg`}
        style={{ background: C.light, border: `1px solid ${C.warm}`, color: C.dark }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-12 rounded-xl border" style={{ background: C.card, borderColor: C.warm }} data-testid="empty-state">
      <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: C.warm }} />
      <p className="text-sm" style={{ color: C.muted }}>{text}</p>
    </div>
  );
}
