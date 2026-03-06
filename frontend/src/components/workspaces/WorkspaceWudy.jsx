import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, DollarSign, TrendingUp, TrendingDown, FileText, Plus, Edit2, Save, PieChart, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useSendNotification } from './NotificationSystem';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  green: '#4CAF50',
  red: '#ef4444'
};

const WorkspaceWudy = () => {
  const navigate = useNavigate();
  const sendNotification = useSendNotification();
  const [activeTab, setActiveTab] = useState('budget');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ label: '', montant: '', category: 'Production scène', fournisseur: '' });

  // Budget data - FULL as per prompt (97 750€ HT)
  const [budget, setBudget] = useState({
    previsionnel: {
      revenus: [
        { id: 1, label: 'Partenariat Or (x2)', montant: 20000, type: 'partenariat', status: 'En attente' },
        { id: 2, label: 'Partenariat Silver (x5)', montant: 12500, type: 'partenariat', status: 'En attente' },
        { id: 3, label: 'Partenariat Bronze (x10)', montant: 10000, type: 'partenariat', status: 'En attente' },
        { id: 4, label: 'Subvention CTM', montant: 25000, type: 'subvention', status: 'En attente' },
        { id: 5, label: 'Subvention DAC', montant: 10000, type: 'subvention', status: 'En attente' },
        { id: 6, label: 'France Travail', montant: 5000, type: 'subvention', status: 'En attente' },
        { id: 7, label: 'Billetterie (500 places)', montant: 7500, type: 'billetterie', status: 'Prévisionnel' },
        { id: 8, label: 'Stands exposants (x10)', montant: 5000, type: 'exposants', status: 'En attente' },
        { id: 9, label: 'Ventes annexes', montant: 2750, type: 'divers', status: 'Prévisionnel' }
      ],
      depenses: [
        { id: 1, label: 'Cachets artistes', montant: 25000, category: 'Artistes' },
        { id: 2, label: 'Location scène + backline', montant: 15000, category: 'Production scène' },
        { id: 3, label: 'Sono + lumière', montant: 12000, category: 'Technique' },
        { id: 4, label: 'Sécurité + SSIAP', montant: 8000, category: 'Logistique' },
        { id: 5, label: 'Communication print', montant: 5000, category: 'Communication' },
        { id: 6, label: 'Communication digitale', montant: 3000, category: 'Communication' },
        { id: 7, label: 'Logistique événement', montant: 10000, category: 'Logistique' },
        { id: 8, label: 'Assurances', montant: 3000, category: 'Administratif' },
        { id: 9, label: 'SACEM / GUSO', montant: 4000, category: 'Administratif' },
        { id: 10, label: 'Frais administratifs', montant: 2000, category: 'Administratif' },
        { id: 11, label: 'Captation vidéo', montant: 5000, category: 'Technique' },
        { id: 12, label: 'Imprévus (5%)', montant: 5750, category: 'Divers' }
      ]
    },
    reel: {
      revenus: [],
      depenses: [
        { id: 1, label: 'Acompte prestataire sono', montant: 3000, category: 'Technique', date: '01/03/2026', fournisseur: 'SonoCaraïbes', justificatif: false },
        { id: 2, label: 'Design graphique - phase 1', montant: 1500, category: 'Communication', date: '15/02/2026', fournisseur: 'Twina Design', justificatif: true }
      ]
    }
  });

  // Documents financiers
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Devis sono SonoCaraïbes', type: 'Devis', status: 'Reçu', date: '20/02/2026' },
    { id: 2, name: 'Facture graphisme', type: 'Facture', status: 'Payé', date: '15/02/2026' }
  ]);

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Wudy',
      role: 'finance',
      action: 'login',
      details: 'Accès workspace comptabilité'
    });
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Wudy', role: 'finance' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const totalRevenusPrev = budget.previsionnel.revenus.reduce((sum, r) => sum + r.montant, 0);
  const totalDepensesPrev = budget.previsionnel.depenses.reduce((sum, d) => sum + d.montant, 0);
  const soldePrev = totalRevenusPrev - totalDepensesPrev;
  
  const totalRevenusReel = budget.reel.revenus.reduce((sum, r) => sum + r.montant, 0);
  const totalDepensesReel = budget.reel.depenses.reduce((sum, d) => sum + d.montant, 0);
  const soldeReel = totalRevenusReel - totalDepensesReel;

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
  };

  const addExpense = async () => {
    if (!newExpense.label || !newExpense.montant) {
      toast.error('Libellé et montant requis');
      return;
    }

    const expense = {
      id: Date.now(),
      label: newExpense.label,
      montant: parseFloat(newExpense.montant),
      category: newExpense.category,
      date: new Date().toLocaleDateString('fr-FR'),
      fournisseur: newExpense.fournisseur,
      justificatif: false
    };

    setBudget(prev => ({
      ...prev,
      reel: {
        ...prev.reel,
        depenses: [...prev.reel.depenses, expense]
      }
    }));

    // Log action
    await axios.post(`${API}/workspace/log`, {
      user: 'Wudy',
      role: 'finance',
      action: 'expense_added',
      details: `Dépense: ${expense.label} - ${formatMontant(expense.montant)}`
    });

    // Send notification to Laurent
    await sendNotification({
      sender: 'Wudy',
      senderRole: 'finance',
      type: 'expense_added',
      title: 'Nouvelle dépense enregistrée',
      message: `${expense.label}: ${formatMontant(expense.montant)} (${expense.category})`,
      target: 'laurent'
    });

    toast.success(`Dépense ajoutée - Notification envoyée à LC`);
    setShowAddExpense(false);
    setNewExpense({ label: '', montant: '', category: 'Production scène', fournisseur: '' });
  };

  const categories = ['Production scène', 'Artistes', 'Technique', 'Logistique', 'Communication', 'Administratif', 'Divers'];

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.green}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: COLORS.green, color: '#fff' }}>
              WD
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: COLORS.green }}>WUDY</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Comptabilité CC2026</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Solde de trésorerie - Alert banner */}
        <div className="rounded-lg p-4 mb-6 flex items-center justify-between" style={{ 
          background: soldeReel < 0 ? 'rgba(239,68,68,0.1)' : `${COLORS.green}10`, 
          border: `1px solid ${soldeReel < 0 ? 'rgba(239,68,68,0.3)' : `${COLORS.green}30`}` 
        }}>
          <div className="flex items-center gap-4">
            {soldeReel < 0 && <AlertTriangle className="w-6 h-6" style={{ color: COLORS.red }} />}
            <div>
              <div className="text-sm font-bold" style={{ color: soldeReel < 0 ? COLORS.red : COLORS.green }}>
                Solde de trésorerie
              </div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Recettes: {formatMontant(totalRevenusReel)} | Dépenses: {formatMontant(totalDepensesReel)}
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: soldeReel < 0 ? COLORS.red : COLORS.green }}>
            {formatMontant(soldeReel)}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.green}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.green }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Revenus prév.</span>
            </div>
            <div className="text-xl font-bold" style={{ color: COLORS.green }}>{formatMontant(totalRevenusPrev)}</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.red}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4" style={{ color: COLORS.red }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Dépenses prév.</span>
            </div>
            <div className="text-xl font-bold" style={{ color: COLORS.red }}>{formatMontant(totalDepensesPrev)}</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" style={{ color: COLORS.gold }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Solde prév.</span>
            </div>
            <div className="text-xl font-bold" style={{ color: soldePrev >= 0 ? COLORS.green : COLORS.red }}>{formatMontant(soldePrev)}</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4" style={{ color: COLORS.terracotta }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Engagé</span>
            </div>
            <div className="text-xl font-bold" style={{ color: COLORS.terracotta }}>{formatMontant(totalDepensesReel)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'budget', label: 'Budget Prévisionnel', icon: FileText },
            { id: 'reel', label: 'Dépenses Réelles', icon: DollarSign },
            { id: 'documents', label: 'Documents', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              style={{ 
                background: activeTab === tab.id ? COLORS.green : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)'
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'budget' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Revenus prévisionnels */}
            <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.green}20` }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.green }}>
                Revenus Prévisionnels
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {budget.previsionnel.revenus.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="text-sm text-white">{item.label}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: COLORS.green }}>{formatMontant(item.montant)}</div>
                      <div className="text-xs" style={{ color: item.status === 'Confirmé' ? COLORS.green : COLORS.gold }}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="font-bold text-white">TOTAL</span>
                <span className="text-xl font-bold" style={{ color: COLORS.green }}>{formatMontant(totalRevenusPrev)}</span>
              </div>
            </div>

            {/* Dépenses prévisionnelles */}
            <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.red}20` }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.red }}>
                Dépenses Prévisionnelles
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {budget.previsionnel.depenses.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="text-sm text-white">{item.label}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.category}</div>
                    </div>
                    <div className="font-bold" style={{ color: COLORS.red }}>{formatMontant(item.montant)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="font-bold text-white">TOTAL</span>
                <span className="text-xl font-bold" style={{ color: COLORS.red }}>{formatMontant(totalDepensesPrev)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reel' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.green}20` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: COLORS.green }}>Dépenses Réelles</h2>
              <Button onClick={() => setShowAddExpense(true)} style={{ background: COLORS.green }}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter dépense
              </Button>
            </div>
            
            <div className="space-y-3">
              {budget.reel.depenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${COLORS.red}20` }}>
                      <DollarSign className="w-5 h-5" style={{ color: COLORS.red }} />
                    </div>
                    <div>
                      <div className="font-bold text-white">{expense.label}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {expense.fournisseur} • {expense.category} • {expense.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold" style={{ color: COLORS.red }}>{formatMontant(expense.montant)}</div>
                    <span className={`px-2 py-1 rounded text-xs ${expense.justificatif ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {expense.justificatif ? 'Justifié' : 'Sans justif.'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-bold text-white">TOTAL ENGAGÉ</span>
              <span className="text-2xl font-bold" style={{ color: COLORS.red }}>{formatMontant(totalDepensesReel)}</span>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="rounded-lg p-6" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: COLORS.gold }}>Documents Financiers</h2>
              <Button style={{ background: COLORS.gold, color: COLORS.charbon }}>
                <Upload className="w-4 h-4 mr-2" />
                Upload document
              </Button>
            </div>
            
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-4">
                    <FileText className="w-6 h-6" style={{ color: COLORS.gold }} />
                    <div>
                      <div className="text-white">{doc.name}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{doc.type} • {doc.date}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs ${
                    doc.status === 'Payé' ? 'bg-green-500/20 text-green-400' : 
                    doc.status === 'Validé par LC' ? 'bg-blue-500/20 text-blue-400' : 
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add expense modal */}
        {showAddExpense && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="rounded-lg p-6 w-full max-w-md" style={{ background: '#2A2820', border: `1px solid ${COLORS.green}20` }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.green }}>Ajouter une dépense</h3>
              <div className="space-y-3">
                <Input 
                  value={newExpense.label}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Libellé *"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <Input 
                  type="number"
                  value={newExpense.montant}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, montant: e.target.value }))}
                  placeholder="Montant HT *"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <Input 
                  value={newExpense.fournisseur}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, fournisseur: e.target.value }))}
                  placeholder="Fournisseur"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <select 
                  value={newExpense.category}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} style={{ background: '#2A2820' }}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowAddExpense(false)} variant="outline" className="flex-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  Annuler
                </Button>
                <Button onClick={addExpense} className="flex-1" style={{ background: COLORS.green }}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkspaceWudy;
