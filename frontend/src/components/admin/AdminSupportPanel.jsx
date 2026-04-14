import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { HelpCircle, MessageSquare, Plus, Trash2, Edit, Save, X, ChevronDown, ChevronUp, Loader2, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ═══════════════════════════════════
// FAQ ADMIN
// ═══════════════════════════════════

const FAQAdmin = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ question_fr: '', answer_fr: '', question_en: '', answer_en: '', category: 'general', published: true });

  const fetchFaqs = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/faq`);
      setFaqs(res.data.faqs || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const handleSave = async (faqId = null) => {
    try {
      if (faqId) {
        await axios.put(`${API}/admin/faq/${faqId}`, form);
        toast.success('FAQ mise à jour');
      } else {
        await axios.post(`${API}/admin/faq`, { ...form, order: faqs.length });
        toast.success('FAQ ajoutée');
      }
      setEditingId(null);
      setShowAdd(false);
      setForm({ question_fr: '', answer_fr: '', question_en: '', answer_en: '', category: 'general', published: true });
      fetchFaqs();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (faqId) => {
    if (!window.confirm('Supprimer cette FAQ ?')) return;
    try {
      await axios.delete(`${API}/admin/faq/${faqId}`);
      toast.success('FAQ supprimée');
      fetchFaqs();
    } catch { toast.error('Erreur'); }
  };

  const startEdit = (faq) => {
    setEditingId(faq.id);
    setForm({ question_fr: faq.question_fr, answer_fr: faq.answer_fr, question_en: faq.question_en || '', answer_en: faq.answer_en || '', category: faq.category, published: faq.published });
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-terracotta" /></div>;

  return (
    <div className="space-y-4" data-testid="faq-admin">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-charcoal flex items-center gap-2"><HelpCircle className="w-5 h-5 text-sage" /> FAQ ({faqs.length})</h3>
        <Button onClick={() => { setShowAdd(true); setForm({ question_fr: '', answer_fr: '', question_en: '', answer_en: '', category: 'general', published: true }); }}
          className="h-9 px-4 bg-sage text-paper rounded-none font-syne text-xs" data-testid="faq-add-btn">
          <Plus className="w-3 h-3 mr-1" /> Ajouter
        </Button>
      </div>

      {showAdd && (
        <div className="border border-sage/30 bg-sage/5 p-4 space-y-3">
          <Input value={form.question_fr} onChange={e => setForm(f => ({ ...f, question_fr: e.target.value }))} placeholder="Question (FR)" className="h-10 bg-paper border-lightborder rounded-none text-sm" />
          <Textarea value={form.answer_fr} onChange={e => setForm(f => ({ ...f, answer_fr: e.target.value }))} placeholder="Réponse (FR)" className="bg-paper border-lightborder rounded-none text-sm min-h-[80px]" />
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.question_en} onChange={e => setForm(f => ({ ...f, question_en: e.target.value }))} placeholder="Question (EN)" className="h-10 bg-paper border-lightborder rounded-none text-sm" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="h-10 px-3 bg-paper border border-lightborder text-sm text-charcoal">
              <option value="general">Général</option><option value="jetons">Jetons</option><option value="technique">Technique</option><option value="evenement">Événement</option><option value="partenariat">Partenariat</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleSave()} className="h-9 px-4 bg-sage text-paper rounded-none text-xs font-syne"><Save className="w-3 h-3 mr-1" /> Créer</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="h-9 px-4 rounded-none text-xs"><X className="w-3 h-3 mr-1" /> Annuler</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {faqs.map(faq => (
          <div key={faq.id} className={`border p-4 ${faq.published ? 'border-lightborder bg-paper' : 'border-charcoal/20 bg-charcoal/5 opacity-60'}`}>
            {editingId === faq.id ? (
              <div className="space-y-3">
                <Input value={form.question_fr} onChange={e => setForm(f => ({ ...f, question_fr: e.target.value }))} className="h-10 bg-cream border-lightborder rounded-none text-sm" />
                <Textarea value={form.answer_fr} onChange={e => setForm(f => ({ ...f, answer_fr: e.target.value }))} className="bg-cream border-lightborder rounded-none text-sm min-h-[80px]" />
                <div className="flex gap-2">
                  <Button onClick={() => handleSave(faq.id)} className="h-8 px-3 bg-sage text-paper rounded-none text-xs"><Save className="w-3 h-3 mr-1" /> Sauver</Button>
                  <Button onClick={() => setEditingId(null)} variant="outline" className="h-8 px-3 rounded-none text-xs"><X className="w-3 h-3" /></Button>
                  <label className="flex items-center gap-1.5 text-xs text-charcoal/60 ml-auto">
                    <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} className="accent-sage" /> Publié
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal">{faq.question_fr}</p>
                  <p className="text-xs text-charcoal/50 mt-1 line-clamp-2">{faq.answer_fr}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-cream text-charcoal/50 border border-lightborder">{faq.category}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(faq)} className="p-1.5 hover:bg-cream rounded" data-testid={`faq-edit-${faq.id}`}><Edit className="w-3.5 h-3.5 text-charcoal/40" /></button>
                  <button onClick={() => handleDelete(faq.id)} className="p-1.5 hover:bg-terracotta/10 rounded" data-testid={`faq-del-${faq.id}`}><Trash2 className="w-3.5 h-3.5 text-terracotta/60" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// TICKETS ADMIN
// ═══════════════════════════════════

const statusColors = {
  open: { bg: 'bg-terracotta/10', text: 'text-terracotta', label: 'Ouvert', icon: AlertCircle },
  in_progress: { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'En cours', icon: Clock },
  resolved: { bg: 'bg-sage/10', text: 'text-sage', label: 'Résolu', icon: CheckCircle },
  closed: { bg: 'bg-charcoal/10', text: 'text-charcoal/50', label: 'Fermé', icon: X },
};

const TicketsAdmin = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const url = filter ? `${API}/admin/support/tickets?status=${filter}` : `${API}/admin/support/tickets`;
      const res = await axios.get(url);
      setTickets(res.data.tickets || []);
      setStats(res.data.stats || {});
    } catch {} finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const updateStatus = async (ticketId, status) => {
    try {
      await axios.put(`${API}/admin/support/tickets/${ticketId}/status?status=${status}`);
      toast.success('Statut mis à jour');
      fetchTickets();
    } catch { toast.error('Erreur'); }
  };

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await axios.post(`${API}/admin/support/tickets/${ticketId}/reply`, { message: replyText.trim(), author: 'Support Kiltikonet' });
      toast.success('Réponse envoyée');
      setReplyText('');
      fetchTickets();
    } catch { toast.error('Erreur'); }
    finally { setReplying(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-terracotta" /></div>;

  return (
    <div className="space-y-4" data-testid="tickets-admin">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', val: stats.total || 0, color: 'text-charcoal' },
          { label: 'Ouverts', val: stats.open || 0, color: 'text-terracotta' },
          { label: 'En cours', val: stats.in_progress || 0, color: 'text-amber-600' },
          { label: 'Résolus', val: stats.resolved || 0, color: 'text-sage' },
        ].map(s => (
          <div key={s.label} className="border border-lightborder bg-cream p-3 text-center">
            <p className={`font-serif text-2xl ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-charcoal/50 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-syne border transition-colors ${filter === f ? 'border-terracotta bg-terracotta text-paper' : 'border-lightborder text-charcoal/50 hover:border-terracotta'}`}>
            {f === '' ? 'Tous' : (statusColors[f]?.label || f)}
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {tickets.length === 0 ? (
        <div className="text-center py-12 text-charcoal/40">
          <MessageSquare className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm">Aucun ticket</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(tk => {
            const st = statusColors[tk.status] || statusColors.open;
            const StIcon = st.icon;
            const isExpanded = expandedId === tk.id;
            return (
              <div key={tk.id} className="border border-lightborder bg-paper">
                <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : tk.id)} data-testid={`ticket-${tk.id}`}>
                  <StIcon className={`w-4 h-4 shrink-0 ${st.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal truncate">{tk.subject || 'Sans objet'}</span>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-charcoal/50 mt-0.5">{tk.name} · {tk.email} · {new Date(tk.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className="text-[10px] text-charcoal/30 font-mono">{tk.id}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-charcoal/30" /> : <ChevronDown className="w-4 h-4 text-charcoal/30" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-lightborder p-4 space-y-4">
                    {/* Message */}
                    <div className="bg-cream p-3 text-sm text-charcoal/80">{tk.message}</div>

                    {/* Replies */}
                    {tk.replies?.length > 0 && (
                      <div className="space-y-2 pl-4 border-l-2 border-sage/30">
                        {tk.replies.map(r => (
                          <div key={r.id} className="bg-sage/5 p-3 text-sm">
                            <p className="text-xs text-sage font-semibold mb-1">{r.author} · {new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                            <p className="text-charcoal/70">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply form */}
                    <div className="flex gap-2">
                      <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Répondre..." className="flex-1 bg-cream border-lightborder rounded-none text-sm min-h-[60px]" />
                      <div className="flex flex-col gap-1">
                        <Button onClick={() => handleReply(tk.id)} disabled={replying || !replyText.trim()}
                          className="h-9 px-3 bg-sage text-paper rounded-none text-xs"><Send className="w-3 h-3" /></Button>
                      </div>
                    </div>

                    {/* Status actions */}
                    <div className="flex gap-2 pt-2 border-t border-lightborder">
                      {tk.status !== 'resolved' && (
                        <Button onClick={() => updateStatus(tk.id, 'resolved')} className="h-8 px-3 bg-sage/20 text-sage rounded-none text-xs font-syne">
                          <CheckCircle className="w-3 h-3 mr-1" /> Résolu
                        </Button>
                      )}
                      {tk.status === 'open' && (
                        <Button onClick={() => updateStatus(tk.id, 'in_progress')} className="h-8 px-3 bg-amber-500/20 text-amber-600 rounded-none text-xs font-syne">
                          <Clock className="w-3 h-3 mr-1" /> En cours
                        </Button>
                      )}
                      {tk.status !== 'closed' && (
                        <Button onClick={() => updateStatus(tk.id, 'closed')} variant="outline" className="h-8 px-3 rounded-none text-xs border-charcoal/20 text-charcoal/40">
                          <X className="w-3 h-3 mr-1" /> Fermer
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════
// COMBINED PANEL
// ═══════════════════════════════════

export default function AdminSupportPanel() {
  const [activeSection, setActiveSection] = useState('tickets');

  return (
    <div className="p-6 space-y-6" data-testid="admin-support-panel">
      <div className="flex items-center gap-4 border-b border-lightborder pb-4">
        <button onClick={() => setActiveSection('tickets')}
          className={`px-4 py-2 text-sm font-syne border-b-2 transition-colors ${activeSection === 'tickets' ? 'border-terracotta text-terracotta' : 'border-transparent text-charcoal/50'}`}>
          <MessageSquare className="w-4 h-4 inline mr-2" /> Tickets
        </button>
        <button onClick={() => setActiveSection('faq')}
          className={`px-4 py-2 text-sm font-syne border-b-2 transition-colors ${activeSection === 'faq' ? 'border-sage text-sage' : 'border-transparent text-charcoal/50'}`}>
          <HelpCircle className="w-4 h-4 inline mr-2" /> FAQ
        </button>
      </div>

      {activeSection === 'tickets' ? <TicketsAdmin /> : <FAQAdmin />}
    </div>
  );
}
